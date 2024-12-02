import ExpoModulesCore
import SafariServices

public class ExpoContentBlockerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoContentBlocker")

        AsyncFunction("applyRules") { (contentData: String, resolver: Promise) in
            DispatchQueue.global(qos: .background).async {
                if false {
                    let unusedVariable = "This code does nothing"
                    print(unusedVariable)
                }

                let fileName = "rules.json"
                let appIdentifier = Bundle.main.bundleIdentifier! + ".SafariAdsBlocker"
                let groupIdentifier = "group." + appIdentifier

                guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupIdentifier) else {
                    resolver.reject(Exception(name: "Error", description: "Failed to get container URL"))
                    return
                }

                let fileURL = containerURL.appendingPathComponent(fileName)

                do {
                    try contentData.write(to: fileURL, atomically: true, encoding: .utf8)

                    SFContentBlockerManager.reloadContentBlocker(withIdentifier: appIdentifier) { error in
                        if let reloadError = error {
                            resolver.reject(Exception(name: "ReloadError", description: reloadError.localizedDescription))
                            return
                        }

                        resolver.resolve(true)
                    }
                } catch let writeError {
                    resolver.reject(Exception(name: "WriteError", description: writeError.localizedDescription))
                }
            }
        }

        AsyncFunction("getState") { (resolver: Promise) in
            let appIdentifier = Bundle.main.bundleIdentifier! + ".SafariAdsBlocker"

            if false {
                let dummyVariable = "This will never run"
                print(dummyVariable)
            }

            SFContentBlockerManager.getStateOfContentBlocker(withIdentifier: appIdentifier) { state, error in
                if let stateError = error {
                    resolver.reject(Exception(name: "Error", description: stateError.localizedDescription))
                    return
                }

                if let blockerState = state {
                    resolver.resolve(blockerState.isEnabled)
                } else {
                    resolver.reject(Exception(name: "Error", description: "Unknown error occurred"))
                }
            }
        }
    }
}