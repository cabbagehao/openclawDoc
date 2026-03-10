---
title: "Pi開発ワークフロー"
summary: "Pi統合の開発者ワークフロー：ビルド、テスト、ライブ検証"
read_when:
  - Pi統合コードまたはテストを作業している場合
  - Pi固有のlint、typecheck、ライブテストフローを実行している場合
x-i18n:
  source_path: "pi-dev.md"
  source_hash: "497f962ca431f46046a5cb7267e73a6a92cc6c4c35608cdf77f1d7e128c8d01f"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T05:49:41.210Z"
---

# Pi開発ワークフロー

このガイドは、OpenClawにおけるpi統合の作業に適したワークフローをまとめたものです。

## 型チェックとリント

- 型チェックとビルド: `pnpm build`
- リント: `pnpm lint`
- フォーマットチェック: `pnpm format`
- プッシュ前の完全なゲート: `pnpm lint && pnpm build && pnpm test`

## Piテストの実行

Vitestを使用してPi専用のテストセットを直接実行します：

```bash
pnpm test -- \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-extensions/**/*.test.ts"
```

ライブプロバイダーの実行を含める場合：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test -- src/agents/pi-embedded-runner-extraparams.live.test.ts
```

これは主要なPiユニットスイートをカバーします：

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-extensions/*.test.ts`

## 手動テスト

推奨フロー：

- 開発モードでgatewayを実行：
  - `pnpm gateway:dev`
- エージェントを直接トリガー：
  - `pnpm openclaw agent --message "Hello" --thinking low`
- インタラクティブデバッグにTUIを使用：
  - `pnpm tui`

ツール呼び出しの動作を確認するには、`read`または`exec`アクションをプロンプトして、ツールストリーミングとペイロード処理を確認できます。

## クリーンスレートリセット

状態はOpenClaw状態ディレクトリの下に保存されます。デフォルトは`~/.openclaw`です。`OPENCLAW_STATE_DIR`が設定されている場合は、そのディレクトリを使用します。

すべてをリセットするには：

- `openclaw.json` 設定用
- `credentials/` 認証プロファイルとトークン用
- `agents/<agentId>/sessions/` エージェントセッション履歴用
- `agents/<agentId>/sessions.json` セッションインデックス用
- `sessions/` レガシーパスが存在する場合
- `workspace/` 空のワークスペースが必要な場合

セッションのみをリセットする場合は、そのエージェントの`agents/<agentId>/sessions/`と`agents/<agentId>/sessions.json`を削除します。再認証したくない場合は`credentials/`を保持します。

## 参考資料

- [https://docs.openclaw.ai/testing](https://docs.openclaw.ai/testing)
- [https://docs.openclaw.ai/start/getting-started](https://docs.openclaw.ai/start/getting-started)
