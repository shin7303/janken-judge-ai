import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { PlaySettingsForm } from "@/components/settings/play-settings-form";
import { SETTINGS_KEY } from "@/features/settings/store";

describe("PlaySettingsForm", () => {
  beforeEach(() => localStorage.clear());

  it("keeps automatic start enabled by default and persists changes", () => {
    render(<PlaySettingsForm />);

    const autoStart = screen.getByLabelText("両手を検出したら自動開始");
    expect(autoStart).toBeChecked();
    fireEvent.click(autoStart);

    expect(autoStart).not.toBeChecked();
    expect(localStorage.getItem(SETTINGS_KEY)).toContain(
      '"autoStartEnabled":false',
    );
  });
});
