---
summary: "受信した音声 / ボイスメモがどのようにダウンロード、文字起こしされ、返信に反映されるか"
read_when:
  - 音声文字起こしやメディア処理を変更するとき
title: "Audio and Voice Notes"
x-i18n:
  source_hash: "c694fd66dde1fad196da5addd6533d7b7874f3cfa5f266f4ee0253996fc7e600"
---

# Audio / Voice Notes — 2026-01-17

## 現在できること

* **メディア理解（音声）**: 音声理解が有効、または自動検出された場合、OpenClaw は次の順で処理します。
  1. 最初の音声添付ファイル（ローカルパスまたは URL）を見つけ、必要であればダウンロードする
  2. 各モデルエントリへ送る前に `maxBytes` 制限を適用する
  3. 順番に、条件を満たす最初のモデルエントリ（provider または CLI）を実行する
  4. 失敗またはスキップ（サイズ超過 / timeout）した場合は次のエントリを試す
  5. 成功した場合は `Body` を `[Audio]` ブロックに置き換え、`{{Transcript}}` を設定する
* **コマンド解析**: 文字起こしに成功すると、`CommandBody` / `RawBody` に transcript が設定されるため、slash command も引き続き機能します
* **詳細ログ**: `--verbose` では、文字起こしを実行したタイミングと本文を置き換えたタイミングがログに出力されます

## 自動検出（デフォルト）

**モデルを明示設定しておらず**、かつ `tools.media.audio.enabled` が **`false` でない** 場合、OpenClaw は次の順序で自動検出を行い、最初に動作した選択肢を採用します。

1. **ローカル CLI**（インストール済みの場合）
   * `sherpa-onnx-offline`（encoder / decoder / joiner / tokens を含む `SHERPA_ONNX_MODEL_DIR` が必要）
   * `whisper-cli`（`whisper-cpp` 由来。`WHISPER_CPP_MODEL` または同梱 tiny model を使用）
   * `whisper`（Python CLI。モデルは自動ダウンロード）
2. **Gemini CLI**（`gemini`）を `read_many_files` 付きで使う
3. **provider key**（OpenAI → Groq → Deepgram → Google）

自動検出を無効にするには `tools.media.audio.enabled: false` を設定します。挙動をカスタマイズするには `tools.media.audio.models` を設定してください。

注: バイナリ検出は macOS / Linux / Windows をまたいだ best-effort 実装です。CLI が `PATH` 上にあること（`~` は展開されます）を確認するか、完全なコマンドパスを持つ明示的な CLI model を設定してください。

## 設定例

### provider + CLI フォールバック（OpenAI + Whisper CLI）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### provider のみ + scope 制御

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### provider のみ（Deepgram）

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

### provider のみ（Mistral Voxtral）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### transcript をチャットへそのまま返す（opt-in）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## 注意点と制限

* provider 認証は、標準の model 認証順序（auth profile、環境変数、`models.providers.*.apiKey`）に従います
* `provider: "deepgram"` を使う場合、Deepgram は `DEEPGRAM_API_KEY` を参照します
* Deepgram の設定詳細: [Deepgram (audio transcription)](/providers/deepgram)
* Mistral の設定詳細: [Mistral](/providers/mistral)
* 音声 provider では、`tools.media.audio` から `baseUrl`、`headers`、`providerOptions` を上書きできます
* デフォルトのサイズ上限は 20MB（`tools.media.audio.maxBytes`）です。サイズ超過の音声はそのモデルではスキップされ、次のエントリが試されます
* 1024 バイト未満の極端に小さい、または空の音声ファイルは provider / CLI に送る前にスキップされます
* 音声のデフォルト `maxChars` は **未設定** です（全文 transcript）。出力を切り詰めたい場合は `tools.media.audio.maxChars` または各エントリの `maxChars` を設定してください
* OpenAI の自動デフォルトは `gpt-4o-mini-transcribe` です。精度を優先する場合は `model: "gpt-4o-transcribe"` を設定します
* 複数のボイスメモを処理するには `tools.media.audio.attachments` を使います（`mode: "all"` と `maxAttachments`）
* transcript はテンプレート内で `{{Transcript}}` として参照できます
* `tools.media.audio.echoTranscript` はデフォルトで無効です。有効にすると、エージェント処理前に transcript 確認を元のチャットへ返せます
* `tools.media.audio.echoFormat` で echo 文字列をカスタマイズできます（プレースホルダー: `{transcript}`）
* CLI の stdout には上限があります（5MB）。CLI 出力は簡潔に保ってください

### プロキシ環境のサポート

provider ベースの音声文字起こしでは、標準的な outbound proxy 環境変数が利用されます。

* `HTTPS_PROXY`
* `HTTP_PROXY`
* `https_proxy`
* `http_proxy`

proxy 環境変数が設定されていなければ直接外向き通信を行います。proxy 設定が不正な場合、OpenClaw は警告をログに残し、直接取得へフォールバックします。

## グループでの mention 検出

グループチャットで `requireMention: true` が設定されている場合、OpenClaw は mention 判定の **前に** 音声を文字起こしします。これにより、音声メモ内に mention が含まれている場合でも処理できるようになります。

**動作:**

1. 音声メッセージにテキスト本文がなく、かつグループで mention が必須の場合、OpenClaw は preflight 文字起こしを行います
2. transcript に対して mention pattern（例: `@BotName`、絵文字トリガー）をチェックします
3. mention が見つかった場合、メッセージは通常の返信パイプラインへ進みます
4. 音声メモでも mention gate を通過できるよう、mention 判定には transcript が使われます

**フォールバック挙動:**

* preflight 中の文字起こしが失敗した場合（timeout、API error など）、メッセージはテキストのみの mention 判定に基づいて処理されます
* これにより、テキスト + 音声の混在メッセージが誤って落とされることを防げます

**Telegram グループ / トピックごとの opt-out:**

* グループ単位で preflight transcript mention check を無効にするには `channels.telegram.groups.<chatId>.disableAudioPreflight: true` を設定します
* topic 単位で上書きするには `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` を設定します（`true` でスキップ、`false` で強制有効）
* デフォルトは `false` です（mention gate 条件に一致した場合は preflight が有効）

**例:** `requireMention: true` が設定された Telegram グループで、ユーザーが「Hey @Claude, what's the weather?」と話した音声メモを送るとします。音声が文字起こしされ、mention が検出され、エージェントが返信します。

## 注意すべき点

* scope rule は first-match wins です。`chatType` は `direct`、`group`、`room` に正規化されます
* CLI は終了コード 0 で終わり、プレーンテキストを出力するようにしてください。JSON を返す場合は `jq -r .text` などで整形が必要です
* `parakeet-mlx` で `--output-dir` を渡した場合、`--output-format` が `txt`（または未指定）なら OpenClaw は `<output-dir>/<media-basename>.txt` を読みます。`txt` 以外の出力形式では stdout パースへフォールバックします
* 返信キューを詰まらせないよう、timeout は妥当な値（`timeoutSeconds`、デフォルト 60 秒）に保ってください
* mention 検出用の preflight 文字起こしでは、**最初の** 音声添付だけを処理します。追加の音声は通常の media understanding フェーズで処理されます
