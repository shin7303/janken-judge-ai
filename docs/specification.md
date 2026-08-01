# Janken Judge AI 詳細仕様書

- 文書バージョン: 1.0
- 作成日: 2026-08-01
- 想定公開先: Vercel Hobby
- 想定リポジトリ: GitHub Public Repository
- 開発方針: Codex主体のVibe Coding
- 仮称: **Janken Judge AI**
- キャッチコピー: **二人の手の動きを時間軸で解析し、後出しの可能性を可視化するブラウザAI審判**

---

## 1. プロダクト概要

Janken Judge AIは、一台のカメラに二人の手を同時に映し、グー・チョキ・パーの認識、勝敗判定、両者の手が確定した時刻の比較、確定後の手の変更検出を行うWebアプリケーションである。

単なる画像分類アプリではなく、連続する映像を時系列データとして扱い、次の情報を表示する。

- 左右プレイヤーの手
- 各プレイヤーの認識結果と信頼度
- 「ポン」の基準時刻
- 手が確定した推定時刻
- 両者の確定時刻差
- 確定後に別の手へ変更したか
- 後出しの可能性に関する判定
- 判定直前から結果までのスローリプレイ
- 判定根拠を示すタイムライン

本アプリは娯楽用のAI審判であり、不正を科学的・法的に断定するものではない。「後出し確定」ではなく、「遅延あり」「要確認」「後出しの可能性が高い」と表現する。

---

## 2. 開発目的

### 2.1 ユーザー価値

- 二人のじゃんけんで起きる「今の後出しでは？」を楽しく検証できる
- スロー再生と時刻差により、結果だけでなく判定根拠も確認できる
- インストール不要で、スマートフォンやPCのブラウザから利用できる
- 映像をサーバーへ送信せず、端末内で処理できる

### 2.2 ポートフォリオとして示す技術

- ブラウザ上のリアルタイム画像認識
- MediaPipeによる複数手の認識
- 時系列データ処理
- Web Workerによる重い推論処理の分離
- カメラ、Canvas、MediaRecorderなどのWeb API
- 状態機械によるゲーム進行管理
- TypeScriptによるドメインロジック設計
- ユニットテスト、統合テスト、E2Eテスト
- GitHubとVercelを使ったCI/CD
- レスポンシブUI
- プライバシーを考慮したクライアント完結設計
- Codexを用いた要件駆動のVibe Coding

### 2.3 Vibe Codingの見せ方

「Codexに全部書かせた」だけではなく、以下をリポジトリで示す。

- 人間が定義した詳細仕様書
- Codex用の `AGENTS.md`
- 実装フェーズと受入条件
- AIが生成したコードに対する自動テスト
- 技術的判断を残すADR
- 既知の限界と誤判定条件
- 実装履歴をまとめた `docs/ai-development-log.md`
- サンプル判定データと再現可能なテスト

---

## 3. 対象範囲

### 3.1 MVPに含める

1. 一台のカメラで二人の手を同時認識
2. グー・チョキ・パーの分類
3. 左右プレイヤーへの割り当て
4. カウントダウン
5. 勝敗判定
6. 手の確定時刻の推定
7. 確定時刻差の表示
8. 確定後の手の変更検出
9. 後出し可能性の段階表示
10. スローリプレイ
11. 判定タイムライン
12. 直近対戦履歴
13. カメラ・推論性能の診断表示
14. 二人いなくても機能を確認できるデモモード
15. Vercelへの無料デプロイ
16. 日本語UI
17. PC・スマートフォン対応

### 3.2 MVPに含めない

- 離れた場所にいる二人のオンライン対戦
- WebRTCによる通信
- ユーザー登録、ログイン
- クラウドへの動画保存
- 顔認識、本人確認
- 音声や会話の録音
- 金銭を賭ける用途
- 大会の公式審判としての利用
- 後出しの意図の断定
- 独自AIモデルの学習
- ランキングやSNS機能
- 動画ファイルの一般ユーザー投稿

---

## 4. 想定利用環境

### 4.1 推奨環境

- PC: 最新版のChrome、Edge、Safari
- スマートフォン: 最新版のChromeまたはSafari
- カメラ: 内蔵またはUSB Webカメラ
- 通信: 初回のアプリ・モデル読み込み時のみ必要
- 撮影: 横向き推奨
- 明るさ: 手の輪郭が確認できる室内照明
- 背景: 手と似た色が少なく、模様が複雑でない背景

### 4.2 プレイ条件

- 一台のカメラの前に二人が並ぶ
- 画面左側の人物をPlayer A、右側をPlayer Bとする
- 各プレイヤーは原則一方の手だけを映す
- 両者の手が中央で交差しないようにする
- カメラから手までの距離をおおむね揃える
- 手首から指先までがフレーム内に入るようにする

### 4.3 非対応・判定保留条件

次の場合は無理に勝敗や後出しを判定せず、「判定不能」または「要再試合」とする。

- 手が一つしか検出できない
- 三つ以上の手が検出された
- 二人の手が交差した
- 手が画面外へ出た
- 認識信頼度が不足した
- フレームレートが著しく低い
- カメラが途中で停止した
- 一方または両方がグー・チョキ・パー以外の形だった
- 手が大きく隠れた
- タブがバックグラウンドになった
- 推論モデルでエラーが発生した

---

## 5. 用語定義

