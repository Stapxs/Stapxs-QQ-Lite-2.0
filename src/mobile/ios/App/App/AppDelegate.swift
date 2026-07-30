import UIKit
import Capacitor
import BackgroundTasks

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        UIViewController.initializeMethod()

        // 注册后台任务
        registerBackgroundTasks()

        return true
    }

    // MARK: - Background Tasks

    private func registerBackgroundTasks() {
        if #available(iOS 13.0, *) {
            // 注册后台处理任务 - 用于保持 WebSocket 连接
            BGTaskScheduler.shared.register(
                forTaskWithIdentifier: "cn.stapxs.webqq.refresh",
                using: nil
            ) { task in
                self.handleAppRefresh(task: task as! BGAppRefreshTask)
            }

            // 注册后台处理任务 - 用于处理长时间运行的任务
            BGTaskScheduler.shared.register(
                forTaskWithIdentifier: "cn.stapxs.webqq.processing",
                using: nil
            ) { task in
                self.handleProcessingTask(task: task as! BGProcessingTask)
            }
        }
    }

    @available(iOS 13.0, *)
    private func handleAppRefresh(task: BGAppRefreshTask) {
        // 调度下一次后台刷新
        scheduleAppRefresh()

        // 创建一个操作来处理后台任务
        let queue = OperationQueue()
        queue.maxConcurrentOperationCount = 1

        // 监听任务过期
        task.expirationHandler = {
            queue.cancelAllOperations()
        }

        // 执行后台任务
        queue.addOperation {
            // 这里可以触发 WebSocket 重连或发送心跳
            NotificationCenter.default.post(name: Notification.Name("backgroundRefresh"), object: nil)

            // 完成任务
            task.setTaskCompleted(success: true)
        }
    }

    @available(iOS 13.0, *)
    private func handleProcessingTask(task: BGProcessingTask) {
        // 调度下一次处理任务
        scheduleProcessingTask()

        task.expirationHandler = {
            // 任务即将过期
            task.setTaskCompleted(success: false)
        }

        // 执行长时间运行的任务
        DispatchQueue.global().async {
            // 触发后台处理
            NotificationCenter.default.post(name: Notification.Name("backgroundProcessing"), object: nil)
            task.setTaskCompleted(success: true)
        }
    }

    @available(iOS 13.0, *)
    private func scheduleAppRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: "cn.stapxs.webqq.refresh")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15分钟后

        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("无法调度后台刷新任务: \(error)")
        }
    }

    @available(iOS 13.0, *)
    private func scheduleProcessingTask() {
        let request = BGProcessingTaskRequest(identifier: "cn.stapxs.webqq.processing")
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        request.earliestBeginDate = Date(timeIntervalSinceNow: 30 * 60) // 30分钟后

        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("无法调度后台处理任务: \(error)")
        }
    }

    @available(iOS 13.0, *)
    func scheduleBackgroundTasksIfNeeded() {
        scheduleAppRefresh()
        scheduleProcessingTask()
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
