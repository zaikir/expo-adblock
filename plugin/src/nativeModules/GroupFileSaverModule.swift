import Foundation

@objc(GroupFileSaverModule)
class GroupFileSaverModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool {
      return false
    }
  
  @objc(saveFileToGroup:fileName:groupName:resolver:rejecter:)
  func saveFileToGroup(
    _ content: String,
    fileName: String,
    groupName: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let fileURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupName)!.appendingPathComponent(fileName)

    do {
      try content.write(to: fileURL, atomically: true, encoding: .utf8)
      resolve(true)
    } catch {
      NSLog("Couldn't write content to file")
      reject("saveFileToGroup failure", error.localizedDescription, nil)
    }
  }
}
