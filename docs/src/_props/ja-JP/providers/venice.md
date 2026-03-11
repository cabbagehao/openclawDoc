---
summary: "OpenClaw で Venice AI プライバシー重視モデルを使用する"
read_when:
  - OpenClaw でプライバシーを重視した推論が必要な場合
  - Venice AI セットアップ ガイダンスが必要な場合
title: "ヴェニス AI"
x-i18n:
  source_hash: "e72c7ad24b045e9695530bee80ab7213986742354b7553b72bb230b75edf76e8"
---

# Venice AI (ヴェネチアハイライト)

**Venice** は、独自のモデルへのオプションの匿名アクセスを備えた、プライバシー最優先の推論のための当社のハイライトである Venice セットアップです。

Venice AI は、無修正モデルのサポートと、匿名化されたプロキシを介した主要な独自モデルへのアクセスを備えた、プライバシーに重点を置いた AI 推論を提供します。デフォルトではすべての推論は非公開であり、データのトレーニングやログ記録はありません。

## OpenClaw でヴェネツィアを選ぶ理由

* オープンソース モデルの **プライベート推論** (ログ記録なし)。
* **必要なときに**無修正モデル\*\*。
* 品質が重要な場合、独自のモデル (Opus/GPT/Gemini) への **匿名アクセス**。
* OpenAI 互換の `/v1` エンドポイント。

## プライバシー モード

| Venice には 2 つのプライバシー レベルがあります。これを理解することがモデルを選択する鍵となります。 | モード                                                                                           | 説明                                  | モデル |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------- | --- |
| **プライベート**                                              | 完全プライベート。プロンプト/応答は **保存または記録されることはありません**。儚い。                                                 | ラマ、クウェン、ディープシーク、キミ、ミニマックス、ヴェニス無修正など |     |
| **匿名化**                                                 | メタデータが削除された状態で、ヴェニス経由でプロキシされます。基盤となるプロバイダー (OpenAI、Anthropic、Google、xAI) は、匿名化されたリクエストを認識します。 | クロード、GPT、ジェミニ、グロク                   |     |

＃＃ 特徴- **プライバシー重視**: 「プライベート」(完全プライベート) モードと「匿名」(プロキシ) モードのどちらかを選択します

* **無修正モデル**: コンテンツ制限のないモデルへのアクセス
* **主要モデル アクセス**: Venice の匿名化プロキシ経由で Claude、GPT、Gemini、および Grok を使用します。
* **OpenAI 互換 API**: 簡単な統合のための標準 `/v1` エンドポイント
* **ストリーミング**: ✅ すべてのモデルでサポートされています
* **関数呼び出し**: ✅ 一部のモデルでサポートされています (モデルの機能を確認してください)
* **ビジョン**: ✅ ビジョン機能を備えたモデルでサポートされています
* **ハードレート制限なし**: 極端な使用にはフェアユーススロットルが適用される場合があります

## セットアップ

### 1. API キーを取得する

