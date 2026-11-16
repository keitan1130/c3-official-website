import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  async viteFinal(config) {
    config.plugins = config.plugins?.filter(
      (plugin) =>
        !plugin || !("name" in plugin) || plugin.name !== "site-pages",
    );
    return config;
  },
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};
export default config;
