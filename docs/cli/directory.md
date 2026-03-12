---
summary: "`openclaw directory` の CLI リファレンス (自身、連絡先、グループの検索)"
read_when:
  - 各チャネルにおける連絡先やグループ、自身の ID を確認したい場合
  - チャネルディレクトリのアダプターを開発している場合
title: "directory"
x-i18n:
  source_hash: "7c878d9013aeaa22c8a21563fac30b465a86be85d8c917c5d4591b5c3d4b2025"
---
ディレクトリ検索に対応しているチャネルにおいて、連絡先（ピア）、グループ、および自分自身の情報を検索します。

## よく使われるフラグ

- `--channel <name>`: チャネルの ID または別名（複数のチャネルが構成されている場合は必須、1 つのみの場合は自動的に選択されます）。
- `--account <id>`: アカウント ID（デフォルトはチャネルのデフォルトアカウント）。
- `--json`: JSON 形式で出力。

## 補足事項

- `directory` コマンドは、他のコマンド（特に `openclaw message send --target ...`）で使用するための ID を特定するのに役立ちます。
- 多くのチャネルにおいて、検索結果はプロバイダーのライブデータではなく、構成ファイル（許可リストや設定済みのグループ）に基づいています。
- デフォルトの出力形式は、タブ区切りの `id` (および `name`) です。スクリプトで利用する場合は `--json` を使用してください。

## 検索結果を `message send` で利用する例

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "こんにちは"
```

## 各チャネルの ID 形式

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (グループ)
- Telegram: `@username` または数値のチャット ID。グループは数値 ID です。
- Slack: `user:U…` および `channel:C…`
- Discord: `user:<id>` および `channel:<id>`
- Matrix (プラグイン): `user:@user:server`, `room:!roomId:server`, または `#alias:server`
- Microsoft Teams (プラグイン): `user:<id>` および `conversation:<id>`
- Zalo (プラグイン): ユーザー ID (Bot API)
- Zalo Personal / `zalouser` (プラグイン): `zca` 由来のスレッド ID (DM/グループ)。`me`, `friend list`, `group list` などで確認できます。

## 自分自身 ("me") の確認

```bash
openclaw directory self --channel zalouser
```

## 連絡先 (Peers/Users) の一覧

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "名前"
openclaw directory peers list --channel zalouser --limit 50
```

## グループ (Groups) の一覧

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "仕事"
openclaw directory groups members --channel zalouser --group-id <id>
```
