---
summary: "Nextcloud Talk のサポート ステータス、機能、および構成"
read_when:
  - Nextcloud Talk チャネル機能の開発中
title: "ネクストクラウドトーク"
x-i18n:
  source_hash: "2769144221e41391fc903a8a9289165fb9ffcc795dd54615e5009f1d6f48df3f"
---

# Nextcloudトーク（プラグイン）

ステータス: プラグイン (Webhook ボット) 経由でサポートされています。ダイレクト メッセージ、ルーム、リアクション、マークダウン メッセージがサポートされています。

## プラグインが必要です

Nextcloud Talk はプラグインとして出荷され、コア インストールにはバンドルされていません。

CLI (npm レジストリ) 経由でインストールします。

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

ローカル チェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./extensions/nextcloud-talk
```

構成/オンボーディング中に Nextcloud Talk を選択し、git チェックアウトが検出された場合、
OpenClaw はローカル インストール パスを自動的に提供します。

詳細: [プラグイン](/tools/plugin)

## クイックセットアップ (初心者向け)

1. Nextcloud Talk プラグインをインストールします。
2. Nextcloud サーバーでボットを作成します。

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. ターゲットルーム設定でボットを有効にします。
4. OpenClaw を構成します。
   - 構成: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - または環境: `NEXTCLOUD_TALK_BOT_SECRET` (デフォルトアカウントのみ)
5. ゲートウェイを再起動します (またはオンボーディングを終了します)。

最小限の構成:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## 注意事項

- ボットは DM を開始できません。ユーザーは最初にボットにメッセージを送信する必要があります。
- Webhook URL はゲートウェイから到達可能である必要があります。プロキシの背後にある場合は、`webhookPublicUrl` を設定します。
- メディアのアップロードはボット API ではサポートされていません。メディアは URL として送信されます。
- Webhook ペイロードは DM とルームを区別しません。 `apiUser` + `apiPassword` を設定して、ルームタイプの検索を有効にします (それ以外の場合、DM はルームとして扱われます)。

## アクセス制御 (DM)- デフォルト: `channels.nextcloud-talk.dmPolicy = "pairing"`。不明な送信者がペアリング コードを取得します

- 承認方法:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- パブリック DM: `channels.nextcloud-talk.dmPolicy="open"` と `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` は Nextcloud ユーザー ID のみに一致します。表示名は無視されます。

## 部屋 (グループ)

- デフォルト: `channels.nextcloud-talk.groupPolicy = "allowlist"` (メンションゲート)。
- `channels.nextcloud-talk.rooms` を持つルームを許可リストに登録します:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- ルームを許可しない場合は、許可リストを空のままにするか、`channels.nextcloud-talk.groupPolicy="disabled"` を設定します。

## 機能

| 特集                 | ステータス             |
| -------------------- | ---------------------- |
| ダイレクトメッセージ | サポートされている     |
| 客室                 | サポートされている     |
| スレッド             | サポートされていません |
| メディア             | URL のみ               |
| 反応                 | サポートされている     |
| ネイティブコマンド   | サポートされていません |

## 構成リファレンス (Nextcloud Talk)

完全な構成: [構成](/gateway/configuration)

プロバイダーのオプション:- `channels.nextcloud-talk.enabled`: チャネルの起動を有効/無効にします。

- `channels.nextcloud-talk.baseUrl`: Nextcloud インスタンスの URL。
- `channels.nextcloud-talk.botSecret`: ボットの共有秘密。
- `channels.nextcloud-talk.botSecretFile`: 秘密ファイルのパス。
- `channels.nextcloud-talk.apiUser`: ルーム検索 (DM 検出) 用の API ユーザー。
- `channels.nextcloud-talk.apiPassword`: 部屋検索用の API/アプリ パスワード。
- `channels.nextcloud-talk.apiPasswordFile`: API パスワード ファイルのパス。
- `channels.nextcloud-talk.webhookPort`: Webhook リスナー ポート (デフォルト: 8788)。
- `channels.nextcloud-talk.webhookHost`: Webhook ホスト (デフォルト: 0.0.0.0)。
- `channels.nextcloud-talk.webhookPath`: Webhook パス (デフォルト: /nextcloud-talk-webhook)。
- `channels.nextcloud-talk.webhookPublicUrl`: 外部から到達可能な Webhook URL。
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`: DM 許可リスト (ユーザー ID)。 `open` には `"*"` が必要です。
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`: グループ許可リスト (ユーザー ID)。
- `channels.nextcloud-talk.rooms`: 部屋ごとの設定と許可リスト。
- `channels.nextcloud-talk.historyLimit`: グループ履歴制限 (0 で無効)。
- `channels.nextcloud-talk.dmHistoryLimit`: DM 履歴制限 (0 で無効)。
- `channels.nextcloud-talk.dms`: DM ごとのオーバーライド (historyLimit)。
- `channels.nextcloud-talk.textChunkLimit`: 送信テキストのチャンク サイズ (文字数)。
- `channels.nextcloud-talk.chunkMode`: `length` (デフォルト) または `newline` は、長さをチャンクする前に空白行 (段落境界) で分割します。
- `channels.nextcloud-talk.blockStreaming`: このチャネルのブロック ストリーミングを無効にします。
- `channels.nextcloud-talk.blockStreamingCoalesce`: ブロック ストリーミング結合調整。
- `channels.nextcloud-talk.mediaMaxMb`: 受信メディアの上限 (MB)。
