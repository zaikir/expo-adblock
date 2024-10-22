export class BlockerProviderLog {
  static log(str: string) {
    console.log(`\tblocker-expo-plugin: ${str}`);
  }

  static error(str: string) {
    console.error(`\tblocker-expo-plugin: ${str}`);
  }
}
