---
summary: "`openclaw uninstall` の CLI リファレンス (ゲートウェイサービスとローカルデータの削除)"
read_when:
  - ゲートウェイサービスやローカルの状態を削除したい場合
  - 削除される内容を事前にシミュレーション（ドライラン）したい場合
title: "uninstall"
seoTitle: "OpenClaw CLI: openclaw uninstall コマンドの使い方と主要オプション・実行例"
description: "ゲートウェイサービスおよびローカルデータをアンインストールします（CLI 自体は削除されません）。補足事項を確認できます。"
x-i18n:
  source_hash: "5a82cdcb2a7254f87edd3c6678e4c35f00c805971c705610149cbb2ff48b29a4"
---
ゲートウェイサービスおよびローカルデータをアンインストールします（CLI 自体は削除されません）。

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## 補足事項

- 状態ディレクトリやワークスペースを削除する前に、復元可能なスナップショットを作成しておくために、まず `openclaw backup create` を実行することを推奨します。
- `--all` を指定すると、サービス、状態、ワークスペース、アプリ（もしあれば）のすべてが削除対象となります。
- 安全のため、実際に削除を行うには `--yes` フラグが必要です（非対話モードの場合）。
