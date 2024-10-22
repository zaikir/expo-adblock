#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE (GroupFileSaverModule, NSObject)

RCT_EXTERN_METHOD(saveFileToGroup
                  : (NSString *)content fileName
                  : (NSString *)filename groupName
                  : (NSString *)groupName resolver
                  : (RCTPromiseResolveBlock *)resolve rejecter
                  : (RCTPromiseRejectBlock)reject)

@end
