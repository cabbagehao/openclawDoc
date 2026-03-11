---
summary: "Zalo ボットのサポートステータス、機能、および構成"
read_when:
  - Zalo 連携や webhook の設定を行う場合
title: "Zalo"
x-i18n:
  source_hash: "5c787e2a8c1c335df02a6676482a1fedfb79728af4cc54e4c8097221a6abca6e"
---

# Zalo (ボット API)

ステータス: 実験的。DM がサポートされており、グループ処理は明示的なポリシー制御によって利用可能です。

## プラグインが必要

Zalo はプラグインとして提供されており、コアインストールには同梱されていません。

* CLI 経由でインストール: `openclaw plugins install @openclaw/zalo`
* または、オンボーディング中に **Zalo** を選択し、インストールプロンプトに従ってください。
* 詳細: [プラグイン](/tools/plugin)

## クイックセットアップ (初心者向け)

1. Zalo プラグインをインストールします:
   * ソースチェックアウトから: `openclaw plugins install ./extensions/zalo`
   * npm から (公開されている場合): `openclaw plugins install @openclaw/zalo`
   * または、オンボーディングで **Zalo** を選択。
2. トークンを設定します:
   * 環境変数: `ZALO_BOT_TOKEN=...`
   * 構成ファイル: `channels.zalo.botToken: "..."`。
3. ゲートウェイを再起動します (またはオンボーディングを完了させます)。
4. DM アクセスはデフォルトでペアリングモードです。最初の連絡時にペアリングコードを承認してください。

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

## Zalo チャネルの概要

Zalo はベトナムで広く使われているメッセージングアプリです。そのボット API を使用することで、ゲートウェイは 1 対 1 の会話用ボットを運用できます。
確定的なルーティングが必要なカスタマーサポートや通知の用途に適しています。

* ゲートウェイが所有する Zalo ボット API チャネルです。
* 確定的なルーティング: 返信は常に Zalo に戻ります。モデルがチャネルを選択することはありません。
* DM はエージェントのメインセッションを共有します。
* グループはポリシー制御 (`groupPolicy` + `groupAllowFrom`) でサポートされ、デフォルトは安全のため許可リスト方式（フェールクローズ）になっています。

## セットアップ手順

### 1) ボットトークンの作成 (Zalo Bot Platform)

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) にアクセスしてサインインします。
2. 新しいボットを作成し、設定を行います。
3. ボットトークン (形式: `12345689:abc-xyz`) をコピーします。

### 2) トークンの構成 (環境変数または構成ファイル)

構成例:

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

環境変数の場合: `ZALO_BOT_TOKEN=...` (デフォルトアカウントにのみ適用されます)。

マルチアカウントのサポート: `channels.zalo.accounts` を使用して、アカウントごとにトークンとオプションの `name` を指定できます。

3. ゲートウェイを再起動します。トークンが解決されると Zalo チャネルが開始されます。
4. ボットへ最初にメッセージを送信した際に表示されるペアリングコードを承認してください。

## 仕組みと動作

* 受信メッセージは、メディアプレースホルダーと共に共通のチャネル形式に正規化されます。
* 返信は常に同じ Zalo チャットに送信されます。
* デフォルトはロングポーリング方式です。`channels.zalo.webhookUrl` を設定することで webhook モードも利用可能です。

## 制限事項

* 送信テキストは Zalo API の制限により 2000 文字ごとに分割されます。
* メディアの送受信サイズは `channels.zalo.mediaMaxMb` (デフォルト 5MB) で制限されます。
* ストリーミングは、2000 文字制限のため有用性が低く、デフォルトでブロックされています。

## アクセス制御 (DM)

### DM アクセス

* デフォルト: `channels.zalo.dmPolicy = "pairing"`。未知の送信者にはペアリングコードが送信され、承認されるまでメッセージは無視されます (コードは 1 時間で期限切れになります)。
* 承認方法:
  * `openclaw pairing list zalo`
  * `openclaw pairing approve zalo <CODE>`
* 詳細については [ペアリング](/channels/pairing) を参照してください。
* `channels.zalo.allowFrom` は数値のユーザー ID を受け入れます（ユーザー名の検索は利用できません）。

## アクセス制御 (グループ)

* `channels.zalo.groupPolicy` でグループのインバウンド処理を制御します: `open | allowlist | disabled`。
* デフォルトは安全のため `allowlist` (許可リスト) です。
* `channels.zalo.groupAllowFrom` で、グループ内でボットをトリガーできる送信者 ID を制限します。
* `groupAllowFrom` が未設定の場合、送信者チェックには `allowFrom` が使用されます。
* `groupPolicy: "disabled"` はすべてのグループメッセージをブロックします。
* `groupPolicy: "open"` は（メンション制約を満たせば）すべてのグループメンバーを許可します。
* 注意: `channels.zalo` 構成が完全に欠落している場合でも、安全のため `groupPolicy="allowlist"` が適用されます。

## ロングポーリング vs webhook

