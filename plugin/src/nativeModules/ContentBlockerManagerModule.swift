import Foundation
import SafariServices

@objc(ContentBlockerManagerModule)
class ContentBlockerManagerModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool {
      return false
    }
  
  @objc(getState:resolver:rejecter:)
  func getState(
    _ identifier: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    SFContentBlockerManager.getStateOfContentBlocker(withIdentifier: identifier, completionHandler: { state, error in
      if let error = error {
        reject("getState failure", error.localizedDescription, nil)
        return
      }

      if let state = state {
        let contentBlockerIsEnabled = state.isEnabled
        resolve(contentBlockerIsEnabled)
      }
    })
  }

  @objc(reload:resolver:rejecter:)
  func reload(
    _ identifier: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    SFContentBlockerManager.reloadContentBlocker(withIdentifier: identifier, completionHandler: { error in
      if let error = error {
        print(error)
        
        reject("reload failure", error.localizedDescription, nil)
        return
      }

      resolve(nil)
    })
  }
}
