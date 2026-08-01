import { describe, expect, it } from "vitest";
import {
  initialRoundState,
  roundMachine,
  type RoundMachineState,
} from "@/features/round/round-machine";

const ready = roundMachine(initialRoundState, {
  type: "CAMERA_STATUS",
  ready: true,
});

describe("roundMachine", () => {
  it("runs the guarded countdown through PON and observation", () => {
    let state = roundMachine(ready, { type: "START" });
    expect(state).toMatchObject({ phase: "COUNTDOWN", countdown: 3 });
    state = roundMachine(state, { type: "COUNTDOWN_TICK", timestampMs: 1000 });
    state = roundMachine(state, { type: "COUNTDOWN_TICK", timestampMs: 2000 });
    state = roundMachine(state, { type: "COUNTDOWN_TICK", timestampMs: 3000 });
    expect(state).toMatchObject({ phase: "PON", ponTimestampMs: 3000 });
    expect(roundMachine(state, { type: "BEGIN_OBSERVING" }).phase).toBe(
      "OBSERVING",
    );
  });

  it("ignores start attempts until the camera is ready", () => {
    expect(roundMachine(initialRoundState, { type: "START" })).toBe(
      initialRoundState,
    );
  });

  it.each(["COUNTDOWN", "PON", "OBSERVING"] as const)(
    "aborts %s when camera quality is lost",
    (phase) => {
      const state: RoundMachineState = {
        phase,
        countdown: phase === "COUNTDOWN" ? 2 : null,
        ponTimestampMs: phase === "COUNTDOWN" ? null : 100,
        abortReason: null,
      };
      expect(
        roundMachine(state, { type: "CAMERA_STATUS", ready: false }),
      ).toMatchObject({ phase: "ABORTED", countdown: null });
    },
  );

  it("does not let late camera events overwrite a terminal state", () => {
    const terminal: RoundMachineState = { ...ready, phase: "RESULT" };
    expect(
      roundMachine(terminal, { type: "CAMERA_STATUS", ready: false }),
    ).toBe(terminal);
  });
});
