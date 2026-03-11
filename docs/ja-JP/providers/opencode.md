---
summary: "OpenClaw で OpenCode Zen の厳選モデルを利用する"
read_when:
  - OpenCode Zen を使ってモデルへアクセスしたいとき
  - コーディング向けに厳選されたモデル一覧を使いたいとき
title: "OpenCode Zen"
x-i18n:
  source_hash: "b3b5c640ac32f3177f6f4ffce766f3f57ff75c6ca918822c817d9a18f680be8f"
---

# OpenCode Zen

OpenCode Zen は、OpenCode チームがコーディング エージェント向けに推奨する**厳選モデル一覧**です。
API キーと `opencode` provider を使う、任意のホスト型モデル アクセス経路として利用できます。
Zen は現在 beta です。

## CLI セットアップ

```bash
openclaw onboard --auth-choice opencode-zen
# または non-interactive
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

## 設定例

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 注意事項

- `OPENCODE_ZEN_API_KEY` も利用できます。
- Zen にサインインし、請求情報を登録したうえで API キーを取得してください。
- OpenCode Zen はリクエスト単位で課金されます。詳細は OpenCode のダッシュボードを確認してください。
