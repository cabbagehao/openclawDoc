---
summary: "「openclaw デーモン」 (ゲートウェイ サービス管理のレガシー エイリアス) の CLI リファレンス"
read_when:
  - スクリプトではまだ「openclaw daemon ...」を使用しています
  - サービスのライフサイクル コマンド (インストール/開始/停止/再起動/ステータス) が必要です
title: "デーモン"
x-i18n:
  source_hash: "b67f116e565b9f69967d95e5eac8ddc8d818f195b0d7d610e0997cf504edcfb7"
---

# `openclaw daemon`

ゲートウェイ サービス管理コマンドのレガシー エイリアス。

`openclaw daemon ...` は、`openclaw gateway ...` サービス コマンドと同じサービス コントロール サーフェスにマップされます。

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

- `status`: サービスのインストール状態を表示し、ゲートウェイの健全性を調査します
- `install`: サービスのインストール (`launchd`/`systemd`/`schtasks`)
- `uninstall`: サービスを削除します
- `start`: サービスの開始
- `stop`: サービスを停止します
- `restart`: サービスを再起動します

## 共通オプション

- `status`: `--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--deep`、 `--json`
- `install`: `--port`、`--runtime <node|bun>`、`--token`、`--force`、`--json`
- ライフサイクル (`uninstall|start|stop|restart`): `--json`

注:- `status` は、可能な場合、プローブ認証用に構成された認証 SecretRef を解決します。

- Linux systemd インストールでは、`status` トークン ドリフト チェックに `Environment=` と `EnvironmentFile=` の両方のユニット ソースが含まれます。
- トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef で管理されている場合、`install` は SecretRef が解決可能であることを検証しますが、解決されたトークンをサービス環境メタデータに保持しません。
- トークン認証にトークンが必要で、構成されたトークン SecretRef が解決されない場合、インストールは失敗して終了します。
- `gateway.auth.token` と `gateway.auth.password` の両方が構成され、`gateway.auth.mode` が設定されていない場合、モードが明示的に設定されるまでインストールはブロックされます。

## 優先する

現在のドキュメントと例には [`openclaw gateway`](/cli/gateway) を使用してください。
