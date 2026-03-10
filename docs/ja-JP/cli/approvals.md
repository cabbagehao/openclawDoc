---
summary: "「openclaw 承認」の CLI リファレンス (ゲートウェイまたはノード ホストの実行承認)"
read_when:
  - CLI から実行承認を編集したい
  - ゲートウェイまたはノードホストのホワイトリストを管理する必要がある
title: "承認"
x-i18n:
  source_hash: "4329cdaaec2c5f5d619415b6431196512d4834dc1ccd7363576f03dd9b845130"
---

# `openclaw approvals`

**ローカル ホスト**、**ゲートウェイ ホスト**、または **ノード ホスト**の実行承認を管理します。
デフォルトでは、コマンドはディスク上のローカル承認ファイルをターゲットとします。 `--gateway` を使用してゲートウェイをターゲットにするか、`--node` を使用して特定のノードをターゲットにします。

関連:

- 幹部の承認: [幹部の承認](/tools/exec-approvals)
- ノード: [ノード](/nodes)

## 共通コマンド

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

## ファイルから承認を置き換えます

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

## 許可リストヘルパー

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 注意事項

- `--node` は、`openclaw nodes` と同じリゾルバー (ID、名前、IP、または ID プレフィックス) を使用します。
- `--agent` のデフォルトは `"*"` で、これはすべてのエージェントに適用されます。
- ノードホストは `system.execApprovals.get/set` (macOS アプリまたはヘッドレス ノード ホスト) をアドバタイズする必要があります。
- 承認ファイルはホストごとに `~/.openclaw/exec-approvals.json` に保存されます。