| 用語 | 定義 |
|---|---|
| PON時刻 | 画面上で「ポン」と表示され、判定基準となる単調増加時刻 |
| 観測 | 一フレームに対する手の位置、ジェスチャー、信頼度などの推論結果 |
| 有効ジェスチャー | ROCK、PAPER、SCISSORSのいずれか |
| 安定区間 | 同一ジェスチャーが一定時間・一定回数以上継続した区間 |
| 確定時刻 | 最初の有効な安定区間が始まった推定時刻 |
| 確定後変更 | 一度確定した後、別の有効ジェスチャーが安定した状態 |
| 確定時刻差 | 遅いプレイヤーの確定時刻から早いプレイヤーの確定時刻を引いた値 |
| 遅延プレイヤー | 確定時刻が遅かった側 |
| 後出し疑い | 時刻差や確定後変更に基づくヒューリスティック判定 |
| 判定不能 | データ品質が不足し、信頼できる結果を出せない状態 |
| ROI | 各プレイヤーが手を出す画面上の領域 |
| ラウンド | カウントダウン開始から結果確定までの一回の対戦 |

---

## 6. 画面構成

### 6.1 トップ画面 `/`

表示内容:

- アプリ名
- キャッチコピー
- 「二人でプレイ」ボタン
- 「デモを見る」ボタン
- 「遊び方」ボタン
- プライバシー説明
- GitHubリポジトリへの導線
- 技術スタックの簡易表示
- 注意書き

注意書き例:

> 本アプリの後出し判定は映像上の時刻差を用いた娯楽向け推定です。不正の意図や事実を断定するものではありません。

### 6.2 セットアップ画面 `/play/setup`

表示内容:

- カメラ利用許可ボタン
- カメラ選択
- 映像プレビュー
- モデル読込状況
- 推論FPS
- 左右のプレイヤー領域
- 明るさ・検出状況
- 「準備完了」判定
- 判定感度設定
- リプレイ利用設定
- 左右反転表示設定

準備完了条件:

- カメラが利用可能
- 推論モデルがロード済み
- 二つの手が検出可能
- 各手が別々のROI内に存在
- 推論FPSが最低基準以上
- タブがアクティブ

### 6.3 プレイ画面 `/play`

主な領域:

1. カメラ映像
2. Player A領域
3. Player B領域
4. 手のランドマーク表示
5. 現在のジェスチャー表示
6. 信頼度表示
7. カウントダウン
8. 状態メッセージ
9. 推論FPS
10. 中止ボタン

画面上の状態例:

- 手を枠内に入れてください
- 準備OK
- 3
- 2
- 1
- PON!
- 判定中
- 結果

### 6.4 結果画面 `/play/result`

表示内容:

- Player Aの手
- Player Bの手
- 勝者またはあいこ
- Player A確定時刻
- Player B確定時刻
- 確定時刻差
- 後出し可能性
- 判定理由
- データ品質
- リプレイ
- タイムライン
- 再戦ボタン
- セットアップに戻るボタン

表示例:

> Player Bの確定がPlayer Aより382ms遅く、Player Bの手がPlayer Aに勝つ組み合わせでした。後出しの可能性があります。

別例:

> Player Bは421ms遅れて確定しましたが、勝敗上有利な手ではありませんでした。「遅延あり」と表示しますが、後出しの意図は判定できません。

### 6.5 デモ画面 `/demo`

採用担当者などが二人やカメラを用意しなくても主要機能を確認できる画面。

- 正常な同時じゃんけん
- 確定時刻差が大きい例
- 確定後に手を変更した例
- 認識信頼度不足の例
- 手が交差して判定不能になる例

デモデータは固定JSONと同梱サンプル動画を使用する。ユーザーによる動画アップロード機能は設けない。

---

## 7. ゲーム進行

### 7.1 状態機械

```text
BOOT
  -> MODEL_LOADING
  -> CAMERA_PERMISSION
  -> CAMERA_READY
  -> CALIBRATING
  -> READY
  -> COUNTDOWN
  -> CAPTURING
  -> ANALYZING
  -> RESULT
  -> REPLAY
  -> READY
```

例外状態:

```text
ANY_STATE
  -> PAUSED
  -> ERROR
  -> CAMERA_DENIED
  -> UNSUPPORTED
```

### 7.2 一ラウンドの標準進行

1. 二人の手が各ROIに入る
2. 500ms以上安定して検出されたら「準備OK」
3. ユーザーが開始ボタンを押す
4. 3、2、1のカウントダウン
5. 「PON!」を表示し、基準時刻 `t0` を記録
6. `t0` 前後の観測を収集
7. 各プレイヤーの有効ジェスチャーを確定
8. 追加確認期間で手の変更を監視
9. 勝敗と後出し可能性を計算
10. 結果とリプレイを表示

### 7.3 標準時間設定

初期値は次のとおりとし、定数として一か所で管理する。

```ts
const ROUND_CONFIG = {
  readyStableMs: 500,
  countdownMs: 3000,
  prePonObservationMs: 800,
  postPonDeadlineMs: 1200,
  postCommitConfirmationMs: 200,
  gestureStableMs: 120,
  changedGestureStableMs: 150,
  minStableSamples: 3,
  minGestureScore: 0.65,
  reviewDelayMs: 200,
  likelyLateDelayMs: 350,
  minimumInferenceFps: 10,
  recommendedInferenceFps: 15,
};
```

