---
summary: "OpenClaw で OpenCode Go カタログを使う"
read_when:
  - OpenCode Go カタログを使いたいとき
  - Go ホスト型モデル向けの runtime model ref を確認したいとき
title: "OpenCode Go"
seoTitle: "OpenClawでOpenCode Goカタログを使う設定ガイド"
description: "OpenCode Go カタログを OpenClaw で使うための認証と設定のガイドです。共有 API キー、利用可能なモデル、runtime provider id の扱いを確認できます。"
x-i18n:
  source_hash: "8650af7c64220c14bab8c22472fff8bebd7abde253e972b6a11784ad833d321c"
---

# OpenCode Go

OpenCode Go は [OpenCode](/providers/opencode) 内の Go カタログです。
Zen カタログと同じ `OPENCODE_API_KEY` を使いますが、upstream のモデル単位ルーティングを正しく保つため、runtime provider id は `opencode-go` のままです。

## 対応モデル

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## CLI セットアップ

```bash
openclaw onboard --auth-choice opencode-go
# または non-interactive
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## 設定例

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## ルーティング動作

model ref に `opencode-go/...` を使うと、OpenClaw がモデルごとのルーティングを自動で処理します。

## 注意事項

- 共通のオンボーディング手順とカタログ概要は [OpenCode](/providers/opencode) を参照してください。
- runtime ref は明示のまま維持されます。Zen は `opencode/...`、Go は `opencode-go/...` です。
