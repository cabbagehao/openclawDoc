---
summary: "LINE Messaging APIプラグインのセットアップ、設定、使用方法"
read_when:
  - OpenClawをLINEに接続したい場合
  - LINEのwebhookと認証情報のセットアップが必要な場合
  - LINE固有のメッセージオプションを使用したい場合
title: LINE
x-i18n:
  source_path: "channels/line.md"
  source_hash: "46badab228c37f9c4424855736d494ec03d2ce8d7caaf558f8aca158cfbbee3b"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T06:39:10.601Z"
---

# LINE (プラグイン)

LINE は LINE Messaging API を介して OpenClaw に接続します。このプラグインはゲートウェイ上で webhook レシーバーとして動作し、認証にはチャネルアクセストークンとチャネルシークレットを使用します。

ステータス: プラグインによりサポート。ダイレクトメッセージ、グループチャット、メディア、位置情報、Flex メッセージ、テンプレートメッセージ、クイックリプライがサポートされています。リアクションとスレッドはサポートされていません。

## プラグインが必要

LINE プラグインをインストールします:

```bash
openclaw plugins install @openclaw/line
```

ローカルチェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./extensions/line
```

## セットアップ

1. LINE Developers アカウントを作成し、コンソールを開きます:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. プロバイダーを作成 (または選択) し、**Messaging API** チャネルを追加します。
3. チャネル設定から**チャネルアクセストークン**と**チャネルシークレット**をコピーします。
4. Messaging API 設定で **Webhook を利用する** を有効にします。
5. webhook URL をゲートウェイのエンドポイントに設定します (HTTPS が必要):

```
https://gateway-host/line/webhook
```

ゲートウェイは LINE の webhook 検証 (GET) と受信イベント (POST) に応答します。
カスタムパスが必要な場合は、`channels.line.webhookPath` または `channels.line.accounts.<id>.webhookPath` を設定し、それに応じて URL を更新してください。

セキュリティに関する注意:

- LINE の署名検証はリクエストボディに依存します (生ボディに対する HMAC)。そのため、OpenClaw は検証前に厳格な事前認証ボディ制限とタイムアウトを適用します。

## 設定

最小限の設定:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

環境変数 (デフォルトアカウントのみ):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

トークン/シークレットファイル:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

複数アカウント:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## アクセス制御

ダイレクトメッセージはデフォルトでペアリングになります。未知の送信者はペアリングコードを受け取り、承認されるまでメッセージは無視されます。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

許可リストとポリシー:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM 用の許可された LINE ユーザー ID
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: グループ用の許可された LINE ユーザー ID
- グループごとのオーバーライド: `channels.line.groups.<groupId>.allowFrom`
- ランタイムに関する注意: `channels.line` セクションが完全に欠落している場合、ランタイムはグループチェックのために `groupPolicy="allowlist"` にフォールバックします (`channels.defaults.groupPolicy` が設定されている場合でも)。

LINE ID は大文字小文字を区別します。有効な ID は次のようになります:

- ユーザー: `U` + 32 桁の 16 進数
- グループ: `C` + 32 桁の 16 進数
- ルーム: `R` + 32 桁の 16 進数

## メッセージの動作

- テキストは 5000 文字で分割されます。
- Markdown フォーマットは削除されます。コードブロックとテーブルは可能な場合 Flex カードに変換されます。
- ストリーミングレスポンスはバッファリングされます。エージェントが作業している間、LINE 側にはローディングアニメーションが表示され、完了後にフルチャックを受信します。
- メディアダウンロードは `channels.line.mediaMaxMb` (デフォルト 10) で制限されます。

## チャネルデータ (リッチメッセージ)

`channelData.line` を使用して、クイックリプライ、位置情報、Flex カード、またはテンプレートメッセージを送信します。

```json5
{
  text: "どうぞ",
  channelData: {
    line: {
      quickReplies: ["ステータス", "ヘルプ"],
      location: {
        title: "オフィス",
        address: "東京都千代田区丸の内 1-2-3",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "ステータスカード",
        contents: {
          /* Flex ペイロード */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "続行しますか?",
        confirmLabel: "はい",
        confirmData: "yes",
        cancelLabel: "いいえ",
        cancelData: "no",
      },
    },
  },
}
```

LINE プラグインには、Flex メッセージプリセット用の `/card` コマンドも付属しています:

```
/card info "ようこそ" "ご参加ありがとうございます!"
```

## トラブルシューティング

- **Webhook 検証が失敗する:** webhook URL が HTTPS であり、`channelSecret` が LINE コンソールと一致していることを確認してください。
- **受信イベントがない:** webhook パスが `channels.line.webhookPath` と一致し、ゲートウェイが LINE から到達可能であることを確認してください。
- **メディアダウンロードエラー:** メディアがデフォルト制限を超える場合は、`channels.line.mediaMaxMb` を増やしてください。
