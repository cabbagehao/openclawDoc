---
summary: "ネイティブ zca-js (QR ログイン) による Zalo 個人アカウントのサポート、機能、および構成"
read_when:
  - OpenClaw に Zalo 個人アカウント連携を導入する場合
  - Zalo 個人アカウントのログインやメッセージフローをデバッグする場合
title: "Zalo Personal"
x-i18n:
  source_hash: "f15de8f47426f079ab091306e9172357d309438574cf2f5d248f76f6891f183d"
---

# Zalo Personal (非公式)

ステータス: 実験的。この連携機能は、OpenClaw 内部でネイティブの `zca-js` を使用し、**個人の Zalo アカウント**を自動化します。

> **警告:** これは非公式の連携機能であり、アカウントの停止や凍結につながるリスクがあります。ご自身の責任において使用してください。

## プラグインが必要

Zalo Personal はプラグインとして提供されており、コアインストールには同梱されていません。

* CLI 経由でインストール: `openclaw plugins install @openclaw/zalouser`
* または、ソースチェックアウトからインストール: `openclaw plugins install ./extensions/zalouser`
* 詳細: [プラグイン](/tools/plugin)

外部の `zca`/`openzca` CLI バイナリは不要です。

## クイックセットアップ (初心者向け)

1. プラグインをインストールします（上記参照）。
2. ログイン（ゲートウェイが動作しているマシンで QR コードを使用）:
   * `openclaw channels login --channel zalouser`
   * スマートフォンの Zalo アプリで表示された QR コードをスキャンします。
3. チャネルを有効にします:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. ゲートウェイを再起動します（またはオンボーディングを完了させます）。
5. DM アクセスはデフォルトでペアリングモードです。最初の連絡時にペアリングコードを承認してください。

## Zalo Personal チャネルの概要

* `zca-js` を介して完全にインプロセスで動作します。
* ネイティブのイベントリスナーを使用してインバウンドメッセージを受信します。
* JS API を通じて直接返信（テキスト/メディア/リンク）を送信します。
* Zalo ボット API が利用できない「個人アカウント」の用途向けに設計されています。

## 名称について

チャネル ID は `zalouser` です。これは、**個人の Zalo ユーザーアカウント**（非公式）を自動化することを明示するためです。将来的に公式の Zalo API 連携が導入される可能性に備え、`zalo` という ID は予約されています。

## ID の確認 (ディレクトリ)

ディレクトリ CLI を使用して、相手（ピア）やグループの ID を確認できます:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 制限事項

* 送信テキストは、Zalo クライアントの制限により約 2000 文字ごとに分割されます。
* ストリーミング出力はデフォルトでブロックされています。

## アクセス制御 (DM)

`channels.zalouser.dmPolicy` は `pairing | allowlist | open | disabled` (デフォルト: `pairing`) をサポートします。

`channels.zalouser.allowFrom` にはユーザー ID または名前を指定できます。オンボーディング中、プラグインのインプロセス連絡先検索を使用して、名前が ID に解決されます。

承認方法:

* `openclaw pairing list zalouser`
* `openclaw pairing approve zalouser <code>`

## グループアクセス (オプション)

* デフォルト: `channels.zalouser.groupPolicy = "open"` (グループを許可)。未設定時のデフォルトを上書きするには `channels.defaults.groupPolicy` を使用してください。
* 許可リストによる制限:
  * `channels.zalouser.groupPolicy = "allowlist"`
  * `channels.zalouser.groups` (キーはグループ ID または名前。どのグループを許可するかを制御)
  * `channels.zalouser.groupAllowFrom` (許可されたグループ内で、誰がボットをトリガーできるかを制御)
* すべてのグループをブロック: `channels.zalouser.groupPolicy = "disabled"`。
* 構成ウィザードで、グループ許可リストの設定を求めることができます。
* 起動時、OpenClaw は許可リスト内のグループ名やユーザー名を ID に解決し、そのマッピングをログに出力します。解決できなかったエントリは、入力されたままの形式で保持されます。
* `groupAllowFrom` が未設定の場合、グループ送信者のチェックには `allowFrom` が使用されます。
* 送信者チェックは、通常のグループメッセージと制御コマンド（例: `/new`, `/reset`）の両方に適用されます。

構成例:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### グループメンション制約

* `channels.zalouser.groups.<group>.requireMention` で、グループ返信にメンションを必須にするかどうかを制御します。
* 解決順序: 正確なグループ ID/名前 -> 正規化されたグループスラッグ -> `*` -> デフォルト (`true`)。
* これは許可リストに登録されたグループとオープングループモードの両方に適用されます。
* 権限のある制御コマンド（例: `/new`）は、メンション制約をバイパスできます。
* メンションが必要なためにグループメッセージがスキップされた場合、OpenClaw はそれを保留中のグループ履歴として保存し、次に処理されるメッセージに含めます。
* グループ履歴の制限数は、デフォルトで `messages.groupChat.historyLimit` (フォールバック値は 50) です。`channels.zalouser.historyLimit` でアカウントごとに上書き可能です。

構成例:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## マルチアカウント

各アカウントは、OpenClaw 状態内の `zalouser` プロファイルにマップされます。構成例:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## タイピング、リアクション、配信確認

* 返信を送信する前に、タイピング中イベントを送信します (ベストエフォート)。
* メッセージリアクションアクション `react` をサポートしています。
  * `remove: true` を指定することで、特定のリアクション絵文字を削除できます。
  * リアクションの仕様については [リアクション](/tools/reactions) を参照してください。
* イベントメタデータを含むインバウンドメッセージに対し、配信済みおよび既読の確認を送信します (ベストエフォート)。

## トラブルシューティング

**ログインが維持されない:**

* `openclaw channels status --probe` を確認してください。
* 再ログインを試してください: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**許可リストやグループ名が解決されない:**

* `allowFrom` / `groupAllowFrom` / `groups` には数値 ID を使用するか、正確なフレンド名・グループ名を使用してください。

**古い CLI ベースの構成からアップグレードした場合:**

* 外部の `zca` プロセスに関する古い設定は削除してください。
* このチャネルは外部 CLI バイナリなしで、OpenClaw 内部で完全に動作するようになりました。
