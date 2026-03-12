---
summary: "gogcli を使って Gmail Pub/Sub プッシュを OpenClaw の webhook に接続します"
read_when:
  - Gmail の受信トリガーを OpenClaw に接続したい場合
  - エージェント起動用の Pub/Sub プッシュを設定したい場合
title: "Gmail Pub/Sub"
x-i18n:
  source_path: "automation/gmail-pubsub.md"
  source_hash: "0c8a87516e12091f96209f570012cdba895265af3d48ba848e0260535535bd18"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T05:51:35.483Z"
---

# Gmail Pub/Sub -> OpenClaw

目的: Gmail watch -> Pub/Sub プッシュ -> `gog gmail watch serve` -> OpenClaw webhook。

## 前提条件

- `gcloud` がインストール済みで、ログイン済みであること（[install guide](https://docs.cloud.google.com/sdk/docs/install-sdk)）。
- `gog`（gogcli）がインストール済みで、対象の Gmail アカウントに対して認可済みであること（[gogcli.sh](https://gogcli.sh/)）。
- OpenClaw で hooks が有効になっていること（[webhook](/automation/webhook) を参照）。
- `tailscale` にログイン済みであること（[tailscale.com](https://tailscale.com/)）。サポート対象の構成では、公開 HTTPS エンドポイントに Tailscale Funnel を使用します。
  他のトンネルサービスでも動作する場合がありますが、DIY かつサポート対象外で、手動での設定が必要です。
  現時点でサポートしているのは Tailscale です。

フック設定例（Gmail プリセットのマッピングを有効化）:

```json5
{
  hooks: {
    enabled: true,
    token: "OPENCLAW_HOOK_TOKEN",
    path: "/hooks",
    presets: ["gmail"],
  },
}
```

Gmail の要約をチャットサーフェスへ配信したい場合は、`deliver` と必要に応じて `channel`/`to` を設定したマッピングでプリセットを上書きします。

```json5
{
  hooks: {
    enabled: true,
    token: "OPENCLAW_HOOK_TOKEN",
    presets: ["gmail"],
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "New email from {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}\n{{messages[0].body}}",
        model: "openai/gpt-5.2-mini",
        deliver: true,
        channel: "last",
        // to: "+15551234567"
      },
    ],
  },
}
```

固定のチャンネルに送る場合は、`channel` と `to` を設定します。そうでない場合、`channel: "last"` は最後に使われた配信ルートを使用します（フォールバック先は WhatsApp です）。

Gmail 実行時により低コストなモデルを使わせたい場合は、マッピングで `model` を設定します（`provider/model` またはエイリアス）。`agents.defaults.models` を強制している場合は、その許可リストにも含めてください。

Gmail hooks 専用のデフォルトモデルと思考レベルを設定するには、設定に `hooks.gmail.model` / `hooks.gmail.thinking` を追加します。

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

注意:

- マッピング内のフック単位の `model`/`thinking` は、これらのデフォルトを引き続き上書きします。
- フォールバック順は `hooks.gmail.model` → `agents.defaults.model.fallbacks` → プライマリです（認証エラー、レート制限、タイムアウト時）。
- `agents.defaults.models` を設定している場合、Gmail 用モデルは許可リストに含まれている必要があります。
- Gmail hook の内容は、デフォルトで外部コンテンツ安全境界でラップされます。
  無効化する場合（危険です）は、`hooks.gmail.allowUnsafeExternalContent: true` を設定してください。

ペイロード処理をさらにカスタマイズしたい場合は、`hooks.mappings` を追加するか、`~/.openclaw/hooks/transforms` 配下に JS / TS の transform モジュールを置いてください（[webhook](/automation/webhook) を参照）。

## ウィザード（推奨）

OpenClaw のヘルパーを使うと、全体をまとめて配線できます（macOS では依存関係を brew 経由でインストールします）。

```bash
openclaw webhooks gmail setup \
  --account openclaw@gmail.com
```

デフォルト:

- 公開プッシュエンドポイントには Tailscale Funnel を使用します。
- `openclaw webhooks gmail run` 用の `hooks.gmail` 設定を書き込みます。
- Gmail hook プリセットを有効化します（`hooks.presets: ["gmail"]`）。

パスに関する注意: `tailscale.mode` が有効な場合、OpenClaw は自動的に `hooks.gmail.serve.path` を `/` に設定し、公開パスは `hooks.gmail.tailscale.path`（デフォルトは `/gmail-pubsub`）に保持します。これは、Tailscale がプロキシ前に set-path プレフィックスを取り除くためです。
バックエンド側でプレフィックス付きパスを受け取る必要がある場合は、`hooks.gmail.tailscale.target`（または `--tailscale-target`）を `http://127.0.0.1:8788/gmail-pubsub` のような完全な URL に設定し、`hooks.gmail.serve.path` と一致させてください。

カスタムエンドポイントを使いたい場合は、`--push-endpoint <url>` または `--tailscale off` を使用します。

プラットフォームに関する注意: macOS では、ウィザードが `gcloud`、`gogcli`、`tailscale` を Homebrew 経由でインストールします。Linux では、事前に手動でインストールしてください。

ゲートウェイの自動起動（推奨）:

- `hooks.enabled=true` かつ `hooks.gmail.account` が設定されている場合、ゲートウェイは起動時に `gog gmail watch serve` を開始し、watch を自動更新します。
- 自動起動を無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定します（自分でデーモンを実行する場合に便利です）。
- 手動デーモンと同時に実行しないでください。`listen tcp 127.0.0.1:8788: bind: address already in use` が発生します。

手動デーモン（`gog gmail watch serve` を起動し、自動更新も行う）:

```bash
openclaw webhooks gmail run
```

## 初回セットアップ

1. `gog` が使用する OAuth クライアントを**所有している GCP プロジェクト**を選択します。

```bash
gcloud auth login
gcloud config set project <project-id>
```

注意: Gmail watch では、Pub/Sub トピックが OAuth クライアントと同じプロジェクト内に存在する必要があります。

2. API を有効化します。

```bash
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

3. トピックを作成します。

```bash
gcloud pubsub topics create gog-gmail-watch
```

4. Gmail プッシュに publish 権限を付与します。

```bash
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

## watch を開始する

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

出力に含まれる `history_id` は保存しておいてください（デバッグ時に使います）。

## プッシュハンドラーを実行する

ローカルでの例（共有トークン認証）:

```bash
gog gmail watch serve \
  --account openclaw@gmail.com \
  --bind 127.0.0.1 \
  --port 8788 \
  --path /gmail-pubsub \
  --token <shared> \
  --hook-url http://127.0.0.1:18789/hooks/gmail \
  --hook-token OPENCLAW_HOOK_TOKEN \
  --include-body \
  --max-bytes 20000
```

注意:

- `--token` はプッシュエンドポイントを保護します（`x-gog-token` または `?token=`）。
- `--hook-url` は OpenClaw の `/hooks/gmail` を指します（マッピング済み。分離実行と main への要約を行います）。
- `--include-body` と `--max-bytes` は、OpenClaw に送られる本文スニペットを制御します。

推奨: `openclaw webhooks gmail run` は同じフローをラップし、watch も自動更新します。

## ハンドラーを公開する（上級者向け、サポート対象外）

Tailscale 以外のトンネルが必要な場合は、手動で配線し、プッシュサブスクリプションに公開 URL を設定してください（サポート対象外で、ガードレールもありません）。

```bash
cloudflared tunnel --url http://127.0.0.1:8788 --no-autoupdate
```

生成された URL をプッシュエンドポイントとして使用します。

```bash
gcloud pubsub subscriptions create gog-gmail-watch-push \
  --topic gog-gmail-watch \
  --push-endpoint "https://<public-url>/gmail-pubsub?token=<shared>"
```

本番環境では、安定した HTTPS エンドポイントを使用し、Pub/Sub OIDC JWT を設定してから次を実行します。

```bash
gog gmail watch serve --verify-oidc --oidc-email <svc@...>
```

## テスト

監視対象の受信トレイにメッセージを送信します。

```bash
gog gmail send \
  --account openclaw@gmail.com \
  --to openclaw@gmail.com \
  --subject "watch test" \
  --body "ping"
```

watch の状態と履歴を確認します。

```bash
gog gmail watch status --account openclaw@gmail.com
gog gmail history --account openclaw@gmail.com --since <historyId>
```

## トラブルシューティング

- `Invalid topicName`: プロジェクトが一致していません（トピックが OAuth クライアントのプロジェクト内にありません）。
- `User not authorized`: トピックに `roles/pubsub.publisher` が付与されていません。
- メッセージが空: Gmail プッシュが提供するのは `historyId` のみです。`gog gmail history` で取得してください。

## クリーンアップ

```bash
gog gmail watch stop --account openclaw@gmail.com
gcloud pubsub subscriptions delete gog-gmail-watch-push
gcloud pubsub topics delete gog-gmail-watch
```
