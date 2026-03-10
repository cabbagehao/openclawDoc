---
summary: "OpenCode Zen (厳選されたモデル) を OpenClaw で使用する"
read_when:
  - モデルにアクセスするには OpenCode Zen が必要です
  - コーディングに適したモデルの厳選されたリストが必要な場合
title: "OpenCode Zen"
x-i18n:
  source_hash: "b3b5c640ac32f3177f6f4ffce766f3f57ff75c6ca918822c817d9a18f680be8f"
---

# オープンコード禅

OpenCode Zen は、OpenCode チームがコーディング エージェントに推奨する **厳選されたモデルのリスト** です。
これは、API キーと `opencode` プロバイダーを使用する、オプションのホスト型モデル アクセス パスです。
Zen は現在ベータ版です。

## CLI セットアップ

```bash
openclaw onboard --auth-choice opencode-zen
# or non-interactive
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

## 構成スニペット

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 注意事項

- `OPENCODE_ZEN_API_KEY` もサポートされています。
- Zen にサインインし、請求の詳細を追加して、API キーをコピーします。
- OpenCode Zen はリクエストごとに請求します。詳細については、OpenCode ダッシュボードを確認してください。
