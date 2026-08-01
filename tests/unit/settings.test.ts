import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, parseSettings } from "@/features/settings/store";

describe("parseSettings", () => {
  it("uses safe defaults for malformed or unknown values", () => {
    expect(parseSettings("{")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{"sensitivity":"extreme","mirrored":false}')).toEqual(
      {
        ...DEFAULT_SETTINGS,
        mirrored: false,
      },
    );
  });

  it("restores all supported local settings", () => {
    expect(
      parseSettings(
        JSON.stringify({
          sensitivity: "strict",
          replayEnabled: false,
          mirrored: false,
          autoStartEnabled: false,
          countdownVolume: 0.8,
        }),
      ),
    ).toEqual({
      sensitivity: "strict",
      replayEnabled: false,
      mirrored: false,
      autoStartEnabled: false,
      countdownVolume: 0.8,
    });
  });
});
