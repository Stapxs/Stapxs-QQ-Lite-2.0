## 关于 I10n 配置
在本文件夹下存放了语言设置文件 `_l10nconfig.json` 以及所有的语言文件。

### 语言设置文件
语言设置文件用于程序自动加载所有有效的语言，段结构如下：
~~~
{
    "value": "zh-CN",
    "name": "中文（简体）",
    "time": {
        "date": {
            "year": "numeric",
            "month": "short",
            "day": "numeric"
        },
        "time": {
            "hour": "numeric",
            "minute": "numeric",
            "second": "numeric"
        }
    }
}
~~~
- `value`：语言名称。请依照语种名称代码规范命名，同时其对于的文件名应该相同。
- `name`：显示名称。这是这个语言在语言设置选项中显示的名字。
- `time`：时间格式化的参数。依照 `ECMA-402 Intl.DateTimeFormat` 格式设置，参见：https://402.ecma-international.org/2.0/#sec-intl-datetimeformat-constructor
- `currency`：金额格式化的参数。事实上我觉得用不着这玩意，所以不写了。

### 添加新的语言
添加新语言的方式很简单，首先在语言设置文件中追加相关设置，然后在文件夹中放入对应的翻译文件 `.json`，重新启动项目即可。

### 关于特殊的格式化和保留内容
#### 参数 `{*}`
- 这是参数，从程序中生成的参数将替换这个字符。如：`"join_time": "{time} 加入群聊"
`
#### 复数 `|`
- 某些语言复数拥有特殊的格式，在可能出现复数的情况下将会像这样编写翻译：`"car": "car | cars"`

### Q&A
#### 为什么语言名要依照语种名称代码规范命名
- 因为 Vue-i18n 的日期格式化会把这个名字传入 `Intl.DateTimeFormat` 用于判断国家格式 …… 我也想加个不存在的国家（比如喵喵语？），但是这会使日期格式化报错 ……