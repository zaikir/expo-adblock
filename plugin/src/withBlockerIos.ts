import {
  ConfigPlugin,
  withDangerousMod,
  withEntitlementsPlist,
  withXcodeProject,
} from "@expo/config-plugins";
import {
  addBuildSourceFileToGroup,
  getProjectName,
} from "@expo/config-plugins/build/ios/utils/Xcodeproj.js";
import { ExpoConfig } from "@expo/config-types";
import assert from "assert";
import * as fs from "fs";
import * as path from "path";

import { BlockerProviderLog } from "./support/BlockerProviderLog.ts";
import { FileManager } from "./support/FileManager";
import NseUpdaterManager from "./support/NseUpdaterManager";
import getEasManagedCredentialsConfigExtra from "./support/eas/getEasManagedCredentialsConfigExtra";
import {
  DEFAULT_BUNDLE_SHORT_VERSION,
  DEFAULT_BUNDLE_VERSION,
  IPHONEOS_DEPLOYMENT_TARGET,
  NATIVE_MODULES_FILES,
  NSE_BRIDGE_HEADER_SNIPPET,
  NSE_EXT_FILES,
  NSE_SOURCE_FILE,
  NSE_TARGET_NAME,
  SWIFT_VERSION,
  TARGETED_DEVICE_FAMILY,
} from "./support/iosConstants";
import { BlockerPluginProps } from "./types";

const withAppEnvironment: ConfigPlugin<BlockerPluginProps> = (config) => {
  return withEntitlementsPlist(config, (newConfig) => {
    return newConfig;
  });
};

const withEasManagedCredentials: ConfigPlugin<BlockerPluginProps> = (
  config,
) => {
  assert(
    config.ios?.bundleIdentifier,
    "Missing 'ios.bundleIdentifier' in app config.",
  );

  config.extra = getEasManagedCredentialsConfigExtra(config as ExpoConfig);
  return config;
};

const withAdblockNSE: ConfigPlugin<BlockerPluginProps> = (config) => {
  const pluginDir = require.resolve("../jest.config.js");
  const sourceDir = path.join(pluginDir, "../src/serviceExtensionFiles/");

  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosPath = path.join(config.modRequest.projectRoot, "ios");

      /* COPY OVER EXTENSION FILES */
      fs.mkdirSync(`${iosPath}/${NSE_TARGET_NAME}`, { recursive: true });

      for (let i = 0; i < NSE_EXT_FILES.length; i++) {
        const extFile = NSE_EXT_FILES[i];
        const targetFile = `${iosPath}/${NSE_TARGET_NAME}/${extFile}`;
        await FileManager.copyFile(`${sourceDir}${extFile}`, targetFile);
      }

      // Copy NSE source file either from configuration-provided location, falling back to the default one.
      // const sourcePath = `${sourceDir}${NSE_SOURCE_FILE}`;
      // const targetFile = `${iosPath}/${NSE_TARGET_NAME}/${NSE_SOURCE_FILE}`;
      // await FileManager.copyFile(`${sourcePath}`, targetFile);

      /* MODIFY COPIED EXTENSION FILES */
      const nseUpdater = new NseUpdaterManager(iosPath);
      await nseUpdater.updateNSEEntitlements(
        `group.${config.ios?.bundleIdentifier}.ContentBlocker`,
      );
      await nseUpdater.updateNSEBundleVersion(
        config.ios?.buildNumber ?? DEFAULT_BUNDLE_VERSION,
      );
      await nseUpdater.updateNSEBundleShortVersion(
        config?.version ?? DEFAULT_BUNDLE_SHORT_VERSION,
      );

      return config;
    },
  ]);
};

const withCopyNativeModules: ConfigPlugin<BlockerPluginProps> = (config) => {
  const pluginDir = require.resolve("../jest.config.js");
  const sourceDir = path.join(pluginDir, "../build/nativeModules/");
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosPath = path.join(config.modRequest.projectRoot, "ios");

      for (let i = 0; i < NSE_EXT_FILES.length; i++) {
        const extFile = NATIVE_MODULES_FILES[i];
        const targetFile = `${iosPath}/${config.modRequest.projectName}/${extFile}`;
        await FileManager.copyFile(`${sourceDir}${extFile}`, targetFile);
      }

      return config;
    },
  ]);
};

const withAppGroupPermissions: ConfigPlugin<BlockerPluginProps> = (config) => {
  const APP_GROUP_KEY = "com.apple.security.application-groups";
  return withEntitlementsPlist(config, (newConfig) => {
    if (!Array.isArray(newConfig.modResults[APP_GROUP_KEY])) {
      newConfig.modResults[APP_GROUP_KEY] = [];
    }
    const modResultsArray = newConfig.modResults[APP_GROUP_KEY] as any[];
    const entitlement = `group.${newConfig?.ios?.bundleIdentifier || ""}.ContentBlocker`;
    if (modResultsArray.indexOf(entitlement) !== -1) {
      return newConfig;
    }
    modResultsArray.push(entitlement);

    return newConfig;
  });
};

