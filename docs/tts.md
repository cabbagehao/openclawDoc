---
summary: "送信返信用の音声合成 (TTS)"
read_when:
  - 返信のテキスト読み上げを有効にする
  - TTS プロバイダーまたは制限の構成
  - /tts コマンドの使用
title: "テキスト読み上げ"
x-i18n:
  source_hash: "02dbaf88bae62e0815c19121ee0469deb6ddb620f5c58b0a09bf17133837c7b5"
---

# テキスト読み上げ (TTS)

OpenClaw は、イレブンラボ、OpenAI、または Edge TTS を使用して、アウトバウンド返信を音声に変換できます。
OpenClaw が音声を送信できる場所ならどこでも機能します。 Telegram には丸い音声メモのバブルが表示されます。

## サポートされているサービス

- **イレブンラボ** (プライマリまたはフォールバックプロバイダー)
- **OpenAI** (プライマリまたはフォールバック プロバイダー。要約にも使用されます)
- **Edge TTS** (プライマリまたはフォールバック プロバイダー、`node-edge-tts` を使用、API キーがない場合のデフォルト)

### Edge TTS の注意事項

Edge TTS は、`node-edge-tts` 経由で Microsoft Edge のオンライン ニューラル TTS サービスを使用します。
図書館。これはホスト型サービス (ローカルではない) であり、Microsoft のエンドポイントを使用し、
API キーは必要ありません。 `node-edge-tts` は音声設定オプションを公開し、
ただし、すべてのオプションが Edge サービスでサポートされているわけではありません。 引用turn2search0

Edge TTS は公開された SLA やクォータのないパブリック Web サービスであるため、これを扱います。
ベストエフォートとして。保証された制限とサポートが必要な場合は、OpenAI または イレブンラボを使用してください。
Microsoft の Speech REST API では、リクエストあたり 10 分の音声制限が文書化されています。エッジTTS
は制限を公開していないため、同様の制限またはそれより低い制限を想定しています。 引用turn0search3

## オプションのキー

OpenAI または イレブンラボが必要な場合:

- `ELEVENLABS_API_KEY` (または `XI_API_KEY`)
- `OPENAI_API_KEY`

Edge TTS には API キーは**必要ありません**。 API キーが見つからない場合、OpenClaw はデフォルトで
Edge TTS に送信します (`messages.tts.edge.enabled=false` によって無効にされていない限り)。複数のプロバイダーが構成されている場合、選択したプロバイダーが最初に使用され、他のプロバイダーはフォールバック オプションになります。
自動サマリーは、構成された `summaryModel` (または `agents.defaults.model.primary`) を使用します。
そのため、サマリーを有効にする場合はプロバイダーも認証される必要があります。

## サービスリンク

