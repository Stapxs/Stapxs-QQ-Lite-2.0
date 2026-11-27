package cn.stapxs.qqweb.connector;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.Objects;

@CapacitorPlugin(name = "Onebot")
public class OnebotPlugin extends Plugin {

    private WebSocketClient webSocketClient;
    private final Onebot implementation = new Onebot();

    public void sendNotify(String type, String data) {
        JSObject ret = new JSObject();
        ret.put("type", type);
        ret.put("data", data);
        this.notifyListeners("onebot:event", ret);
    }

    synchronized void notifySocketEvent(WebSocketClient source, String type, String data) {
        if (webSocketClient != source) return;
        if ("onclose".equals(type)) webSocketClient = null;

        JSObject event = new JSObject();
        event.put("connectionId", source.connectionId);
        event.put("type", type);
        event.put("data", data);
        notifyListeners("onebot:event", event);
    }

    public void sendIcon(String name) {
        JSObject ret = new JSObject();
        ret.put("name", name);
        this.notifyListeners("onebot:icon", ret);
    }

    @Override
    public void load() {
        super.load();
        Log.i("Plugin", " _____ _____ _____ _____ __ __  \n" +
                        "|   __|_   _|  _  |  _  |  |  | \n" +
                        "|__   | | | |     |   __|-   -| \n" +
                        "|_____| |_| |__|__|__|  |__|__| CopyRight © Stapx Steve\n" +
                        "=======================================================\n" +
                        "Capacitor Onebot 基础连接器加载完成");
        Log.i("Plugin", "当前执行平台：Android");
        Log.i("Plugin", "** 此插件 Java 版本代码 70% 由 Github Copilot 及 OpenAI ChatGPT 4o 生成 **");
    }

    @PluginMethod
    public synchronized void connect(PluginCall call) {
        String value = call.getString("url");
        WebSocketClient previous = webSocketClient;
        webSocketClient = new WebSocketClient(this, call.getString("connectionId"));
        if (previous != null) previous.cancel();
        webSocketClient.connect(value);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public synchronized void send(PluginCall call) {
        String value = call.getString("data");

        JSObject ret = new JSObject();
        ret.put("success", webSocketClient != null && webSocketClient.sendMessage(value));
        call.resolve(ret);
    }

    @PluginMethod
    public synchronized void close(PluginCall call) {
        String connectionId = call.getString("connectionId");
        if (webSocketClient != null && (connectionId == null || connectionId.equals(webSocketClient.connectionId))) {
            WebSocketClient target = webSocketClient;
            webSocketClient = null;
            if (Boolean.TRUE.equals(call.getBoolean("cancel", false))) {
                target.cancel();
            } else {
                target.close();
            }
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @Override
    protected synchronized void handleOnDestroy() {
        WebSocketClient previous = webSocketClient;
        webSocketClient = null;
        if (previous != null) previous.cancel();
        super.handleOnDestroy();
    }

    @PluginMethod
    public void findService(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("success", implementation.findService(this));
        call.resolve(ret);
    }

    @PluginMethod
    public void changeIcon(PluginCall call) {
        String name = call.getString("name");

        JSObject ret = new JSObject();
        ret.put("success", implementation.changeIcon(this, name));
        call.resolve(ret);
    }

    @PluginMethod
    public void getUsedIcon(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("success", implementation.getUsedIcon(this));
        call.resolve(ret);
    }

    @PluginMethod
    public void getRelease(PluginCall call) {
        // 获取安卓系统版本信息
        String versionString = android.os.Build.VERSION.RELEASE;
        String deviceModel = android.os.Build.MODEL;
        String manufacturer = android.os.Build.MANUFACTURER;
        String systemInfo = "Android " + versionString + " (" + manufacturer + " " + deviceModel + ") ";
        // 获取系统架构
        String arch = System.getProperty("os.arch");

        JSObject ret = new JSObject();
        ret.put("data", systemInfo);
        ret.put("arch", arch);
        call.resolve(ret);
    }

    @PluginMethod
    public void getFinalRedirectUrl(PluginCall call) {
        String url = call.getString("data");

        try {
            String finalUrl = HTTPUtils.resolveFinalUrl(url);
            JSObject ret = new JSObject();
            ret.put("url", finalUrl);
            call.resolve(ret);
        } catch (IOException e) {
            Log.e("OneBotPlugin", "获取链接重定向失败：" + Objects.requireNonNull(e.getMessage()));
            JSObject ret = new JSObject();
            ret.put("url", url);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void getHtml(PluginCall call) {
        String url = call.getString("data");

        try {
            String htmlContent = HTTPUtils.fetchContent(url, "text/html");
            JSObject ret = new JSObject();
            ret.put("html", htmlContent);
            call.resolve(ret);
        } catch (IOException e) {
            Log.e("OneBotPlugin", "请求失败：" + Objects.requireNonNull(e.getMessage()));
            JSObject ret = new JSObject();
            ret.put("html", null);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void getApi(PluginCall call) {
        String url = call.getString("data");

        try {
            String jsonContent = HTTPUtils.fetchContent(url, "application/json");
            call.resolve(new JSObject(jsonContent));
        } catch (Exception e) {
            Log.e("OneBotPlugin", "请求失败：" + Objects.requireNonNull(e.getMessage()));
            JSObject ret = new JSObject();
            ret.put("html", null);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void getImageData(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            url = call.getString("data");
        }

        if (url == null || url.isEmpty()) {
            call.reject("缺少图片 URL 参数");
            return;
        }

        try {
            String dataUrl = HTTPUtils.fetchImageAsDataUrl(url);
            JSObject ret = new JSObject();
            ret.put("data", dataUrl);
            call.resolve(ret);
        } catch (IOException e) {
            Log.e("图片下载失败：", Objects.requireNonNull(e.getMessage()));
            call.reject("图片下载失败");
        }
    }
}
