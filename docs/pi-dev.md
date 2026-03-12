---
title: "Pi Development Workflow"
summary: "Pi 統合向け開発ワークフロー: build、test、live validation"
read_when:
  - Pi 統合コードやテストを触るとき
  - Pi 固有の lint、typecheck、live test フローを回すとき
x-i18n:
  source_path: "pi-dev.md"
  source_hash: "497f962ca431f46046a5cb7267e73a6a92cc6c4c35608cdf77f1d7e128c8d01f"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T05:49:41.210Z"
---
このガイドは、OpenClaw における pi 統合の作業で使う、実用的な開発フローをまとめたものです。

## 型チェックと lint

- 型チェックと build: `pnpm build`
- lint: `pnpm lint`
- format check: `pnpm format`
- push 前のフルゲート: `pnpm lint && pnpm build && pnpm test`

## Pi テストの実行

Pi 向けテストセットは、Vitest で直接実行できます。

```bash
pnpm test -- \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-extensions/**/*.test.ts"
```

live provider 実行も含める場合:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test -- src/agents/pi-embedded-runner-extraparams.live.test.ts
```

これで主要な Pi unit suite をカバーできます。

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-extensions/*.test.ts`

## 手動テスト

推奨フロー:

- gateway を dev mode で起動する
  - `pnpm gateway:dev`
- agent を直接実行する
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 対話デバッグには TUI を使う
  - `pnpm tui`

tool call の挙動を確認したい場合は、`read` や `exec` を使う prompt を投げると、tool streaming と payload 処理を確認しやすくなります。

## クリーンスレートリセット

状態は OpenClaw の state directory 配下に保存されます。デフォルトは `~/.openclaw` です。`OPENCLAW_STATE_DIR` が設定されている場合は、その directory を使います。

すべてをリセットしたい場合:

- `openclaw.json`（設定）
- `credentials/`（認証 profile と token）
- `agents/<agentId>/sessions/`（agent session 履歴）
- `agents/<agentId>/sessions.json`（session index）
- `sessions/`（legacy path が残っている場合）
- `workspace/`（完全に空の workspace が必要な場合）

session だけをリセットしたい場合は、その agent の `agents/<agentId>/sessions/` と `agents/<agentId>/sessions.json` を削除します。再認証したくない場合は `credentials/` を残してください。

## 参考資料

- [https://docs.openclaw.ai/testing](https://docs.openclaw.ai/testing)
- [https://docs.openclaw.ai/start/getting-started](https://docs.openclaw.ai/start/getting-started)
