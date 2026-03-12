---
summary: "OpenClaw の API キーまたは Codex サブスクリプションを介して OpenAI を使用する"
read_when:
  - OpenClaw で OpenAI モデルを使用したい
  - API キーの代わりに Codex サブスクリプション認証が必要な場合
title: "OpenClawでOpenAIを使うAPIキー・Codex認証設定ガイド"
description: "OpenAI を OpenClaw で使うための設定ガイドです。API キー認証と Codex サブスクリプション認証の違い、ログイン手順、利用条件を確認できます。"
x-i18n:
  source_hash: "3b28e56807133a82747d1d874181c75d9ae3d2430b1e8b486738fe09b6e46e70"
---
OpenAI は、GPT モデル用の開発者 API を提供します。 Codex はサブスクリプションの **ChatGPT サインイン**をサポートします
使用量ベースのアクセスの場合は、**API キー** サインインにアクセスします。 Codex クラウドには ChatGPT サインインが必要です。
OpenAI は、OpenClaw などの外部ツール/ワークフローでのサブスクリプション OAuth の使用を明示的にサポートしています。

## オプション A: OpenAI API キー (OpenAI プラットフォーム)

**最適な用途:** 直接 API アクセスと使用量ベースの課金。
OpenAI ダッシュボードから API キーを取得します。

### CLI セットアップ

```bash
openclaw onboard --auth-choice openai-api-key
# or non-interactive
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### 構成スニペット

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

OpenAI の現在の API モデルのドキュメント リスト `gpt-5.4` および `gpt-5.4-pro` (直接の場合)
OpenAI APIの使用法。 OpenClaw は両方を `openai/*` 応答パス経由で転送します。

## オプション B: OpenAI Code (Codex) サブスクリプション

**最適な用途:** API キーの代わりに ChatGPT/Codex サブスクリプション アクセスを使用します。
Codex クラウドには ChatGPT サインインが必要ですが、Codex CLI は ChatGPT または API キー サインインをサポートしています。

### CLI セットアップ (Codex OAuth)

```bash
# Run Codex OAuth in the wizard
openclaw onboard --auth-choice openai-codex

# Or run OAuth directly
openclaw models auth login --provider openai-codex
```

### 構成スニペット (Codex サブスクリプション)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

OpenAI の現在の Codex ドキュメントには、現在の Codex モデルとして `gpt-5.4` がリストされています。オープンクロー
これを ChatGPT/Codex OAuth の使用のために `openai-codex/gpt-5.4` にマップします。

### トランスポートのデフォルト

OpenClaw はモデルのストリーミングに `pi-ai` を使用します。 `openai/*` と
`openai-codex/*`、デフォルトのトランスポートは `"auto"` (最初に WebSocket、次に SSE)
フォールバック)。

`agents.defaults.models.<provider/model>.params.transport` を設定できます。- `"sse"`: SSE を強制する

- `"websocket"`: WebSocket を強制する
- `"auto"`: WebSocket を試してから、SSE にフォールバックします。

`openai/*` (応答 API) の場合、OpenClaw は次の方法で WebSocket のウォームアップも有効にします。
WebSocket トランスポートが使用される場合のデフォルト (`openaiWsWarmup: true`)。

関連する OpenAI ドキュメント:

- [WebSocketによるリアルタイムAPI](https://platform.openai.com/docs/guides/realtime-websocket)
- [ストリーミング API 応答 (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### OpenAI WebSocket のウォームアップ

OpenAI のドキュメントでは、ウォームアップはオプションとして説明されています。 OpenClaw はデフォルトで有効になっています
`openai/*` WebSocket トランスポート使用時の最初のターンのレイテンシを短縮します。

### ウォームアップを無効にする

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### ウォームアップを明示的に有効にする

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### OpenAIの優先処理

OpenAI の API は、`service_tier=priority` を介して優先処理を公開します。で
OpenClaw、`agents.defaults.models["openai/<model>"].params.serviceTier` を次のように設定します
直接の `openai/*` 応答リクエストでそのフィールドを渡します。

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

サポートされている値は、`auto`、`default`、`flex`、および `priority` です。

### OpenAI Responses のサーバー側圧縮

直接 OpenAI Response モデルの場合 (`openai/*` と `api: "openai-responses"` を使用)
`baseUrl` (`api.openai.com` 上)、OpenClaw がサーバー側で OpenAI を自動的に有効にするようになりました
圧縮ペイロードのヒント:

- `store: true` を強制します (モデル互換性が `supportsStore: false` を設定しない場合)
- `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入しますデフォルトでは、`compact_threshold` はモデル `contextWindow` (または `80000`) の `70%` です。
  利用できない場合）。

### サーバー側の圧縮を明示的に有効にする

互換性のあるものに `context_management` インジェクションを強制したい場合にこれを使用します。
応答モデル (例: Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### カスタムしきい値を使用して有効にする

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### サーバー側の圧縮を無効にする

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` は `context_management` インジェクションのみを制御します。
Direct OpenAI Responses モデルは、互換性が設定されていない限り、引き続き `store: true` を強制します
`supportsStore: false`。

## 注意事項

- モデル参照は常に `provider/model` を使用します ([/concepts/models](/concepts/models) を参照)。
- 認証の詳細と再利用ルールは [/concepts/oauth](/concepts/oauth) にあります。
