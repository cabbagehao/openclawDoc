---
summary: "macOS におけるゲートウェイ ランタイム（外部 launchd サービス）"
read_when:
  - OpenClaw.app のパッケージ化
  - macOS ゲートウェイ launchd サービスのデバッグ
  - macOS 用のゲートウェイ CLI のインストール
title: "macOS のゲートウェイ"
seoTitle: "OpenClawのmacOS のゲートウェイ の仕組み・設定手順・運用ガイド"
description: "OpenClaw.app には、Node / Bun やゲートウェイ ランタイムは同梱されなくなりました。macOS アプリは 外部の openclaw CLI がインストールされていることを前提とし、ゲートウェイを子プロセスとして起動しません。"
x-i18n:
  source_hash: "c1ba561b24f093a6bf0a5cc1258a443464cdaa7cdfae656ec1629a94442bf46d"
---
OpenClaw.app には、Node / Bun やゲートウェイ ランタイムは同梱されなくなりました。macOS アプリは **外部の** `openclaw` CLI がインストールされていることを前提とし、ゲートウェイを子プロセスとして起動しません。代わりに、ユーザーごとの launchd サービスでゲートウェイを常駐させるか、すでにローカルで動作している既存のゲートウェイへ接続します。

## CLI のインストール（ローカル モードでは必須）

Mac 側に Node 22 以降を用意し、`openclaw` をグローバル インストールします。

```bash
npm install -g openclaw@<version>
```

macOS アプリの **Install CLI** ボタンも、npm / pnpm 経由で同じ処理を実行します。ゲートウェイ ランタイムに bun を使うことは推奨されません。

## launchd（LaunchAgent としてのゲートウェイ）

レーベル:

- `ai.openclaw.gateway`（または `ai.openclaw.<profile>`。従来の `com.openclaw.*` が残っている場合があります）

plist の保存場所（ユーザーごと）:

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （または `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理主体:

- ローカル モードでは、macOS アプリが LaunchAgent のインストールと更新を管理します。
- CLI から `openclaw gateway install` を実行してインストールすることもできます。

動作:

- 「OpenClaw Active」で LaunchAgent を有効化または無効化できます。
- アプリを終了してもゲートウェイは停止しません。launchd がプロセスを維持します。
- 設定済みポートでゲートウェイがすでに動作している場合、アプリは新しく起動せず、その既存プロセスへ接続します。

ロギング:

- launchd の stdout / stderr: `/tmp/openclaw/openclaw-gateway.log`

## バージョン互換性

macOS アプリは、ゲートウェイのバージョンがアプリ自身のバージョンと互換性を持つかどうかを確認します。互換性がない場合は、アプリのバージョンに合わせてグローバル CLI を更新してください。

## スモークチェック

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

続いて次を実行します。

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
