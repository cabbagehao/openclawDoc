---
summary: "macOS スキル設定 UI とゲートウェイ支援ステータス"
read_when:
  - macOS の Skills 設定 UI を更新するとき
  - skills の gating や install 動作を変更するとき
title: "スキル"
x-i18n:
  source_hash: "ecd5286bbe49eed89319686c4f7d6da55ef7b0d3952656ba98ef5e769f3fbf79"
---

# スキル (macOS)

macOS アプリは、OpenClaw のスキル情報をゲートウェイ経由で表示します。ローカルで `SKILL.md` を解析することはありません。

## データ ソース

- `skills.status` (ゲートウェイ) は、すべてのスキルと、その利用可否、欠けている要件を返します。
  バンドル済みスキルに対する allowlist block もここに含まれます。
- 要件は、各 `SKILL.md` にある `metadata.openclaw.requires` から導出されます。

## インストール操作

- `metadata.openclaw.install` が install option (brew / node / go / uv) を定義します。
- アプリは `skills.install` を呼び出して、ゲートウェイ ホスト上で installer を実行します。
- 複数の installer が指定されている場合でも、ゲートウェイが返すのは優先度の高い 1 件だけです。brew が使えるなら brew、そうでなければ `skills.install` の node manager、それもなければ既定の npm を使います。

## 環境変数 / API キー

- アプリはキーを `~/.openclaw/openclaw.json` の `skills.entries.<skillKey>` 配下に保存します。
- `skills.update` は `enabled`、`apiKey`、`env` を更新します。

## リモート モード

- install と設定更新は、ローカル Mac ではなくゲートウェイ ホスト側で実行されます。