これらは科学的に後出しを証明する閾値ではなく、アプリ上の初期ヒューリスティック値である。設定画面から「厳しめ・標準・ゆるめ」を選択できるようにする。

---

## 8. 手認識仕様

### 8.1 採用技術

Google MediaPipe Gesture RecognizerのWeb版を利用する。

初期モデルの既定ジェスチャーを次のように対応付ける。

| MediaPipe分類 | アプリ内分類 |
|---|---|
| `Closed_Fist` | `ROCK` |
| `Open_Palm` | `PAPER` |
| `Victory` | `SCISSORS` |
| その他 | `UNKNOWN` |

設定:

```ts
{
  runningMode: "VIDEO",
  numHands: 2,
  minHandDetectionConfidence: 0.5,
  minHandPresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
  cannedGesturesClassifierOptions: {
    scoreThreshold: 0.6,
    categoryAllowlist: ["Closed_Fist", "Open_Palm", "Victory"]
  }
}
```

実装時は実際のライブラリ型定義に合わせてプロパティ名を調整する。

### 8.2 推論処理

- モデルはプレイ画面を開いたときに遅延ロードする
- 初回ロード後にダミーフレームでウォームアップする
- カメラの全フレームを無制限に推論しない
- 推論頻度を最大20〜30回/秒に制御する
- 同じ映像フレームを重複処理しない
- 時刻には `performance.now()` を使用する
- 対応ブラウザでは `requestVideoFrameCallback` を使用する
- 非対応ブラウザでは `requestAnimationFrame` にフォールバックする
- 重い推論はWeb Workerへ分離する
- Workerへ渡すフレームは `ImageBitmap` などのTransferableを優先する
- Workerが処理中の場合、古い未処理フレームをキューに積み続けない
- 常に最新フレームを優先し、遅延蓄積を防ぐ

### 8.3 左右プレイヤー割り当て

MediaPipeのLeft/Right handednessはプレイヤー識別に使わない。プレイヤーは画面上の位置で識別する。

1. 検出した21ランドマークから手の重心を算出
2. ミラー表示を考慮した `screenX` に変換
3. `screenX < 0.5` をPlayer A、`screenX >= 0.5` をPlayer Bの候補とする
4. 直前フレームの位置との距離を用いて追跡を安定化
5. 中央付近に両手が集まった場合は割り当て信頼度を下げる
6. 両手が交差または同一ROIに入った場合はラウンドを無効化する

### 8.4 手の安定判定

同じジェスチャーが検出されても、一フレームだけでは確定しない。

安定区間の条件:

- 有効ジェスチャーである
- スコアが `minGestureScore` 以上
- 同じ分類が `minStableSamples` 回以上
- 継続時間が `gestureStableMs` 以上
- 区間内の欠落が一フレーム以下
- 手の位置がROI外へ出ていない
- プレイヤー割り当てが曖昧でない

短時間の誤分類は多数決またはヒステリシスで吸収する。

---

## 9. 確定時刻の推定

### 9.1 基本定義

各プレイヤーについて、PON時刻以降に最初に成立した有効な安定区間の開始時刻を確定時刻とする。

```text
commitTime = firstStableRun.startTime
```

### 9.2 グーの特例

通常のじゃんけんでは、PON前から握りこぶしを作っているため、グーだけがPON前から安定している可能性がある。

`Closed_Fist` がPON前から継続している場合:

```text
commitTime = PON時刻
```

ただし、PON後すぐに別の手へ変化した場合は、グーを一時状態として扱い、最終的な安定ジェスチャーを採用する。

### 9.3 最終ジェスチャー

- 両者の確定後、追加で `postCommitConfirmationMs` 監視する
- 確定した手がそのまま維持された場合、それを最終ジェスチャーとする
- 別の有効ジェスチャーへ安定して変わった場合、確定後変更として記録する
- 変更後の手を勝敗判定に使う
- 変更前後の両方を結果画面に表示する

例:

```text
Player B:
  182ms: PAPER確定
  411ms: SCISSORSへ変更
  最終手: SCISSORS
  理由コード: SWITCH_AFTER_COMMIT
```

---

## 10. 後出し可能性の判定

### 10.1 判定方針

判定は次の二種類を分ける。

1. **遅延確定型**  
   相手より大きく遅れて手が確定した。

2. **確定後変更型**  
   一度有効な手が確定した後、別の手へ変更した。

「遅く出した」ことと「相手を見て意図的に変更した」ことは同一ではないため、画面表示でも区別する。

### 10.2 判定レベル

```ts
type FairnessVerdict =
  | "CLEAR"
  | "DELAYED"
  | "REVIEW"
  | "LIKELY_LATE"
  | "SWITCH_DETECTED"
  | "INSUFFICIENT_DATA"
  | "INVALID_ROUND";
```

### 10.3 ルール

#### A. 正常

条件:

- 両者が有効な手を確定
- 確定後変更なし
- 確定時刻差が `reviewDelayMs` 未満

結果:

```text
CLEAR
```

表示:

> 両者の手は許容時間内に確定しました。

#### B. 単純な遅延

条件:

- 確定時刻差が `reviewDelayMs` 以上
- 遅れた側の手が早い側に勝つ手ではない
- 確定後変更なし

結果:

```text
DELAYED
```

