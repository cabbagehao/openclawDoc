---
summary: "Text-to-speech (TTS) for outbound replies"
description: "OpenClaw에서 ElevenLabs, OpenAI, Edge TTS를 사용해 응답을 오디오로 보내는 방법, provider fallback, slash command, 출력 형식을 정리합니다."
read_when:
  - "reply에 text-to-speech를 켜고 싶을 때"
  - "TTS provider나 제한값을 조정할 때"
  - "`/tts` 명령 사용법을 확인할 때"
title: "Text-to-Speech"
x-i18n:
  source_path: "tts.md"
---

# Text-to-speech (TTS)

OpenClaw는 ElevenLabs, OpenAI, Edge TTS를 사용해 outbound reply를 오디오로 변환할 수 있습니다. OpenClaw가 audio를 보낼 수 있는 채널이라면 어디서든 동작하며, Telegram에서는 round voice-note bubble로 전송됩니다.

## Supported services

- **ElevenLabs** (primary 또는 fallback provider)
- **OpenAI** (primary 또는 fallback provider, summary에도 사용)
- **Edge TTS** (primary 또는 fallback provider, API key가 없을 때 기본값으로 동작)

### Edge TTS notes

Edge TTS는 `node-edge-tts` 라이브러리를 통해 Microsoft Edge의 online neural TTS service를 사용합니다. 로컬 서비스가 아니라 hosted service이며, Microsoft endpoint를 사용하고 API key가 필요하지 않습니다. `node-edge-tts`는 speech configuration option과 output format을 제공하지만, Edge service가 모든 옵션을 지원하는 것은 아닙니다.

Edge TTS는 공개 SLA나 quota가 명시된 서비스가 아니므로 best-effort로 취급해야 합니다. 보장된 한도와 지원이 필요하면 OpenAI 또는 ElevenLabs를 사용하세요. Microsoft Speech REST API는 요청당 10분 audio limit를 문서화하고 있지만, Edge TTS 자체는 한도를 공개하지 않으므로 유사하거나 더 낮은 제한을 가정하는 편이 안전합니다.

## Optional keys

OpenAI 또는 ElevenLabs를 쓰려면 다음이 필요합니다.

- `ELEVENLABS_API_KEY` (또는 `XI_API_KEY`)
- `OPENAI_API_KEY`

Edge TTS는 API key가 필요하지 않습니다. 어떤 API key도 없으면 OpenClaw는 Edge TTS를 기본값으로 사용합니다. 단, `messages.tts.edge.enabled=false`로 비활성화한 경우는 예외입니다.

여러 provider가 설정되어 있으면, 선택된 provider를 먼저 사용하고 나머지를 fallback으로 사용합니다.
Auto-summary는 설정된 `summaryModel` 또는 `agents.defaults.model.primary`를 사용하므로, summary를 켜면 해당 provider 인증도 되어 있어야 합니다.

## Service links

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Is it enabled by default?

아니요. Auto-TTS는 기본적으로 **off**입니다. config에서 `messages.tts.auto`를 설정하거나, session별로 `/tts always` (`/tts on` alias)을 사용해 켜야 합니다.

단, TTS 자체가 켜진 이후에는 Edge TTS는 기본 활성화 상태이며, OpenAI 또는 ElevenLabs API key가 없을 때 자동 선택됩니다.

## Config

TTS config는 `openclaw.json`의 `messages.tts` 아래에 있습니다.
전체 schema는 [Gateway configuration](/gateway/configuration)에 있습니다.

### Minimal config (enable + provider)

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

### OpenAI primary with ElevenLabs fallback

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

### Edge TTS primary (no API key)

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

### Disable Edge TTS

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

### Custom limits + prefs path

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

### Only reply with audio after an inbound voice note

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Disable auto-summary for long replies

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

그 다음 다음 명령을 실행합니다.

```
/tts summary off
```

### Notes on fields

- `auto`: auto-TTS mode (`off`, `always`, `inbound`, `tagged`)
  - `inbound`는 inbound voice note가 있을 때만 audio를 전송
  - `tagged`는 reply에 `[[tts]]` tag가 있을 때만 audio를 전송
- `enabled`: legacy toggle (`doctor`가 이를 `auto`로 migrate)
- `mode`: `"final"` (default) 또는 `"all"` (tool/block reply 포함)
- `provider`: `"elevenlabs"`, `"openai"`, `"edge"` (fallback은 자동)
- `provider`가 unset이면 OpenClaw는 `openai` (key가 있으면) → `elevenlabs` (key가 있으면) → `edge` 순으로 선호
- `summaryModel`: 긴 reply용 저비용 model, 기본값은 `agents.defaults.model.primary`
  - `provider/model` 형식 또는 configured model alias를 받을 수 있음
- `modelOverrides`: model이 TTS directive를 직접 내보낼 수 있게 허용. 기본값은 on
  - `allowProvider` 기본값은 `false`이므로, provider switching은 opt-in
