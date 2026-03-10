---
summary: "macOS 上のゲートウェイ ランタイム (外部 launchd サービス)"
read_when:
  - OpenClaw.app のパッケージ化
  - macOS ゲートウェイ launchd サービスのデバッグ
  - macOS 用のゲートウェイ CLI のインストール
title: "macOS 上のゲートウェイ"
x-i18n:
  source_hash: "c1ba561b24f093a6bf0a5cc1258a443464cdaa7cdfae656ec1629a94442bf46d"
---

# macOS 上のゲートウェイ (外部 launchd)

OpenClaw.app には、Node/Bun または Gateway ランタイムがバンドルされなくなりました。 macOS アプリ
**外部** `openclaw` CLI インストールを予期しており、ゲートウェイを
子プロセスを管理し、ゲートウェイを維持するためにユーザーごとの launchd サービスを管理します。
実行中 (または、すでに実行中の場合は既存のローカル ゲートウェイに接続します)。

## CLI をインストールします (ローカル モードに必要)

Mac にはノード 22+ が必要で、`openclaw` をグローバルにインストールします。

```bash
npm install -g openclaw@<version>
```

macOS アプリの **Install CLI** ボタンは、npm/pnpm 経由で同じフローを実行します (ゲートウェイ ランタイムには bun は推奨されません)。

## Launchd (LaunchAgent としてのゲートウェイ)

レーベル:

- `ai.openclaw.gateway` (または `ai.openclaw.<profile>`、従来の `com.openclaw.*` が残る場合があります)

Plist の場所 (ユーザーごと):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (または `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

マネージャー:

- macOS アプリは、ローカル モードで LaunchAgent のインストール/更新を所有します。
- CLI を使用してインストールすることもできます: `openclaw gateway install`。

動作:

- 「OpenClaw Active」は、LaunchAgent を有効または無効にします。
- アプリを終了してもゲートウェイは停止しません\*\* (launchd はゲートウェイを存続させます)。
- ゲートウェイが設定されたポート上ですでに実行されている場合、アプリは
  新しいものを始める代わりに。

ロギング:

- launchd stdout/エラー: `/tmp/openclaw/openclaw-gateway.log`

## バージョンの互換性

macOS アプリは、ゲートウェイのバージョンをそれ自体のバージョンと比較してチェックします。もし彼らがそうなら
互換性がない場合は、アプリのバージョンと一致するようにグローバル CLI を更新します。## 煙チェック

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

次に:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
