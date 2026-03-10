---
summary: "「openclaw ディレクトリ」の CLI リファレンス (セルフ、ピア、グループ)"
read_when:
  - チャンネルの連絡先/グループ/セルフ ID を検索したい
  - チャネル ディレクトリ アダプタを開発しています。
title: "ディレクトリ"
x-i18n:
  source_hash: "7c878d9013aeaa22c8a21563fac30b465a86be85d8c917c5d4591b5c3d4b2025"
---

# `openclaw directory`

それをサポートするチャネル (連絡先/ピア、グループ、および「私」) のディレクトリ検索。

## 共通フラグ

- `--channel <name>`: チャネル ID/エイリアス (複数のチャネルが設定されている場合は必須、1 つだけが設定されている場合は自動)
- `--account <id>`: アカウント ID (デフォルト: チャネルのデフォルト)
- `--json`: JSON を出力します

## 注意事項

- `directory` は、他のコマンド (特に `openclaw message send --target ...`) に貼り付けることができる ID を見つけるのに役立ちます。
- 多くのチャネルでは、結果はライブ プロバイダー ディレクトリではなく、構成に基づいています (許可リスト/構成済みグループ)。
- デフォルトの出力はタブで区切られた `id` (場合によっては `name`) です。スクリプトには `--json` を使用してください。

## `message send` での結果の使用

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## IDフォーマット（チャンネル別）

- WhatsApp: `+15551234567` (DM)、`1234567890-1234567890@g.us` (グループ)
- テレグラム: `@username` または数値チャット ID。グループは数値 ID です
- スラック: `user:U…` および `channel:C…`
- Discord: `user:<id>` および `channel:<id>`
- マトリックス (プラグイン): `user:@user:server`、`room:!roomId:server`、または `#alias:server`
- Microsoft Teams (プラグイン): `user:<id>` および `conversation:<id>`
- Zalo (プラグイン): ユーザー ID (ボット API)
- Zalo Personal / `zalouser` (プラグイン): `zca` からのスレッド ID (DM/グループ) (`me`、`friend list`、`group list`)

## 自分 (「私」)

```bash
openclaw directory self --channel zalouser
```

## ピア (連絡先/ユーザー)```bash

openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50

````

## グループ

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
````