- `maxTextLength`: TTS 입력 hard cap (문자 수). 초과하면 `/tts audio`는 실패
- `timeoutMs`: request timeout (ms)
- `prefsPath`: local prefs JSON path override (provider/limit/summary)
- `apiKey` 값은 env var (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `OPENAI_API_KEY`)로 fallback
- `elevenlabs.baseUrl`: ElevenLabs API base URL override
- `openai.baseUrl`: OpenAI TTS endpoint override
- `openai.baseUrl`
  - resolution order: `messages.tts.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - 기본값이 아닌 경우 OpenAI-compatible TTS endpoint로 취급하므로 custom model/voice name도 허용
- `elevenlabs.voiceSettings`
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (`1.0` = normal)
- `elevenlabs.applyTextNormalization`: `auto|on|off`
- `elevenlabs.languageCode`: 2-letter ISO 639-1 (예: `en`, `de`)
- `elevenlabs.seed`: integer `0..4294967295` (best-effort determinism)
- `edge.enabled`: Edge TTS 사용 허용 (default `true`; API key 불필요)
- `edge.voice`: Edge neural voice name (예: `en-US-MichelleNeural`)
- `edge.lang`: language code (예: `en-US`)
- `edge.outputFormat`: Edge output format (예: `audio-24khz-48kbitrate-mono-mp3`)
  - 유효 값은 Microsoft Speech output formats를 참고하세요. Edge가 모든 format을 지원하는 것은 아닙니다.
- `edge.rate` / `edge.pitch` / `edge.volume`: percent string (예: `+10%`, `-5%`)
- `edge.saveSubtitles`: audio 옆에 JSON subtitle도 기록
- `edge.proxy`: Edge TTS request용 proxy URL
- `edge.timeoutMs`: request timeout override (ms)

## Model-driven overrides (default on)

기본적으로 model은 **한 번의 reply에 한해** TTS directive를 출력할 수 있습니다.
`messages.tts.auto`가 `tagged`일 때는 이러한 directive가 있어야 audio가 생성됩니다.

활성화되면 model은 `[[tts:...]]` directive를 내보내 특정 reply의 voice를 override할 수 있습니다. 또한 `[[tts:text]]...[[/tts:text]]` block을 함께 사용하면, laughter나 singing cue처럼 오디오에만 들어가고 일반 텍스트에는 보이지 않아야 하는 표현을 넣을 수 있습니다.

`provider=...` directive는 `modelOverrides.allowProvider: true`일 때만 적용됩니다.

Example reply payload:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

사용 가능한 directive key:

- `provider` (`openai` | `elevenlabs` | `edge`, `allowProvider: true` 필요)
- `voice` (OpenAI voice) 또는 `voiceId` (ElevenLabs)
- `model` (OpenAI TTS model 또는 ElevenLabs model id)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

모든 model override를 끄려면:

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
```

provider switching만 허용하고 나머지 knob은 제한하려면:

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

## Per-user preferences

slash command는 local override를 `prefsPath`에 기록합니다.
기본값은 `~/.openclaw/settings/tts.json`이며, `OPENCLAW_TTS_PREFS` 또는 `messages.tts.prefsPath`로 override할 수 있습니다.

저장되는 필드:

- `enabled`
- `provider`
- `maxLength` (summary threshold, 기본값 1500자)
- `summarize` (기본값 `true`)

이 값들은 해당 host에서 `messages.tts.*`보다 우선합니다.

## Output formats (fixed)

- **Telegram**: Opus voice note (`opus_48000_64` from ElevenLabs, `opus` from OpenAI)
  - 48kHz / 64kbps는 voice note에 적절한 tradeoff이며 round bubble에 필요
- **Other channels**: MP3 (`mp3_44100_128` from ElevenLabs, `mp3` from OpenAI)
  - 44.1kHz / 128kbps는 speech clarity 기준 기본 균형값
- **Edge TTS**: `edge.outputFormat` 사용 (기본값 `audio-24khz-48kbitrate-mono-mp3`)
  - `node-edge-tts`는 `outputFormat`을 받지만, Edge service에서 모든 format을 사용할 수 있는 것은 아닙니다
  - output format 값은 Microsoft Speech output formats를 따릅니다 (Ogg/WebM Opus 포함)
  - Telegram `sendVoice`는 OGG/MP3/M4A를 받을 수 있지만, 확실한 Opus voice note UX가 필요하면 OpenAI 또는 ElevenLabs를 사용하세요
  - 설정된 Edge output format이 실패하면 OpenClaw는 MP3로 재시도합니다.

OpenAI/ElevenLabs의 format은 고정이며, Telegram voice-note UX에는 Opus가 기대됩니다.

## Auto-TTS behavior

활성화되면 OpenClaw는 다음처럼 동작합니다.

- reply에 이미 media 또는 `MEDIA:` directive가 있으면 TTS를 건너뜀
- 너무 짧은 reply(< 10자)는 건너뜀
- 긴 reply는 `agents.defaults.model.primary` 또는 `summaryModel`로 요약한 뒤 오디오 생성
- 생성된 audio를 reply에 첨부

reply가 `maxLength`를 초과했고 summary가 꺼져 있거나 summary model용 API key가 없으면, audio는 생략되고 일반 텍스트 reply만 전송됩니다.

## Flow diagram

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

## Slash command usage

명령은 하나입니다: `/tts`
enablement details는 [Slash commands](/tools/slash-commands)를 참고하세요.

Discord 참고: `/tts`는 Discord built-in command라서 OpenClaw는 native command를 `/voice`로 등록합니다. 텍스트 명령 `/tts ...` 자체는 여전히 동작합니다.

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

메모:

- 명령은 authorized sender여야 합니다. allowlist/owner rule은 그대로 적용됩니다.
- `commands.text` 또는 native command registration이 활성화되어 있어야 합니다.
- `off|always|inbound|tagged`는 session별 toggle입니다. (`/tts on`은 `/tts always` alias)
- `limit`와 `summary`는 main config가 아니라 local prefs에 저장됩니다.
- `/tts audio`는 일회성 audio reply를 생성하며 TTS를 켜두지는 않습니다.

## Agent tool

`tts` tool은 text를 speech로 변환하고 `MEDIA:` path를 반환합니다. 결과가 Telegram-compatible이면 tool은 `[[audio_as_voice]]`도 포함해 Telegram이 voice bubble로 보내도록 합니다.

## Gateway RPC

Gateway method:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
