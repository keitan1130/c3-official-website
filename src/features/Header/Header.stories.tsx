import { MemoryRouter } from "react-router-dom";
import { expect, userEvent, within } from "storybook/test";

import Header from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "Features/Header",
  component: Header,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof Header>;
export default META;
type Story = StoryObj<typeof META>;
export const ThemeAndMenu: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "ダークモードに切り替え" }),
    );
    await expect(
      canvas.getByRole("button", { name: "ライトモードに切り替え" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "メニューを開く" }),
    );
    await expect(
      canvas.getByRole("navigation", { name: "メインメニュー" }),
    ).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(
      canvas.getByRole("button", { name: "メニューを開く" }),
    ).toHaveFocus();
    await userEvent.click(
      canvas.getByRole("button", { name: "ライトモードに切り替え" }),
    );
  },
};
