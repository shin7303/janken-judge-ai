# Janken Judge AI

二人のじゃんけんをカメラで認識し、勝敗だけでなく、両者の手が確定した推定時刻と確定後の変更を解析するブラウザAI審判です。

- 映像は端末内で処理します
- 時刻差と判定根拠を表示します
- Vercel Hobby での無料公開を想定しています

## Development

```bash
npx pnpm@10.34.5 install
npx pnpm@10.34.5 dev
```

```bash
npx pnpm@10.34.5 lint
npx pnpm@10.34.5 typecheck
npx pnpm@10.34.5 test
npx pnpm@10.34.5 build
```

## Project documents

- [Specification](docs/specification.md)
- [Architecture](docs/architecture.md)
- [Known limitations](docs/limitations.md)
- [AI development log](docs/ai-development-log.md)

The project is currently progressing phase by phase. The landing page and development foundation are complete; camera recognition, round analysis, replay, and demo mode will follow in their own traceable commits.
