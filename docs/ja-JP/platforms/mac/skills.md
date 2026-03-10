---
summary: "macOS スキル設定 UI とゲートウェイ支援ステータス"
read_when:
  - macOS スキル設定 UI の更新
  - スキルゲーティングまたはインストール動作の変更
title: "スキル"
x-i18n:
  source_hash: "ecd5286bbe49eed89319686c4f7d6da55ef7b0d3952656ba98ef5e769f3fbf79"
---

# スキル (macOS)

macOS アプリは、ゲートウェイ経由で OpenClaw スキルを表示します。ローカルでスキルを解析しません。

## データソース

- `skills.status` (ゲートウェイ) は、すべてのスキルに加え、適格性と不足している要件を返します。
  (バンドルされたスキルの許可リスト ブロックを含む)。
- 要件は、各 `SKILL.md` の `metadata.openclaw.requires` から派生します。

## インストールアクション

- `metadata.openclaw.install` はインストール オプション (brew/node/go/uv) を定義します。
- アプリは `skills.install` を呼び出して、ゲートウェイ ホスト上でインストーラーを実行します。
- 複数のインストーラーが提供されている場合、ゲートウェイは優先インストーラーを 1 つだけ表示します。
  (利用可能な場合は brew、それ以外の場合は `skills.install` のノード マネージャー、デフォルトの npm)。

## 環境/API キー

- アプリはキーを `skills.entries.<skillKey>` の下の `~/.openclaw/openclaw.json` に保存します。
- `skills.update` パッチ `enabled`、`apiKey`、および `env`。

## リモートモード

- インストールと構成の更新は、(ローカル Mac ではなく) ゲートウェイ ホストで行われます。
