---
summary: "`openclaw config` の CLI リファレンス (構成の取得、設定、削除、パスの確認、検証)"
read_when:
  - 構成（config）を非対話的に読み取ったり編集したりしたい場合
title: "OpenClaw CLI: openclaw config コマンドの使い方と主要オプション・実行例"
description: "構成ファイルのヘルパーです。パスを指定して値の取得、設定、削除、検証を行ったり、現在有効な構成ファイルを表示したりできます。サブコマンドなしで実行した場合は、構成ウィザードが開きます（openclaw configure と同じです）。"
x-i18n:
  source_hash: "40f101e9159cf02175e461b248805b8b58692d7bbe94f62c7242c5a636f2efdf"
---
構成ファイルのヘルパーです。パスを指定して値の取得、設定、削除、検証を行ったり、現在有効な構成ファイルを表示したりできます。サブコマンドなしで実行した場合は、構成ウィザードが開きます（`openclaw configure` と同じです）。

## 実行例

```bash
openclaw config file
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config unset tools.web.search.apiKey
openclaw config validate
openclaw config validate --json
```

## パスの指定

パスにはドット記法またはブラケット記法を使用できます:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

エージェントのリスト内インデックスを使用して、特定のエージェントを対象にできます:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 値の形式

値は可能な限り JSON5 として解析され、解析できない場合は文字列として扱われます。
明示的に JSON5 解析を行いたい場合は `--strict-json` を使用してください。`--json` フラグも互換性のためにサポートされています。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

## サブコマンド

- `config file`: 現在有効な構成ファイルのパスを表示します（`OPENCLAW_CONFIG_PATH` またはデフォルトの場所から解決されます）。

編集後はゲートウェイを再起動してください。

## 構成の検証 (Validate)

ゲートウェイを起動せずに、現在の構成がスキーマに従っているかを検証します。

```bash
openclaw config validate
openclaw config validate --json
```
