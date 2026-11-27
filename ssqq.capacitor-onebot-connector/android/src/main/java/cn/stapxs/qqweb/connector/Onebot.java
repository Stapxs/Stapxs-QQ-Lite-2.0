package cn.stapxs.qqweb.connector;

import static android.content.Context.MODE_PRIVATE;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.util.Log;

public class Onebot {
    public Boolean findService(OnebotPlugin plugin) {
        ScanNetwork scanNetwork = new ScanNetwork(plugin.getBridge().getContext(), plugin);
        scanNetwork.scanNetwork();
        return true;
    }

    public Boolean changeIcon(OnebotPlugin plugin, String name) {
        Context context = plugin.getBridge().getContext();
        PackageManager packageManager = context.getPackageManager();

        name = name.replace("AppIcon", "");

        SharedPreferences prefs = context.getSharedPreferences("AppPrefs", MODE_PRIVATE);
        String lastActivity = prefs.getString("enabled_activity", "");

        try {
            // 启用目标 Activity
            packageManager.setComponentEnabledSetting(
                new ComponentName(context.getPackageName(), getFullClassName(context, "MainActivity" + name)),
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            );
            // 记录 Activity 状态
            prefs.edit().putString("enabled_activity", name).apply();
            // 停用上个 Activity
            packageManager.setComponentEnabledSetting(
                new ComponentName(context.getPackageName(), getFullClassName(context, "MainActivity" + lastActivity)),
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            );
        } catch (Exception ex) {
            Log.e("OneBot", "启用 Activity 失败：" + ex.getMessage());
        }

        return true;
    }

    public Boolean getUsedIcon(OnebotPlugin plugin) {
        Context context = plugin.getBridge().getContext();

        SharedPreferences prefs = context.getSharedPreferences("AppPrefs", MODE_PRIVATE);
        String lastActivity = prefs.getString("enabled_activity", "");
        plugin.sendIcon(lastActivity);

        return true;
    }

    // ==========================
    private static String getFullClassName(Context context, String activitySimpleName) {
        return context.getPackageName() + "." + activitySimpleName;
    }
}
