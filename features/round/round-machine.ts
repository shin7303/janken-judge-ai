export type RoundPhase =
  | "IDLE"
  | "CAMERA_READY"
  | "COUNTDOWN"
  | "PON"
  | "OBSERVING"
  | "FINALIZING"
  | "RESULT"
  | "ABORTED";

export type RoundMachineState = {
  phase: RoundPhase;
  countdown: number | null;
  ponTimestampMs: number | null;
  abortReason: string | null;
};

export type RoundMachineEvent =
  | { type: "CAMERA_STATUS"; ready: boolean }
  | { type: "START" }
  | { type: "COUNTDOWN_TICK"; timestampMs: number }
  | { type: "BEGIN_OBSERVING" }
  | { type: "FINALIZE" }
  | { type: "COMPLETE" }
  | { type: "ABORT"; reason: string }
  | { type: "RESET"; cameraReady: boolean };

export const initialRoundState: RoundMachineState = {
  phase: "IDLE",
  countdown: null,
  ponTimestampMs: null,
  abortReason: null,
};

const activePhases: RoundPhase[] = ["COUNTDOWN", "PON", "OBSERVING"];

export function roundMachine(
  state: RoundMachineState,
  event: RoundMachineEvent,
): RoundMachineState {
  if (event.type === "ABORT") {
    if (!activePhases.includes(state.phase)) return state;
    return {
      ...state,
      phase: "ABORTED",
      countdown: null,
      abortReason: event.reason,
    };
  }
  if (event.type === "RESET")
    return {
      ...initialRoundState,
      phase: event.cameraReady ? "CAMERA_READY" : "IDLE",
    };
  if (event.type === "CAMERA_STATUS") {
    if (activePhases.includes(state.phase) && !event.ready)
      return roundMachine(state, {
        type: "ABORT",
        reason:
          "カメラ映像または認識品質が不安定になりました。再試合してください。",
      });
    if (state.phase !== "IDLE" && state.phase !== "CAMERA_READY") return state;
    const phase = event.ready ? "CAMERA_READY" : "IDLE";
    return phase === state.phase ? state : { ...state, phase };
  }
  if (event.type === "START") {
    if (state.phase !== "CAMERA_READY") return state;
    return {
      phase: "COUNTDOWN",
      countdown: 3,
      ponTimestampMs: null,
      abortReason: null,
    };
  }
  if (event.type === "COUNTDOWN_TICK") {
    if (state.phase !== "COUNTDOWN" || state.countdown === null) return state;
    if (state.countdown > 1)
      return { ...state, countdown: state.countdown - 1 };
    return {
      ...state,
      phase: "PON",
      countdown: null,
      ponTimestampMs: event.timestampMs,
    };
  }
  if (event.type === "BEGIN_OBSERVING" && state.phase === "PON")
    return { ...state, phase: "OBSERVING" };
  if (event.type === "FINALIZE" && state.phase === "OBSERVING")
    return { ...state, phase: "FINALIZING" };
  if (event.type === "COMPLETE" && state.phase === "FINALIZING")
    return { ...state, phase: "RESULT" };
  return state;
}
