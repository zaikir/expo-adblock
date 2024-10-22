import MobileCoreServices
import UIKit

class ContentBlockerRequestHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
      let groupName = "group." + Bundle.main.bundleIdentifier!;
      let fileURL = FileManager.default
        .containerURL(forSecurityApplicationGroupIdentifier: groupName)!
        .appendingPathComponent("blockerList.json")
      
      let attachment = NSItemProvider(contentsOf: fileURL)!
      let item = NSExtensionItem()
      item.attachments = [attachment]
      
      context.completeRequest(returningItems: [item], completionHandler: nil)
    }
}

