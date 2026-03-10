---
summary: "プロバイダー + CLI フォールバックを使用した受信画像/音声/ビデオの理解 (オプション)"
read_when:
  - メディア理解の設計またはリファクタリング
  - 受信音声/ビデオ/画像の前処理の調整
title: "メディアの理解"
x-i18n:
  source_hash: "3f4364c2744a9d48f6b7863d1e6ad495b7706af57fa7509f83dde4448e22f151"
---

# メディア理解 (インバウンド) — 2026-01-17

OpenClaw は、応答パイプラインが実行される前に **受信メディア** (画像/音声/ビデオ) を要約できます。ローカル ツールまたはプロバイダー キーが利用可能になると自動検出され、無効にしたりカスタマイズしたりできます。理解が間違っている場合でも、モデルは通常どおり元のファイル/URL を受け取ります。

## 目標

- オプション: 受信メディアを短いテキストに事前ダイジェストして、より高速なルーティングとより優れたコマンド解析を実現します。
- モデルへのオリジナルのメディア配信を (常に) 保持します。
- **プロバイダー API** と **CLI フォールバック** をサポートします。
- 順序付けされたフォールバック (エラー/サイズ/タイムアウト) を持つ複数のモデルを許可します。

## 高レベルの動作

1. 受信添付ファイル (`MediaPaths`、`MediaUrls`、`MediaTypes`) を収集します。
2. 有効な機能 (画像/音声/ビデオ) ごとに、ポリシーごとに添付ファイルを選択します (デフォルト: **最初**)。
3. 最初の対象となるモデル エントリ (サイズ + 機能 + 認証) を選択します。
4. モデルが失敗するか、メディアが大きすぎる場合は、**次のエントリに戻ります**。
5. 成功した場合:
   - `Body` は、`[Image]`、`[Audio]`、または `[Video]` ブロックになります。
   - オーディオ セット `{{Transcript}}`;コマンド解析ではキャプション テキストが存在する場合に使用されます。
     それ以外の場合はトランスクリプト。
   - キャプションはブロック内に `User text:` として保存されます。

理解が失敗するか無効になった場合、**返信フローは元の本文と添付ファイルで続行**されます。

## 構成の概要`tools.media` は **共有モデル** に加えて、機能ごとのオーバーライドをサポートします

- `tools.media.models`: 共有モデル リスト (ゲートには `capabilities` を使用します)。
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - デフォルト (`prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`)
  - プロバイダーのオーバーライド (`baseUrl`、`headers`、`providerOptions`)
  - `tools.media.audio.providerOptions.deepgram` 経由の Deepgram オーディオ オプション
  - オーディオ トランスクリプト エコー コントロール (`echoTranscript`、デフォルト `false`、`echoFormat`)
  - オプションの **機能ごとの `models` リスト** (共有モデルよりも優先)
  - `attachments` ポリシー (`mode`、`maxAttachments`、`prefer`)
  - `scope` (チャネル/チャットタイプ/セッションキーによるオプションのゲート)
- `tools.media.concurrency`: 最大同時実行能力 (デフォルト **2**)。

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

### モデルのエントリ

各 `models[]` エントリは **プロバイダ** または **CLI** にすることができます。

