---
summary: "受信音声メモのディープグラム文字起こし"
read_when:
  - 音声添付ファイルに Deepgram の音声テキスト変換が必要な場合
  - 簡単な Deepgram 構成例が必要です
title: "ディープグラム"
x-i18n:
  source_hash: "dabd1f6942c339fbd744fbf38040b6a663b06ddf4d9c9ee31e3ac034de9e79d9"
---

# ディープグラム (音声文字起こし)

Deepgram は音声テキスト変換 API です。 OpenClaw では、**受信音声/音声メモに使用されます
`tools.media.audio` 経由の転写**。

有効にすると、OpenClaw は音声ファイルを Deepgram にアップロードし、トランスクリプトを挿入します。
応答パイプライン (`{{Transcript}}` + `[Audio]` ブロック) に追加されます。これは**ストリーミングではありません**。
事前に記録された転写エンドポイントを使用します。

ウェブサイト: [https://deepgram.com](https://deepgram.com)  
ドキュメント: [https://developers.deepgram.com](https://developers.deepgram.com)

## クイックスタート

1. API キーを設定します。

```
DEEPGRAM_API_KEY=dg_...
```

2. プロバイダーを有効にします。

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## オプション

- `model`: ディープグラム モデル ID (デフォルト: `nova-3`)
- `language`: 言語のヒント (オプション)
- `tools.media.audio.providerOptions.deepgram.detect_language`: 言語検出を有効にする (オプション)
- `tools.media.audio.providerOptions.deepgram.punctuate`: 句読点を有効にする (オプション)
- `tools.media.audio.providerOptions.deepgram.smart_format`: スマート フォーマットを有効にする (オプション)

言語の例:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
      },
    },
  },
}
```

ディープグラム オプションを使用した例:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        providerOptions: {
          deepgram: {
            detect_language: true,
            punctuate: true,
            smart_format: true,
          },
        },
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## 注意事項

- 認証は標準のプロバイダー認証順序に従います。 `DEEPGRAM_API_KEY` は最も単純なパスです。
- プロキシを使用する場合は、エンドポイントまたはヘッダーを `tools.media.audio.baseUrl` および `tools.media.audio.headers` でオーバーライドします。
- 出力は、他のプロバイダーと同じオーディオ ルール (サイズの上限、タイムアウト、トランスクリプトの挿入) に従います。