- [OpenAI Text-to-Speech ガイド](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI オーディオ API リファレンス](https://platform.openai.com/docs/api-reference/audio)
- [イレブンラボ テキスト読み上げ](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [イレブンラボ認証](https://elevenlabs.io/docs/api-reference/authentication)
- [ノードエッジ-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech 出力形式](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## デフォルトで有効になっていますか?

いいえ。Auto‑TTS はデフォルトで **オフ** です。設定で有効にします
`messages.tts.auto` または `/tts always` (エイリアス: `/tts on`) とのセッションごと。

Edge TTS は、TTS がオンになると **デフォルトで有効**になり、自動的に使用されます
OpenAI または Celebrities API キーが利用できない場合。

## 構成

TTS 構成は、`openclaw.json` の `messages.tts` の下に存在します。
完全なスキーマは [ゲートウェイ構成](/gateway/configuration) にあります。

### 最小限の構成 (有効化 + プロバイダー)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI プライマリと イレブンラボ フォールバック

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
    },
  },
}
```

### Edge TTS プライマリ (API キーなし)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "edge",
      edge: {
        enabled: true,
        voice: "en-US-MichelleNeural",
        lang: "en-US",
        outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        rate: "+10%",
        pitch: "-5%",
      },
    },
  },
}
```

### エッジ TTS を無効にする

```json5
{
  messages: {
    tts: {
      edge: {
        enabled: false,
      },
    },
  },
}
```

### カスタム制限 + 設定パス

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### 受信音声メモの後にのみ音声で返信する

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### 長い返信の自動要約を無効にする

````json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```次に、次を実行します。

````

/tts summary off

```

### フィールドに関する注意事項- `auto`: 自動 TTS モード (`off`、`always`、`inbound`、`tagged`)。
  - `inbound` は、受信音声メモの後にのみ音声を送信します。
  - `tagged` は、応答に `[[tts]]` タグが含まれている場合にのみ音声を送信します。
- `enabled`: 従来の切り替え (医師はこれを `auto` に移行します)。
- `mode`: `"final"` (デフォルト) または `"all"` (ツール/ブロック応答を含む)。
- `provider`: `"elevenlabs"`、`"openai"`、または `"edge"` (フォールバックは自動です)。
- `provider` が **未設定**の場合、OpenClaw は `openai` (キーの場合)、次に `elevenlabs` (キーの場合) を優先します。
  それ以外の場合は `edge`。
- `summaryModel`: 自動サマリー用のオプションの安価なモデル。デフォルトは `agents.defaults.model.primary` です。
  - `provider/model` または構成されたモデルのエイリアスを受け入れます。
- `modelOverrides`: モデルが TTS ディレクティブを発行できるようにします (デフォルトでオン)。
  - `allowProvider` のデフォルトは `false` です (プロバイダーの切り替えはオプトインです)。
- `maxTextLength`: TTS 入力 (文字) のハード キャップ。 `/tts audio` を超えると失敗します。
- `timeoutMs`: リクエストのタイムアウト (ミリ秒)。
- `prefsPath`: ローカル設定の JSON パス (プロバイダー/制限/概要) をオーバーライドします。
- `apiKey` 値は環境変数 (`ELEVENLABS_API_KEY`/`XI_API_KEY`、`OPENAI_API_KEY`) にフォールバックします。
- `elevenlabs.baseUrl`: イレブンラボ API ベース URL をオーバーライドします。- `openai.baseUrl`: OpenAI TTS エンドポイントをオーバーライドします。
  - 解決順序: `messages.tts.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - デフォルト以外の値は OpenAI 互換の TTS エンドポイントとして扱われるため、カスタム モデル名と音声名が受け入れられます。
- `elevenlabs.voiceSettings`:
  - `stability`、`similarityBoost`、`style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = 通常)
- `elevenlabs.applyTextNormalization`: `auto|on|off`
- `elevenlabs.languageCode`: 2 文字の ISO 639-1 (例: `en`、`de`)
- `elevenlabs.seed`: 整数 `0..4294967295` (ベストエフォート型決定論)
- `edge.enabled`: Edge TTS の使用を許可します (デフォルト `true`、API キーなし)。
- `edge.voice`: エッジ ニューラル音声名 (例: `en-US-MichelleNeural`)。
- `edge.lang`: 言語コード (例: `en-US`)。
- `edge.outputFormat`: エッジ出力形式 (例: `audio-24khz-48kbitrate-mono-mp3`)。
  - 有効な値については、「Microsoft Speech 出力形式」を参照してください。すべての形式が Edge でサポートされているわけではありません。
- `edge.rate` / `edge.pitch` / `edge.volume`: パーセント文字列 (例: `+10%`、`-5%`)。
- `edge.saveSubtitles`: 音声ファイルと一緒に JSON 字幕を書き込みます。
- `edge.proxy`: Edge TTS リクエストのプロキシ URL。
- `edge.timeoutMs`: リクエストのタイムアウト オーバーライド (ミリ秒)。

## モデル駆動型オーバーライド (デフォルトはオン)デフォルトでは、モデルは単一の応答に対して TTS ディレクティブを発行できます**。
`messages.tts.auto` が `tagged` の場合、オーディオをトリガーするにはこれらのディレクティブが必要です。

有効にすると、モデルは `[[tts:...]]` ディレクティブを発行して音声をオーバーライドできます。
単一の応答の場合、オプションの `[[tts:text]]...[[/tts:text]]` ブロックを加えて、
にのみ表示される表現力豊かなタグ (笑い、歌の合図など) を提供します。
オーディオ。

`provider=...` ディレクティブは、`modelOverrides.allowProvider: true` でない限り無視されます。

