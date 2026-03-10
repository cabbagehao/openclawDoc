---
summary: "Zalo ボットのサポートステータス、機能、および構成"
read_when:
  - Zalo 機能または Webhook の作業
title: "ザロ"
x-i18n:
  source_hash: "5c787e2a8c1c335df02a6676482a1fedfb79728af4cc54e4c8097221a6abca6e"
---

# Zalo (ボット API)

ステータス: 実験中。 DM はサポートされています。グループ処理は、明示的なグループ ポリシー制御で使用できます。

## プラグインが必要です

Zalo はプラグインとして出荷され、コア インストールにはバンドルされていません。

- CLI 経由でインストール: `openclaw plugins install @openclaw/zalo`
- または、オンボーディング中に **Zalo** を選択し、インストール プロンプトを確認します
- 詳細: [プラグイン](/tools/plugin)

## クイックセットアップ (初心者向け)

1. Zalo プラグインをインストールします。
   - ソース チェックアウトから: `openclaw plugins install ./extensions/zalo`
   - npm から (公開されている場合): `openclaw plugins install @openclaw/zalo`
   - または、オンボーディングで **Zalo** を選択し、インストール プロンプトを確認します
2. トークンを設定します。
   - 環境: `ZALO_BOT_TOKEN=...`
   - または構成: `channels.zalo.botToken: "..."`。
3. ゲートウェイを再起動します (またはオンボーディングを終了します)。
4. DM アクセスはデフォルトでペアリングされます。最初の連絡時にペアリング コードを承認します。

最小限の構成:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      botToken: "12345689:abc-xyz",
      dmPolicy: "pairing",
    },
  },
}
```

## それは何ですか

Zalo はベトナムに特化したメッセージング アプリです。そのボット API を使用すると、ゲートウェイは 1 対 1 の会話用にボットを実行できます。
これは、Zalo への確定的なルーティングが必要なサポートや通知に適しています。

- ゲートウェイが所有する Zalo ボット API チャネル。
- 決定的ルーティング: 応答は Zalo に返されます。モデルはチャネルを選択しません。
- DM はエージェントのメイン セッションを共有します。
- グループはポリシー制御 (`groupPolicy` + `groupAllowFrom`) でサポートされており、デフォルトでフェイルクローズされた許可リストの動作が設定されます。

## セットアップ (高速パス)

### 1) ボットトークンを作成します (Zalo ボットプラットフォーム)1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) に移動してサインインします

2. 新しいボットを作成し、その設定を構成します。
3. ボット トークン (形式: `12345689:abc-xyz`) をコピーします。

### 2) トークンを構成します (env または config)

例:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      botToken: "12345689:abc-xyz",
      dmPolicy: "pairing",
    },
  },
}
```

環境オプション: `ZALO_BOT_TOKEN=...` (デフォルトのアカウントでのみ機能します)。

マルチアカウントのサポート: アカウントごとのトークンとオプションの `name` で `channels.zalo.accounts` を使用します。

3. ゲートウェイを再起動します。 Zalo は、トークンが解決されると (env または config) 開始します。
4. DM アクセスのデフォルトはペアリングです。ボットに最初に接続したときにコードを承認します。

## 仕組み (動作)

- 受信メッセージは、メディア プレースホルダーを使用して共有チャネル エンベロープに正規化されます。
- 返信は常に同じ Zalo チャットにルーティングされます。
- デフォルトではロングポーリング。 Webhook モードは `channels.zalo.webhookUrl` で利用可能です。

## 制限

- 送信テキストは 2000 文字に分割されます (Zalo API 制限)。
- メディアのダウンロード/アップロードは `channels.zalo.mediaMaxMb` (デフォルトは 5) によって制限されます。
- ストリーミングは 2000 文字制限のため、デフォルトでブロックされ、ストリーミングの有用性が低くなります。

## アクセス制御 (DM)

### DMアクセス- デフォルト: `channels.zalo.dmPolicy = "pairing"`。不明な送信者がペアリング コードを受信します。メッセージは承認されるまで無視されます (コードは 1 時間後に期限切れになります)

- 承認方法:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- ペアリングはデフォルトのトークン交換です。詳細：[ペアリング](/channels/pairing)
- `channels.zalo.allowFrom` は数値のユーザー ID を受け入れます (ユーザー名検索は利用できません)。

## アクセス制御 (グループ)

- `channels.zalo.groupPolicy` は、グループの受信処理を制御します: `open | allowlist | disabled`。
- デフォルトの動作はフェールクローズです: `allowlist`。
- `channels.zalo.groupAllowFrom` は、グループ内のボットをトリガーできる送信者 ID を制限します。
- `groupAllowFrom` が設定されていない場合、Zalo は送信者チェックのために `allowFrom` に戻ります。
- `groupPolicy: "disabled"` はすべてのグループ メッセージをブロックします。
- `groupPolicy: "open"` は、任意のグループ メンバーを許可します (メンションゲート)。
- ランタイムに関する注意: `channels.zalo` が完全に欠落している場合でも、ランタイムは安全のために `groupPolicy="allowlist"` にフォールバックします。

## ロングポーリングと Webhook の比較- デフォルト: ロングポーリング (パブリック URL は必要ありません)