```json5
{
  type: "provider", // default if omitted
  provider: "openai",
  model: "gpt-5.2",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, used for multi‑modal entries
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

CLI テンプレートでは以下も使用できます。

- `{{MediaDir}}` (メディア ファイルを含むディレクトリ)
- `{{OutputDir}}` (この実行用に作成されたスクラッチ ディレクトリ)
- `{{OutputBase}}` (スクラッチ ファイルのベース パス、拡張子なし)

## デフォルトと制限

推奨されるデフォルト:- `maxChars`: 画像/ビデオの場合 **500** (短い、コマンドフレンドリー)

- `maxChars`: 音声の **設定解除** (制限を設定しない限り完全なトランスクリプト)
- `maxBytes`:
  - 画像: **10MB**
  - オーディオ: **20MB**
  - ビデオ: **50MB**

ルール:

- メディアが `maxBytes` を超える場合、そのモデルはスキップされ、**次のモデルが試行**されます。
- **1024 バイト** より小さいオーディオ ファイルは空または破損したものとして扱われ、プロバイダー/CLI の文字起こし前にスキップされます。
- モデルが `maxChars` を超える値を返す場合、出力はトリミングされます。
- `prompt` のデフォルトは単純な「{メディア} の説明」です。 `maxChars` ガイダンス (画像/ビデオのみ) に加えて。
- `<capability>.enabled: true` であってもモデルが設定されていない場合、OpenClaw は
  **アクティブ応答モデル** (プロバイダーが機能をサポートしている場合)。

### メディア理解の自動検出 (デフォルト)

`tools.media.<capability>.enabled` が **OC_I18N_0056\_\_ に設定されていない**場合、
構成されたモデル、OpenClaw はこの順序で自動検出し、**最初のモデルで停止します
作業オプション**:1. **ローカル CLI** (音声のみ、インストールされている場合)

- `sherpa-onnx-offline` (エンコーダー/デコーダー/ジョイナー/トークンを備えた `SHERPA_ONNX_MODEL_DIR` が必要)
- `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` またはバンドルされている小型モデルを使用)
- `whisper` (Python CLI; モデルを自動的にダウンロードします)

2. **Gemini CLI** (`gemini`) `read_many_files` を使用する
3. **プロバイダーキー**
   - オーディオ: OpenAI → Groq → Deepgram → Google
   - 画像: OpenAI → Anthropic → Google → MiniMax
   - ビデオ: Google

自動検出を無効にするには、次のように設定します。

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

注: バイナリ検出は、macOS/Linux/Windows 全体でベストエフォート型です。 CLI が `PATH` (`~` を展開します) 上にあることを確認するか、完全なコマンド パスを使用して明示的な CLI モデルを設定します。

### プロキシ環境のサポート (プロバイダーモデル)

プロバイダーベースの **オーディオ** および **ビデオ** メディア理解が有効になっている場合、OpenClaw
プロバイダーの HTTP 呼び出しに対して標準のアウトバウンド プロキシ環境変数を尊重します。

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

プロキシ環境変数が設定されていない場合、メディア理解では直接出力が使用されます。
プロキシ値の形式が不正な場合、OpenClaw は警告をログに記録し、直接の値にフォールバックします。
取ってくる。

## 機能 (オプション)

`capabilities` を設定すると、エントリはそれらのメディア タイプに対してのみ実行されます。共有用
リストから、OpenClaw はデフォルトを推測できます。- `openai`、`anthropic`、`minimax`: **画像**

- `google` (Gemini API): **画像 + 音声 + ビデオ**
- `groq`: **オーディオ**
- `deepgram`: **オーディオ**

CLI エントリの場合は、**`capabilities` を明示的に設定**して、予期しない一致を回避します。
`capabilities` を省略した場合、エントリはリストに表示されます。

## プロバイダー サポート マトリックス (OpenClaw 統合)

| 能力       | プロバイダーの統合                                  | メモ                                                   |
| ---------- | --------------------------------------------------- | ------------------------------------------------------ |
| 画像       | OpenAI / Anthropic / Google / その他 (`pi-ai` 経由) | レジストリ内のイメージ対応モデルはすべて機能します。   |
| オーディオ | OpenAI、Groq、ディープグラム、Google、ミストラル    | プロバイダーの転写 (Whisper/Deepgram/Gemini/Voxtral)。 |
| ビデオ     | Google (Gemini API)                                 | プロバイダーのビデオを理解する。                       |

## モデル選択のガイダンス- 品質と安全性が重要な場合は、各メディア機能に利用可能な最強の最新世代モデルを優先します

- 信頼できない入力を処理するツール対応エージェントの場合は、古い/弱いメディア モデルを避けてください。
- 可用性を確保するために、機能ごとに少なくとも 1 つのフォールバックを保持します (高品質モデル + 高速/安価なモデル)。
- CLI フォールバック (`whisper-cli`、`whisper`、`gemini`) は、プロバイダー API が使用できない場合に役立ちます。
- `parakeet-mlx` 注: `--output-dir` を使用すると、出力形式が `txt` (または指定されていない) の場合、OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。 `txt` 以外の形式は stdout にフォールバックします。

## 添付ポリシー

機能ごとの `attachments` は、どの添付ファイルが処理されるかを制御します。

- `mode`: `first` (デフォルト) または `all`
- `maxAttachments`: 処理される数に上限を設定します (デフォルト **1**)
- `prefer`: `first`、`last`、`path`、`url`

`mode: "all"` の場合、出力には `[Image 1/2]`、`[Audio 2/2]` などのラベルが付けられます。

## 構成例

### 1) 共有モデルのリスト + オーバーライド

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

### 2) 音声 + ビデオのみ (画像オフ)

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

### 3) オプションのイメージ理解

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

### 4) マルチモーダルな単一エントリ (明示的な機能)

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

## ステータス出力

メディア理解を実行すると、`/status` に短い概要行が含まれます。

````
📎 Media: image ok (openai/gpt-5.2) · audio skipped (maxBytes)
```これには、機能ごとの結果と、該当する場合は選択されたプロバイダー/モデルが表示されます。

## 注意事項

- 理解は**最善の努力**です。エラーによって返信がブロックされることはありません。
- 理解が無効になっている場合でも、添付ファイルは引き続きモデルに渡されます。
- `scope` を使用して、理解を実行する場所を制限します (例: DM のみ)。

## 関連ドキュメント

- [構成](/gateway/configuration)
- [画像とメディアのサポート](/nodes/images)
````