表示:

> 手の確定に時間差がありますが、後出しによる有利な変更かどうかは判断できません。

#### C. 要確認

条件:

- 確定時刻差が `reviewDelayMs` 以上 `likelyLateDelayMs` 未満
- 遅れた側の最終手が早い側に勝つ
- 確定後変更なし

結果:

```text
REVIEW
```

表示:

> 遅れた側が有利な手を出しています。リプレイで確認してください。

#### D. 後出し可能性が高い

条件:

- 確定時刻差が `likelyLateDelayMs` 以上
- 遅れた側の最終手が早い側に勝つ
- データ品質が基準以上

結果:

```text
LIKELY_LATE
```

表示:

> 確定時刻差が大きく、遅れた側が有利な手を出しています。後出しの可能性があります。

#### E. 確定後変更

条件:

- 一度確定した後、別の有効ジェスチャーが安定
- 変更がラウンドの監視期間内に発生

結果:

```text
SWITCH_DETECTED
```

表示:

> 一度確定した手から別の手への変更を検出しました。

変更後の手が相手に勝つ場合は、結果画面で強調する。

#### F. 判定不能

条件例:

- FPS不足
- 信頼度不足
- 手の交差
- 手の欠落
- タブ非表示
- 推論エラー

結果:

```text
INSUFFICIENT_DATA
```

または

```text
INVALID_ROUND
```

### 10.4 勝敗判定

```ts
function judgeWinner(a: Gesture, b: Gesture): Winner {
  if (a === b) return "DRAW";
  if (
    (a === "ROCK" && b === "SCISSORS") ||
    (a === "SCISSORS" && b === "PAPER") ||
    (a === "PAPER" && b === "ROCK")
  ) {
    return "PLAYER_A";
  }
  return "PLAYER_B";
}
```

---

## 11. データ品質スコア

結果には後出し判定だけでなく、判定に使用したデータ品質も表示する。

### 11.1 品質要素

- 平均推論FPS
- 最低推論FPS
- 各プレイヤーの平均ジェスチャー信頼度
- 手の欠落フレーム数
- プレイヤー割り当ての曖昧フレーム数
- 手の交差
- タブ非表示の有無
- カメラ解像度
- ラウンド中の最大処理遅延

### 11.2 品質レベル

```ts
type QualityLevel = "HIGH" | "MEDIUM" | "LOW" | "INVALID";
```

表示例:

- 高: 判定に十分な映像品質
- 中: 一部不安定。リプレイ確認推奨
- 低: 誤判定の可能性あり
- 無効: 自動判定を表示しない

---

## 12. リプレイ仕様

### 12.1 録画範囲

MediaRecorderを使用し、端末内メモリに短時間だけ保持する。

録画開始:

- カウントダウン開始直前

録画終了:

- 両者確定後の確認期間終了時
- またはPON後の最大待機時間終了時

想定録画長:

- 約4〜6秒

### 12.2 保存方針

- 動画をサーバーへアップロードしない
- データベースへ保存しない
- ページ再読み込みで削除されてよい
- 新しいラウンド開始時に古いObject URLを破棄する
- `URL.revokeObjectURL()` を必ず呼ぶ
- カメラ停止時に全MediaStreamTrackを停止する

### 12.3 再生機能

- 再生・一時停止
- シーク
- 0.25倍
- 0.5倍
- 1.0倍
- PON位置へ移動
- Player A確定位置へ移動
- Player B確定位置へ移動
- 手変更位置へ移動

### 12.4 タイムライン

```text
-800ms                0ms                 +1200ms
  |--------------------|----------------------|
  観測開始             PON                  締切
                        A確定 +142ms
                              B確定 +524ms
                              時刻差 382ms
```

タイムラインには次を表示する。

- PON
- Player A確定
- Player B確定
- 手変更イベント
- 認識欠落
- 判定締切
- 無効化イベント

### 12.5 フォールバック

MediaRecorderまたは適切な動画形式が利用できない場合:

- 勝敗・時刻差・タイムラインは利用可能
- リプレイのみ無効
- UIに理由を表示
- アプリ全体をエラー終了させない

---

## 13. 履歴仕様

### 13.1 保存対象

ブラウザのlocalStorageまたはIndexedDBに、直近20ラウンドのメタデータのみ保存する。

保存する:

- ラウンドID
- 実施時刻
- 両者の手
- 勝者
- 確定時刻
- 時刻差
- 公平性判定
- 品質レベル
- 理由コード

保存しない:

- カメラ映像
- 静止画
- ランドマークの全フレーム
- 個人を特定できる情報

### 13.2 ユーザー操作

- 履歴一覧
- 全削除
- JSONエクスポート
- 設定初期化

---

## 14. 技術構成

### 14.1 フロントエンド

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- MediaPipe `@mediapipe/tasks-vision`
- Web Worker
- Canvas API
- MediaDevices API
- MediaRecorder API
- localStorageまたはIndexedDB
- Vitest
- React Testing Library
- Playwright
- ESLint
- Prettier
- pnpm

Next.jsは実装開始時点の最新安定版を使用し、生成されたlockfileをコミットして依存関係を固定する。

### 14.2 サーバー

MVPではサーバー処理を持たない。

- API Routeなし
- Server Actionなし
- データベースなし
- 認証なし
- オブジェクトストレージなし
- 外部AI APIなし
- 秘密鍵なし
- 環境変数なし

