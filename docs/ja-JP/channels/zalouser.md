---
summary: "ネイティブ zca-js (QR ログイン)、機能、および構成による Zalo 個人アカウントのサポート"
read_when:
  - OpenClaw 用の Zalo Personal のセットアップ
  - Zalo Personal ログインまたはメッセージ フローのデバッグ
title: "ザロパーソナル"
x-i18n:
  source_hash: "f15de8f47426f079ab091306e9172357d309438574cf2f5d248f76f6891f183d"
---

# Zaloパーソナル（非公式）

ステータス: 実験中。この統合により、OpenClaw 内のネイティブ `zca-js` を介して **個人 Zalo アカウント**が自動化されます。

> **警告:** これは非公式の統合であり、アカウントの停止/禁止につながる可能性があります。ご自身の責任でご使用ください。

## プラグインが必要です

Zalo Personal はプラグインとして出荷され、コア インストールにはバンドルされていません。

- CLI 経由でインストール: `openclaw plugins install @openclaw/zalouser`
- またはソース チェックアウトから: `openclaw plugins install ./extensions/zalouser`
- 詳細: [プラグイン](/tools/plugin)

外部 `zca`/`openzca` CLI バイナリは必要ありません。

## クイックセットアップ (初心者向け)

1. プラグインをインストールします (上記を参照)。
2. ログイン (QR、ゲートウェイ マシン上):
   - `openclaw channels login --channel zalouser`
   - Zalo モバイル アプリで QR コードをスキャンします。
3. チャネルを有効にします。

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

4. ゲートウェイを再起動します (またはオンボーディングを終了します)。
5. DM アクセスはデフォルトでペアリングになります。最初の連絡時にペアリング コードを承認します。

## それは何ですか

- `zca-js` を介して完全にインプロセスで実行されます。
- ネイティブ イベント リスナーを使用して受信メッセージを受信します。
- JS API (テキスト/メディア/リンク) を通じて直接返信を送信します。
- Zalo Bot API が利用できない「個人アカウント」のユースケース向けに設計されています。

## 命名

チャンネル ID は `zalouser` で、**個人 Zalo ユーザー アカウント** (非公式) を自動化することを明示します。 `zalo` は、将来の公式 Zalo API 統合の可能性のために予約しておきます。## ID (ディレクトリ) の検索

ディレクトリ CLI を使用して、ピア/グループとその ID を検出します。

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 制限

- 送信テキストは最大 2000 文字に分割されます (Zalo クライアントの制限)。
- ストリーミングはデフォルトでブロックされています。

## アクセス制御 (DM)

`channels.zalouser.dmPolicy` は、`pairing | allowlist | open | disabled` (デフォルト: `pairing`) をサポートします。

`channels.zalouser.allowFrom` はユーザー ID または名前を受け入れます。オンボーディング中、プラグインのインプロセス連絡先検索を使用して、名前が ID に解決されます。

承認方法:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## グループアクセス (オプション)

- デフォルト: `channels.zalouser.groupPolicy = "open"` (グループは許可されます)。設定されていない場合は、`channels.defaults.groupPolicy` を使用してデフォルトをオーバーライドします。
- 以下を使用して許可リストに制限します。
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (キーはグループ ID または名前であり、どのグループを許可するかを制御します)
  - `channels.zalouser.groupAllowFrom` (許可されたグループ内のどの送信者がボットをトリガーできるかを制御します)
- すべてのグループをブロックします: `channels.zalouser.groupPolicy = "disabled"`。
- 構成ウィザードでは、グループ許可リストの入力を求めることができます。
- 起動時に、OpenClaw は許可リスト内のグループ/ユーザー名を ID に解決し、マッピングをログに記録します。未解決のエントリは入力されたとおりに保持されます。
- `groupAllowFrom` が設定されていない場合、ランタイムはグループ送信者チェックのために `allowFrom` に戻ります。
- 送信者チェックは、通常のグループ メッセージと制御コマンド (`/new`、`/reset` など) の両方に適用されます。

例:

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

### グループメンションゲート- `channels.zalouser.groups.<group>.requireMention` は、グループの返信にメンションが必要かどうかを制御します

- 解決順序: 正確なグループ ID/名前 -> 正規化されたグループ スラグ -> `*` -> デフォルト (`true`)。
- これは、許可リストに登録されたグループとオープン グループ モードの両方に適用されます。
- 承認された制御コマンド (`/new` など) はメンション ゲートをバイパスできます。
- メンションが必要なためにグループ メッセージがスキップされた場合、OpenClaw はそれを保留中のグループ履歴として保存し、次に処理されるグループ メッセージに含めます。
- グループ履歴制限のデフォルトは `messages.groupChat.historyLimit` (フォールバック `50`) です。 `channels.zalouser.historyLimit` を使用してアカウントごとにオーバーライドできます。

例:

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

アカウントは OpenClaw 状態の `zalouser` プロファイルにマップされます。例:

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

## 入力、反応、配信の確認

- OpenClaw は、応答を送信する前に入力イベントを送信します (ベストエフォート)。
- メッセージ リアクション アクション `react` は、チャネル アクションの `zalouser` に対してサポートされています。
  - `remove: true` を使用して、メッセージから特定の反応絵文字を削除します。
  - 反応セマンティクス: [反応](/tools/reactions)
- イベント メタデータを含む受信メッセージの場合、OpenClaw は配信済み + 確認済みの確認応答を送信します (ベストエフォート)。

## トラブルシューティング

**ログインがうまくいかない:**

- `openclaw channels status --probe`
- 再ログイン: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**許可リスト/グループ名が解決されませんでした:**- `allowFrom`/`groupAllowFrom`/`groups` には数値 ID、または正確な友人/グループ名を使用します。

**古い CLI ベースのセットアップからアップグレード:**

- 古い外部 `zca` プロセスの前提条件を削除します。
- チャネルは外部 CLI バイナリなしで OpenClaw で完全に実行されるようになりました。
