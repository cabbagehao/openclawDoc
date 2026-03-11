# Tlon (プラグイン)

Tlon は Urbit 上に構築された分散型メッセンジャーです。OpenClaw はお使いの Urbit ship に接続し、DM やグループチャットのメッセージに応答できます。グループでの返信には、デフォルトで @メンションが必要ですが、許可リストによってさらに制限することも可能です。

ステータス: プラグインによりサポートされています。DM、グループメンション、スレッドへの返信、リッチテキスト形式、および画像のアップロードがサポートされています。リアクションと投票はまだサポートされていません。

## プラグインが必要

Tlon はプラグインとして提供されており、コアインストールには同梱されていません。

CLI (npm レジストリ) 経由でインストールします:

```bash
openclaw plugins install @openclaw/tlon
```

ローカルチェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./extensions/tlon
```

詳細: [プラグイン](/tools/plugin)

## セットアップ

1. Tlon プラグインをインストールします。
2. ship の URL とログインコードを用意します。
3. `channels.tlon` を構成します。
4. ゲートウェイを再起動します。
5. ボットに DM を送信するか、グループチャネルでメンションします。

最小限の構成 (単一アカウント):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // 推奨: 常に許可される自身のメイン ship
    },
  },
}
```

## プライベート / LAN 内の ship

デフォルトでは、OpenClaw は SSRF 保護のため、プライベート/内部ホスト名や IP 範囲をブロックします。
ship がプライベートネットワーク (localhost、LAN 内 IP、または内部ホスト名) で動作している場合は、明示的に許可する必要があります:

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

これは以下のような URL に適用されます:

* `http://localhost:8080`
* `http://192.168.x.x:8080`
* `http://my-ship.local:8080`

⚠️ ローカルネットワークを信頼する場合にのみ、これを有効にしてください。この設定は ship URL へのリクエストに対する SSRF 保護を無効にします。

## グループチャネル

自動検出はデフォルトで有効になっています。チャネルを手動で固定（Pin）することも可能です:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

自動検出を無効にするには:

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

DM 許可リスト (空の場合、DM は許可されません。承認フローには `ownerShip` を使用します):

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

## オーナーおよび承認システム

未承認のユーザーが対話を試みた際に承認リクエストを受け取るためのオーナー ship を設定します:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

オーナー ship は**どこでも自動的に承認されます**。DM の招待は自動的に承諾され、チャネルメッセージは常に許可されます。オーナーを `dmAllowlist` や `defaultAuthorizedShips` に追加する必要はありません。

設定されている場合、オーナーは以下の通知を DM で受け取ります:

* 許可リストにない ship からの DM リクエスト
* 未承認のチャネルでのメンション
* グループへの招待リクエスト

## 自動承諾設定

DM 招待の自動承諾 (dmAllowlist に含まれる ship からの場合):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

グループ招待の自動承諾:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## 配信ターゲット (CLI/Cron)

`openclaw message send` や Cron 配信でこれらを使用します:

* DM: `~sampel-palnet` または `dm/~sampel-palnet`
* グループ: `chat/~host-ship/channel` または `group:~host-ship/channel`

## 同梱スキル

Tlon プラグインには、Tlon 操作への CLI アクセスを提供する同梱スキル ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)) が含まれています:

* **Contacts**: プロフィールの取得/更新、連絡先一覧
* **Channels**: 一覧表示、作成、メッセージ投稿、履歴取得
* **Groups**: 一覧表示、作成、メンバー管理
* **DMs**: メッセージ送信、メッセージへのリアクション
* **Reactions**: 投稿や DM への絵文字リアクションの追加/削除
* **Settings**: スラッシュコマンドによるプラグイン権限の管理

このスキルは、プラグインがインストールされると自動的に利用可能になります。

## 機能

| 機能         | ステータス                        |
| :--------- | :--------------------------- |
| ダイレクトメッセージ | ✅ サポート済み                     |
| グループ/チャネル  | ✅ サポート済み (デフォルトでメンション制約あり)   |
| スレッド       | ✅ サポート済み (スレッド内で自動返信)        |
| リッチテキスト    | ✅ Markdown を Tlon 形式に変換      |
| 画像         | ✅ Tlon ストレージにアップロード          |
| リアクション     | ✅ [同梱スキル](#bundled-skill) 経由 |
| 投票         | ❌ 未サポート                      |
| ネイティブコマンド  | ✅ サポート済み (デフォルトではオーナーのみ)     |

## トラブルシューティング

まず以下のコマンドを順番に確認してください:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

よくある問題:

* **DM が無視される**: 送信者が `dmAllowlist` に含まれておらず、承認フロー用の `ownerShip` も設定されていない。
* **グループメッセージが無視される**: チャネルが検出されていないか、送信者が承認されていない。
* **接続エラー**: ship の URL が到達可能か確認してください。ローカルの ship の場合は `allowPrivateNetwork` を有効にしてください。
* **認証エラー**: ログインコードが最新であることを確認してください（コードは更新されることがあります）。

## 構成リファレンス

完全な構成: [構成](/gateway/configuration)

プロバイダーオプション:

* `channels.tlon.enabled`: チャネルの起動を有効/無効にします。
* `channels.tlon.ship`: ボットの Urbit ship 名 (例: `~sampel-palnet`)。
* `channels.tlon.url`: ship の URL (例: `https://sampel-palnet.tlon.network`)。
* `channels.tlon.code`: ship のログインコード。
* `channels.tlon.allowPrivateNetwork`: localhost や LAN 内の URL を許可 (SSRF バイパス)。
* `channels.tlon.ownerShip`: 承認システム用のオーナー ship (常に承認されます)。
* `channels.tlon.dmAllowlist`: DM を許可する ship (空の場合はなし)。
* `channels.tlon.autoAcceptDmInvites`: 許可リストにある ship からの DM を自動承諾。
* `channels.tlon.autoAcceptGroupInvites`: すべてのグループ招待を自動承諾。
* `channels.tlon.autoDiscoverChannels`: グループチャネルを自動検出 (デフォルト: true)。
* `channels.tlon.groupChannels`: 手動で固定されたチャネル。
* `channels.tlon.defaultAuthorizedShips`: すべてのチャネルで承認される ship。
* `channels.tlon.authorization.channelRules`: チャネルごとの認証ルール。
* `channels.tlon.showModelSignature`: メッセージにモデル名を付加。

## 補足事項

* グループでの返信には、応答のためにメンション (例: `~your-bot-ship`) が必要です。
* スレッドへの返信: 受信メッセージがスレッド内の場合、OpenClaw はそのスレッド内で返信します。
* リッチテキスト: Markdown 形式 (太字、斜体、コード、見出し、リスト) は Tlon のネイティブ形式に変換されます。
* 画像: URL は Tlon ストレージにアップロードされ、画像ブロックとして埋め込まれます。
