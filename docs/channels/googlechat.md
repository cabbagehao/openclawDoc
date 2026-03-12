---
summary: "Google Chat アプリのサポート状況、機能、設定"
read_when:
  - Google Chat チャンネル機能を扱う場合
title: "Google Chat"
seoTitle: "OpenClawのGoogle Chatボット連携の設定方法と運用ガイド"
description: "Google Chat アプリを OpenClaw に接続する設定ガイドです。Webhook ベースの構成、DM とスペースの対応範囲、セットアップ手順を確認できます。"
x-i18n:
  source_hash: "63af1b6326be96cc47be45e90bafefe3465195c2dedff4ed1c19bf07bd2f8f80"
---
ステータス: Google Chat API の webhook 経由で DM とスペースに対応しています (HTTP のみ)。

## Quick setup (beginner)

1. Google Cloud プロジェクトを作成し、**Google Chat API** を有効にします。
   - [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials) を開きます。
   - API がまだ有効でなければ有効化します。
2. **Service Account** を作成します。
   - **Create Credentials** > **Service Account** を選択します。
   - 任意の名前を付けます (例: `openclaw-chat`)。
   - 権限は空欄のままにして **Continue** を押します。
   - アクセスを持つ principal も空欄のままにして **Done** を押します。
3. **JSON Key** を作成してダウンロードします。
   - Service Account の一覧から、いま作成したアカウントを開きます。
   - **Keys** タブを開きます。
   - **Add Key** > **Create new key** を選びます。
   - **JSON** を選択して **Create** を押します。
4. ダウンロードした JSON ファイルをゲートウェイホストへ保存します (例: `~/.openclaw/googlechat-service-account.json`)。
5. [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) で Google Chat アプリを作成します。
   - **Application info** を入力します。
     - **App name**: 例 `OpenClaw`
     - **Avatar URL**: 例 `https://openclaw.ai/logo.png`
     - **Description**: 例 `Personal AI Assistant`
   - **Interactive features** を有効にします。
   - **Functionality** で **Join spaces and group conversations** を有効にします。
   - **Connection settings** で **HTTP endpoint URL** を選択します。
   - **Triggers** で **Use a common HTTP endpoint URL for all triggers** を選び、ゲートウェイの公開 URL に `/googlechat` を付けたものを指定します。
     - _Tip: `openclaw status` を実行すると、ゲートウェイの公開 URL を確認できます。_
   - **Visibility** で **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;** を有効にします。
   - テキストボックスへ利用者のメールアドレス (例: `user@example.com`) を入力します。
   - 画面下部の **Save** を押します。
6. **App status** を有効にします。
   - 保存後に **ページを再読み込み** します。
   - **App status** セクションを探します。通常は保存後、画面上部または下部付近に表示されます。
   - ステータスを **Live - available to users** に変更します。
   - もう一度 **Save** を押します。
7. Service Account のパスと webhook audience を使って OpenClaw を設定します。
   - 環境変数: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - または設定: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`
8. webhook audience の type と value を設定します。Chat アプリ側の設定と一致させてください。
9. ゲートウェイを起動します。Google Chat は webhook パスに対して POST を送信します。

## Add to Google Chat

ゲートウェイが起動しており、利用者のメールアドレスが visibility list に追加されていれば、次の手順で使い始められます。

1. [Google Chat](https://chat.google.com/) を開きます。
2. **Direct Messages** の横にある **+** アイコンを押します。
3. 通常ユーザーを追加する検索欄に、Google Cloud Console で設定した **App name** を入力します。
   - **Note**: このボットは非公開アプリのため、"Marketplace" の一覧には表示されません。名前で検索する必要があります。
4. 検索結果からボットを選択します。
5. **Add** または **Chat** を押して 1 対 1 の会話を開始します。
6. `"Hello"` を送ってアシスタントを起動します。

## Public URL (Webhook-only)

Google Chat の webhook には公開 HTTPS エンドポイントが必要です。セキュリティのため、**外部へ公開するのは `/googlechat` パスだけ** にしてください。OpenClaw のダッシュボードや、その他の機密性の高いエンドポイントはプライベートネットワーク内にとどめておくべきです。

### Option A: Tailscale Funnel (Recommended)

プライベートダッシュボードには Tailscale Serve を使い、公開する webhook パスには Funnel を使います。これにより、`/` は非公開のままにしつつ、`/googlechat` だけを外部公開できます。

1. **ゲートウェイがどのアドレスにバインドされているか確認します。**

   ```bash
   ss -tlnp | grep 18789
   ```

   `127.0.0.1`、`0.0.0.0`、または `100.x.x.x` のような Tailscale IP など、表示された IP アドレスを控えます。

2. **ダッシュボードを tailnet 内だけに公開します (port 8443)。**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **webhook パスだけを公開します。**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **ノードに Funnel アクセスを許可します。**
   必要に応じて、出力に表示される認可 URL を開き、tailnet policy 上でそのノードに Funnel を許可してください。

5. **設定を確認します。**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

公開される webhook URL は次の形になります。
`https://<node-name>.<tailnet>.ts.net/googlechat`

