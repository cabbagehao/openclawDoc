---
summary: "Google Chat アプリのサポート状況、機能、構成"
read_when:
  - Google Chat チャネル機能の開発中
title: "Googleチャット"
x-i18n:
  source_hash: "63af1b6326be96cc47be45e90bafefe3465195c2dedff4ed1c19bf07bd2f8f80"
---

# Google Chat（チャットAPI）

ステータス: Google Chat API Webhook 経由で DM + スペースの準備ができています (HTTP のみ)。

## クイックセットアップ (初心者向け)1. Google Cloud プロジェクトを作成し、**Google Chat API** を有効にします

- [Google Chat API 認証情報](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials) に移動します。
- API がまだ有効になっていない場合は有効にします。

2. **サービス アカウント**を作成します。
   - **資格情報の作成** > **サービス アカウント** を押します。
   - 任意の名前を付けます (例: `openclaw-chat`)。
   - 権限を空白のままにします (**続行**を押します)。
   - アクセス権のあるプリンシパルは空白のままにしておきます (**完了**を押します)。
3. **JSON キー**を作成してダウンロードします。
   - サービス アカウントのリストで、作成したアカウントをクリックします。
   - [**キー**] タブに移動します。
   - [**キーの追加**] > [**新しいキーの作成**] をクリックします。
   - **JSON** を選択し、**作成** を押します。
4. ダウンロードした JSON ファイルをゲートウェイ ホストに保存します (例: `~/.openclaw/googlechat-service-account.json`)。
5. [Google Cloud Console チャット設定](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) で Google Chat アプリを作成します。
   - **アプリケーション情報**を入力します:
     - **アプリ名**: (例: `OpenClaw`)
     - **アバター URL**: (例: `https://openclaw.ai/logo.png`)
     - **説明**: (例: `Personal AI Assistant`)
   - **インタラクティブ機能**を有効にします。
   - **機能**で、**スペースとグループ会話に参加する**をチェックします。
   - **接続設定**で、**HTTP エンドポイント URL** を選択します。
   - **トリガー**で、**すべてのトリガーに共通のHTTPエンドポイントURLを使用する**を選択し、ゲートウェイのパブリックURLに`/googlechat`を続けて設定します。- _ヒント: `openclaw status` を実行して、ゲートウェイのパブリック URL を見つけます。_
   - **[公開設定]** で、**このチャット アプリを \<あなたのドメイン\> の特定のユーザーおよびグループが利用できるようにします** をオンにします。
   - テキスト ボックスに電子メール アドレス (例: `user@example.com`) を入力します。
   - 下部にある [**保存**] をクリックします。
6. **アプリのステータスを有効にする**:
   - 保存後、**ページを更新**してください。
   - **アプリのステータス** セクションを探します (通常は保存後の上部または下部付近)。
   - ステータスを **ライブ - ユーザーが利用可能** に変更します。
   - [**保存**] を再度クリックします。
7. サービス アカウント パス + Webhook オーディエンスを使用して OpenClaw を構成します。
   - 環境: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - または構成: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. Webhook オーディエンスのタイプと値を設定します (チャット アプリの構成と一致します)。
9. ゲートウェイを起動します。 Google Chat は Webhook パスに POST します。

## Google チャットに追加

