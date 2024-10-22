#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ContentBlockerManagerModule, NSObject)

RCT_EXTERN_METHOD(getState:(NSString *)identifier resolver:(RCTPromiseResolveBlock *)resolve rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(reload:(NSString *)identifier resolver:(RCTPromiseResolveBlock *)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
