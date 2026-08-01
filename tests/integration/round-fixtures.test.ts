import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { FrameObservation, RoundResult } from "@/domain/types";
import { analyzeRound } from "@/features/round/analyze-round";

type Fixture = {
  ponTimestampMs: number;
  observations: FrameObservation[];
  expected: Pick<RoundResult, "winner" | "fairnessVerdict">;
};

const fixtureFiles = [
  "normal-simultaneous.json",
  "delayed-winning.json",
  "delayed-losing.json",
  "switch-after-commit.json",
  "low-confidence.json",
  "crossed-hands.json",
  "low-fps.json",
];

describe("round JSON fixtures", () => {
  it.each(fixtureFiles)("reproduces %s", (fixtureFile) => {
    const fixture = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "tests", "fixtures", fixtureFile),
        "utf8",
      ),
    ) as Fixture;
    const result = analyzeRound(fixture.observations, fixture.ponTimestampMs);

    expect(result, basename(fixtureFile)).toMatchObject(fixture.expected);
  });
});