ゲートウェイが実行され、電子メールが公開リストに追加されたら、次のようにします。1. [Google チャット](https://chat.google.com/) に移動します。2. [**ダイレクトメッセージ**] の横にある **+** (プラス) アイコンをクリックします。3. 検索バー (通常はユーザーを追加する場所) に、Google Cloud Console で構成した **アプリ名** を入力します。

- **注意**: ボットはプライベート アプリであるため、「マーケットプレイス」の参照リストには表示されません。名前で検索する必要があります。

4. 結果からボットを選択します。
5. [**追加**] または [**チャット**] をクリックして 1 対 1 の会話を開始します。6.「Hello」を送信してアシスタントを起動します。

## パブリック URL (Webhook のみ)

Google Chat Webhook にはパブリック HTTPS エンドポイントが必要です。セキュリティのため、**`/googlechat` パス**のみをインターネットに公開してください。 OpenClaw ダッシュボードとその他の機密性の高いエンドポイントをプライベート ネットワーク上に保持します。

### オプション A: テールスケール ファネル (推奨)

プライベート ダッシュボードには Tailscale Serve を使用し、パブリック Webhook パスには Funnel を使用します。これにより、`/` は非公開に保たれ、`/googlechat` のみが公開されます。

1. **ゲートウェイがバインドされているアドレスを確認します。**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP アドレスをメモします (例: `127.0.0.1`、`0.0.0.0`、または `100.x.x.x` のような Tailscale IP)。

2. **ダッシュボードをテールネットのみに公開します (ポート 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Webhook パスのみを公開します:**

   ````bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```4. **ノードにファネルアクセスを許可します:**
   プロンプトが表示されたら、出力に表示されている認可 URL にアクセスして、テールネット ポリシーでこのノードのファネルを有効にします。

   ````

4. **構成を確認します:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

パブリック Webhook URL は次のようになります。
`https://<node-name>.<tailnet>.ts.net/googlechat`

プライベート ダッシュボードはテールネットのみのままです。
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat アプリの設定でパブリック URL (`:8443` なし) を使用します。

> 注: この構成は再起動後も維持されます。後で削除するには、`tailscale funnel reset` および `tailscale serve reset` を実行します。

### オプション B: リバース プロキシ (キャディ)

Caddy のようなリバース プロキシを使用する場合は、特定のパスのみをプロキシします。

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

この構成では、`your-domain.com/` へのリクエストは無視されるか 404 として返されますが、`your-domain.com/googlechat` は OpenClaw に安全にルーティングされます。

### オプション C: Cloudflare トンネル

Webhook パスのみをルーティングするようにトンネルのイングレス ルールを構成します。

- **パス**: `/googlechat` -> `http://localhost:18789/googlechat`
- **デフォルト ルール**: HTTP 404 (見つからない)

## 仕組み1. Google Chat は Webhook POST をゲートウェイに送信します。各リクエストには `Authorization: Bearer <token>` ヘッダーが含まれます

- OpenClaw は、ヘッダーが存在する場合、完全な Webhook 本文を読み取り/解析する前にベアラー認証を検証します。
- 本文に `authorizationEventObject.systemIdToken` を含む Google Workspace アドオン リクエストは、より厳格な事前認証本文バジェットを通じてサポートされます。

2. OpenClaw は、構成された `audienceType` + `audience` に対してトークンを検証します。
   - `audienceType: "app-url"` → オーディエンスは HTTPS Webhook URL です。
   - `audienceType: "project-number"` → 対象者はクラウド プロジェクト番号です。
3. メッセージはスペースによってルーティングされます。
   - DM はセッション キー `agent:<agentId>:googlechat:dm:<spaceId>` を使用します。
   - スペースはセッション キー `agent:<agentId>:googlechat:group:<spaceId>` を使用します。
4. DM アクセスはデフォルトでペアリングされます。不明な送信者がペアリング コードを受信します。承認するには:
   - `openclaw pairing approve googlechat <code>`
5. グループ スペースには、デフォルトで @-ment が必要です。メンション検出にアプリのユーザー名が必要な場合は、`botUser` を使用します。

## ターゲット

配信と許可リストには次の識別子を使用します。

- ダイレクト メッセージ: `users/<userId>` (推奨)。
- 生の電子メール `name@example.com` は変更可能であり、`channels.googlechat.dangerouslyAllowNameMatching: true` の場合の直接許可リストの一致にのみ使用されます。
- 非推奨: `users/<email>` は、電子メールの許可リストではなく、ユーザー ID として扱われます。
- スペース: `spaces/<spaceId>`。

## 構成のハイライト

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

注:- サービス アカウントの資格情報は、`serviceAccount` (JSON 文字列) を使用してインラインで渡すこともできます。

- `serviceAccountRef` もサポートされています (env/file SecretRef)。これには、`channels.googlechat.accounts.<id>.serviceAccountRef` の下のアカウントごとの参照が含まれます。
- `webhookPath` が設定されていない場合、デフォルトの Webhook パスは `/googlechat` です。
- `dangerouslyAllowNameMatching` は、ホワイトリストに対する変更可能な電子メール プリンシパルの一致を再度有効にします (ブレークグラス互換モード)。
- リアクションは、`actions.reactions` が有効な場合、`reactions` ツールおよび `channels action` を介して利用できます。
- `typingIndicator` は、`none`、`message` (デフォルト)、および `reaction` (反応にはユーザー OAuth が必要です) をサポートします。
- 添付ファイルはチャット API を通じてダウンロードされ、メディア パイプラインに保存されます (サイズの上限は `mediaMaxMb`)。

シークレットの参照詳細: [シークレット管理](/gateway/secrets)。

## トラブルシューティング

### 405 メソッドは許可されていません

Google Cloud Log Explorer に次のようなエラーが表示される場合:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

これは、Webhook ハンドラーが登録されていないことを意味します。一般的な原因:

1. **チャネルが構成されていません**: `channels.googlechat` セクションが構成にありません。次の方法で確認します。

   ```bash
   openclaw config get channels.googlechat
   ```

   「構成パスが見つかりません」が返された場合は、構成を追加します ([構成のハイライト](#config-highlights) を参照)。

2. **プラグインが有効になっていません**: プラグインのステータスを確認します:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   「無効」と表示される場合は、構成に `plugins.entries.googlechat.enabled: true` を追加します。3. **ゲートウェイが再起動されていません**: 構成を追加した後、ゲートウェイを再起動します。

   ```bash
   openclaw gateway restart
   ```

チャネルが実行されていることを確認します。

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### その他の問題

- `openclaw channels status --probe` で認証エラーまたはオーディエンス設定の欠落を確認してください。
- メッセージが到着しない場合は、チャット アプリの Webhook URL とイベント サブスクリプションを確認してください。
- ゲートブロックの応答に言及する場合は、`botUser` をアプリのユーザーリソース名に設定し、`requireMention` を確認します。
- テスト メッセージの送信中に `openclaw logs --follow` を使用して、リクエストがゲートウェイに到達するかどうかを確認します。

関連ドキュメント:

- [ゲートウェイ構成](/gateway/configuration)
- [セキュリティ](/gateway/security)
- [反応](/tools/reactions)