プライベートダッシュボードは tailnet 内のままです。
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat アプリの設定には、`:8443` を含まない公開 URL を使ってください。

> Note: この設定は再起動後も維持されます。削除したい場合は `tailscale funnel reset` と `tailscale serve reset` を実行してください。

### Option B: Reverse Proxy (Caddy)

Caddy などの reverse proxy を使う場合は、該当パスだけを proxy してください。

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

この構成では、`your-domain.com/` へのリクエストは無視されるか 404 を返し、`your-domain.com/googlechat` だけが安全に OpenClaw へルーティングされます。

### Option C: Cloudflare Tunnel

tunnel の ingress rules を、webhook パスだけに向けるよう設定します。

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## How it works

1. Google Chat が webhook POST をゲートウェイへ送信します。各リクエストには `Authorization: Bearer <token>` ヘッダーが含まれます。
   - OpenClaw は、このヘッダーがある場合、webhook 本文を最後まで読んだり解析したりする前に bearer 認証を検証します。
   - 本文に `authorizationEventObject.systemIdToken` を持つ Google Workspace Add-on リクエストも、より厳格な事前認証本文バジェットを使ってサポートされます。
2. OpenClaw は設定された `audienceType` と `audience` に対してトークンを検証します。
   - `audienceType: "app-url"` の場合、audience は HTTPS の webhook URL です。
   - `audienceType: "project-number"` の場合、audience は Cloud project number です。
3. メッセージは space 単位でルーティングされます。
   - DM ではセッションキー `agent:<agentId>:googlechat:dm:<spaceId>` を使います。
   - Space ではセッションキー `agent:<agentId>:googlechat:group:<spaceId>` を使います。
4. DM アクセスはデフォルトでペアリングです。未知の送信者にはペアリングコードが返るため、次のコマンドで承認します。
   - `openclaw pairing approve googlechat <code>`
5. Group space では、デフォルトで @mention が必要です。アプリのユーザー名がないとメンション検出できない場合は `botUser` を設定します。

## Targets

配信先や allowlist では、次の識別子を使います。

- Direct message: `users/<userId>` (推奨)
- 生のメールアドレス `name@example.com` は変更可能であり、`channels.googlechat.dangerouslyAllowNameMatching: true` を設定した場合にだけ、DM allowlist の直接一致へ使われます。
- 非推奨: `users/<email>` はメールアドレスの allowlist ではなく、user id として扱われます。
- Space: `spaces/<spaceId>`

## Config highlights

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

補足:

- Service Account の認証情報は `serviceAccount` に JSON 文字列としてインライン指定することもできます。
- `serviceAccountRef` も使えます (env/file SecretRef)。`channels.googlechat.accounts.<id>.serviceAccountRef` のように、アカウント単位でも指定できます。
- `webhookPath` を設定しない場合、既定値は `/googlechat` です。
- `dangerouslyAllowNameMatching` は、変更可能なメール principal による allowlist 一致を再度有効化します。緊急互換モード向けの設定です。
- `actions.reactions` を有効にすると、リアクションは `reactions` ツールおよび `channels action` から利用できます。
- `typingIndicator` では `none`、`message` (デフォルト)、`reaction` を使えます。`reaction` には user OAuth が必要です。
- 添付ファイルは Chat API 経由でダウンロードされ、メディアパイプラインへ保存されます。サイズ上限は `mediaMaxMb` です。

SecretRef の詳細は [Secrets Management](/gateway/secrets) を参照してください。

## Troubleshooting

### 405 Method Not Allowed

Google Cloud Logs Explorer に次のようなエラーが出る場合があります。

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

これは webhook handler が登録されていないことを意味します。代表的な原因は次のとおりです。

1. **Channel not configured**: 設定に `channels.googlechat` セクションがありません。次のコマンドで確認します。

   ```bash
   openclaw config get channels.googlechat
   ```

   `Config path not found` が返る場合は、設定を追加してください ([Config highlights](#config-highlights) を参照)。

2. **Plugin not enabled**: plugin の状態を確認します。

   ```bash
   openclaw plugins list | grep googlechat
   ```

   `disabled` と表示される場合は、設定に `plugins.entries.googlechat.enabled: true` を追加してください。

3. **Gateway not restarted**: 設定追加後にゲートウェイが再起動されていません。次を実行してください。

   ```bash
   openclaw gateway restart
   ```

チャンネルが動作中かどうかは次のコマンドで確認できます。

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Other issues

- `openclaw channels status --probe` を使って、認証エラーや audience 設定不足を確認してください。
- メッセージが届かない場合は、Chat app 側の webhook URL と event subscriptions を確認してください。
- メンション制御のために返信が止まっている場合は、`botUser` にアプリの user resource name を設定し、`requireMention` も確認してください。
- テストメッセージを送りながら `openclaw logs --follow` を実行すると、リクエストがゲートウェイへ届いているか確認できます。

関連ドキュメント:

- [Gateway configuration](/gateway/configuration)
- [Security](/gateway/security)
- [Reactions](/tools/reactions)
