import ExpoModulesCore
import SafariServices

public class ExpoContentBlockerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoContentBlocker")

    AsyncFunction("applyRules") { (content: String, promise: Promise) in
        DispatchQueue.global(qos: .background).async {
            let fileName = "blockerList.json";
            let identifier = Bundle.main.bundleIdentifier! + ".ContentBlocker";
            let groupName = "group." + identifier;

            let fileURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupName)!.appendingPathComponent(fileName)

            do {
                try content.write(to: fileURL, atomically: true, encoding: .utf8)

                SFContentBlockerManager.reloadContentBlocker(withIdentifier: identifier, completionHandler: { error in
                    if let error = error {
                        promise.reject(
                            Exception(
                                name: "Reload error",
                                description: "\(error.localizedDescription)"
                            )
                        )
                        return
                    }

                    promise.resolve(true)
                })
            } catch {
                promise.reject(
                    Exception(
                        name: "Error",
                        description: "\(error)"
                    )
                )
            }
        }
    }


    AsyncFunction("getState") { (promise: Promise) in 
        let identifier = Bundle.main.bundleIdentifier! + ".ContentBlocker";

        SFContentBlockerManager.getStateOfContentBlocker(withIdentifier: identifier, completionHandler: { state, error in
            if let error = error {
                promise.reject(
                    Exception(
                        name: "Error",
                        description: "\(error.localizedDescription)"
                    )
                )
                return
            }
            
            if let state = state {
                let contentBlockerIsEnabled = state.isEnabled
                promise.resolve(contentBlockerIsEnabled)
            } else {
                promise.reject(
                    Exception(
                        name: "Error",
                        description: "Unknown error"
                    )
                )
            }
        })
    }
  }
}
