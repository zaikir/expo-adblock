import ExpoModulesCore
import SafariServices

public class ContentBlockerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ContentBlocker")

    AsyncFunction("applyRules") { (rules: String, promise: Promise) in
        DispatchQueue.global(qos: .background).async {
            let fileName = "blockerList.json";
            let groupName = "group." + Bundle.main.bundleIdentifier! + ".ContentBlocker";

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
