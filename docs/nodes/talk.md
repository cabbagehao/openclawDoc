---
summary: "Talk mode: ElevenLabs TTS を使った連続音声会話"
read_when:
  - macOS / iOS / Android で Talk mode を実装するとき
  - 音声 / TTS / 割り込み挙動を変更するとき
title: "Talk Mode"
x-i18n:
  source_hash: "34ceb3669c5f9c166af6951ab8c6fcb0e626ed487de5cbe9449bcf9ba4aa12ac"
---

# Talk Mode

Talk mode は、継続的な音声会話ループです。

1. 音声を聞き取る
2. transcript を model に送る（main session、`chat.send`）
3. 応答を待つ
4. ElevenLabs による TTS で読み上げる（streaming playback）

## 挙動（macOS）

- Talk mode が有効な間は **常時表示の overlay** が出る
- フェーズは **Listening → Thinking → Speaking** と遷移する
- **短い無音区間**（silence window）で、現在の transcript を送信する
- 応答は **WebChat** に書き込まれる（手入力した場合と同じ）
- **音声割り込み**（デフォルト on）: assistant が話している最中にユーザーが話し始めた場合、再生を停止し、次の prompt 用に interruption timestamp を記録する

## 応答内の voice directive

assistant は、音声制御のために応答先頭へ **1 行の JSON** を付けられます。

```json
{ "voice": "<voice-id>", "once": true }
```

ルール:

- 対象になるのは最初の非空行だけ
- 不明な key は無視される
- `once: true` は現在の応答だけに適用される
- `once` がない場合、その voice は Talk mode の新しいデフォルトになる
- JSON 行は TTS 再生前に取り除かれる

サポートする key:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`、`rate`（WPM）、`stability`、`similarity`、`style`、`speakerBoost`
- `seed`、`normalize`、`lang`、`output_format`、`latency_tier`
- `once`

## 設定（`~/.openclaw/openclaw.json`）

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

- `interruptOnSpeech`: `true`
- `silenceTimeoutMs`: 未設定時は platform ごとのデフォルト無音待機時間を使う（`700 ms on macOS and Android, 900 ms on iOS`）
- `voiceId`: `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` にフォールバックし、API key がある場合は最初の ElevenLabs voice も候補になる
- `modelId`: 未設定時は `eleven_v3`
- `apiKey`: `ELEVENLABS_API_KEY`、または利用可能であれば gateway shell profile にフォールバックする
- `outputFormat`: macOS / iOS は `pcm_44100`、Android は `pcm_24000` がデフォルト（MP3 streaming を強制したい場合は `mp3_*` を指定）

## macOS UI

- メニューバーの toggle: **Talk**
- Config タブ: **Talk Mode** グループ（voice id + interrupt toggle）
- Overlay:
  - **Listening**: 雲の pulse と mic level 表示
  - **Thinking**: 沈み込む animation
  - **Speaking**: 放射状の ring
  - 雲をクリック: 読み上げ停止
  - X をクリック: Talk mode 終了

## 注意点

- Speech と Microphone の権限が必要です
- `chat.send` を session key `main` に対して使います
- TTS は `ELEVENLABS_API_KEY` を使った ElevenLabs streaming API と、macOS / iOS / Android 上の incremental playback により低遅延化されています
- `eleven_v3` の `stability` は `0.0`、`0.5`、`1.0` のいずれかに制限されます。他の model は `0..1` を受け付けます
- `latency_tier` は設定時に `0..4` の範囲で検証されます
- Android は低遅延 AudioTrack streaming 向けに `pcm_16000`、`pcm_22050`、`pcm_24000`、`pcm_44100` の output format をサポートします