応答ペイロードの例:

```

Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]

````

利用可能なディレクティブ キー (有効な場合):

- `provider` (`openai` | `elevenlabs` | `edge`、`allowProvider: true` が必要)
- `voice` (OpenAI 音声) または `voiceId` (イレブンラボ)
- `model` (OpenAI TTS モデルまたは Celebrities モデル ID)
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

すべてのモデルのオーバーライドを無効にします。

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
````

オプションの許可リスト (他のノブを構成可能なままにしてプロバイダーの切り替えを有効にする):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## ユーザーごとの設定

スラッシュ コマンドは、ローカル オーバーライドを `prefsPath` に書き込みます (デフォルト:
`~/.openclaw/settings/tts.json`、`OPENCLAW_TTS_PREFS` でオーバーライドするか、
`messages.tts.prefsPath`)。

保存されたフィールド:- `enabled`

- `provider`
- `maxLength` (概要しきい値、デフォルトは 1500 文字)
- `summarize` (デフォルト `true`)

これらは、そのホストの `messages.tts.*` をオーバーライドします。

## 出力形式 (固定)

- **テレグラム**: Opus 音声メモ (イレブンラボからの `opus_48000_64`、OpenAI からの `opus`)。
  - 48kHz / 64kbps は音声とノートの適切なトレードオフであり、丸いバブルに必要です。
- **その他のチャンネル**: MP3 (イレブンラボの `mp3_44100_128`、OpenAI の `mp3`)。
  - 44.1kHz / 128kbps は、音声を明瞭にするためのデフォルトのバランスです。
- **エッジ TTS**: `edge.outputFormat` (デフォルト `audio-24khz-48kbitrate-mono-mp3`) を使用します。
  - `node-edge-tts` は `outputFormat` を受け入れますが、すべての形式が利用できるわけではありません
    エッジサービスから。 引用turn2search0
  - 出力形式の値は、Microsoft Speech 出力形式 (Ogg/WebM Opus を含む) に従います。 引用turn1search0
  - テレグラム `sendVoice` は OGG/MP3/M4A を受け入れます。必要に応じて OpenAI/イレブンラボを使用してください
    Opus の音声メモを保証します。 引用turn1search1
  - 設定された Edge 出力形式が失敗した場合、OpenClaw は MP3 で再試行します。

OpenAI/イレブンラボの形式は固定されています。 Telegram は Opus にボイスノート UX を期待しています。

## 自動 TTS 動作

有効にすると、OpenClaw は次のことを行います。- 応答にすでにメディアまたは `MEDIA:` ディレクティブが含まれている場合は、TTS をスキップします。

- 非常に短い返信 (10 文字未満) をスキップします。
- `agents.defaults.model.primary` (または `summaryModel`) を使用して有効にすると、長い返信を要約します。
- 生成された音声を返信に添付します。

応答が `maxLength` を超え、要約がオフの場合 (または、
サマリーモデル)、オーディオ
はスキップされ、通常のテキスト応答が送信されます。

## フロー図

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## スラッシュコマンドの使用法

コマンドは `/tts` という 1 つだけです。
有効化の詳細については、[スラッシュ コマンド](/tools/slash-commands) を参照してください。

Discord に関する注意: `/tts` は組み込みの Discord コマンドであるため、OpenClaw は
`/voice` をネイティブ コマンドとして使用します。テキスト `/tts ...` は引き続き機能します。

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

注:

- コマンドには承認された送信者が必要です (許可リスト/所有者のルールが引き続き適用されます)。
- `commands.text` またはネイティブ コマンドの登録が有効になっている必要があります。
- `off|always|inbound|tagged` はセッションごとの切り替えです (`/tts on` は `/tts always` のエイリアスです)。
- `limit` および `summary` は、メイン設定ではなくローカル設定に保存されます。
- `/tts audio` は 1 回限りの音声応答を生成します (TTS をオンに切り替えません)。

## エージェントツール

`tts` ツールはテキストを音声に変換し、`MEDIA:` パスを返します。とき
結果は Telegram と互換性があり、ツールには `[[audio_as_voice]]` が含まれているため、
Telegram は音声バブルを送信します。

## ゲートウェイ RPCゲートウェイ方式

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
