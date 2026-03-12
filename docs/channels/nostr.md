---
summary: "NIP-04 暗号化メッセージを介した Nostr DM チャネル"
read_when:
  - OpenClaw が Nostr 経由で DM を受信できるようにしたい場合
  - 分散型メッセージングの設定を行っている場合
title: "Nostr"
x-i18n:
  source_hash: "6b9fe4c74bf5e7c0f59bbaa129ec5270fd29a248551a8a9a7dde6cff8fb46111"
---
**ステータス:** オプションのプラグイン (デフォルトでは無効)。

Nostr は、ソーシャルネットワーキング用の分散型プロトコルです。このチャネルを有効にすると、OpenClaw は NIP-04 経由で暗号化されたダイレクトメッセージ (DM) を受信し、応答できるようになります。

## インストール (オンデマンド)

### オンボーディング (推奨)

- オンボーディングウィザード (`openclaw onboard`) や `openclaw channels add` では、オプションのチャネルプラグインが一覧表示されます。
- Nostr を選択すると、必要に応じてプラグインをインストールするように求められます。

インストールのデフォルト動作:

- **dev チャンネル + git チェックアウトが利用可能:** ローカルのプラグインパスを使用します。
- **stable/beta チャンネル:** npm からダウンロードします。

プロンプトでの選択はいつでも上書き可能です。

### 手動インストール

```bash
openclaw plugins install @openclaw/nostr
```

ローカルチェックアウトを使用する場合 (開発ワークフロー):

```bash
openclaw plugins install --link <path-to-openclaw>/extensions/nostr
```

プラグインをインストールまたは有効にした後は、ゲートウェイを再起動してください。

## クイックセットアップ

1. Nostr のキーペアを生成します (必要な場合):

```bash
# nak を使用する場合
nak key generate
```

2. 構成ファイルに追加します:

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}"
    }
  }
}
```

3. キーを環境変数としてエクスポートします:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. ゲートウェイを再起動します。

## 構成リファレンス

| キー | 型 | デフォルト | 説明 |
| :--- | :--- | :--- | :--- |
| `privateKey` | string | 必須 | `nsec` または 16 進形式の秘密鍵 |
| `relays` | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | リレー URL (WebSocket) |
| `dmPolicy` | string | `pairing` | DM アクセスポリシー |
| `allowFrom` | string[] | `[]` | 許可された送信者の公開鍵 |
| `enabled` | boolean | `true` | チャネルの有効/無効 |
| `name` | string | - | 表示名 |
| `profile` | object | - | NIP-01 プロフィールメタデータ |

## プロフィールメタデータ

プロフィールデータは NIP-01 `kind:0` イベントとして公開されます。コントロール UI (Channels -> Nostr -> Profile) から管理するか、構成ファイルで直接設定できます。

構成例:

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "profile": {
        "name": "openclaw",
        "displayName": "OpenClaw",
        "about": "パーソナルアシスタント DM ボット",
        "picture": "https://example.com/avatar.png",
        "banner": "https://example.com/banner.png",
        "website": "https://example.com",
        "nip05": "openclaw@example.com",
        "lud16": "openclaw@example.com"
      }
    }
  }
}
```

注記:

- プロフィールの URL には `https://` を使用する必要があります。
- リレーからインポートすると、フィールドがマージされ、ローカルの上書き設定が保持されます。

## アクセス制御

### DM ポリシー

- **pairing** (デフォルト): 未知の送信者にはペアリングコードが送信されます。
- **allowlist**: `allowFrom` に含まれる公開鍵のみが DM を送信できます。
- **open**: パブリックな受信 DM を許可します (`allowFrom: ["*"]` が必要)。
- **disabled**: 受信 DM を無視します。

### 許可リストの例

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "dmPolicy": "allowlist",
      "allowFrom": ["npub1abc...", "npub1xyz..."]
    }
  }
}
```

## キーの形式

以下の形式を受け入れます:

- **秘密鍵:** `nsec...` または 64 文字の 16 進数
- **公開鍵 (`allowFrom`):** `npub...` または 16 進数

## リレー (Relays)

デフォルト設定: `relay.damus.io` および `nos.lol`。

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "relays": ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"]
    }
  }
}
```

ヒント:

- 冗長性のために 2〜3 個のリレーを使用してください。
- リレーが多すぎると遅延や重複の原因となるため避けてください。
- 有料リレーを使用すると信頼性が向上する場合があります。
- テストにはローカルリレーが適しています (`ws://localhost:7777`)。

## プロトコルのサポート

| NIP | ステータス | 説明 |
| :--- | :--- | :--- |
| NIP-01 | サポート済み | 基本的なイベント形式 + プロフィールメタデータ |
| NIP-04 | サポート済み | 暗号化 DM (`kind:4`) |
| NIP-17 | 計画中 | ギフト包装 (Gift-wrapped) DM |
| NIP-44 | 計画中 | バージョン管理された暗号化 |

## テスト

### ローカルリレー

```bash
# strfry を起動
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "relays": ["ws://localhost:7777"]
    }
  }
}
```

### 手動テスト

1. ログからボットの公開鍵 (npub) をメモします。
2. Nostr クライアント (Damus, Amethyst 等) を開きます。
3. ボットの公開鍵に DM を送信します。
4. 応答を確認します。

## トラブルシューティング

### メッセージを受信できない

- 秘密鍵が有効であることを確認してください。
- リレーの URL が到達可能であり、`wss://` (ローカルの場合は `ws://`) を使用していることを確認してください。
- `enabled` が `false` になっていないか確認してください。
- ゲートウェイのログでリレーの接続エラーを確認してください。

### 応答を送信できない

- リレーが書き込みを受け入れているか確認してください。
- アウトバウンドの接続性を確認してください。
- リレーのレート制限に注意してください。

### 応答が重複する

- 複数のリレーを使用している場合、重複は想定内の動作です。
- メッセージはイベント ID によって重複排除されます。最初のアクティベーションのみが応答をトリガーします。

## セキュリティ

- 秘密鍵を決してコミットしないでください。
- キーの管理には環境変数を使用してください。
- 本番用のボットには `allowlist` の使用を検討してください。

## 制限事項 (MVP)

- ダイレクトメッセージのみ (グループチャットは不可)。
- メディアの添付は未サポート。
- NIP-04 のみ (NIP-17 のギフト包装は計画中)。
