import { MemoryRouter } from "react-router-dom";

import App from "@/App";

import type { Meta, StoryObj } from "@storybook/react";

const META = { title: "App/Scaffold", component: App } satisfies Meta<
  typeof App
>;
export default META;
type Story = StoryObj<typeof META>;
export const Default: Story = {};
