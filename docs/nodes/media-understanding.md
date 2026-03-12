---
summary: "受信した画像 / 音声 / 動画の理解（オプション）。provider と CLI のフォールバックに対応"
read_when:
  - media understanding を設計またはリファクタリングするとき
  - 受信した音声 / 動画 / 画像の前処理を調整するとき
title: "Media Understanding"
x-i18n:
  source_hash: "3f4364c2744a9d48f6b7863d1e6ad495b7706af57fa7509f83dde4448e22f151"
---
OpenClaw は、返信パイプラインに入る前に **受信メディア**（画像 / 音声 / 動画）を要約できます。ローカルツールや provider key が利用可能な場合は自動検出され、必要に応じて無効化やカスタマイズも可能です。understanding を無効にしても、model には従来どおり元のファイル / URL が渡されます。

## 目標

- オプションとして、受信メディアを短いテキストへ事前要約し、ルーティングとコマンド解析を速く・安定させる
- 元のメディアは必ず model へ渡し続ける
- **provider API** と **CLI fallback** の両方をサポートする
- error / size / timeout に応じて順序付き fallback を使えるようにする

## 高レベル挙動

1. 受信添付（`MediaPaths`、`MediaUrls`、`MediaTypes`）を収集する
2. 有効な capability（image / audio / video）ごとに、policy に従って添付を選ぶ（デフォルトは **最初の 1 件**）
3. サイズ、capability、認証条件を満たす最初の model entry を選ぶ
4. model が失敗するか、メディアが大きすぎる場合は **次の entry へ fallback** する
5. 成功した場合:
   - `Body` は `[Image]`、`[Audio]`、`[Video]` ブロックになる
   - 音声では `{{Transcript}}` を設定し、caption があればそれを、なければ transcript を command parsing に使う
   - caption はブロック内に `User text:` として保持される

understanding が失敗した場合や無効な場合でも、**返信フローは元の本文と添付付きで継続** します。

## 設定の概要

`tools.media` は **共有 models** と、capability ごとの override をサポートします。

- `tools.media.models`: 共有 model list（`capabilities` で適用先を制御）
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - デフォルト値（`prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`）
  - provider override（`baseUrl`、`headers`、`providerOptions`）
  - `tools.media.audio.providerOptions.deepgram` 経由の Deepgram 音声オプション
  - 音声 transcript echo 制御（`echoTranscript`、デフォルト `false`、`echoFormat`）
  - capability ごとの **専用 `models` list**（共有 model より優先）
  - `attachments` policy（`mode`、`maxAttachments`、`prefer`）
  - `scope`（channel / chatType / session key 単位での optional gating）
- `tools.media.concurrency`: capability 実行の最大並列数（デフォルト **2**）

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### model entry

各 `models[]` entry は **provider** または **CLI** です。

