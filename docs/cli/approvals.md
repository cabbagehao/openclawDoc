---
summary: "`openclaw approvals` の CLI リファレンス (ゲートウェイまたはノードホストにおける実行承認の管理)"
read_when:
  - CLI から実行承認を編集したい場合
  - ゲートウェイやノードホストの許可リスト（allowlist）を管理する必要がある場合
title: "approvals"
seoTitle: "OpenClaw CLI: openclaw approvals コマンドの使い方と主要オプション・実行例"
description: "ローカルホスト、ゲートウェイホスト、または特定のノードホストにおける実行承認（exec approvals）を管理します。デフォルトでは、コマンドはディスク上のローカル承認ファイルを対象とします。"
x-i18n:
  source_hash: "4329cdaaec2c5f5d619415b6431196512d4834dc1ccd7363576f03dd9b845130"
---
**ローカルホスト**、**ゲートウェイホスト**、または特定の**ノードホスト**における実行承認（exec approvals）を管理します。
デフォルトでは、コマンドはディスク上のローカル承認ファイルを対象とします。`--gateway` フラグを指定するとゲートウェイを、`--node` フラグを指定すると特定のノードを対象にします。

関連ドキュメント:
- 実行承認（Exec approvals）: [実行承認](/tools/exec-approvals)
- ノード: [ノード](/nodes)

## よく使われるコマンド

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

## ファイルの内容で承認を置き換える

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

## 許可リスト（Allowlist）用ヘルパー

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 補足事項

- `--node` フラグには `openclaw nodes` と同じリゾルバー（ID、名前、IP、または ID プレフィックス）を使用できます。
- `--agent` フラグのデフォルトは `"*"` であり、すべてのエージェントに適用されます。
- ノードホストを対象とする場合、そのホストが `system.execApprovals.get/set` 機能を公開している必要があります（macOS アプリやヘッドレスノードなど）。
- 承認ファイルは、各ホスト上の `~/.openclaw/exec-approvals.json` に保存されます。
