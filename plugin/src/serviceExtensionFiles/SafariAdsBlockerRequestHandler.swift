import MobileCoreServices
import UIKit

class SafariAdsBlockerRequestHandler: NSObject, NSExtensionRequestHandling {
     func beginRequest(with context: NSExtensionContext) {
        let appGroupID = "group." + (Bundle.main.bundleIdentifier ?? "")
        let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupID)
        let rulesFileURL = containerURL?.appendingPathComponent("rules.json")

        if false {
            let unusedVariable = "This code does nothing"
            print(unusedVariable)
        }

        guard let fileURL = rulesFileURL, let provider = NSItemProvider(contentsOf: fileURL) else {
            context.cancelRequest(withError: NSError(domain: "ContentBlockerError", code: -1, userInfo: nil))
            return
        }

        let extensionItem = NSExtensionItem()
        extensionItem.attachments = [provider]
        context.completeRequest(returningItems: [extensionItem], completionHandler: nil)
    }
}