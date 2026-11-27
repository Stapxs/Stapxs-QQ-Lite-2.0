use base64::{engine::general_purpose, Engine as _};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use log::{debug, error, info};
use rand::RngCore;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};

// ── 全局状态 ────────────────────────────────────────────────

/// Tauri managed state：用 Mutex 包装 SQLite 连接
pub struct DbState(pub Mutex<DbStateInner>);

pub struct DbStateInner {
    pub data_dir: PathBuf,
    pub enabled: bool,
    pub conn: Option<Connection>,
}

impl DbState {
    pub fn new(data_dir: PathBuf, enabled: bool) -> Self {
        Self(Mutex::new(DbStateInner {
            data_dir,
            enabled,
            conn: None,
        }))
    }

    fn with_conn<T, F>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce(&Connection) -> Result<T, String>,
    {
        let mut inner = self.0.lock().map_err(|e| e.to_string())?;

        if !inner.enabled {
            return Err("本地历史消息存储未启用".to_string());
        }

        if inner.conn.is_none() {
            let conn = open_db(inner.data_dir.clone()).map_err(|e| e.to_string())?;
            inner.conn = Some(conn);
            info!("SQLite 数据库懒加载初始化完成");
        }

        let conn = inner
            .conn
            .as_ref()
            .ok_or_else(|| "无法获取数据库连接".to_string())?;

        f(conn)
    }
}

// ── 数据结构 ────────────────────────────────────────────────

/// 单条消息记录（前后端共用）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MsgRecord {
    /// Bot 侧的消息 ID
    pub message_id: String,
    /// 关联会话 ID（group_id 或 user_id）
    pub chat_id: i64,
    /// 会话类型："group" | "private"
    pub chat_type: String,
    /// 发送者 user_id
    pub sender_id: i64,
    /// 发送者昵称（card 优先，fallback nickname）
    pub sender_name: Option<String>,
    /// 消息序号（并非所有 Bot 都提供，可为 null）
    pub seq: Option<i64>,
    /// 消息时间戳（秒，Bot 原始值）
    pub time: i64,
    /// JSON 序列化的 MsgItemElem[] 消息段数组
    pub message: String,
    /// 纯文本摘要（getMsgRawTxt 结果）
    pub raw_message: Option<String>,
    /// 是否已撤回
    pub revoked: bool,
}

/// 获取当前平台的数据库加密密钥。
/// 若系统密码管理器不可用，回退到设备本地随机密钥文件（每台设备唯一）。
fn get_db_key(db_path: &std::path::Path) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        match crate::commands::keychain::get_or_create_db_key() {
            Ok(key) => return Ok(key),
            Err(e) => log::warn!("钥匙串读取失败，尝试本地回退密钥：{}", e),
        }
    }
    #[cfg(target_os = "windows")]
    {
        match crate::commands::keychain::get_or_create_db_key() {
            Ok(key) => return Ok(key),
            Err(e) => log::warn!("Windows 凭据管理器读取失败，尝试本地回退密钥：{}", e),
        }
    }
    #[cfg(target_os = "linux")]
    {
        match crate::commands::keychain::get_or_create_db_key() {
            Ok(key) => return Ok(key),
            Err(e) => log::warn!("Linux Secret Service 读取失败，尝试本地回退密钥：{}", e),
        }
    }

    let fallback_path = db_path.with_extension("dbkey");
    get_or_create_fallback_db_key(&fallback_path)
}

fn get_or_create_fallback_db_key(path: &std::path::Path) -> Result<String, String> {
    if let Ok(existing) = fs::read_to_string(path) {
        let key = existing.trim().to_string();
        if !key.is_empty() {
            return Ok(key);
        }
    }

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("创建密钥目录失败：{}", e))?;
    }

    let mut buf = [0u8; 32];
    rand::rng().fill_bytes(&mut buf);
    let key: String = buf.iter().map(|b| format!("{:02x}", b)).collect();

    fs::write(path, &key).map_err(|e| format!("写入回退密钥失败：{}", e))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(path, fs::Permissions::from_mode(0o600));
    }

    log::warn!(
        "系统密码管理器不可用，已写入本地设备专属回退密钥：{:?}",
        path
    );

    Ok(key)
}