```json5
{
  type: "provider", // default if omitted
  provider: "openai",
  model: "gpt-5.2",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, used for multi-modal entries
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLI template では次の変数も使えます。

- `{{MediaDir}}`（メディアファイルを含む directory）
- `{{OutputDir}}`（この run 用に作られる scratch directory）
- `{{OutputBase}}`（拡張子なしの scratch file base path）

## デフォルトと制限

推奨デフォルト:

- `maxChars`: image / video は **500**（短く、command-friendly）
- `maxChars`: audio は **未設定**（制限を指定しない限り全文 transcript）
- `maxBytes`:
  - image: **10MB**
  - audio: **20MB**
  - video: **50MB**

ルール:

- メディアが `maxBytes` を超える場合、その model はスキップされ、**次の model を試します**
- **1024 バイト未満** の audio file は空または破損として扱い、provider / CLI に渡す前にスキップします
- model の出力が `maxChars` を超えた場合は切り詰めます
- `prompt` のデフォルトは単純な “Describe the {media}.” に `maxChars` の指示を足したものです（image / video のみ）
- `<capability>.enabled: true` でも model が未設定なら、その capability をサポートする **現在の reply model** を試します

### media understanding の自動検出（デフォルト）

`tools.media.<capability>.enabled` が **`false` でなく**、かつ model を設定していない場合、OpenClaw は次の順で自動検出し、**最初に動作したもの** を使います。

1. **ローカル CLI**（audio のみ。インストール済みなら）
   - `sherpa-onnx-offline`（encoder / decoder / joiner / tokens を含む `SHERPA_ONNX_MODEL_DIR` が必要）
   - `whisper-cli`（`whisper-cpp`。`WHISPER_CPP_MODEL` または同梱 tiny model を使用）
   - `whisper`（Python CLI。model は自動ダウンロード）
2. **Gemini CLI**（`gemini`）を `read_many_files` 付きで使用
3. **provider key**
   - audio: OpenAI → Groq → Deepgram → Google
   - image: OpenAI → Anthropic → Google → MiniMax
   - video: Google

無効にするには次のように設定します。

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

注: バイナリ検出は macOS / Linux / Windows をまたいだ best-effort 実装です。CLI が `PATH` 上にあること（`~` は展開されます）を確認するか、完全な command path を持つ明示的な CLI model を設定してください。

### proxy 環境のサポート（provider model）

provider ベースの **audio** と **video** の media understanding では、provider HTTP call に対して標準的な outbound proxy 環境変数を尊重します。

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

proxy 環境変数が未設定なら直接通信します。proxy 値の形式が不正な場合、OpenClaw は warning を記録し、直接 fetch へフォールバックします。

## capabilities（任意）

`capabilities` を設定した場合、その entry は指定した media type に対してのみ実行されます。shared list では、OpenClaw が次のようにデフォルト推定できます。

- `openai`、`anthropic`、`minimax`: **image**
- `google`（Gemini API）: **image + audio + video**
- `groq`: **audio**
- `deepgram`: **audio**

CLI entry では、予期しない一致を避けるため **`capabilities` を明示指定** してください。`capabilities` を省略した場合、その entry は所属する list に対して有効になります。

## provider support matrix（OpenClaw integration）

| Capability | Provider integration                             | Notes                                                     |
| ---------- | ------------------------------------------------ | --------------------------------------------------------- |
| Image      | OpenAI / Anthropic / Google / others via `pi-ai` | registry 上で image 対応の model なら利用できる           |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral          | provider 側 transcription（Whisper / Deepgram / Gemini / Voxtral） |
| Video      | Google (Gemini API)                              | provider ベースの video understanding                     |

## model 選定ガイド

- 品質や安全性を重視する場合は、各 media capability で利用可能な最新世代の強い model を優先してください
- 信頼できない入力を扱う tool-enabled agent では、古い / 弱い media model は避けるのが無難です
- 可用性確保のため、capability ごとに最低 1 つは fallback を持たせてください（高品質 model + 高速 / 低コスト model）
- CLI fallback（`whisper-cli`、`whisper`、`gemini`）は provider API が使えない場合に有効です
- `parakeet-mlx` 注記: `--output-dir` を指定すると、出力形式が `txt`（または未指定）の場合に OpenClaw は `<output-dir>/<media-basename>.txt` を読みます。`txt` 以外の形式では stdout parsing にフォールバックします

## attachment policy

capability ごとの `attachments` は、どの添付を処理するかを制御します。

- `mode`: `first`（デフォルト）または `all`
- `maxAttachments`: 処理数の上限（デフォルト **1**）
- `prefer`: `first`、`last`、`path`、`url`

`mode: "all"` の場合、出力には `[Image 1/2]`、`[Audio 2/2]` のようなラベルが付きます。

## 設定例

### 1) shared models list + overrides

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.2", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) audio + video のみ（image off）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) optional image understanding

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.2" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) 単一の multi-modal entry（明示的 capabilities）

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## status 出力

media understanding が実行されると、`/status` に短い summary line が表示されます。

```
📎 Media: image ok (openai/gpt-5.2) · audio skipped (maxBytes)
```

ここには capability ごとの結果と、該当する場合は使用した provider / model が表示されます。

## 注意点

- understanding は **best-effort** です。error が出ても返信自体は止まりません
- understanding が無効でも、添付は引き続き model へ渡されます
- `scope` を使って、understanding を実行する場所を絞れます（例: DM のみ）

## 関連ドキュメント

- [Configuration](/gateway/configuration)
- [Image & Media Support](/nodes/images)