### 14.3 クライアント完結の理由

- Vercel無料枠で公開しやすい
- 推論中のサーバー費用が発生しない
- 映像を外部送信しない
- 通信遅延が判定時刻へ影響しない
- オフラインに近い状態でも動作可能
- 個人情報管理を最小化できる

---

## 15. ディレクトリ構成

```text
janken-judge-ai/
├─ app/
│  ├─ page.tsx
│  ├─ demo/
│  │  └─ page.tsx
│  ├─ play/
│  │  ├─ page.tsx
│  │  ├─ setup/
│  │  │  └─ page.tsx
│  │  └─ result/
│  │     └─ page.tsx
│  ├─ layout.tsx
│  └─ globals.css
├─ components/
│  ├─ camera/
│  ├─ game/
│  ├─ replay/
│  ├─ timeline/
│  └─ ui/
├─ features/
│  ├─ camera/
│  ├─ gesture/
│  ├─ player-tracking/
│  ├─ round/
│  ├─ fairness/
│  ├─ replay/
│  └─ history/
├─ domain/
│  ├─ gesture.ts
│  ├─ round.ts
│  ├─ fairness.ts
│  ├─ quality.ts
│  └─ types.ts
├─ workers/
│  └─ gesture.worker.ts
├─ public/
│  ├─ models/
│  │  └─ gesture_recognizer.task
│  ├─ demo/
│  │  ├─ normal.*
│  │  ├─ delayed.*
│  │  └─ switch.*
│  └─ icons/
├─ tests/
│  ├─ fixtures/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
├─ docs/
│  ├─ specification.md
│  ├─ architecture.md
│  ├─ ai-development-log.md
│  ├─ limitations.md
│  └─ adr/
├─ AGENTS.md
├─ next.config.ts
├─ package.json
├─ pnpm-lock.yaml
└─ README.md
```

---

## 16. 主要データ型

```ts
export type PlayerId = "PLAYER_A" | "PLAYER_B";

export type Gesture =
  | "ROCK"
  | "PAPER"
  | "SCISSORS"
  | "UNKNOWN";

export interface Point2D {
  x: number;
  y: number;
}

export interface FrameObservation {
  timestampMs: number;
  playerId: PlayerId;
  gesture: Gesture;
  gestureScore: number;
  handVisible: boolean;
  centroid: Point2D | null;
  assignmentConfidence: number;
  landmarks?: Point2D[];
}

export interface StableGestureRun {
  playerId: PlayerId;
  gesture: Exclude<Gesture, "UNKNOWN">;
  startMs: number;
  endMs: number;
  sampleCount: number;
  medianScore: number;
}

export interface CommitEvent {
  playerId: PlayerId;
  gesture: Exclude<Gesture, "UNKNOWN">;
  committedAtMs: number;
  relativeToPonMs: number;
  confidence: number;
}

export interface GestureSwitchEvent {
  playerId: PlayerId;
  from: Exclude<Gesture, "UNKNOWN">;
  to: Exclude<Gesture, "UNKNOWN">;
  switchedAtMs: number;
  relativeToPonMs: number;
}

export interface RoundQuality {
  level: "HIGH" | "MEDIUM" | "LOW" | "INVALID";
  averageInferenceFps: number;
  droppedObservationCount: number;
  ambiguousAssignmentCount: number;
  averageGestureScoreA: number;
  averageGestureScoreB: number;
  reasons: string[];
}

export interface RoundResult {
  roundId: string;
  ponTimestampMs: number;
  playerACommit: CommitEvent | null;
  playerBCommit: CommitEvent | null;
  playerAFinalGesture: Gesture;
  playerBFinalGesture: Gesture;
  winner: "PLAYER_A" | "PLAYER_B" | "DRAW" | "UNDECIDED";
  delayMs: number | null;
  latePlayer: PlayerId | null;
  fairnessVerdict: FairnessVerdict;
  switchEvents: GestureSwitchEvent[];
  quality: RoundQuality;
  reasonCodes: string[];
}
```

---

## 17. Worker通信仕様

### 17.1 Main ThreadからWorker

```ts
type WorkerRequest =
  | {
      type: "INIT";
      modelUrl: string;
      wasmBaseUrl: string;
      config: GestureRecognizerConfig;
    }
  | {
      type: "FRAME";
      frameId: number;
      timestampMs: number;
      bitmap: ImageBitmap;
    }
  | {
      type: "RESET";
    }
  | {
      type: "DISPOSE";
    };
```

### 17.2 WorkerからMain Thread

```ts
type WorkerResponse =
  | {
      type: "READY";
    }
  | {
      type: "OBSERVATION";
      frameId: number;
      timestampMs: number;
      hands: RawHandObservation[];
      inferenceDurationMs: number;
    }
  | {
      type: "ERROR";
      code: string;
      message: string;
      recoverable: boolean;
    };
```

### 17.3 バックプレッシャー

- Worker処理中フラグを持つ
- 処理中は次のフレームを一件だけ最新値として保持する
- 古いフレームをFIFOで蓄積しない
- 結果受信後、最新の保留フレームだけ送る
- 推論遅延が一定値を超えた場合は入力解像度または推論頻度を下げる

---

## 18. UI・UX要件

### 18.1 デザイン方向

