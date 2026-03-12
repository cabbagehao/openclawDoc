---
summary: "OpenClaw の高度なセットアップと開発ワークフロー"
read_when:
  - 新しいマシンをセットアップする場合
  - 個人のセットアップを壊すことなく「最新で最高」のものが欲しい場合
title: "セットアップ"
---
<Note>
初めてセットアップする場合は、[はじめに](/start/getting-started)から始めてください。
ウィザードの詳細については、[オンボーディングウィザード](/start/wizard)を参照してください。
</Note>

最終更新日: 2026-01-01

## 概要 (TL;DR)

- **カスタマイズはリポジトリの外部に置きます:** `~/.openclaw/workspace` (ワークスペース) + `~/.openclaw/openclaw.json` (設定)。
- **安定したワークフロー:** macOS アプリをインストールし、バンドルされた Gateway を実行させます。
- **最先端 (Bleeding edge) のワークフロー:** `pnpm gateway:watch` を介して自分で Gateway を実行し、macOS アプリをローカルモードでアタッチさせます。

## 前提条件 (ソースから)

- Node `>=22`
- `pnpm`
- Docker (オプション。コンテナ化されたセットアップ/e2e のみ — [Docker](/install/docker) を参照してください)

## カスタマイズ戦略 (アップデートで壊れないようにする)

「100% 自分向けにカスタマイズされたもの」*かつ*簡単なアップデートが必要な場合は、カスタマイズを以下に保持します：

- **設定:** `~/.openclaw/openclaw.json` (JSON / JSON5 風)
- **ワークスペース:** `~/.openclaw/workspace` (スキル、プロンプト、記憶。プライベートな git リポジトリにしてください)

一度だけブートストラップします：

```bash
openclaw setup
```

このリポジトリ内から、ローカルの CLI エントリを使用します：

```bash
openclaw setup
```

グローバルインストールがまだない場合は、`pnpm openclaw setup` 経由で実行してください。

## このリポジトリから Gateway を実行する

`pnpm build` の後、パッケージ化された CLI を直接実行できます：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 安定したワークフロー (macOS アプリ優先)

1. **OpenClaw.app** (メニューバー) をインストールして起動します。
2. オンボーディング / 権限チェックリスト (TCC プロンプト) を完了します。
3. Gateway が **Local** になっており、実行されていることを確認します (アプリが管理します)。
4. サーフェスをリンクします (例：WhatsApp)：

```bash
openclaw channels login
```

5. サニティチェック：

```bash
openclaw health
```

ビルドでオンボーディングが利用できない場合：

- `openclaw setup` を実行し、次に `openclaw channels login` を実行して、手動で Gateway を起動します (`openclaw gateway`)。

## 最先端のワークフロー (ターミナルでの Gateway)

目標：TypeScript の Gateway で作業し、ホットリロードを取得し、macOS アプリの UI をアタッチしたままにする。

### 0) (オプション) macOS アプリもソースから実行する

macOS アプリも最先端の状態にしたい場合：

```bash
./scripts/restart-mac.sh
```

### 1) 開発用 Gateway を起動する

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` はゲートウェイをウォッチモードで実行し、TypeScript の変更時にリロードします。

### 2) macOS アプリを実行中の Gateway に向ける

**OpenClaw.app** で：

- 接続モード (Connection Mode): **Local**
  アプリは、設定されたポートで実行中のゲートウェイにアタッチします。

### 3) 確認

- アプリ内の Gateway ステータスが **“Using existing gateway …”** になっているはずです
- または CLI 経由：

```bash
openclaw health
```

### よくある落とし穴

- **間違ったポート:** Gateway WS のデフォルトは `ws://127.0.0.1:18789` です。アプリと CLI を同じポートに保ってください。
- **状態が保存される場所:**
  - 資格情報: `~/.openclaw/credentials/`
  - セッション: `~/.openclaw/agents/<agentId>/sessions/`
  - ログ: `/tmp/openclaw/`

## 資格情報ストレージマップ

認証のデバッグやバックアップ対象を決定する際にこれを使用してください：

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram ボットトークン**: config/env または `channels.telegram.tokenFile`
- **Discord ボットトークン**: config/env または SecretRef (env/file/exec プロバイダー)
- **Slack トークン**: config/env (`channels.slack.*`)
- **ペアリング許可リスト**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (デフォルトアカウント)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (非デフォルトアカウント)
- **モデル認証プロファイル**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイルバックアップされたシークレットペイロード (オプション)**: `~/.openclaw/secrets.json`
- **レガシー OAuth インポート**: `~/.openclaw/credentials/oauth.json`
  詳細: [セキュリティ](/gateway/security#credential-storage-map)。

## アップデート (セットアップを壊さずに)

- `~/.openclaw/workspace` と `~/.openclaw/` は「あなたのもの」として保持してください。個人のプロンプトや設定を `openclaw` リポジトリに入れないでください。
- ソースのアップデート：`git pull` + `pnpm install` (ロックファイルが変更された場合) + 引き続き `pnpm gateway:watch` を使用します。

## Linux (systemd ユーザーサービス)

Linux インストールでは、systemd の**ユーザー**サービスを使用します。デフォルトでは、systemd はログアウトやアイドル状態になるとユーザーサービスを停止し、Gateway を終了させます。オンボーディングでは、リンガリング (lingering) の有効化を試みます (sudo のプロンプトが表示される場合があります)。それでもオフの場合は、次を実行してください：

```bash
sudo loginctl enable-linger $USER
```

常時稼働またはマルチユーザーのサーバーの場合は、ユーザーサービスではなく**システム**サービスを検討してください (リンガリングは不要です)。systemd に関する注意事項については、[Gateway ランブック](/gateway) を参照してください。

## 関連ドキュメント

- [Gateway ランブック](/gateway) (フラグ、監視、ポート)
- [Gateway の構成](/gateway/configuration) (設定スキーマ + 例)
- [Discord](/channels/discord) および [Telegram](/channels/telegram) (返信タグ + replyToMode 設定)
- [OpenClaw アシスタントのセットアップ](/start/openclaw)
- [macOS アプリ](/platforms/macos) (ゲートウェイのライフサイクル)
