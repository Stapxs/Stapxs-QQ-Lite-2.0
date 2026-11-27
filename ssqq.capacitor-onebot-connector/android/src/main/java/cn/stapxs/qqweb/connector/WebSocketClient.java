package cn.stapxs.qqweb.connector;

import android.util.Log;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

public class WebSocketClient {
    private static final OkHttpClient CLIENT = new OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build();
    final String connectionId;
    private WebSocket webSocket;

    private final OnebotPlugin plugin;

    public WebSocketClient(OnebotPlugin plugin, String connectionId) {
        this.plugin = plugin;
        this.connectionId = connectionId;
    }

    public void connect(String serverUrl) {
        Request request;
        try {
            request = new Request.Builder()
                .url(serverUrl)
                .build();
        } catch (IllegalArgumentException | NullPointerException ex) {
            closeBack(-1, "WebSocket URL 无效");
            return;
        }

        webSocket = CLIENT.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(
                @NonNull WebSocket webSocket,
                @NonNull Response response) {
                plugin.notifySocketEvent(WebSocketClient.this, "onopen", "{}");
            }

            @Override
            public void onMessage(
                @NonNull WebSocket webSocket,
                @NonNull String text) {
                plugin.notifySocketEvent(WebSocketClient.this, "onmessage", text);
            }

            @Override
            public void onClosing(@NonNull WebSocket webSocket, int code, @NonNull String reason) {
                webSocket.close(1000, null);
            }

            @Override
            public void onClosed(
                @NonNull WebSocket webSocket,
                int code, @NonNull String reason) {
                Log.d("Onebot", "WebSocket closed: " + code);
                closeBack(code, reason);
            }

            @Override
            public void onFailure(
                @NonNull WebSocket webSocket,
                @NonNull Throwable t, Response response) {
                String detail = response == null ? t.getClass().getSimpleName() : "HTTP " + response.code();
                Log.d("Onebot", "WebSocket failure: " + detail);
                closeBack(-1, detail);
            }
        });
    }

    public boolean sendMessage(String message) {
        return webSocket != null && message != null && webSocket.send(message);
    }

    public void close() {
        if (webSocket != null) {
            webSocket.close(1000, "客户端关闭连接");
        }
    }

    public void cancel() {
        if (webSocket != null) webSocket.cancel();
    }

    private void closeBack(int code, String error) {
        JSObject ret = new JSObject();
        ret.put("code", code);
        ret.put("message", error);
        plugin.notifySocketEvent(this, "onclose", ret.toString());
    }
}
