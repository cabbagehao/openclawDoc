---
summary: "`openclaw daemon` の CLI リファレンス (ゲートウェイサービス管理用のレガシーな別名)"
read_when:
  - スクリプト等で `openclaw daemon ...` を引き続き使用している場合
  - サービスのライフサイクル管理コマンド（インストール/起動/停止/再起動/ステータス）が必要な場合
title: "daemon"
x-i18n:
  source_hash: "b67f116e565b9f69967d95e5eac8ddc8d818f195b0d7d610e0997cf504edcfb7"
---
ゲートウェイのサービス管理コマンド用のレガシーな別名（エイリアス）です。

`openclaw daemon ...` は、`openclaw gateway ...` のサービス制御コマンドと同じ機能を実行します。

## 使用法

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## サブコマンド

- `status`: サービスのインストール状態を表示し、ゲートウェイの稼働状況を確認します。
- `install`: サービスをインストールします (`launchd`, `systemd`, `schtasks`)。
- `uninstall`: サービスを削除します。
- `start`: サービスを起動します。
- `stop`: サービスを停止します。
- `restart`: サービスを再起動します。

## よく使われるオプション

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- ライフサイクル管理 (`uninstall`, `start`, `stop`, `restart`): `--json`

注意事項:
- `status` は、可能であれば構成された認証用 SecretRef を解決して診断に使用します。
- Linux の systemd 環境では、`status` によるトークンの不一致チェックは、ユニットファイルの `Environment=` および `EnvironmentFile=` の両方を対象とします。
- トークン認証が必要な状況で、`gateway.auth.token` が SecretRef で管理されている場合、`install` は SecretRef が解決可能か検証しますが、解決されたトークン自体をサービスの環境メタデータに永続化させることはありません。
- トークン認証が必要な状況で、構成されたトークン用の SecretRef が解決できない場合、インストールは行われません。
- `gateway.auth.token` と `gateway.auth.password` の両方が構成され、かつ `gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでインストールはブロックされます。

## 推奨事項

最新のドキュメントや実行例については [`openclaw gateway`](/cli/gateway) を参照してください。