// ── 初始化 ──────────────────────────────────────────────────

/// 打开（或创建）数据库，建表建索引
pub fn open_db(data_dir: PathBuf) -> rusqlite::Result<Connection> {
    std::fs::create_dir_all(&data_dir).ok();
    let db_path = data_dir.join("messages.db");

    open_or_recreate(db_path)
}

/// 尝试以加密模式打开数据库；失败直接抛出异常结束
fn open_or_recreate(db_path: std::path::PathBuf) -> rusqlite::Result<Connection> {
    match try_open_encrypted(&db_path) {
        Ok(conn) => Ok(conn),
        Err(e) => {
            log::warn!(
                "无法以加密模式打开 {:?}（{}）",
                db_path, e
            );
            // 直接退出应用
            std::process::exit(1);
        }
    }
}

/// 打开并执行加密初始化，返回就绪的连接
fn try_open_encrypted(db_path: &std::path::Path) -> rusqlite::Result<Connection> {
    let conn = Connection::open(db_path)?;

    // 从平台密码管理器获取加密密钥（必须在任何其他操作之前执行）
    let key = get_db_key(db_path)
        .map_err(|e| rusqlite::Error::InvalidParameterName(format!("数据库密钥不可用：{}", e)))?;
    conn.execute_batch(&format!("PRAGMA key = '{}';" , key))?;

    // 验证密钥是否正确（query sqlite_master 是 SQLCipher 推荐的验证方式）
    conn.execute_batch("SELECT count(*) FROM sqlite_master;")?;

    // WAL 模式：并发读写性能更好
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS messages (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            self_id     TEXT    NOT NULL,
            message_id  TEXT    NOT NULL,
            chat_id     INTEGER NOT NULL,
            chat_type   TEXT    NOT NULL,
            sender_id   INTEGER NOT NULL,
            sender_name TEXT,
            seq         INTEGER,
            time        INTEGER NOT NULL,
            message     TEXT    NOT NULL,
            raw_message TEXT,
            revoked     INTEGER NOT NULL DEFAULT 0,
            created_at  INTEGER NOT NULL,
            UNIQUE(self_id, message_id)
        );

        CREATE INDEX IF NOT EXISTS idx_messages_chat
            ON messages(self_id, chat_id, time, id);
        ",
    )?;

    // 迁移：为旧数据库添加 seq 列（若列已存在则静默忽略）
    let _ = conn.execute_batch("ALTER TABLE messages ADD COLUMN seq INTEGER;");

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS images (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            self_id    TEXT    NOT NULL,
            url_hash   TEXT    NOT NULL,
            mime_type  TEXT    NOT NULL DEFAULT 'image/jpeg',
            data       BLOB    NOT NULL,
            created_at INTEGER NOT NULL,
            UNIQUE(self_id, url_hash)
        );
        ",
    )?;

    Ok(conn)
}

// ── 命令实现 ─────────────────────────────────────────────────

fn forward_id(segment: &Value) -> Option<String> {
    let legacy;
    let id = match segment.get("type")?.as_str()? {
        "forward" => segment.get("id")?,
        "json" => {
            let data = segment.get("data")?;
            let data = if let Some(text) = data.as_str() {
                legacy = serde_json::from_str::<Value>(text).ok()?;
                &legacy
            } else {
                data
            };
            if data.get("app")?.as_str()? != "com.tencent.multimsg" {
                return None;
            }
            data.pointer("/meta/detail/resid")?
        }
        _ => return None,
    };
    match id {
        Value::String(id) if !id.is_empty() => Some(id.clone()),
        Value::Number(id) => Some(id.to_string()),
        _ => None,
    }
}

fn has_forward_content(segment: &Value) -> bool {
    segment.get("type").and_then(Value::as_str) == Some("forward")
        && segment.get("content").and_then(Value::as_array).is_some_and(|nodes| {
            !nodes.is_empty() && nodes.iter().all(|node| node.get("message").is_some_and(Value::is_array))
        })
}

