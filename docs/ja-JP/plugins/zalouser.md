---
summary: "Zalo Personal プラグイン: QR ログイン + ネイティブ zca-js 経由のメッセージング (プラグインのインストール + チャネル設定 + ツール)"
read_when:
  - OpenClaw での Zalo Personal (非公式) サポートが必要です
  - zalouser プラグインを構成または開発しています
title: "Zaloパーソナルプラグイン"
x-i18n:
  source_hash: "c3afa0375b8fd2957a3f6f12e166a2703a606c782736b09818588d9f9800b8bf"
---

# Zalo Personal (プラグイン)

プラグインを介した OpenClaw の Zalo Personal サポート。ネイティブ `zca-js` を使用して通常の Zalo ユーザー アカウントを自動化します。

> **警告:** 非公式の自動化は、アカウントの停止/禁止につながる可能性があります。ご自身の責任でご使用ください。

## 命名

チャンネル ID は `zalouser` で、**個人 Zalo ユーザー アカウント** (非公式) を自動化することを明示します。 `zalo` は、将来の公式 Zalo API 統合の可能性のために予約されています。

## 実行場所

このプラグインは **ゲートウェイ プロセス内**で実行されます。

リモート ゲートウェイを使用する場合は、**ゲートウェイを実行しているマシン**にリモート ゲートウェイをインストール/構成し、ゲートウェイを再起動します。

外部 `zca`/`openzca` CLI バイナリは必要ありません。

## インストール

### オプション A: npm からインストールする

```bash
openclaw plugins install @openclaw/zalouser
```

その後、ゲートウェイを再起動します。

### オプション B: ローカル フォルダー (dev) からインストールする

```bash
openclaw plugins install ./extensions/zalouser
cd ./extensions/zalouser && pnpm install
```

その後、ゲートウェイを再起動します。

## 構成

チャネル構成は `channels.zalouser` (`plugins.entries.*` ではありません) の下にあります。

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

## エージェントツール

ツール名: `zalouser`

アクション: `send`、`image`、`link`、`friends`、`groups`、`me`、`status`

チャネル メッセージ アクションは、メッセージ リアクションの `react` もサポートしています。