* デフォルト: ロングポーリング (公開 URL は不要)。
* webhook モード: `channels.zalo.webhookUrl` と `channels.zalo.webhookSecret` を設定します。
  * シークレットは 8〜256 文字である必要があります。
  * webhook URL は HTTPS である必要があります。
  * Zalo は検証用に `X-Bot-Api-Secret-Token` ヘッダーを付けてイベントを送信します。
  * ゲートウェイは `channels.zalo.webhookPath` (デフォルトは URL のパス部分) でリクエストを処理します。
  * リクエストの `Content-Type` は `application/json` である必要があります。
  * 重複したイベント (`event_name + message_id`) は、短期間の再送ウィンドウ内では無視されます。
  * 急激なトラフィック増加にはパス/送信元ごとにレート制限が適用され、HTTP 429 を返す場合があります。

**注意:** Zalo API の仕様上、ロングポーリング（getUpdates）と webhook は排他的です。

## サポートされているメッセージ形式

* **テキスト**: 2000 文字の分割送信を含め完全サポート。
* **画像**: 受信画像のダウンロードおよび処理、`sendPhoto` による送信をサポート。
* **ステッカー**: ログには記録されますが、エージェントによる応答は行われません。
* **未サポートの形式**: ログには記録されます（例: 保護されたユーザーからのメッセージなど）。

## 機能一覧

| 機能         | ステータス                          |
| :--------- | :----------------------------- |
| ダイレクトメッセージ | ✅ サポート済み                       |
| グループ       | ⚠️ ポリシー制御によりサポート (デフォルトは許可リスト) |
| メディア (画像)  | ✅ サポート済み                       |
| リアクション     | ❌ 未サポート                        |
| スレッド       | ❌ 未サポート                        |
| 投票         | ❌ 未サポート                        |
| ネイティブコマンド  | ❌ 未サポート                        |
| ストリーミング    | ⚠️ ブロック (2000 文字制限のため)         |

## 配信ターゲット (CLI/Cron)

* ターゲットとしてチャット ID を使用します。
* 例: `openclaw message send --channel zalo --target 123456789 --message "こんにちは"`。

## トラブルシューティング

**ボットが応答しない:**

* トークンが有効か確認してください: `openclaw channels status --probe`
* 送信者が承認されているか（ペアリングまたは allowFrom）確認してください。
* ゲートウェイのログを確認してください: `openclaw logs --follow`

**webhook がイベントを受信しない:**

* webhook URL が HTTPS を使用しているか確認してください。
* シークレットトークンが 8〜256 文字か確認してください。
* ゲートウェイの HTTP エンドポイントが設定されたパスで到達可能か確認してください。
* ロングポーリングが動作していないか確認してください（排他的な関係です）。

## 構成リファレンス (Zalo)

完全な構成: [構成](/gateway/configuration)

プロバイダーオプション:

* `channels.zalo.enabled`: チャネルの起動を有効/無効にします。
* `channels.zalo.botToken`: Zalo Bot Platform から取得したボットトークン。
* `channels.zalo.tokenFile`: ファイルからトークンを読み取ります。
* `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (デフォルト: pairing)。
* `channels.zalo.allowFrom`: DM 許可リスト (数値ユーザー ID)。`open` には `"*"` が必要です。
* `channels.zalo.groupPolicy`: `open | allowlist | disabled` (デフォルト: allowlist)。
* `channels.zalo.groupAllowFrom`: グループ送信者の許可リスト (ユーザー ID)。未設定時は `allowFrom` にフォールバックします。
* `channels.zalo.mediaMaxMb`: 送受信メディアのサイズ上限 (MB, デフォルト 5)。
* `channels.zalo.webhookUrl`: webhook モードを有効化 (HTTPS 必須)。
* `channels.zalo.webhookSecret`: webhook シークレット (8〜256 文字)。
* `channels.zalo.webhookPath`: ゲートウェイ上の webhook 受付パス。
* `channels.zalo.proxy`: API リクエストに使用するプロキシ URL。

マルチアカウントオプション:

* `channels.zalo.accounts.<id>.botToken`: アカウントごとのトークン。
* `channels.zalo.accounts.<id>.name`: 表示名。
* `channels.zalo.accounts.<id>.enabled`: アカウントの有効/無効。
* `channels.zalo.accounts.<id>.dmPolicy`: アカウントごとの DM ポリシー。
* `channels.zalo.accounts.<id>.allowFrom`: アカウントごとの許可リスト。
* `channels.zalo.accounts.<id>.groupPolicy`: アカウントごとのグループポリシー。
* `channels.zalo.accounts.<id>.webhookUrl`: アカウントごとの webhook URL。
* `channels.zalo.accounts.<id>.webhookSecret`: アカウントごとの webhook シークレット。
* `channels.zalo.accounts.<id>.webhookPath`: アカウントごとの webhook 受付パス。
* `channels.zalo.accounts.<id>.proxy`: アカウントごとのプロキシ URL。
