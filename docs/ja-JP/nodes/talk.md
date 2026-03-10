---
summary: "トークモード: イレブンラボ TTS による連続音声会話"
read_when:
  - macOS/iOS/Android でのトークモードの実装
  - 音声/TTS/割り込み動作の変更
title: "トークモード"
x-i18n:
  source_hash: "34ceb3669c5f9c166af6951ab8c6fcb0e626ed487de5cbe9449bcf9ba4aa12ac"
---

# トークモード

トーク モードは、継続的な音声会話ループです。

1. スピーチを聞く
2. トランスクリプトをモデルに送信します (メインセッション、chat.send)
3. 応答を待ちます
4. イレブンラボ経由で話す（ストリーミング再生）

## 動作 (macOS)

- トーク モードが有効になっている間、**常時オンのオーバーレイ**。
- **聞く→考える→話す**のフェーズ移行。
- **短い一時停止** (沈黙のウィンドウ) で、現在のトランスクリプトが送信されます。
- 返信は **WebChat** に書き込まれます (入力と同じ)。
- **音声中断** (デフォルト オン): アシスタントが話している間にユーザーが話し始めると、再生を停止し、次のプロンプトの中断タイムスタンプを記録します。

## 応答内の音声ディレクティブ

アシスタントは、音声を制御するために、応答の前に **単一の JSON 行**を付けることができます。

```json
{ "voice": "<voice-id>", "once": true }
```

ルール:

- 空ではない最初の行のみ。
- 不明なキーは無視されます。
- `once: true` は現在の応答にのみ適用されます。
- `once` を使用しない場合、音声がトーク モードの新しいデフォルトになります。
- JSON 行は TTS 再生前に削除されます。

サポートされているキー:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`、`rate` (WPM)、`stability`、`similarity`、`style`、`speakerBoost`
- `seed`、`normalize`、`lang`、`output_format`、`latency_tier`
- `once`## 構成 (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

デフォルト:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 設定を解除すると、Talk はトランスクリプトを送信する前にプラットフォームのデフォルトの一時停止ウィンドウを維持します (`700 ms on macOS and Android, 900 ms on iOS`)
- `voiceId`: `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (または API キーが利用可能な場合は最初の イレブンラボの音声) にフォールバックします。
- `modelId`: 設定されていない場合、デフォルトは `eleven_v3` になります。
- `apiKey`: `ELEVENLABS_API_KEY` (または利用可能な場合はゲートウェイ シェル プロファイル) にフォールバックします。
- `outputFormat`: macOS/iOS ではデフォルトで `pcm_44100`、Android では `pcm_24000` になります (MP3 ストリーミングを強制するには `mp3_*` を設定します)

## macOS UI

- メニューバーの切り替え: **トーク**
- [設定] タブ: **トーク モード** グループ (音声 ID + 割り込み切り替え)
- オーバーレイ:
  - **リスニング**: 雲の脈動とマイクレベル
  - **思考**: 沈むアニメーション
  - **話す**: 放射リング
  - クラウドをクリック: 話すのをやめます
  - X をクリック: トーク モードを終了します

## 注意事項- 音声 + マイクの権限が必要です

- セッション キー `main` に対して `chat.send` を使用します。
- TTS は、`ELEVENLABS_API_KEY` を使用した イレブンラボ ストリーミング API と、macOS/iOS/Android でのインクリメンタル再生を使用して、遅延を低減します。
- `eleven_v3` の `stability` は、`0.0`、`0.5`、または `1.0` に検証されます。他のモデルは `0..1` を受け入れます。
- `latency_tier` は、設定されると `0..4` に検証されます。
- Android は、低遅延 AudioTrack ストリーミング用の `pcm_16000`、`pcm_22050`、`pcm_24000`、および `pcm_44100` 出力形式をサポートします。