- Webhook モード: `channels.zalo.webhookUrl` および `channels.zalo.webhookSecret` を設定します。
  - Webhook シークレットは 8 ～ 256 文字である必要があります。
  - Webhook URL は HTTPS を使用する必要があります。
  - Zalo は検証のために `X-Bot-Api-Secret-Token` ヘッダーを付けてイベントを送信します。
  - ゲートウェイ HTTP は、`channels.zalo.webhookPath` で Webhook リクエストを処理します (デフォルトは Webhook URL パス)。
  - リクエストでは `Content-Type: application/json` (または `+json` メディア タイプ) を使用する必要があります。
  - 重複したイベント (`event_name + message_id`) は、短い再生ウィンドウでは無視されます。
  - バースト トラフィックはパス/ソースごとにレート制限されており、HTTP 429 を返す場合があります。

**注意:** Zalo API ドキュメントごとに、getUpdates (ポーリング) と Webhook は相互に排他的です。

## サポートされているメッセージ タイプ

- **テキスト メッセージ**: 2000 文字のチャンクを完全にサポートします。
- **画像メッセージ**: 受信画像をダウンロードして処理します。 `sendPhoto` 経由で画像を送信します。
- **ステッカー**: 記録されていますが、完全には処理されていません (エージェントの応答なし)。
- **サポートされていないタイプ**: ログに記録されます (例: 保護されたユーザーからのメッセージ)。

## 機能|特集 |ステータス |

| --------------- | -------------------------------------------------------- |
|ダイレクトメッセージ | ✅ サポートされている |
|グループ | ⚠️ ポリシー制御でサポート (デフォルトで許可リスト) |
|メディア（画像） | ✅ サポートされている |
|反応 | ❌ サポートされていません |
|スレッド | ❌ サポートされていません |
|世論調査 | ❌ サポートされていません |
|ネイティブコマンド | ❌ サポートされていません |
|ストリーミング | ⚠️ ブロックされました (2000 文字制限) |

## 配信ターゲット (CLI/cron)

- チャット ID をターゲットとして使用します。
- 例: `openclaw message send --channel zalo --target 123456789 --message "hi"`。

## トラブルシューティング

**ボットが応答しません:**

- トークンが有効であることを確認します: `openclaw channels status --probe`
- 送信者が承認されていることを確認します (ペアリングまたはallowFrom)
- ゲートウェイのログを確認します: `openclaw logs --follow`

**Webhook がイベントを受信しません:**

- Webhook URL が HTTPS を使用していることを確認してください
- シークレット トークンが 8 ～ 256 文字であることを確認します。
- ゲートウェイの HTTP エンドポイントが構成されたパス上で到達可能であることを確認します。
- getUpdates ポーリングが実行されていないことを確認します (これらは相互に排他的です)。

## 構成リファレンス (Zalo)完全な構成: [構成](/gateway/configuration)

プロバイダーのオプション:

- `channels.zalo.enabled`: チャネルの起動を有効/無効にします。
- `channels.zalo.botToken`: Zalo ボット プラットフォームからのボット トークン。
- `channels.zalo.tokenFile`: ファイル パスからトークンを読み取ります。
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (デフォルト: ペアリング)。
- `channels.zalo.allowFrom`: DM 許可リスト (ユーザー ID)。 `open` には `"*"` が必要です。ウィザードは数値 ID を要求します。
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (デフォルト: ホワイトリスト)。
- `channels.zalo.groupAllowFrom`: グループ送信者許可リスト (ユーザー ID)。設定を解除すると、`allowFrom` に戻ります。
- `channels.zalo.mediaMaxMb`: 受信/送信メディアの上限 (MB、デフォルトは 5)。
- `channels.zalo.webhookUrl`: Webhook モードを有効にします (HTTPS が必要)。
- `channels.zalo.webhookSecret`: Webhook シークレット (8 ～ 256 文字)。
- `channels.zalo.webhookPath`: ゲートウェイ HTTP サーバー上の Webhook パス。
- `channels.zalo.proxy`: API リクエストのプロキシ URL。

マルチアカウントのオプション:- `channels.zalo.accounts.<id>.botToken`: アカウントごとのトークン。

- `channels.zalo.accounts.<id>.tokenFile`: アカウントごとのトークン ファイル。
- `channels.zalo.accounts.<id>.name`: 表示名。
- `channels.zalo.accounts.<id>.enabled`: アカウントを有効/無効にします。
- `channels.zalo.accounts.<id>.dmPolicy`: アカウントごとの DM ポリシー。
- `channels.zalo.accounts.<id>.allowFrom`: アカウントごとの許可リスト。
- `channels.zalo.accounts.<id>.groupPolicy`: アカウントごとのグループ ポリシー。
- `channels.zalo.accounts.<id>.groupAllowFrom`: アカウント グループごとの送信者許可リスト。
- `channels.zalo.accounts.<id>.webhookUrl`: アカウントごとの Webhook URL。
- `channels.zalo.accounts.<id>.webhookSecret`: アカウントごとの Webhook シークレット。
- `channels.zalo.accounts.<id>.webhookPath`: アカウントごとの Webhook パス。
- `channels.zalo.accounts.<id>.proxy`: アカウントごとのプロキシ URL。