- ゲームらしく明るい
- AI判定の根拠が見える
- 判定状態を色だけに依存しない
- カメラ映像が最も大きい
- 重要な数値を中央にまとめる
- スマートフォン横向きを優先
- PCでは左右二分割
- 結果画面はSNSで見せやすいカード構成

### 18.2 必須表示

ライブ画面:

```text
Player A
現在: チョキ
信頼度: 87%
状態: 未確定
```

結果画面:

```text
Player A: パー  +148ms
Player B: チョキ +530ms
時刻差: 382ms
判定: 後出しの可能性あり
品質: 高
```

### 18.3 アクセシビリティ

- 色に加えてアイコンとテキストを使用
- キーボードで主要操作可能
- フォーカス表示
- ARIAラベル
- 点滅を多用しない
- `prefers-reduced-motion` 対応
- 音を消しても利用可能
- 音量設定
- カウントダウンを視覚と音の両方で提示

---

## 19. エラー処理

| エラー | 表示 | 復旧 |
|---|---|---|
| カメラ権限拒否 | 権限が必要と説明 | ブラウザ設定案内 |
| カメラなし | 対応カメラが見つからない | デモモード |
| モデル読込失敗 | 読込に失敗 | 再試行 |
| Worker失敗 | 推論処理エラー | Worker再生成 |
| 手が一つ | 二人の手を枠内へ | 自動復帰 |
| 手が三つ以上 | 一人一つの手に限定 | 自動復帰 |
| FPS不足 | 動作が重い | 解像度低下 |
| MediaRecorder非対応 | リプレイ不可 | 判定のみ継続 |
| タブ非表示 | ラウンド中断 | 再試合 |
| カメラ切断 | カメラが切断された | 再選択 |

---

## 20. プライバシー・セキュリティ

### 20.1 プライバシー要件

- カメラはユーザー操作後にのみ起動
- 映像はブラウザ内で処理
- 映像を外部サーバーへ送信しない
- 動画を永続保存しない
- 顔認識を行わない
- マイク権限を要求しない
- ページ離脱時にカメラを停止
- 履歴削除ボタンを用意
- プライバシー説明をトップとセットアップに表示

### 20.2 HTTPヘッダー

最低限、次を設定する。