fn repair_stored_forward(conn: &Connection, self_id: &str, msg: &MsgRecord) -> rusqlite::Result<()> {
    let Ok(incoming) = serde_json::from_str::<Vec<Value>>(&msg.message) else {
        return Ok(());
    };
    if !incoming.iter().any(has_forward_content) {
        return Ok(());
    }
    let stored: Option<String> = conn.query_row(
        "SELECT message FROM messages
         WHERE self_id = ?1 AND message_id = ?2 AND chat_id = ?3 AND chat_type = ?4 AND revoked = 0",
        params![self_id, msg.message_id, msg.chat_id, msg.chat_type],
        |row| row.get(0),
    ).optional()?;
    let Some(mut stored) = stored.and_then(|value| serde_json::from_str::<Vec<Value>>(&value).ok()) else {
        return Ok(());
    };
    let mut changed = false;
    for (old, new) in stored.iter_mut().zip(&incoming) {
        if has_forward_content(new) && !has_forward_content(old) {
            let id = forward_id(new);
            if forward_id(old) == id
                && (id.is_some() || old.get("type").and_then(Value::as_str) == Some("forward"))
            {
                *old = new.clone();
                changed = true;
            }
        }
    }
    if changed {
        conn.execute(
            "UPDATE messages SET message = ?1 WHERE self_id = ?2 AND message_id = ?3",
            params![Value::Array(stored).to_string(), self_id, msg.message_id],
        )?;
    }
    Ok(())
}

/// 批量保存消息，并补全已有记录里尚未加载的合并转发。
///
/// 返回实际插入的条数。
#[tauri::command]
pub fn db_save_messages(
    state: State<DbState>,
    self_id: String,
    messages: Vec<MsgRecord>,
) -> Result<usize, String> {
    state.with_conn(|conn| {
        let now = chrono::Utc::now().timestamp_millis();
        let mut inserted = 0usize;

        debug!("保存 {} 条 {} 的消息 ……", messages.len(), self_id);

        for msg in &messages {
            let n = conn
                .execute(
                    "INSERT OR IGNORE INTO messages
                        (self_id, message_id, chat_id, chat_type,
                         sender_id, sender_name, seq, time, message,
                         raw_message, revoked, created_at)
                     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)",
                    params![
                        self_id,
                        msg.message_id,
                        msg.chat_id,
                        msg.chat_type,
                        msg.sender_id,
                        msg.sender_name,
                        msg.seq,
                        msg.time,
                        msg.message,
                        msg.raw_message,
                        msg.revoked as i32,
                        now,
                    ],
                )
                .map_err(|e| e.to_string())?;
            if n == 0 && !msg.revoked {
                repair_stored_forward(conn, &self_id, msg).map_err(|e| e.to_string())?;
            }
            inserted += n;
        }

        debug!("成功保存 {} 条消息", inserted);

        Ok(inserted)
    })
}

#[tauri::command]
pub fn db_refresh_image_url(
    state: State<DbState>,
    self_id: String,
    message_id: String,
    chat_id: i64,
    chat_type: String,
    segment_index: usize,
    previous_url: Option<String>,
    url: String,
) -> Result<bool, String> {
    let url_path = format!("$[{segment_index}].url");
    let type_path = format!("$[{segment_index}].type");
    state.with_conn(|conn| {
        conn.execute(
            "UPDATE messages SET message = json_set(message, ?1, ?2)
             WHERE self_id = ?3 AND message_id = ?4 AND chat_id = ?5 AND chat_type = ?6
               AND revoked = 0 AND CASE WHEN json_valid(message) THEN
                   json_extract(message, ?7) = 'image' AND json_extract(message, ?1) IS ?8
               END",
            params![url_path, url, self_id, message_id, chat_id, chat_type, type_path, previous_url],
        ).map(|count| count > 0).map_err(|e| e.to_string())
    })
}

