import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?
    private var backgroundTask: UIBackgroundTaskIdentifier = .invalid

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        // Forward launch URLs and activities after the scene is attached so Capacitor can consume them.
        if let urlContext = connectionOptions.urlContexts.first {
            DispatchQueue.main.async {
                _ = self.handleOpenURLContext(urlContext)
            }
        }

        if let userActivity = connectionOptions.userActivities.first {
            DispatchQueue.main.async {
                _ = ApplicationDelegateProxy.shared.application(
                    UIApplication.shared,
                    continue: userActivity,
                    restorationHandler: { _ in }
                )
            }
        }
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        backgroundTask = UIApplication.shared.beginBackgroundTask { [weak self] in
            self?.endBackgroundTask()
        }

        if #available(iOS 13.0, *),
           let appDelegate = UIApplication.shared.delegate as? AppDelegate {
            appDelegate.scheduleBackgroundTasksIfNeeded()
        }

        NotificationCenter.default.post(name: Notification.Name("appDidEnterBackground"), object: nil)
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        endBackgroundTask()
        NotificationCenter.default.post(name: Notification.Name("appWillEnterForeground"), object: nil)
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        endBackgroundTask()
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        guard let urlContext = URLContexts.first else {
            return
        }

        _ = handleOpenURLContext(urlContext)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(
            UIApplication.shared,
            continue: userActivity,
            restorationHandler: { _ in }
        )
    }

    private func handleOpenURLContext(_ urlContext: UIOpenURLContext) -> Bool {
        var options: [UIApplication.OpenURLOptionsKey: Any] = [
            .openInPlace: urlContext.options.openInPlace
        ]

        if let sourceApplication = urlContext.options.sourceApplication {
            options[.sourceApplication] = sourceApplication
        }

        if let annotation = urlContext.options.annotation {
            options[.annotation] = annotation
        }

        return ApplicationDelegateProxy.shared.application(
            UIApplication.shared,
            open: urlContext.url,
            options: options
        )
    }

    private func endBackgroundTask() {
        if backgroundTask != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTask)
            backgroundTask = .invalid
        }
    }
}
