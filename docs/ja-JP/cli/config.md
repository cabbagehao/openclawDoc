---
summary: "「openclaw config」の CLI リファレンス (get/set/unset/file/validate)"
read_when:
  - 構成を非対話的に読み取りまたは編集したい
title: "構成"
x-i18n:
  source_hash: "40f101e9159cf02175e461b248805b8b58692d7bbe94f62c7242c5a636f2efdf"
---

# `openclaw config`

構成ヘルパー: パスによって値を取得/設定/設定解除/検証し、アクティブな値を出力します。
設定ファイル。サブコマンドを使用せずに実行して開く
構成ウィザード (`openclaw configure` と同じ)。

## 例

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

## パス

パスはドットまたは括弧表記を使用します。

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

エージェント リスト インデックスを使用して、特定のエージェントをターゲットにします。

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 値

可能な場合、値は JSON5 として解析されます。それ以外の場合は文字列として扱われます。
JSON5 解析を要求するには、`--strict-json` を使用します。 `--json` は従来のエイリアスとして引き続きサポートされます。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

## サブコマンド

- `config file`: アクティブな構成ファイルのパス (`OPENCLAW_CONFIG_PATH` またはデフォルトの場所から解決) を出力します。

編集後にゲートウェイを再起動します。

## 検証する

を開始せずに、アクティブなスキーマに対して現在の構成を検証します。
ゲートウェイ。

```bash
openclaw config validate
openclaw config validate --json
```