1. [venice.ai](https://venice.ai) にサインアップします。
2. **\[設定] → \[API キー] → \[新しいキーの作成]** に移動します。
3. API キーをコピーします (形式: `vapi_xxxxxxxxxxxx`)

### 2. OpenClaw を構成する

**オプション A: 環境変数**

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

**オプション B: 対話型セットアップ (推奨)**

```bash
openclaw onboard --auth-choice venice-api-key
```

これにより、次のことが行われます。

1. API キーの入力を求めます (または既存の `VENICE_API_KEY` を使用します)
2. 利用可能なすべての Venice モデルを表示する
3. デフォルトのモデルを選択させます
4. プロバイダーを自動的に構成する

**オプション C: 非対話型**

```bash
openclaw onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. セットアップの確認

```bash
openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
```

## モデルの選択

セットアップ後、OpenClaw には利用可能なすべての Venice モデルが表示されます。ニーズに基づいて選択してください:- **デフォルト モデル**: 強力なプライベート推論とビジョンのための `venice/kimi-k2-5`。

* **高機能オプション**: 最強の匿名化された Venice パス用の `venice/claude-opus-4-6`。
* **プライバシー**: 完全にプライベートな推論には「プライベート」モデルを選択します。
* **機能**: ヴェニスのプロキシ経由でクロード、GPT、ジェミニにアクセスするには、「匿名化」モデルを選択します。

デフォルトのモデルはいつでも変更できます。

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

利用可能なすべてのモデルをリストします。

```bash
openclaw models list | grep venice
```

## `openclaw configure` 経由で構成します

1. `openclaw configure` を実行します。
2. **モデル/認証**を選択します
3. **Venice AI** を選択します

## どのモデルを使用すればよいですか?|使用例 |推奨モデル |なぜ |

\| ------------------------ | -------------------------------- | -------------------------------------------- |
\| **一般チャット (デフォルト)** | `kimi-k2-5` |強力な個人的推論とビジョン |
\| **全体的に最高の品質** | `claude-opus-4-6` |最強の匿名化されたヴェネツィアオプション |
\| **プライバシー + コーディング** | `qwen3-coder-480b-a35b-instruct` |大規模なコンテキストを備えたプライベートコーディングモデル |
\| **プライベートビジョン** | `kimi-k2-5` |プライベート モードを終了せずにビジョンをサポート |
\| **早い + 安い** | `qwen3-4b` |軽量推論モデル |
\| **複雑なプライベートタスク** | `deepseek-v3.2` |強力な推論ですが、Venice ツールはサポートされていません。
\| **無修正** | `venice-uncensored` |コンテンツ制限なし |

## 利用可能なモデル (合計 41)

### プライベート モデル (26) — 完全にプライベート、ログなし|モデルID |名前 |コンテキスト |特長 |

\| -------------------------------------- | ----------------------------------- | ------- | ------------------------ |
\| `kimi-k2-5` |キミK2.5 | 256k |デフォルト、推論、ビジョン |
\| `kimi-k2-thinking` |キミ K2 思考 | 256k |推論 |
\| `llama-3.3-70b` |ラマ 3.3 70B | 128k |一般 |
\| `llama-3.2-3b` |ラマ 3.2 3B | 128k |一般 |
\| `hermes-3-llama-3.1-405b` |エルメス 3 ラマ 3.1 405B | 128k |一般、ツールは無効です |
\| `qwen3-235b-a22b-thinking-2507` | Qwen3 235B 思考 | 128k |推論 |
\| `qwen3-235b-a22b-instruct-2507` | Qwen3 235B 指示する | 128k |一般 |
\| `qwen3-coder-480b-a35b-instruct` | Qwen3 コーダー 480B | 256k |コーディング |
\| `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 コーダー 480B ターボ | 256k |コーディング |
\| `qwen3-5-35b-a3b` | Qwen3.5 35B A3B | 256k |推論、ビジョン || `qwen3-next-80b` | Qwen3 Next 80B | 256k |一般 |
\| `qwen3-vl-235b-a22b` | Qwen3 VL 235B (ビジョン) | 256k |ビジョン |
\| `qwen3-4b` |ヴェニス スモール (Qwen3 4B) | 32k |迅速な推理 |
\| `deepseek-v3.2` |ディープシーク V3.2 | 160k |推論、ツールが無効になっています |
\| `venice-uncensored` |ヴェニス 無修正 (ドルフィン-ミストラル) | 32k |無修正、ツール無効 |
\| `mistral-31-24b` |ヴェニス ミディアム (ミストラル) | 128k |ビジョン |
\| `google-gemma-3-27b-it` | Google Gemma 3 27B 説明書 | 198k |ビジョン |
\| `openai-gpt-oss-120b` | OpenAI GPT OSS 120B | 128k |一般 |
\| `nvidia-nemotron-3-nano-30b-a3b` | NVIDIA Nemotron 3 Nano 30B | 128k |一般 |
\| `olafangensan-glm-4.7-flash-heretic` | GLM 4.7 フラッシュの異端者 | 128k |推論 |
\| `zai-org-glm-4.6` | GLM 4.6 | 198k |一般 |
\| `zai-org-glm-4.7` | GLM 4.7 | 198k |推論 || `zai-org-glm-4.7-flash` | GLM 4.7 フラッシュ | 128k |推論 |
\| `zai-org-glm-5` | GLM5 | 198k |推論 |
\| `minimax-m21` |ミニマックス M2.1 | 198k |推論 |
\| `minimax-m25` |ミニマックス M2.5 | 198k |推論 |

### 匿名化モデル (15) — Venice プロキシ経由|モデルID |名前 |コンテキスト |特長 |

\| ------------------------------- | ------------------------------ | ------- | ------------------------- |
\| `claude-opus-4-6` |クロード Opus 4.6 (ヴェネツィア経由) | 1M |推論、ビジョン |
\| `claude-opus-4-5` |クロード オーパス 4.5 (ヴェネツィア経由) | 198k |推論、ビジョン |
\| `claude-sonnet-4-6` |クロード ソネット 4.6 (ヴェネツィア経由) | 1M |推論、ビジョン |
\| `claude-sonnet-4-5` |クロード ソネット 4.5 (ヴェネツィア経由) | 198k |推論、ビジョン |
\| `openai-gpt-54` | GPT-5.4 (ヴェネツィア経由) | 1M |推論、ビジョン |
\| `openai-gpt-53-codex` | GPT-5.3 コーデックス (ヴェネツィア経由) | 400k |推論、ビジョン、コーディング |
\| `openai-gpt-52` | GPT-5.2 (ヴェネツィア経由) | 256k |推論 |
\| `openai-gpt-52-codex` | GPT-5.2 コーデックス (ヴェネツィア経由) | 256k |推論、ビジョン、コーディング |
\| `openai-gpt-4o-2024-11-20` | GPT-4o (ヴェネツィア経由) | 128k |ビジョン |
\| `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (ヴェネツィア経由) | 128k |ビジョン |
\| `gemini-3-1-pro-preview` | Gemini 3.1 Pro (ヴェネツィア経由) | 1M |推論、ビジョン || `gemini-3-pro-preview` | Gemini 3 Pro (ヴェネツィア経由) | 198k |推論、ビジョン |
\| `gemini-3-flash-preview` | Gemini 3 Flash (ヴェネツィア経由) | 256k |推論、ビジョン |
\| `grok-41-fast` | Grok 4.1 Fast (ヴェネツィア経由) | 1M |推論、ビジョン |
\| `grok-code-fast-1` | Grok Code Fast 1 (ヴェニス経由) | 256k |推論、コーディング |

## モデルの発見

`VENICE_API_KEY` が設定されている場合、OpenClaw は Venice API からモデルを自動的に検出します。 API に到達できない場合は、静的カタログにフォールバックします。

`/models` エンドポイントはパブリック (リストには認証は必要ありません) ですが、推論には有効な API キーが必要です。

## ストリーミングとツールのサポート

| 特集            | サポート                                                   |
| ------------- | ------------------------------------------------------ |
| **ストリーミング**   | ✅ すべてのモデル                                              |
| **関数呼び出し**    | ✅ ほとんどのモデル (API で `supportsFunctionCalling` を確認してください) |
| **ビジョン/イメージ** | ✅ 「Vision」機能が付いたモデル                                    |
| **JSON モード**  | ✅ `response_format` 経由でサポート                            |

## 価格設定

ヴェネツィアはクレジットベースのシステムを採用しています。現在の料金については、[venice.ai/pricing](https://venice.ai/pricing) を確認してください。- **プライベート モデル**: 一般に低コスト

* **匿名化モデル**: API の直接価格 + 少額の Venice 料金と同様

## 比較: Venice と Direct API

| 側面         | ヴェネツィア (匿名)        | ダイレクトAPI           |
| ---------- | ------------------ | ------------------ |
| **プライバシー** | メタデータは削除され、匿名化されます | あなたのアカウントがリンクされました |
| **レイテンシ**  | +10-50ms (プロキシ)    | ダイレクト              |
| **特徴**     | ほとんどの機能がサポートされています | フル機能               |
| **請求**     | ヴェネツィアのクレジット       | プロバイダーの請求          |

## 使用例

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## トラブルシューティング

### API キーが認識されません

```bash
echo $VENICE_API_KEY
openclaw models list | grep venice
```

キーが `vapi_` で始まることを確認してください。

### モデルがありません

Venice モデル カタログは動的に更新されます。現在利用可能なモデルを確認するには、`openclaw models list` を実行します。一部のモデルは一時的にオフラインになる場合があります。

### 接続の問題

Venice API は `https://api.venice.ai/api/v1` にあります。ネットワークで HTTPS 接続が許可されていることを確認してください。

## 設定ファイルの例

```json5
{
  env: { VENICE_API_KEY: "vapi_..." },
  agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
  models: {
    mode: "merge",
    providers: {
      venice: {
        baseUrl: "https://api.venice.ai/api/v1",
        apiKey: "${VENICE_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2-5",
            name: "Kimi K2.5",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## リンク

* [ヴェネツィアAI](https://venice.ai)
* [API ドキュメント](https://docs.venice.ai)
* [価格](https://venice.ai/pricing)
* [ステータス](https://status.venice.ai)
