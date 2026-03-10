---
summary: "受信したオーディオ/音声メモがどのようにダウンロードされ、転記され、返信に挿入されるか"
read_when:
  - 音声転写またはメディア処理の変更
title: "オーディオおよび音声メモ"
x-i18n:
  source_hash: "c694fd66dde1fad196da5addd6533d7b7874f3cfa5f266f4ee0253996fc7e600"
---

# オーディオ / 音声メモ — 2026-01-17

## 何が機能するか

- **メディア理解 (音声)**: 音声理解が有効になっている (または自動検出されている) 場合、OpenClaw は次のようにします。
  1. 最初の音声添付ファイル (ローカル パスまたは URL) を見つけて、必要に応じてダウンロードします。
  2. 各モデル エントリに送信する前に `maxBytes` を強制します。
  3. 最初の適格なモデル エントリを順番に実行します (プロバイダーまたは CLI)。
  4. 失敗するかスキップした場合 (サイズ/タイムアウト)、次のエントリが試行されます。
  5. 成功すると、`Body` が `[Audio]` ブロックに置き換えられ、`{{Transcript}}` が設定されます。
- **コマンド解析**: 転写が成功すると、`CommandBody`/`RawBody` が転写に設定されるため、スラッシュ コマンドは引き続き機能します。
- **詳細ログ**: `--verbose` では、文字起こしが実行されたときと、本文が置き換えられたときにログが記録されます。

## 自動検出 (デフォルト)

**モデルを構成せず**、`tools.media.audio.enabled` が `false` に設定されていない\*\*場合、
OpenClaw は次の順序で自動検出し、最初に動作するオプションで停止します。

1. **ローカル CLI** (インストールされている場合)
   - `sherpa-onnx-offline` (エンコーダー/デコーダー/ジョイナー/トークンを備えた `SHERPA_ONNX_MODEL_DIR` が必要)
   - `whisper-cli` (`whisper-cpp` から。`WHISPER_CPP_MODEL` またはバンドルされている小型モデルを使用)
   - `whisper` (Python CLI; モデルを自動的にダウンロードします)
2. **Gemini CLI** (`gemini`) `read_many_files` を使用する
3. **プロバイダー キー** (OpenAI → Groq → Deepgram → Google)自動検出を無効にするには、`tools.media.audio.enabled: false` を設定します。
   カスタマイズするには、`tools.media.audio.models` を設定します。
   注: バイナリ検出は、macOS/Linux/Windows 全体でベストエフォート型です。 CLI が `PATH` (`~` を展開します) 上にあることを確認するか、完全なコマンド パスを使用して明示的な CLI モデルを設定します。

## 構成例

### プロバイダー + CLI フォールバック (OpenAI + Whisper CLI)

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

### スコープ ゲーティングを備えたプロバイダー専用

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

### プロバイダーのみ (ディープグラム)

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

### プロバイダーのみ (Mistral Voxtral)

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

### チャットへのトランスクリプトのエコー (オプトイン)

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

## 注意事項と制限事項- プロバイダー認証は、標準モデルの認証順序 (認証プロファイル、環境変数、`models.providers.*.apiKey`) に従います

