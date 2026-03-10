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

LINEはLINE Messaging APIを介してOpenClawに接続します。このプラグインはGateway上でwebhookレシーバーとして動作し、認証にはチャンネルアクセストークンとチャンネルシークレットを使用します。

ステータス: プラグインによりサポート。ダイレクトメッセージ、グループチャット、メディア、位置情報、Flexメッセージ、テンプレートメッセージ、クイックリプライがサポートされています。リアクションとスレッドはサポートされていません。

## プラグインが必要

LINEプラグインをインストールします:

```bash
openclaw plugins install @openclaw/line
```

ローカルチェックアウト(gitリポジトリから実行する場合):

```bash
openclaw plugins install ./extensions/line
```

## セットアップ

1. LINE Developersアカウントを作成し、コンソールを開きます:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. プロバイダーを作成(または選択)し、**Messaging API**チャンネルを追加します。
3. チャンネル設定から**チャンネルアクセストークン**と**チャンネルシークレット**をコピーします。
4. Messaging API設定で**Webhookを利用する**を有効にします。
5. webhook URLをGatewayエンドポイントに設定します(HTTPSが必要):

```
https://gateway-host/line/webhook
```

GatewayはLINEのwebhook検証(GET)と受信イベント(POST)に応答します。
カスタムパスが必要な場合は、`channels.line.webhookPath`または`channels.line.accounts.<id>.webhookPath`を設定し、それに応じてURLを更新してください。

セキュリティに関する注意:

- LINE署名検証はボディに依存します(生のボディに対するHMAC)。そのため、OpenClawは検証前に厳格な事前認証ボディ制限とタイムアウトを適用します。

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

環境変数(デフォルトアカウントのみ):

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
- `channels.line.allowFrom`: DM用の許可されたLINEユーザーID
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: グループ用の許可されたLINEユーザーID
- グループごとのオーバーライド: `channels.line.groups.<groupId>.allowFrom`
- ランタイムに関する注意: `channels.line`が完全に欠落している場合、ランタイムはグループチェックのために`groupPolicy="allowlist"`にフォールバックします(`channels.defaults.groupPolicy`が設定されている場合でも)。

LINE IDは大文字小文字を区別します。有効なIDは次のようになります:

- ユーザー: `U` + 32桁の16進数
- グループ: `C` + 32桁の16進数
- ルーム: `R` + 32桁の16進数

## メッセージの動作

- テキストは5000文字で分割されます。
- Markdownフォーマットは削除されます。コードブロックとテーブルは可能な場合Flexカードに変換されます。
- ストリーミングレスポンスはバッファリングされます。エージェントが作業している間、LINEはローディングアニメーションとともに完全なチャンクを受信します。
- メディアダウンロードは`channels.line.mediaMaxMb`(デフォルト10)で制限されます。

## チャンネルデータ(リッチメッセージ)

`channelData.line`を使用して、クイックリプライ、位置情報、Flexカード、またはテンプレートメッセージを送信します。

```json5
{
  text: "どうぞ",
  channelData: {
    line: {
      quickReplies: ["ステータス", "ヘルプ"],
      location: {
        title: "オフィス",
        address: "東京都千代田区丸の内1-2-3",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "ステータスカード",
        contents: {
          /* Flexペイロード */
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

LINEプラグインには、Flexメッセージプリセット用の`/card`コマンドも付属しています:

```
/card info "ようこそ" "ご参加ありがとうございます!"
```

## トラブルシューティング

- **Webhook検証が失敗する:** webhook URLがHTTPSであり、`channelSecret`がLINEコンソールと一致していることを確認してください。
- **受信イベントがない:** webhookパスが`channels.line.webhookPath`と一致し、GatewayがLINEから到達可能であることを確認してください。
- **メディアダウンロードエラー:** メディアがデフォルト制限を超える場合は、`channels.line.mediaMaxMb`を増やしてください。
