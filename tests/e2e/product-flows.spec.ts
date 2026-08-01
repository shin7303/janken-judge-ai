import { expect, test, type Locator } from "@playwright/test";
import type { RoundResult } from "../../domain/types";
import { REPLAY_UNAVAILABLE_KEY } from "../../features/replay/storage";

const result: RoundResult = {
  ponTimestampMs: 1000,
  playerACommit: {
    playerId: "PLAYER_A",
    gesture: "ROCK",
    committedAtMs: 1020,
    relativeToPonMs: 20,
    confidence: 0.92,
  },
  playerBCommit: {
    playerId: "PLAYER_B",
    gesture: "SCISSORS",
    committedAtMs: 1100,
    relativeToPonMs: 100,
    confidence: 0.9,
  },
  playerAFinalGesture: "ROCK",
  playerBFinalGesture: "SCISSORS",
  winner: "PLAYER_A",
  delayMs: 80,
  latePlayer: "PLAYER_B",
  fairnessVerdict: "CLEAR",
  switchEvents: [],
  quality: {
    level: "HIGH",
    averageInferenceFps: 20,
    droppedObservationCount: 0,
    ambiguousAssignmentCount: 0,
    averageGestureScoreA: 0.92,
    averageGestureScoreB: 0.9,
    reasons: [],
  },
  reasonCodes: [],
};

const activate = (locator: Locator) =>
  locator.evaluate((element: HTMLElement) => element.click());

test("moves from the landing page through normal and late demo evidence", async ({
  page,
}) => {
  await page.goto("/");
  await activate(page.getByRole("link", { name: /デモを見る/ }));
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText("問題なし", { exact: true })).toBeVisible();
  await activate(page.getByRole("button", { name: /遅れて有利な手/ }));
  await expect(
    page.getByText("後出しの可能性あり", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("LATE_WINNING_HAND_LARGE_DELAY")).toBeVisible();
});

test("shows a recoverable explanation when camera permission is denied", async ({
  page,
}) => {
  await page.goto("/play/setup");
  await page.evaluate(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        throw new DOMException("denied", "NotAllowedError");
      },
    });
  });
  await activate(page.getByRole("button", { name: /カメラを開始/ }));
  await expect(page.getByRole("status")).toContainText("権限が拒否");
  await expect(
    page.getByRole("button", { name: /カメラを開始/ }),
  ).toBeEnabled();
});

test("persists and resets local play settings", async ({ page }) => {
  await page.goto("/play/setup");
  await page.getByLabel("判定感度").selectOption("lenient");
  await page.getByLabel("カウントダウン音量").selectOption("1");
  await activate(page.getByLabel("スローリプレイを保存"));
  await activate(page.getByLabel("プレビューを左右反転"));
  await page.reload();
  await expect(page.getByLabel("判定感度")).toHaveValue("lenient");
  await expect(page.getByLabel("カウントダウン音量")).toHaveValue("1");
  await expect(page.getByLabel("スローリプレイを保存")).not.toBeChecked();
  await expect(page.getByLabel("プレビューを左右反転")).not.toBeChecked();
  await activate(page.getByRole("button", { name: "設定を初期値に戻す" }));
  await expect(page.getByLabel("判定感度")).toHaveValue("standard");
  await expect(page.getByLabel("カウントダウン音量")).toHaveValue("0.5");
});

test("restores a result, offers replay fallback, saves history, and restarts", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    ({ storedResult, replayUnavailableKey }) => {
      sessionStorage.setItem(
        "janken-last-result",
        JSON.stringify(storedResult),
      );
      sessionStorage.setItem(
        replayUnavailableKey,
        "テスト環境では録画を利用できません。",
      );
    },
    { storedResult: result, replayUnavailableKey: REPLAY_UNAVAILABLE_KEY },
  );
  await page.goto("/play/result");
  await expect(page.getByRole("heading", { name: "問題なし" })).toBeVisible();
  await expect(
    page.getByText("テスト環境では録画を利用できません。"),
  ).toBeVisible();
  await activate(page.getByRole("link", { name: "履歴" }));
  await expect(page.getByText("CLEAR", { exact: true })).toBeVisible();
  await activate(page.getByRole("button", { name: "全削除" }));
  await expect(page.getByText("まだ対戦履歴はありません。")).toBeVisible();

  await page.goto("/play/result");
  await activate(page.getByRole("link", { name: /再戦/ }));
  await expect(page).toHaveURL(/\/play$/);
  await expect(page.getByRole("heading", { name: /手を枠に/ })).toBeVisible();
});
