---
summary: "「openclaw デバイス」の CLI リファレンス (デバイスのペアリング + トークンのローテーション/取り消し)"
read_when:
  - デバイスのペアリング要求を承認しています
  - デバイストークンをローテーションまたは取り消す必要があります
title: "デバイス"
x-i18n:
  source_hash: "efcc88d20e64556eb06158a8fd5e5c785e9c31421c2a89353d136a6578dc1d1d"
---

# `openclaw devices`

デバイス ペアリング リクエストとデバイス スコープのトークンを管理します。

## コマンド

### `openclaw devices list`

保留中のペアリング要求とペアリングされたデバイスをリストします。

```
openclaw devices list
openclaw devices list --json
```

### `openclaw devices remove <deviceId>`

ペアになっているデバイス エントリを 1 つ削除します。

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

ペアリングされたデバイスを一括でクリアします。

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

保留中のデバイスのペアリング要求を承認します。 `requestId` を省略した場合、OpenClaw
最新の保留中のリクエストを自動的に承認します。

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

保留中のデバイスのペアリング要求を拒否します。

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

特定のロールのデバイス トークンをローテーションします (オプションでスコープを更新します)。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

### `openclaw devices revoke --device <id> --role <role>`

特定のロールのデバイス トークンを取り消します。

```
openclaw devices revoke --device <deviceId> --role node
```

## 共通オプション

- `--url <url>`: ゲートウェイ WebSocket URL (構成時のデフォルトは `gateway.remote.url`)。
- `--token <token>`: ゲートウェイ トークン (必要な場合)。
- `--password <password>`: ゲートウェイのパスワード (パスワード認証)。
- `--timeout <ms>`: RPC タイムアウト。
- `--json`: JSON 出力 (スクリプト作成に推奨)。

注: `--url` を設定すると、CLI は構成または環境の資格情報にフォールバックしません。
`--token` または `--password` を明示的に渡します。明示的な資格情報が欠落しているとエラーになります。

## 注意事項- トークンのローテーションは、新しいトークン (機密) を返します。秘密のように扱ってください

- これらのコマンドには `operator.pairing` (または `operator.admin`) スコープが必要です。
- `devices clear` は `--yes` によって意図的にゲートされます。
- ローカル ループバックでペアリング スコープが使用できない場合 (および明示的な `--url` が渡されない場合)、list/approve はローカル ペアリング フォールバックを使用できます。
