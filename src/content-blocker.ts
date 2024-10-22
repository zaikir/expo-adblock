import { requireNativeModule } from "expo-modules-core";

import { ContentBlockerRule } from "./types";

const ContentBlockerModule = requireNativeModule("ContentBlocker");

export async function applyBlockerRules(rules: ContentBlockerRule[]) {
  await ContentBlockerModule.applyRules(JSON.stringify(rules));
}

export async function getBlockerState() {
  return await ContentBlockerModule.getState();
}