/// 获取某会话最新 n 条消息（正序返回，revoked 消息不包含）
#[tauri::command]
pub fn db_get_latest(
    state: State<DbState>,
    self_id: String,
    chat_id: i64,
    n: i64,
) -> Result<Vec<MsgRecord>, String> {
    state.with_conn(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT message_id, chat_id, chat_type, sender_id, sender_name,
                        seq, time, message, raw_message, revoked
                 FROM messages
                 WHERE self_id = ?1 AND chat_id = ?2 AND revoked = 0
                 ORDER BY time DESC, id DESC
                 LIMIT ?3",
            )
            .map_err(|e| e.to_string())?;

        let mut list: Vec<MsgRecord> = stmt
            .query_map(params![self_id, chat_id, n], row_to_record)
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        // DESC 查询 → 翻转为正序（旧→新）
        list.reverse();
        Ok(list)
    })
}

/// 获取锚点消息之前（更旧）的 n 条，不含锚点本身，正序返回
///
/// 典型用途：上拉加载更多历史。
#[tauri::command]
pub fn db_get_before(
    state: State<DbState>,
    self_id: String,
    chat_id: i64,
    message_id: String,
    n: i64,
) -> Result<Vec<MsgRecord>, String> {
    state.with_conn(|conn| {
        let anchor = get_anchor(conn, &self_id, &message_id)
            .ok_or_else(|| format!("message_id '{}' not found in local db", message_id))?;

        let mut stmt = conn
            .prepare(
                "SELECT message_id, chat_id, chat_type, sender_id, sender_name,
                        seq, time, message, raw_message, revoked
                 FROM messages
                 WHERE self_id = ?1 AND chat_id = ?2 AND revoked = 0
                   AND (time < ?3 OR (time = ?3 AND id < ?4))
                 ORDER BY time DESC, id DESC
                 LIMIT ?5",
            )
            .map_err(|e| e.to_string())?;

        let mut list: Vec<MsgRecord> = stmt
            .query_map(
                params![self_id, chat_id, anchor.0, anchor.1, n],
                row_to_record,
            )
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        list.reverse();
        Ok(list)
    })
}

/// 获取指定时间戳之前（更旧）的 n 条，不含时间更新于锚点之后的消息，正序返回。
///
/// 典型用途：没有 seq/message_id 可用时，按 time 作为上拉历史锚点。
#[tauri::command]
pub fn db_get_before_by_time(
    state: State<DbState>,
    self_id: String,
    chat_id: i64,
    before_time: i64,
    n: i64,
) -> Result<Vec<MsgRecord>, String> {
    if before_time <= 0 || n <= 0 {
        return Ok(vec![]);
    }

    state.with_conn(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT message_id, chat_id, chat_type, sender_id, sender_name,
                        seq, time, message, raw_message, revoked
                 FROM messages
                 WHERE self_id = ?1 AND chat_id = ?2 AND revoked = 0
                   AND time <= ?3
                 ORDER BY time DESC, id DESC
                 LIMIT ?4",
            )
            .map_err(|e| e.to_string())?;

        let mut list: Vec<MsgRecord> = stmt
            .query_map(params![self_id, chat_id, before_time, n], row_to_record)
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        list.reverse();
        Ok(list)
    })
}

/// 获取锚点消息之后（更新）的 n 条，不含锚点本身，正序返回
///
/// 典型用途：跳转到指定消息后加载后续内容。
#[tauri::command]
pub fn db_get_after(
    state: State<DbState>,
    self_id: String,
    chat_id: i64,
    message_id: String,
    n: i64,
) -> Result<Vec<MsgRecord>, String> {
    state.with_conn(|conn| {
        let anchor = get_anchor(conn, &self_id, &message_id)
            .ok_or_else(|| format!("message_id '{}' not found in local db", message_id))?;

        let mut stmt = conn
            .prepare(
                "SELECT message_id, chat_id, chat_type, sender_id, sender_name,
                        seq, time, message, raw_message, revoked
                 FROM messages
                 WHERE self_id = ?1 AND chat_id = ?2 AND revoked = 0
                   AND (time > ?3 OR (time = ?3 AND id > ?4))
                 ORDER BY time ASC, id ASC
                 LIMIT ?5",
            )
            .map_err(|e| e.to_string())?;

        let list: Vec<MsgRecord> = stmt
            .query_map(
                params![self_id, chat_id, anchor.0, anchor.1, n],
                row_to_record,
            )
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(list)
    })
}

