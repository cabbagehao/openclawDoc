---
summary: "`openclaw status` の CLI リファレンス (診断、プローブ、利用状況スナップショット)"
read_when:
  - チャネルの健全性や、最近対話したセッション相手を素早く確認したい場合
  - デバッグ用に、すべてのステータス情報をコピー＆ペースト可能な形式で出力したい場合
title: "status"
x-i18n:
  source_hash: "7c0050b01ed5c9027e4eb274048ca6e40ae042805896585edc48ca5edfbce2f0"
---
チャネルおよびセッションの状態に関する診断情報を表示します。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

## 補足事項

- `--deep`: すべての構成済みチャネル（WhatsApp Web, Telegram, Discord, Google Chat, Slack, Signal）に対してライブプローブ（導通確認）を実行します。
- 複数のエージェントが構成されている場合、出力にはエージェントごとのセッションストア情報が含まれます。
- 利用可能な場合、サマリー（Overview）にはゲートウェイおよびノードホストサービスのインストール状況と実行ステータスが含まれます。
- サマリーには、アップデートチャンネル情報と git SHA（ソースインストールの場合）が含まれます。
- アップデート情報がサマリーに表示されます。新しいバージョンが利用可能な場合は、`openclaw update` コマンドの実行を促すヒントが表示されます（詳細は [アップデート](/install/updating) を参照）。
- 読み取り専用のステータス出力（`status`, `status --json`, `status --all`）は、可能であれば、対象となる構成パスの SecretRef を解決して表示します。
- 対応しているチャネルの SecretRef が構成されているものの、現在の実行パスで解決できない場合、プログラムはクラッシュせずに読み取り専用の制限モードとして動作し、情報が欠落していることを報告します。ターミナル出力では「構成されたトークンがこのコマンドパスで利用できません」といった警告が表示され、JSON 出力には `secretDiagnostics` フィールドが含まれます。