```text
Permissions-Policy: camera=(self), microphone=()
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

Content Security PolicyはMediaPipeのWASM、Worker、Blob URL、モデル配置方法を確認したうえで、実動作を壊さない範囲で導入する。

### 20.3 ログ

本番環境で記録してよいもの:

- 一般的なJavaScriptエラー
- モデル読込成功・失敗
- 非個人情報の性能指標

記録してはいけないもの:

- 動画
- 静止画
- 全ランドマーク
- カメラデバイス名
- 個人を推測できるデータ

MVPでは外部エラー監視サービスを必須としない。

---

## 21. Vercel無料デプロイ仕様

### 21.1 前提

- Vercel Hobbyを使用
- 個人ポートフォリオとして非商用公開
- GitHubの公開リポジトリと連携
- `main` ブランチを本番
- Pull RequestごとにPreview Deployment
- 独自ドメインは任意
- Vercel標準のHTTPSを利用

### 21.2 無料運用を維持する設計

- サーバー関数を使わない
- AI推論はブラウザで実行
- DBを使わない
- 動画をアップロードしない
- Blob Storageを使わない
- 外部有料APIを使わない
- モデルを静的ファイルとして配信
- デモ動画は短く圧縮する
- モデルと静的アセットに長期キャッシュを設定
- プレイ画面を遅延ロードし、トップ閲覧だけでモデルを取得しない

### 21.3 キャッシュ

モデルファイル名にはバージョンまたはハッシュを含める。

例:

```text
/public/models/gesture-recognizer-v1.task
```

推奨ヘッダー:

```text
Cache-Control: public, max-age=31536000, immutable
```

HTMLやビルド成果物のキャッシュはNext.jsとVercelの標準動作に従う。

### 21.4 デプロイ手順

1. GitHubにリポジトリを作成
2. 初期Next.jsプロジェクトをpush
3. VercelでGitHubリポジトリをImport
4. Framework PresetがNext.jsになっていることを確認
5. Build Commandは標準設定
6. `pnpm-lock.yaml` を検出させる
7. Preview Deploymentでカメラ動作を確認
8. `main` へマージしてProductionへ反映
9. スマートフォン実機でカメラ権限を確認
10. Lighthouseと基本E2Eを確認

### 21.5 公開前チェック

- HTTPSでカメラが起動する
- Vercel Preview URLでも動作する
- モデルのパスが本番で404にならない
- Workerのパスが本番ビルドで解決される
- Safariで動画形式フォールバックが動く
- ページ離脱後にカメラランプが消える
- リロード後にObject URLが残らない
- 環境変数が不要
- 利用規約上、個人・非商用ポートフォリオとして公開している

### 21.6 将来の商用化

広告、課金、企業サービスへの組込みなど商用利用へ移行する場合は、Vercelの利用プランと規約を再確認し、必要に応じてProまたは別のホスティングへ移行する。

---

## 22. パフォーマンス要件

### 22.1 目標

- UI操作が推論で固まらない
- 推論FPS: 15以上を推奨
- 最低推論FPS: 10
- カメラ解像度初期値: 640×480程度
- 高性能端末では解像度を上げてもよい
- Workerの未処理フレーム蓄積なし
- モデルはプレイ時のみロード
- ラウンド終了後に不要データを破棄
- リプレイ動画は一件のみメモリ保持

### 22.2 自動品質調整

推論時間が長い場合:

1. 推論頻度を下げる
2. 入力解像度を下げる
3. ランドマーク描画頻度を下げる
4. リプレイ録画品質を下げる
5. 改善しなければ判定品質をLOWにする

---

## 23. テスト仕様

### 23.1 ユニットテスト

対象:

- グー・チョキ・パー勝敗
- 安定区間抽出
- グーのPON時刻特例
- 確定時刻計算
- 確定後変更検出
- 確定時刻差
- 公平性判定
- 品質スコア
- 理由コード
- 左右割り当て
- ミラー座標変換

必須ケース:

1. 同時にグー対チョキ
2. 同時に同じ手
3. 180ms差で遅い側が勝つ
4. 260ms差で遅い側が勝つ
5. 420ms差で遅い側が勝つ
6. 420ms差で遅い側が負ける
7. 一度パー確定後にチョキへ変更
8. 一フレームだけ別分類
9. 信頼度不足
10. 観測欠落
11. 手が交差
12. FPS不足

### 23.2 統合テスト

実際のカメラを使わず、時系列の推論結果JSONを入力してラウンド全体を再現する。

Fixture例:

```text
tests/fixtures/
├─ normal-simultaneous.json
├─ delayed-winning.json
├─ delayed-losing.json
├─ switch-after-commit.json
├─ low-confidence.json
├─ crossed-hands.json
└─ low-fps.json
```

### 23.3 E2Eテスト

Playwrightで次を確認する。

- トップからデモ画面へ移動
- カメラ拒否時の表示
- デモで正常判定
- デモで後出し可能性判定
- 履歴保存と削除
- 設定変更
- モバイル表示
- 結果画面から再戦

可能であればChromiumのfake media deviceを使い、同梱テスト映像を仮想カメラ入力として利用する。

### 23.4 手動実機テスト

最低限:

- Windows + Chrome
- macOS + Chrome
- macOS + Safari
- Android + Chrome
- iPhone + Safari

---

## 24. 受入条件

### 24.1 必須受入条件

- [ ] Vercelの公開URLへアクセスできる
- [ ] カメラ権限をユーザー操作後に要求する
- [ ] 二つの手を同時に検出できる
- [ ] 左右プレイヤーを位置で識別する
- [ ] グー・チョキ・パーを判定できる
- [ ] 全組合せの勝敗が正しい
- [ ] PON時刻が記録される
- [ ] 両者の確定時刻が表示される
- [ ] 確定時刻差が表示される
- [ ] 確定後変更を検出できる
- [ ] 判定不能条件では断定しない
- [ ] 結果に理由コードが含まれる
- [ ] リプレイまたは非対応フォールバックが動く
- [ ] タイムラインが表示される
- [ ] 動画をサーバーへ送信しない
- [ ] ページ離脱時にカメラが停止する
- [ ] デモモードが二人なしで動作する
- [ ] ユニットテストが通る
- [ ] Production Buildが通る
- [ ] READMEから仕様・構成・限界を確認できる

### 24.2 品質受入条件

- [ ] TypeScriptの `any` を原則使用しない
- [ ] ESLintエラー0
- [ ] 型チェック成功
- [ ] テスト成功
- [ ] 推論ロジックとUIが分離されている
- [ ] 公平性判定が純粋関数としてテスト可能
- [ ] Workerのフレームキューが無制限に増えない
- [ ] Object URLとMediaStreamが破棄される
- [ ] エラー時に再試行できる
- [ ] 判定閾値が一か所に集約されている

---

## 25. 実装フェーズ

### Phase 0: プロジェクト基盤

- Next.js + TypeScript + Tailwind
- ESLint、Prettier、Vitest、Playwright
- GitHubリポジトリ
- Vercel初回デプロイ
- トップ画面
- CI

完了条件:

- 空のアプリがVercelで公開
- テストとbuildが成功

### Phase 1: 一人分の手認識

- カメラ権限
- MediaPipeモデル読込
- 一つの手のランドマーク
- ジェスチャー表示
- 推論FPS

完了条件:

- グー・チョキ・パーがライブ表示される

### Phase 2: 二人認識と追跡

- `numHands: 2`
- 左右ROI
- プレイヤー割り当て
- 交差検出
- 準備OK判定

完了条件:

- 二つの手を左右プレイヤーとして安定表示

### Phase 3: ラウンド進行

- 状態機械
- カウントダウン
- PON時刻
- 勝敗判定
- 結果画面

完了条件:

- 一ラウンドを最後まで実行可能

### Phase 4: 時系列・後出し判定

- 観測バッファ
- 安定区間
- 確定時刻
- 時刻差
- 確定後変更
- 公平性判定
- 品質スコア

完了条件:

- JSON Fixtureで全判定テスト成功

### Phase 5: Workerと性能改善

- Web Worker
- 最新フレーム優先
- 解像度調整
- メモリ解放
- 性能診断

完了条件:

- 推論中もUI操作が固まりにくい
- キューが増え続けない

### Phase 6: リプレイとタイムライン

- MediaRecorder
- スロー再生
- イベントマーカー
- フォールバック

完了条件:

- 判定根拠を映像と時系列で確認可能

### Phase 7: デモ・ポートフォリオ化

- 固定デモ
- README
- アーキテクチャ図
- AI開発ログ
- 既知の限界
- スクリーンショット
- OGP

完了条件:

- 採用担当者がカメラなしでも価値を理解可能

### Phase 8: 実機検証・公開

- PC、Android、iPhone
- Vercel Production
- カメラ停止確認
- 最終E2E
- 公開URLをREADMEに追加

---

## 26. Codex向け実装ルール

`AGENTS.md` に以下を記載する。

```md
# Project Rules

