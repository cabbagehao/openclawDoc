---
summary: "Zalo Personal プラグイン: QR ログインと、ネイティブ zca-js を使ったメッセージング（インストール、チャネル設定、ツール）"
read_when:
  - OpenClaw で Zalo Personal（非公式）を使いたいとき
  - zalouser プラグインを設定または開発しているとき
title: "OpenClawのZalo Personalプラグインの設定方法と利用ガイド"
description: "このプラグインは、ネイティブの zca-js を用いて通常の Zalo 個人アカウントを自動操作し、OpenClaw から Zalo Personal を利用できるようにします。"
x-i18n:
  source_hash: "c3afa0375b8fd2957a3f6f12e166a2703a606c782736b09818588d9f9800b8bf"
---
このプラグインは、ネイティブの `zca-js` を用いて通常の Zalo 個人アカウントを自動操作し、OpenClaw から Zalo Personal を利用できるようにします。

> **Warning:** 非公式な自動化は、アカウント停止や ban の原因になる可能性があります。自己責任で使用してください。

## 命名

channel id は `zalouser` です。これは **個人の Zalo user account** を自動化する非公式実装であることを明示するためです。`zalo` は、将来の公式 Zalo API 連携向けに予約しています。

## 実行場所

このプラグインは **ゲートウェイ プロセス内** で動作します。

remote ゲートウェイを使う場合は、**ゲートウェイが動作しているマシン** にインストールと設定を行い、その後ゲートウェイを再起動してください。

外部の `zca` / `openzca` CLI バイナリは不要です。

## インストール

### Option A: npm からインストールする

```bash
openclaw plugins install @openclaw/zalouser
```

その後、ゲートウェイを再起動してください。

### Option B: ローカル フォルダーからインストールする（開発向け）

```bash
openclaw plugins install ./extensions/zalouser
cd ./extensions/zalouser && pnpm install
```

その後、ゲートウェイを再起動してください。

## 設定

channel 設定は `plugins.entries.*` ではなく、`channels.zalouser` 配下に置きます。

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Agent tool

tool 名: `zalouser`

利用できる actions:

- `send`
- `image`
- `link`
- `friends`
- `groups`
- `me`
- `status`

channel message action では、メッセージ リアクション用の `react` も使えます。
