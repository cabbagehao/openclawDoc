---
summary: "Tlon/Urbit のサポート状況、機能、構成"
read_when:
  - Tlon/Urbit チャネル機能の開発中
title: "トロン"
x-i18n:
  source_hash: "f31ca391ce6e7729ddc5092a10f1e956f8236ac5b7fbbbd6b6242ea6dcb56f0c"
---

# Tlon (プラグイン)

Tlon は、Urbit 上に構築された分散型メッセンジャーです。 OpenClaw は Urbit 船に接続して、
DM やグループ チャット メッセージに応答します。グループ返信にはデフォルトで @ メンションが必要ですが、
ホワイトリストによってさらに制限されます。

ステータス: プラグイン経由でサポートされています。 DM、グループメンション、スレッド返信、リッチテキスト形式、
画像のアップロードがサポートされています。リアクションと投票はまだサポートされていません。

## プラグインが必要です

Tlon はプラグインとして出荷され、コア インストールにはバンドルされていません。

CLI (npm レジストリ) 経由でインストールします。

```bash
openclaw plugins install @openclaw/tlon
```

ローカル チェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./extensions/tlon
```

詳細: [プラグイン](/tools/plugin)

## セットアップ

1. Tlon プラグインをインストールします。
2. 船の URL とログイン コードを収集します。
3. `channels.tlon` を構成します。
4. ゲートウェイを再起動します。
5. ボットに DM を送信するか、グループ チャネルでメンションします。

最小限の構成 (単一アカウント):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## プライベート/LAN シップ

デフォルトでは、OpenClaw は SSRF 保護のためにプライベート/内部ホスト名と IP 範囲をブロックします。
船がプライベート ネットワーク (ローカルホスト、LAN IP、または内部ホスト名) 上で実行されている場合、
明示的にオプトインする必要があります。

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

これは次のような URL に適用されます。

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ ローカル ネットワークを信頼する場合にのみこれを有効にしてください。この設定は SSRF 保護を無効にします
シップ URL へのリクエストの場合。

## グループチャンネル自動検出はデフォルトで有効になっています。チャンネルを手動で固定することもできます

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

自動検出を無効にします。

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## アクセス制御

DM 許可リスト (空 = DM は許可されません。承認フローには `ownerShip` を使用します):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

グループ権限 (デフォルトで制限されています):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## 所有者と承認システム

権限のないユーザーが操作を試みたときに承認リクエストを受信するように所有者シップを設定します。

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

オーナーシップは **どこでも自動的に承認されます** — DM の招待は自動的に承認され、
チャネル メッセージは常に許可されます。所有者を `dmAllowlist` に追加する必要はありません。
`defaultAuthorizedShips`。

設定すると、所有者は次の DM 通知を受け取ります。

- 許可リストにない船舶からの DM リクエスト
- チャンネル内での許可のないメンション
- グループ招待リクエスト

## 自動承認設定

DM 招待を自動承認する (dmAllowlist 内の船の場合):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

グループへの招待を自動的に受け入れる:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## 配信ターゲット (CLI/cron)

これらを `openclaw message send` または cron 配信で使用します。

- DM: `~sampel-palnet` または `dm/~sampel-palnet`
- グループ: `chat/~host-ship/channel` または `group:~host-ship/channel`

## バンドルされたスキル

Tlon プラグインにはバンドルされたスキル ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)) が含まれています
Tlon 操作への CLI アクセスを提供します。- **連絡先**: プロフィールの取得/更新、連絡先のリスト

- **チャンネル**: メッセージのリスト、作成、投稿、履歴の取得
- **グループ**: メンバーのリスト、作成、管理
- **DM**: メッセージの送信、メッセージへの反応
- **リアクション**: 投稿や DM への絵文字リアクションを追加/削除します
- **設定**: スラッシュコマンドを使用してプラグインの権限を管理します

プラグインがインストールされると、スキルは自動的に使用可能になります。

## 機能

| 特集                 | ステータス                                                     |
| -------------------- | -------------------------------------------------------------- |
| ダイレクトメッセージ | ✅ サポートされている                                          |
| グループ/チャンネル  | ✅ サポートされています (デフォルトでメンションゲートされます) |
| スレッド             | ✅ サポートされています (スレッド内で自動返信)                 |
| リッチテキスト       | ✅ Markdown を Tlon 形式に変換                                 |
| 画像                 | ✅ Tlon ストレージにアップロード                               |
| 反応                 | ✅ [バンドルスキル](#bundled-skill)経由                        |
| 世論調査             | ❌ まだサポートされていません                                  |
| ネイティブコマンド   | ✅ サポート (デフォルトでは所有者のみ)                         |

## トラブルシューティング

まずこのはしごを実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

よくある失敗:- **DM は無視されました**: 送信者は `dmAllowlist` に含まれておらず、承認フロー用に構成された `ownerShip` もありません。

- **グループ メッセージは無視されました**: チャネルが検出されないか、送信者が承認されていません。
- **接続エラー**: 船の URL が到達可能であることを確認してください。地元の船舶に対して `allowPrivateNetwork` を有効にします。
- **認証エラー**: ログイン コードが最新であることを確認します (コードは循環します)。

## 構成リファレンス

完全な構成: [構成](/gateway/configuration)

プロバイダーのオプション:

- `channels.tlon.enabled`: チャネルの起動を有効/無効にします。
- `channels.tlon.ship`: ボットの Urbit 船名 (例: `~sampel-palnet`)。
- `channels.tlon.url`: URL を出荷します (例: `https://sampel-palnet.tlon.network`)。
- `channels.tlon.code`: ログイン コードを出荷します。
- `channels.tlon.allowPrivateNetwork`: ローカルホスト/LAN URL (SSRF バイパス) を許可します。
- `channels.tlon.ownerShip`: 承認システムの所有者シップ (常に許可されています)。
- `channels.tlon.dmAllowlist`: DM への発送が許可されています (空 = なし)。
- `channels.tlon.autoAcceptDmInvites`: ホワイトリストに登録された船舶からの DM を自動受信します。
- `channels.tlon.autoAcceptGroupInvites`: すべてのグループ招待を自動的に受け入れます。
- `channels.tlon.autoDiscoverChannels`: グループ チャネルを自動検出します (デフォルト: true)。
- `channels.tlon.groupChannels`: チャネル ネストを手動で固定しました。
- `channels.tlon.defaultAuthorizedShips`: すべてのチャネルに対して承認された状態で出荷されます。
- `channels.tlon.authorization.channelRules`: チャネルごとの認証ルール。
- `channels.tlon.showModelSignature`: メッセージにモデル名を追加します。

## 注意事項- グループ返信にはメンション (例: `~your-bot-ship`) が必要です

- スレッド応答: 受信メッセージがスレッド内にある場合、OpenClaw はスレッド内で応答します。
- リッチ テキスト: マークダウン形式 (太字、斜体、コード、ヘッダー、リスト) が Tlon のネイティブ形式に変換されます。
- 画像: URL は Tlon ストレージにアップロードされ、画像ブロックとして埋め込まれます。