- `provider: "deepgram"` が使用されている場合、ディープグラムは `DEEPGRAM_API_KEY` を取得します。
- ディープグラム設定の詳細: [ディープグラム (音声転写)](/providers/deepgram)。
- ミストラル設定の詳細: [ミストラル](/providers/mistral)。
- オーディオプロバイダーは、`tools.media.audio` を介して `baseUrl`、`headers`、および `providerOptions` をオーバーライドできます。
- デフォルトのサイズ上限は 20MB (`tools.media.audio.maxBytes`) です。そのモデルではオーバーサイズのオーディオがスキップされ、次のエントリが試行されます。
- 1024 バイト未満の小さな空のオーディオ ファイルは、プロバイダー/CLI のトランスクリプションの前にスキップされます。
- オーディオのデフォルトの `maxChars` は **未設定** (完全なトランスクリプト) です。出力をトリミングするには、`tools.media.audio.maxChars` またはエントリごとの `maxChars` を設定します。
- OpenAI の自動デフォルトは `gpt-4o-mini-transcribe` です。精度を高めるには、`model: "gpt-4o-transcribe"` を設定します。
- `tools.media.audio.attachments` を使用して複数の音声メモを処理します (`mode: "all"` + `maxAttachments`)。
- トランスクリプトは `{{Transcript}}` としてテンプレートで利用できます。
- `tools.media.audio.echoTranscript` はデフォルトではオフです。エージェントの処理前に、トランスクリプトの確認を発信元のチャットに送信できるようにします。
- `tools.media.audio.echoFormat` は、エコー テキストをカスタマイズします (プレースホルダー: `{transcript}`)。
- CLI の標準出力には上限があります (5MB)。 CLI 出力を簡潔に保ちます。

### プロキシ環境のサポート

プロバイダーベースの音声トランスクリプションでは、標準の送信プロキシ環境変数が尊重されます。- `HTTPS_PROXY`

- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

プロキシ環境変数が設定されていない場合は、直接出力が使用されます。プロキシ設定の形式が不正な場合、OpenClaw は警告をログに記録し、直接フェッチに戻ります。

## グループでの検出についての言及

`requireMention: true` がグループ チャットに設定されている場合、OpenClaw はメンションをチェックする前に\*\*音声を文字に起こすようになりました。これにより、音声メモにメンションが含まれている場合でも、音声メモを処理できるようになります。

**仕組み:**

1. 音声メッセージにテキスト本文がなく、グループがメンションを必要とする場合、OpenClaw は「プリフライト」文字起こしを実行します。
2. トランスクリプトはメンション パターン (`@BotName`、絵文字トリガーなど) についてチェックされます。
3. メンションが見つかった場合、メッセージは完全な返信パイプラインを通過します。
4. トランスクリプトはメンション検出に使用されるため、音声メモはメンション ゲートを通過できます。

**フォールバック動作:**

- プリフライト中に文字起こしが失敗した場合 (タイムアウト、API エラーなど)、メッセージはテキストのみのメンション検出に基づいて処理されます。
- これにより、混合メッセージ (テキスト + オーディオ) が誤って削除されることがなくなります。

**Telegram グループ/トピックごとのオプトアウト:**

- そのグループのプリフライトトランスクリプトメンションチェックをスキップするように `channels.telegram.groups.<chatId>.disableAudioPreflight: true` を設定します。
- トピックごとにオーバーライドするように `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` を設定します (スキップする場合は `true`、強制的に有効にする場合は `false`)。
- デフォルトは `false` (メンションゲート条件が一致する場合にプリフライトが有効になります)。**例:** ユーザーが「@Claude、天気はどうですか?」という音声メモを送信します。 `requireMention: true` の Telegram グループ内。音声メモが書き起こされ、メンションが検出され、エージェントが応答します。

## 落とし穴

- スコープ ルールでは、最初の試合の勝利が使用されます。 `chatType` は、`direct`、`group`、または `room` に正規化されます。
- CLI が 0 で終了し、プレーン テキストを出力していることを確認します。 JSON は `jq -r .text` 経由でマッサージする必要があります。
- `parakeet-mlx` の場合、`--output-dir` を渡すと、`--output-format` が `txt` (または省略された場合) の場合、OpenClaw は `<output-dir>/<media-basename>.txt` を読み取ります。 `txt` 以外の出力形式は stdout 解析にフォールバックします。
- 応答キューがブロックされないように、タイムアウトを適切な値 (`timeoutSeconds`、デフォルトは 60 秒) に保ちます。
- プリフライト文字起こしでは、メンション検出のために **最初**の音声添付ファイルのみが処理されます。追加の音声は、メインのメディア理解フェーズ中に処理されます。
