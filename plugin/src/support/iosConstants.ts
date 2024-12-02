export const IPHONEOS_DEPLOYMENT_TARGET = "14.0";
export const TARGETED_DEVICE_FAMILY = `"1,2"`;
export const SWIFT_VERSION = "5.0";

export const GROUPS_ID_TEMPLATE_REGEX = /{{GROUPS_ID_TEMPLATE_REGEX}}/gm;

export const DEFAULT_BUNDLE_VERSION = "1";
export const DEFAULT_BUNDLE_SHORT_VERSION = "1.0";
export const BUNDLE_SHORT_VERSION_TEMPLATE_REGEX = /{{BUNDLE_SHORT_VERSION}}/gm;
export const BUNDLE_VERSION_TEMPLATE_REGEX = /{{BUNDLE_VERSION}}/gm;

export const NSE_BRIDGE_HEADER_SNIPPET = `
#import "React/RCTBridgeModule.h"
#import <React/RCTEventEmitter.h>
`;

export const NSE_TARGET_NAME = "SafariAdsBlocker";
export const NSE_SOURCE_FILE = "SafariAdsBlockerRequestHandler.swift";
export const NATIVE_MODULES_FILES = [];
export const NSE_EXT_FILES = [
  "rules.json",
  "SafariAdsBlockerRequestHandler.swift",
  `${NSE_TARGET_NAME}.entitlements`,
  `${NSE_TARGET_NAME}-Info.plist`,
];