/// 在指定会话中按关键词全文搜索消息（在 raw_message 中匹配）
///
/// 返回匹配的消息列表，正序（旧→新）。
#[tauri::command]
pub fn db_search_messages(
    state: State<DbState>,
    self_id: String,
    chat_id: i64,
    query: String,
) -> Result<Vec<MsgRecord>, String> {
    state.with_conn(|conn| {
        let pattern = format!("%{}%", query);

        let mut stmt = conn
            .prepare(
                "SELECT message_id, chat_id, chat_type, sender_id, sender_name,
                        seq, time, message, raw_message, revoked
                 FROM messages
                 WHERE self_id = ?1 AND chat_id = ?2 AND revoked = 0
                   AND raw_message LIKE ?3
                 ORDER BY time ASC, id ASC",
            )
            .map_err(|e| e.to_string())?;

        let list: Vec<MsgRecord> = stmt
            .query_map(params![self_id, chat_id, pattern], row_to_record)
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(list)
    })
}

/// 将某条消息标记为已撤回
///
/// 返回是否命中（true = 找到并更新了该消息）。
#[tauri::command]
pub fn db_revoke_message(
    state: State<DbState>,
    self_id: String,
    message_id: String,
) -> Result<bool, String> {
    state.with_conn(|conn| {
        let n = conn
            .execute(
                "UPDATE messages SET revoked = 1
                 WHERE self_id = ?1 AND message_id = ?2",
                params![self_id, message_id],
            )
            .map_err(|e| e.to_string())?;
        Ok(n > 0)
    })
}

/// 存储统计结果
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbStats {
    /// 当前账号已保存的有效消息条数（不含已撤回）
    pub total_messages: i64,
    /// 已缓存的图片张数
    pub image_count: i64,
    /// 图片缓存占用的原始字节总量（BLOB 合计）
    pub image_cache_bytes: i64,
    /// 数据库文件大小（字节）
    pub db_size_bytes: u64,
}

/// 获取当前账号的消息存储统计信息
#[tauri::command]
pub fn db_get_stats(
    state: State<DbState>,
    app_handle: tauri::AppHandle,
    self_id: String,
) -> Result<DbStats, String> {
    state.with_conn(|conn| {
        let total: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM messages WHERE self_id = ?1 AND revoked = 0",
                params![self_id],
                |r| r.get(0),
            )
            .unwrap_or(0);

        let (image_count, image_cache_bytes): (i64, i64) = conn
            .query_row(
                "SELECT COUNT(*), COALESCE(SUM(LENGTH(data)), 0) FROM images WHERE self_id = ?1",
                params![self_id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap_or((0, 0));

        let data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())?;
        let db_size = std::fs::metadata(data_dir.join("messages.db"))
            .map(|m| m.len())
            .unwrap_or(0);

        Ok(DbStats {
            total_messages: total,
            image_count,
            image_cache_bytes,
            db_size_bytes: db_size,
        })
    })
}

/// 已缓存图片（返回给前端用于展示）
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedImage {
    pub mime_type: String,
    /// base64 编码的原始图片字节
    pub data: String,
}

/// 分批清理图片缓存时的进度
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DbClearImagesProgress {
    pub self_id: String,
    pub total: i64,
    pub deleted: i64,
    pub batch_deleted: i64,
    /// 0 ~ 100
    pub progress: f64,
    pub done: bool,
}

/// 图片缓存清理结果
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbClearImagesResult {
    pub total: i64,
    pub deleted: i64,
    pub batches: i64,
}

