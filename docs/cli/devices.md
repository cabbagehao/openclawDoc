---
summary: "`openclaw devices` の CLI リファレンス (デバイスのペアリング、トークンの更新と取り消し)"
read_when:
  - デバイスのペアリング要求を承認したい場合
  - デバイストークンの更新（ローテーション）や取り消しを行いたい場合
title: "OpenClaw CLI: openclaw devices コマンドの使い方と主要オプション・実行例"
description: "デバイスのペアリング要求と、デバイススコープのトークンを管理します。コマンド一覧、openclaw devices list、openclaw devices removeを確認できます。"
x-i18n:
  source_hash: "efcc88d20e64556eb06158a8fd5e5c785e9c31421c2a89353d136a6578dc1d1d"
---
デバイスのペアリング要求と、デバイススコープのトークンを管理します。

## コマンド一覧

### `openclaw devices list`

保留中のペアリング要求と、ペアリング済みのデバイスを一覧表示します。

```bash
openclaw devices list
openclaw devices list --json
```

### `openclaw devices remove <deviceId>`

ペアリング済みデバイスのエントリを 1 つ削除します。

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

ペアリング済みデバイスを一括で削除します。

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

保留中のデバイスペアリング要求を承認します。`requestId` を省略した場合、OpenClaw は最新の要求を自動的に承認します。

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

保留中のデバイスペアリング要求を拒否します。

```bash
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

特定のロールのデバイストークンを更新（ローテーション）します。オプションでスコープの更新も可能です。

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

### `openclaw devices revoke --device <id> --role <role>`

特定のロールのデバイストークンを取り消します。

```bash
openclaw devices revoke --device <deviceId> --role node
```

## よく使われるオプション

- `--url <url>`: ゲートウェイの WebSocket URL (構成済みであれば `gateway.remote.url` がデフォルトとなります)。
- `--token <token>`: ゲートウェイの認証トークン (必要な場合)。
- `--password <password>`: ゲートウェイの認証パスワード。
- `--timeout <ms>`: RPC タイムアウト。
- `--json`: JSON 形式で出力（スクリプトでの利用を推奨）。

注意: `--url` を明示的に指定した場合、CLI は構成ファイルや環境変数の認証情報を自動的に使用することはありません。`--token` または `--password` を明示的に渡してください。認証情報が不足している場合はエラーになります。

## 補足事項

- トークンの更新（rotate）を行うと、新しいトークンが発行されます。これは機密情報として慎重に扱ってください。
- これらのコマンドの実行には `operator.pairing` (または `operator.admin`) スコープの権限が必要です。
- `devices clear` コマンドは安全のため `--yes` フラグを必須としています。
- ローカルループバック環境でペアリングスコープが利用できず、かつ明示的な `--url` が指定されていない場合、list および approve コマンドはローカル環境用のペアリングフォールバックを使用することがあります。
