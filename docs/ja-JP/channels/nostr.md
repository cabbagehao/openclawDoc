---
summary: "NIP-04 暗号化メッセージを介した Nostr DM チャネル"
read_when:
  - OpenClaw が Nostr 経由で DM を受信できるようにしたい
  - 分散型メッセージングを設定しています
title: "ノストル"
x-i18n:
  source_hash: "6b9fe4c74bf5e7c0f59bbaa129ec5270fd29a248551a8a9a7dde6cff8fb46111"
---

# ノストル

**ステータス:** オプションのプラグイン (デフォルトでは無効)。

Nostr はソーシャル ネットワーキング用の分散型プロトコルです。このチャネルにより、OpenClaw は NIP-04 経由で暗号化されたダイレクト メッセージ (DM) を受信し、応答できるようになります。

## インストール (オンデマンド)

### オンボーディング (推奨)

- オンボーディング ウィザード (`openclaw onboard`) および `openclaw channels add` には、オプションのチャネル プラグインがリストされます。
- Nostr を選択すると、オンデマンドでプラグインをインストールするように求められます。

デフォルトをインストールします。

- **開発チャネル + git チェックアウトが利用可能:** はローカル プラグイン パスを使用します。
- **安定版/ベータ版:** npm からダウンロードします。

プロンプト内の選択はいつでも上書きできます。

### 手動インストール

```bash
openclaw plugins install @openclaw/nostr
```

ローカル チェックアウトを使用します (開発ワークフロー)。

```bash
openclaw plugins install --link <path-to-openclaw>/extensions/nostr
```

プラグインをインストールまたは有効にした後、ゲートウェイを再起動します。

## クイックセットアップ

1. Nostr キーペアを生成します (必要な場合)。

```bash
# Using nak
nak key generate
```

2. 構成に追加します。

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}"
    }
  }
}
```

3. キーをエクスポートします。

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. ゲートウェイを再起動します。

## 構成リファレンス|キー |タイプ |デフォルト |説明 |

| ------------ | -------- | ------------------------------------------ | ----------------------------------- |
| `privateKey` |文字列 |必須 | `nsec` または 16 進形式の秘密キー |
| `relays` |文字列[] | `['wss://relay.damus.io', 'wss://nos.lol']` |リレー URL (WebSocket) |
| `dmPolicy` |文字列 | `pairing` | DM アクセス ポリシー |
| `allowFrom` |文字列[] | `[]` |許可された送信者の公開鍵 |
| `enabled` |ブール値 | `true` |チャンネルを有効/無効にする |
| `name` |文字列 | - |表示名 |
| `profile` |オブジェクト | - | NIP-01 プロファイルのメタデータ |

## プロファイルのメタデータ

プロファイル データは、NIP-01 `kind:0` イベントとして公開されます。コントロール UI (チャンネル -> Nostr -> プロファイル) から管理することも、構成で直接設定することもできます。

例:

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "profile": {
        "name": "openclaw",
        "displayName": "OpenClaw",
        "about": "Personal assistant DM bot",
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

注:

- プロファイル URL には `https://` を使用する必要があります。
- リレーからインポートすると、フィールドがマージされ、ローカル オーバーライドが保持されます。## アクセス制御

### DM ポリシー

- **ペアリング** (デフォルト): 不明な送信者がペアリング コードを取得します。
- **許可リスト**: `allowFrom` の公開鍵のみが DM できます。
- **オープン**: パブリック受信 DM (`allowFrom: ["*"]` が必要)。
- **無効**: 受信 DM を無視します。

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

受け入れられる形式:

- **秘密キー:** `nsec...` または 64 文字の 16 進数
- **公開鍵 (`allowFrom`):** `npub...` または 16 進数

## リレー

デフォルト: `relay.damus.io` および `nos.lol`。

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

- 冗長性のために 2 ～ 3 個のリレーを使用します。
- あまりにも多くのリレー (遅延、重複) を避けます。
- 有料リレーにより信頼性が向上します。
- ローカルリレーはテストに適しています (`ws://localhost:7777`)。

## プロトコルのサポート

| ニップ | ステータス         | 説明                                           |
| ------ | ------------------ | ---------------------------------------------- |
| NIP-01 | サポートされている | 基本的なイベント形式 + プロファイル メタデータ |
| NIP-04 | サポートされている | 暗号化された DM (`kind:4`)                     |
| NIP-17 | 計画中             | ギフト包装されたDM                             |
| NIP-44 | 計画中             | バージョン管理された暗号化                     |

## テスト

### ローカル中継

```bash
# Start strfry
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

1. ログからボットの公開キー (npub) をメモします。
2. Nostr クライアント (Damus、Amethyst など) を開きます。
3. ボットの公開キーに DM を送ります。
4. 応答を確認します。

## トラブルシューティング

### メッセージを受信しない- 秘密キーが有効であることを確認します

- リレー URL が到達可能であることを確認し、`wss://` (ローカルの場合は `ws://`) を使用します。
- `enabled` が `false` ではないことを確認します。
- ゲートウェイのログでリレー接続エラーを確認します。

### 応答を送信しない

- リレーが書き込みを受け入れるかどうかを確認します。
- アウトバウンド接続を確認します。
- リレー速度制限に注意してください。

### 重複した回答

- 複数のリレーを使用する場合に想定されます。
- メッセージはイベント ID によって重複排除されます。最初の配信のみが応答をトリガーします。

## セキュリティ

- 秘密キーを決してコミットしないでください。
- キーには環境変数を使用します。
- 運用ボットには `allowlist` を検討してください。

## 制限事項 (MVP)

- ダイレクト メッセージのみ (グループ チャットは不可)。
- メディアの添付はありません。
  ・NIP-04のみ（NIP-17はギフトラッピング予定）。