/// 将图片缓存到本地数据库
///
/// `data` 为 base64 编码的原始图片字节，后端将解码后以 BLOB 形式加密存储。
#[tauri::command]
pub fn db_cache_image(
    state: State<DbState>,
    self_id: String,
    url_hash: String,
    mime_type: String,
    data: String,
) -> Result<(), String> {
    state.with_conn(|conn| {
        let bytes = general_purpose::STANDARD
            .decode(&data)
            .map_err(|e| e.to_string())?;
        if bytes.is_empty() {
            return Err("图片数据为空".into());
        }
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        conn.execute(
            "INSERT INTO images (self_id, url_hash, mime_type, data, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(self_id, url_hash) DO UPDATE SET
                 mime_type = excluded.mime_type, data = excluded.data, created_at = excluded.created_at",
            params![self_id, url_hash, mime_type, bytes, now],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })
}

/// 从本地数据库获取已缓存的图片
///
/// 返回 `CachedImage`（含 MIME 类型和 base64 编码数据），若未缓存则返回 `None`。
#[tauri::command]
pub fn db_get_image(
    state: State<DbState>,
    self_id: String,
    url_hash: String,
) -> Result<Option<CachedImage>, String> {
    state.with_conn(|conn| {
        let result: rusqlite::Result<(String, Vec<u8>)> = conn.query_row(
            "SELECT mime_type, data FROM images WHERE self_id = ?1 AND url_hash = ?2",
            params![self_id, url_hash],
            |row| Ok((row.get(0)?, row.get(1)?)),
        );
        match result {
            Ok((mime_type, bytes)) => Ok(Some(CachedImage {
                mime_type,
                data: general_purpose::STANDARD.encode(&bytes),
            })),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    })
}

/// 清理当前账号的图片缓存
///
/// 返回实际删除的图片条数。
#[tauri::command]
pub fn db_clear_images(
    state: State<DbState>,
    app_handle: AppHandle,
    self_id: String,
) -> Result<DbClearImagesResult, String> {
    state.with_conn(|conn| {
        let batch_size = 500i64;
        let total: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM images WHERE self_id = ?1",
                params![self_id],
                |r| r.get(0),
            )
            .unwrap_or(0);

        let _ = app_handle.emit(
            "db:clearImagesProgress",
            DbClearImagesProgress {
                self_id: self_id.clone(),
                total,
                deleted: 0,
                batch_deleted: 0,
                progress: if total == 0 { 100.0 } else { 0.0 },
                done: total == 0,
            },
        );

        let mut deleted = 0i64;
        let mut batches = 0i64;

        while deleted < total {
            let batch_deleted = conn
                .execute(
                    "DELETE FROM images
                     WHERE id IN (
                        SELECT id FROM images WHERE self_id = ?1 LIMIT ?2
                     )",
                    params![self_id, batch_size],
                )
                .map_err(|e| e.to_string())? as i64;

            if batch_deleted == 0 {
                break;
            }

            deleted += batch_deleted;
            batches += 1;
            let progress = if total > 0 {
                ((deleted as f64 / total as f64) * 100.0).min(100.0)
            } else {
                100.0
            };

            let _ = app_handle.emit(
                "db:clearImagesProgress",
                DbClearImagesProgress {
                    self_id: self_id.clone(),
                    total,
                    deleted,
                    batch_deleted,
                    progress,
                    done: false,
                },
            );
        }

        let _ = app_handle.emit(
            "db:clearImagesProgress",
            DbClearImagesProgress {
                self_id: self_id.clone(),
                total,
                deleted,
                batch_deleted: 0,
                progress: 100.0,
                done: true,
            },
        );

        info!(
            "已分批清理账号 {} 的图片缓存：{} / {} 条，共 {} 批",
            self_id, deleted, total, batches
        );
        Ok(DbClearImagesResult {
            total,
            deleted,
            batches,
        })
    })
}

// ── 内部工具 ─────────────────────────────────────────────────

/// 通过 message_id 查询锚点的 (time, rowid)
fn get_anchor(conn: &Connection, self_id: &str, message_id: &str) -> Option<(i64, i64)> {
    conn.query_row(
        "SELECT time, id FROM messages WHERE self_id = ?1 AND message_id = ?2",
        params![self_id, message_id],
        |row| Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?)),
    )
    .ok()
}

/// 将 rusqlite 行映射为 MsgRecord
fn row_to_record(row: &rusqlite::Row) -> rusqlite::Result<MsgRecord> {
    Ok(MsgRecord {
        message_id: row.get(0)?,
        chat_id: row.get(1)?,
        chat_type: row.get(2)?,
        sender_id: row.get(3)?,
        sender_name: row.get(4)?,
        seq: row.get(5)?,
        time: row.get(6)?,
        message: row.get(7)?,
        raw_message: row.get(8)?,
        revoked: row.get::<_, i32>(9)? != 0,
    })
}
