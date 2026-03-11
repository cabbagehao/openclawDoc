---
summary: "Nextcloud Talk のサポートステータス、機能、および構成"
read_when:
  - Nextcloud Talk チャネル機能の開発
title: "Nextcloud Talk"
x-i18n:
  source_hash: "2769144221e41391fc903a8a9289165fb9ffcc795dd54615e5009f1d6f48df3f"
---

# Nextcloud Talk (プラグイン)

ステータス: プラグイン (webhook ボット) 経由でサポートされています。ダイレクトメッセージ、ルーム、リアクション、および Markdown メッセージがサポートされています。

## プラグインが必要

Nextcloud Talk はプラグインとして提供されており、コアインストールには同梱されていません。

CLI (npm レジストリ) 経由でインストールします:

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

ローカルチェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./extensions/nextcloud-talk
```

構成/オンボーディング中に Nextcloud Talk を選択し、git チェックアウトが検出された場合、OpenClaw は自動的にローカルインストールパスを提案します。

詳細: [プラグイン](/tools/plugin)

## クイックセットアップ (初心者向け)

1. Nextcloud Talk プラグインをインストールします。
2. Nextcloud サーバーでボットを作成します:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 対象のルーム設定でボットを有効にします。
4. OpenClaw を構成します:
   - 構成ファイル: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - または環境変数: `NEXTCLOUD_TALK_BOT_SECRET` (デフォルトアカウントのみ)
5. ゲートウェイを再起動します (またはオンボーディングを完了させます)。

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

- ボットから DM を開始することはできません。ユーザーが最初にボットへメッセージを送信する必要があります。
- webhook URL はゲートウェイから到達可能である必要があります。プロキシの背後にある場合は `webhookPublicUrl` を設定してください。
- ボット API ではメディアのアップロードはサポートされていません。メディアは URL として送信されます。
- webhook のペイロードでは DM とルームが区別されません。ルームタイプの検索を有効にするには `apiUser` + `apiPassword` を設定してください（設定しない場合、DM はルームとして扱われます）。

## アクセス制御 (DM)

- デフォルト: `channels.nextcloud-talk.dmPolicy = "pairing"`。未知の送信者にはペアリングコードが送信されます。
- 承認方法:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- パブリック DM: `channels.nextcloud-talk.dmPolicy="open"` かつ `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` は Nextcloud のユーザー ID にのみ一致します。表示名は無視されます。

## ルーム (グループ)

- デフォルト: `channels.nextcloud-talk.groupPolicy = "allowlist"` (メンション制限あり)。
- ルームを許可リストに追加するには `channels.nextcloud-talk.rooms` を使用します:

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

- ルームを一切許可しない場合は、許可リストを空にするか `channels.nextcloud-talk.groupPolicy="disabled"` を設定してください。

## 機能

| 機能 | ステータス |
| :--- | :--- |
| ダイレクトメッセージ | サポート済み |
| ルーム | サポート済み |
| スレッド | 未サポート |
| メディア | URL のみ |
| リアクション | サポート済み |
| ネイティブコマンド | 未サポート |

## 構成リファレンス (Nextcloud Talk)

完全な構成: [構成](/gateway/configuration)

プロバイダーオプション:

- `channels.nextcloud-talk.enabled`: チャネルの起動を有効/無効にします。
- `channels.nextcloud-talk.baseUrl`: Nextcloud インスタンスの URL。
- `channels.nextcloud-talk.botSecret`: ボットの共有シークレット。
- `channels.nextcloud-talk.botSecretFile`: シークレットファイルのパス。
- `channels.nextcloud-talk.apiUser`: ルーム検索（DM 検出）用の API ユーザー。
- `channels.nextcloud-talk.apiPassword`: ルーム検索用の API/アプリパスワード。
- `channels.nextcloud-talk.apiPasswordFile`: API パスワードファイルのパス。
- `channels.nextcloud-talk.webhookPort`: webhook リスナーポート (デフォルト: 8788)。
- `channels.nextcloud-talk.webhookHost`: webhook host (デフォルト: 0.0.0.0)。
- `channels.nextcloud-talk.webhookPath`: webhook path (デフォルト: /nextcloud-talk-webhook)。
- `channels.nextcloud-talk.webhookPublicUrl`: 外部から到達可能な webhook URL。
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`: DM 許可リスト (ユーザー ID)。`open` の場合は `"*"` が必要です。
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`: グループ許可リスト (ユーザー ID)。
- `channels.nextcloud-talk.rooms`: ルームごとの設定と許可リスト。
- `channels.nextcloud-talk.historyLimit`: グループ履歴の制限数 (0 で無効)。
- `channels.nextcloud-talk.dmHistoryLimit`: DM 履歴の制限数 (0 で無効)。
- `channels.nextcloud-talk.dms`: DM ごとのオーバーライド (historyLimit)。
- `channels.nextcloud-talk.textChunkLimit`: 送信テキストのチャンクサイズ (文字数)。
- `channels.nextcloud-talk.chunkMode`: `length` (デフォルト) または `newline`（長さで分割する前に、空行などの段落境界で分割）。
- `channels.nextcloud-talk.blockStreaming`: このチャネルのブロックストリーミングを無効にします。
- `channels.nextcloud-talk.blockStreamingCoalesce`: ブロックストリーミング結合の調整。
- `channels.nextcloud-talk.mediaMaxMb`: 受信メディアの上限サイズ (MB)。