const withAdblockXcodeProject: ConfigPlugin<BlockerPluginProps> = (
  config,
  props,
) => {
  return withXcodeProject(config, (newConfig) => {
    const xcodeProject = newConfig.modResults;

    if (xcodeProject.pbxTargetByName(NSE_TARGET_NAME)) {
      BlockerProviderLog.log(
        `${NSE_TARGET_NAME} already exists in project. Skipping...`,
      );
      return newConfig;
    }

    // Create new PBXGroup for the extension
    const extGroup = xcodeProject.addPbxGroup(
      [...NSE_EXT_FILES],
      NSE_TARGET_NAME,
      NSE_TARGET_NAME,
    );

    // Add the new PBXGroup to the top level group. This makes the
    // files / folder appear in the file explorer in Xcode.
    const groups = xcodeProject.hash.project.objects["PBXGroup"];
    Object.keys(groups).forEach(function (key) {
      if (
        typeof groups[key] === "object" &&
        groups[key].name === undefined &&
        groups[key].path === undefined
      ) {
        xcodeProject.addToPbxGroup(extGroup.uuid, key);
      }
    });

    // WORK AROUND for codeProject.addTarget BUG
    // Xcode projects don't contain these if there is only one target
    // An upstream fix should be made to the code referenced in this link:
    //   - https://github.com/apache/cordova-node-xcode/blob/8b98cabc5978359db88dc9ff2d4c015cba40f150/lib/pbxProject.js#L860
    const projObjects = xcodeProject.hash.project.objects;
    projObjects["PBXTargetDependency"] =
      projObjects["PBXTargetDependency"] || {};
    projObjects["PBXContainerItemProxy"] =
      projObjects["PBXTargetDependency"] || {};

    // Add the NSE target
    // This adds PBXTargetDependency and PBXContainerItemProxy for you
    const nseTarget = xcodeProject.addTarget(
      NSE_TARGET_NAME,
      "app_extension",
      NSE_TARGET_NAME,
      `${config.ios?.bundleIdentifier}.ContentBlocker`,
    );

    // Add build phases to the new target
    xcodeProject.addBuildPhase(
      ["ContentBlockerRequestHandler.swift"],
      "PBXSourcesBuildPhase",
      "Sources",
      nseTarget.uuid,
    );
    xcodeProject.addBuildPhase(
      ["blockerList.json"],
      "PBXResourcesBuildPhase",
      "Resources",
      nseTarget.uuid,
    );

    xcodeProject.addBuildPhase(
      [],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      nseTarget.uuid,
    );

    // Edit the Deployment info of the new Target, only IphoneOS and Targeted Device Family
    // However, can be more
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (
        typeof configurations[key].buildSettings !== "undefined" &&
        configurations[key].buildSettings.PRODUCT_NAME ===
          `"${NSE_TARGET_NAME}"`
      ) {
        const buildSettingsObj = configurations[key].buildSettings;
        buildSettingsObj.SWIFT_VERSION = SWIFT_VERSION;
        buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET =
          IPHONEOS_DEPLOYMENT_TARGET;
        buildSettingsObj.TARGETED_DEVICE_FAMILY = TARGETED_DEVICE_FAMILY;
        buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `${NSE_TARGET_NAME}/${NSE_TARGET_NAME}.entitlements`;
        buildSettingsObj.CODE_SIGN_STYLE = "Automatic";
      }
    }

    return newConfig;
  });
};

const withMainTargetXcodeProject: ConfigPlugin<BlockerPluginProps> = (
  config,
  props,
) => {
  return withXcodeProject(config, (newConfig) => {
    const projectName = getProjectName(newConfig.modRequest.projectRoot);

    for (let i = 0; i < NATIVE_MODULES_FILES.length; i++) {
      const filePath = path.join(projectName, NATIVE_MODULES_FILES[i]);

      const groupName = path.dirname(filePath);

      addBuildSourceFileToGroup({
        filepath: filePath,
        groupName,
        project: newConfig.modResults,
      });
    }

    return newConfig;
  });
};

const withIosSwiftBridgingHeader: ConfigPlugin = (config) => {
  return withXcodeProject(config, async (newConfig) => {
    const iosRoot = path.join(newConfig.modRequest.projectRoot, "ios");
    const file = await FileManager.readFile(
      `${iosRoot}/${newConfig.modRequest.projectName}/${newConfig.modRequest.projectName}-Bridging-Header.h`,
    );

    const matches = file.match(NSE_BRIDGE_HEADER_SNIPPET);
    if (matches) {
      BlockerProviderLog.log("Add BridgingHeader. Skipping...");
    } else {
      fs.appendFile(
        `${iosRoot}/${newConfig.modRequest.projectName}/${newConfig.modRequest.projectName}-Bridging-Header.h`,
        NSE_BRIDGE_HEADER_SNIPPET,
        (err) => {
          if (err) {
            BlockerProviderLog.error(
              `Error writing to ${newConfig.modRequest.projectName}-Bridging-Header.h}`,
            );
          }
        },
      );
    }

    return newConfig;
  });
};

export const withBlockerIos: ConfigPlugin<BlockerPluginProps> = (
  config,
  props,
) => {
  config = withAppEnvironment(config, props);
  config = withAppGroupPermissions(config, props);
  config = withAdblockNSE(config, props);
  // config = withCopyNativeModules(config, props);
  config = withMainTargetXcodeProject(config, props);
  config = withAdblockXcodeProject(config, props);
  config = withEasManagedCredentials(config, props);
  config = withIosSwiftBridgingHeader(config);
  return config;
};