1. docs/specification.mdを唯一の要求仕様として扱う。
2. 実装前に対象フェーズのタスクを小分けにする。
3. 仕様にないバックエンド、認証、DB、外部APIを追加しない。
4. 映像・静止画をネットワーク送信しない。
5. ドメインロジックをReactコンポーネントへ直接埋め込まない。
6. 公平性判定は純粋関数にする。
7. 判定閾値は設定ファイルへ集約する。
8. 新機能にはテストを追加する。
9. 実装後にlint、typecheck、test、buildを実行する。
10. 失敗を無視せず、原因と修正内容を記録する。
11. ブラウザAPIは利用可否チェックとフォールバックを持たせる。
12. MediaStream、Worker、Object URLを必ず破棄する。
13. 誤判定し得る状態では「判定不能」を優先する。
14. UIでは「不正確定」と断定しない。
15. 変更ごとにdocs/ai-development-log.mdを更新する。
```

### 26.1 Codexへの最初の指示例

```text
docs/specification.mdとAGENTS.mdを読み、Phase 0だけを実装してください。

要件:
- Next.js、TypeScript、Tailwind、pnpm
- Vitest、React Testing Library、Playwright
- lint、typecheck、test、buildの各スクリプト
- トップ画面の最低限UI
- Vercelへそのままデプロイ可能
- バックエンド、DB、認証、外部APIは追加しない
- 実装後に全品質チェックを実行
- 実行結果と未解決事項をdocs/ai-development-log.mdへ記録
- Phase 1以降には着手しない
```

各Phaseを一度にまとめて依頼せず、受入条件を確認してから次へ進める。

---

## 27. READMEに必ず掲載する内容

1. 公開URL
2. 30秒で分かる概要
3. デモGIFまたは短い動画
4. 主要機能
5. 技術スタック
6. アーキテクチャ
7. 後出し判定ロジック
8. プライバシー
9. ローカル起動方法
10. テスト方法
11. Vercelデプロイ方法
12. 既知の限界
13. Codexを使った開発方法
14. ライセンス
15. 今後の改善案

READMEの冒頭例:

```md
# Janken Judge AI

二人のじゃんけんをカメラで認識し、勝敗だけでなく、
両者の手が確定した推定時刻と確定後の変更を解析するブラウザAI審判です。

- インストール不要
- 映像は端末内処理
- スローリプレイ対応
- 判定根拠をタイムライン表示
- Vercelで無料公開
```

---

## 28. 既知の限界

READMEとアプリ内に明示する。

- 一台の一般的なカメラでは、相手の手を実際に見た時刻を測定できない
- 視線や意図を判定できない
- 確定時刻は画像認識上の推定値
- カメラのFPS、露光、遅延、端末性能に影響される
- モーションブラーや指の重なりで誤分類する
- グーはPON前の握りこぶしと区別しにくい
- 左右の手が交差すると追跡が不安定になる
- 肌、背景、照明、手袋などにより精度が変わる
- MediaPipeの既定モデルはじゃんけん専用モデルではない
- 「遅れて有利な手を出した」ことは表示できても、故意の不正は断定できない
- 公式競技や紛争解決には使用できない

---

## 29. 将来拡張

優先順:

1. 判定閾値のキャリブレーション
2. 実際のじゃんけん映像を用いた評価データセット
3. じゃんけん専用ジェスチャー分類器
4. ランドマーク速度を使った動作完了時刻推定
5. 手首・指先の速度グラフ
6. 推論イベントとリプレイ映像の高精度同期
7. PWA化
8. オフラインキャッシュ
9. 英語UI
10. QRコードで公開URL共有
11. 対戦結果カードの画像出力
12. カメラ角度ガイド
13. 外付け高FPSカメラ対応
14. 60fps判定モード
15. 複数ラウンドの統計表示

追加機能を実装しても、映像の外部送信は原則行わない。

---

## 30. 成功判定

本プロジェクトは、次の状態になればポートフォリオとして成功とみなす。

- URLを開けばすぐ概要を理解できる
- 二人で実際に遊べる
- 一人でもデモを確認できる
- 単なる静止画分類ではなく、時間軸解析が見える
- 後出し判定の根拠を説明できる
- 誤判定時に無理な断定をしない
- 映像をサーバーへ送信しない
- 無料で公開を維持できる
- テストと設計資料が揃っている
- Codexを使って複雑なWebアプリを構築・管理できることが伝わる

---

## 31. 参考にする公式資料

実装時に最新版を確認する。

- Vercel Pricing
- Vercel Hobby Plan Documentation
- Vercel Limits
- Google AI Edge MediaPipe Gesture Recognizer for Web
- MDN MediaDevices.getUserMedia
- MDN MediaRecorder
- Next.js Documentation
- Playwright Documentation
