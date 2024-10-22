import { ConfigPlugin } from "@expo/config-plugins";

import { BlockerPluginProps } from "./types";
import { withBlockerIos } from "./withBlockerIos";

const withBlockerProvider: ConfigPlugin<BlockerPluginProps> = (
  config,
  props,
) => {
  // if props are undefined, throw error
  // if (!props) {
  //   throw new Error(
  //     'You are trying to use the utoFillCredentialProvider plugin without any props.'
  //   );
  // }

  // validatePluginProps(props);

  config = withBlockerIos(config, props);

  return config;
};

export default withBlockerProvider;
