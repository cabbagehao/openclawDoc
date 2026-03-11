---
summary: "受信音声メモ向け Deepgram 文字起こし"
read_when:
  - 音声添付ファイルに Deepgram の speech-to-text を使いたいとき
  - Deepgram の簡単な設定例を確認したいとき
title: "Deepgram"
x-i18n:
  source_hash: "dabd1f6942c339fbd744fbf38040b6a663b06ddf4d9c9ee31e3ac034de9e79d9"
---

# Deepgram (Audio Transcription)

Deepgram は speech-to-text API です。OpenClaw では、`tools.media.audio` を通じて **受信した音声 / ボイスノートの文字起こし** に使われます。

有効化すると、OpenClaw は音声ファイルを Deepgram へアップロードし、その transcript を返信パイプラインへ挿入します (`{{Transcript}}` + `[Audio]` block)。これは **ストリーミングではなく**、録音済み音声向けの transcription endpoint を使います。

Website: [https://deepgram.com](https://deepgram.com)
Docs: [https://developers.deepgram.com](https://developers.deepgram.com)

## クイックスタート

1. API key を設定します。

```
DEEPGRAM_API_KEY=dg_...
```

2. provider を有効化します。

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

* `model`: Deepgram の model id (既定値: `nova-3`)
* `language`: 言語ヒント (任意)
* `tools.media.audio.providerOptions.deepgram.detect_language`: 言語検出を有効化 (任意)
* `tools.media.audio.providerOptions.deepgram.punctuate`: 句読点を有効化 (任意)
* `tools.media.audio.providerOptions.deepgram.smart_format`: smart formatting を有効化 (任意)

言語を指定する例:

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

Deepgram 固有オプションを使う例:

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

## 補足

* 認証は標準の provider 認証順に従います。`DEEPGRAM_API_KEY` を使うのが最も簡単です。
* proxy を使う場合は、`tools.media.audio.baseUrl` と `tools.media.audio.headers` で endpoint や header を上書きできます。
* 出力は他 provider と同じ audio ルール (サイズ上限、timeout、transcript 注入) に従います。
