---
summary: "발신 응답을 위한 텍스트 음성 변환(TTS)"
read_when:
  - 응답에 텍스트 음성 변환을 활성화할 때
  - TTS 제공업체나 제한을 설정할 때
  - /tts 명령을 사용할 때
title: "텍스트 음성 변환"
x-i18n:
  source_path: "tts.md"
---

# 텍스트 음성 변환(TTS)

OpenClaw는 ElevenLabs, OpenAI 또는 Edge TTS를 사용해 발신 응답을 오디오로 변환할 수 있습니다.
OpenClaw가 오디오를 보낼 수 있는 곳이라면 어디서나 동작하며, Telegram에서는 둥근 음성 노트 버블로 표시됩니다.

## 지원 서비스

- **ElevenLabs** (기본 제공업체 또는 fallback 제공업체)
- **OpenAI** (기본 제공업체 또는 fallback 제공업체, 요약에도 사용)
- **Edge TTS** (기본 제공업체 또는 fallback 제공업체, API 키가 없을 때 기본값으로 `node-edge-tts` 사용)

### Edge TTS 참고

Edge TTS는 `node-edge-tts` 라이브러리를 통해 Microsoft Edge의 온라인 neural TTS 서비스를 사용합니다.
호스팅된 서비스이며(로컬 실행 아님), Microsoft의 endpoint를 사용하고, API 키가 필요하지 않습니다. `node-edge-tts`는 음성 설정 옵션과 출력 포맷을 노출하지만, 모든 옵션이 Edge 서비스에서 지원되는 것은 아닙니다. citeturn2search0

Edge TTS는 공개 웹 서비스이고 게시된 SLA나 quota가 없으므로 best-effort로 간주해야 합니다.
보장된 제한과 지원이 필요하다면 OpenAI 또는 ElevenLabs를 사용하세요.
Microsoft Speech REST API 문서는 요청당 10분 오디오 제한을 설명하지만, Edge TTS는 제한을 공개하지 않으므로 비슷하거나 더 낮은 제한을 가정하세요. citeturn0search3

## 선택적 키

OpenAI나 ElevenLabs를 사용하려면 다음이 필요합니다.

- `ELEVENLABS_API_KEY` (또는 `XI_API_KEY`)
- `OPENAI_API_KEY`

Edge TTS는 API 키가 **필요하지 않습니다**. API 키가 하나도 없으면 OpenClaw는 기본적으로 Edge TTS를 사용합니다(`messages.tts.edge.enabled=false`로 비활성화하지 않은 경우).

여러 제공업체가 설정돼 있으면 선택된 제공업체를 먼저 사용하고, 나머지는 fallback 옵션으로 사용합니다.
자동 요약은 설정된 `summaryModel`(또는 `agents.defaults.model.primary`)을 사용하므로, 요약을 활성화했다면 해당 제공업체에도 인증이 되어 있어야 합니다.

## 서비스 링크

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## 기본적으로 활성화되나요?

아니요. 자동 TTS는 기본적으로 **꺼져 있습니다**. 설정의 `messages.tts.auto` 또는 세션별 `/tts always`(별칭: `/tts on`)로 활성화하세요.

TTS가 켜진 상태라면 Edge TTS는 기본적으로 **활성화**되어 있으며, OpenAI나 ElevenLabs API 키가 없을 때 자동으로 사용됩니다.

## 설정

TTS 설정은 `openclaw.json`의 `messages.tts` 아래에 있습니다.
전체 스키마는 [Gateway configuration](/gateway/configuration)을 참고하세요.

### 최소 설정 활성화 + 제공업체

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

### OpenAI 기본 + ElevenLabs fallback

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

### Edge TTS 기본 API 키 없음

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

### Edge TTS 비활성화

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

### 커스텀 제한 + prefs 경로

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

### 수신된 음성 노트 뒤에만 오디오로 응답

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### 긴 응답의 자동 요약 비활성화

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

그런 다음 실행하세요.

```
/tts summary off
```

### 필드 참고

- `auto`: 자동 TTS 모드(`off`, `always`, `inbound`, `tagged`)
  - `inbound`는 수신 음성 노트 뒤에만 오디오를 보냅니다.
  - `tagged`는 응답에 `[[tts]]` 태그가 포함된 경우에만 오디오를 보냅니다.
- `enabled`: 레거시 토글(`doctor`가 이를 `auto`로 마이그레이션함)
- `mode`: `"final"`(기본값) 또는 `"all"`(tool/block 응답 포함)
- `provider`: `"elevenlabs"`, `"openai"`, `"edge"`(fallback은 자동)
- `provider`가 **설정되지 않으면** OpenClaw는 `openai`(키가 있으면), 그다음 `elevenlabs`(키가 있으면), 그렇지 않으면 `edge`를 선호합니다.
- `summaryModel`: 자동 요약용 선택적 저비용 모델. 기본값은 `agents.defaults.model.primary`
  - `provider/model` 또는 설정된 모델 alias를 받을 수 있습니다.
- `modelOverrides`: 모델이 TTS 지시문을 내보내도록 허용(기본값: 활성화)
  - `allowProvider`의 기본값은 `false`이며(제공업체 전환은 opt-in)
- `maxTextLength`: TTS 입력의 하드 제한(문자 수). 초과하면 `/tts audio`가 실패합니다.
- `timeoutMs`: 요청 타임아웃(ms)
- `prefsPath`: 로컬 prefs JSON 경로(provider/limit/summary)를 재정의
- `apiKey` 값은 환경 변수(`ELEVENLABS_API_KEY`/`XI_API_KEY`, `OPENAI_API_KEY`)로 대체할 수 있습니다.
- `elevenlabs.baseUrl`: ElevenLabs API 기본 URL 재정의
- `openai.baseUrl`: OpenAI TTS endpoint 재정의
  - 해석 순서: `messages.tts.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - 기본값이 아닌 값은 OpenAI 호환 TTS endpoint로 간주하므로, 커스텀 모델명과 voice 이름을 사용할 수 있습니다.
- `elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `elevenlabs.applyTextNormalization`: `auto|on|off`
- `elevenlabs.languageCode`: 2자리 ISO 639-1 (예: `en`, `de`)
- `elevenlabs.seed`: 정수 `0..4294967295` (best-effort determinism)
- `edge.enabled`: Edge TTS 사용 허용(기본값 `true`, API 키 없음)
- `edge.voice`: Edge neural voice 이름(예: `en-US-MichelleNeural`)
- `edge.lang`: 언어 코드(예: `en-US`)
- `edge.outputFormat`: Edge 출력 포맷(예: `audio-24khz-48kbitrate-mono-mp3`)
  - 유효한 값은 Microsoft Speech output formats를 참고하세요. 모든 포맷이 Edge에서 지원되는 것은 아닙니다.
- `edge.rate` / `edge.pitch` / `edge.volume`: 퍼센트 문자열(예: `+10%`, `-5%`)
- `edge.saveSubtitles`: 오디오 파일과 함께 JSON 자막을 기록
- `edge.proxy`: Edge TTS 요청용 proxy URL
- `edge.timeoutMs`: 요청 타임아웃 재정의(ms)

## 모델 주도 오버라이드 기본 활성화

기본적으로 모델은 단일 응답에 대해 TTS 지시문을 **낼 수 있습니다**.
`messages.tts.auto`가 `tagged`일 때는 오디오를 트리거하려면 이 지시문이 필요합니다.

활성화되면 모델은 단일 응답에서 음성을 바꾸기 위해 `[[tts:...]]` 지시문을 낼 수 있고, 선택적으로 `[[tts:text]]...[[/tts:text]]` 블록을 사용해 오디오에만 들어가야 하는 표현 태그(웃음, 노래 지시 등)를 제공할 수 있습니다.

`provider=...` 지시문은 `modelOverrides.allowProvider: true`가 아닌 한 무시됩니다.

예시 응답 payload:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

활성화 시 사용 가능한 directive key:

- `provider` (`openai` | `elevenlabs` | `edge`, `allowProvider: true` 필요)
- `voice` (OpenAI voice) 또는 `voiceId` (ElevenLabs)
- `model` (OpenAI TTS model 또는 ElevenLabs model id)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

모든 모델 오버라이드를 비활성화:

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

선택적 허용 목록: 제공업체 전환을 허용하면서 다른 옵션은 계속 설정 가능

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

## 사용자별 환경설정

슬래시 명령은 로컬 오버라이드를 `prefsPath`에 기록합니다(기본값: `~/.openclaw/settings/tts.json`, `OPENCLAW_TTS_PREFS` 또는 `messages.tts.prefsPath`로 재정의 가능).

저장되는 필드:

- `enabled`
- `provider`
- `maxLength` (요약 임계값, 기본값 1500자)
- `summarize` (기본값 `true`)

이 값들은 해당 호스트의 `messages.tts.*`를 재정의합니다.

## 출력 포맷 고정

- **Telegram**: Opus 음성 노트(`opus_48000_64` from ElevenLabs, `opus` from OpenAI)
  - 48kHz / 64kbps는 음성 노트에 적절한 절충점이며 둥근 버블 UI에 필요합니다.
- **다른 채널**: MP3 (`mp3_44100_128` from ElevenLabs, `mp3` from OpenAI)
  - 44.1kHz / 128kbps는 음성 명료도를 위한 기본 균형값입니다.
- **Edge TTS**: `edge.outputFormat` 사용(기본값 `audio-24khz-48kbitrate-mono-mp3`)
  - `node-edge-tts`는 `outputFormat`을 받지만, 모든 포맷이 Edge 서비스에서 사용 가능한 것은 아닙니다. citeturn2search0
  - 출력 포맷 값은 Microsoft Speech output formats를 따르며(Ogg/WebM Opus 포함), citeturn1search0
  - Telegram의 `sendVoice`는 OGG/MP3/M4A를 허용합니다. 보장된 Opus 음성 노트가 필요하면 OpenAI/ElevenLabs를 사용하세요. citeturn1search1
  - 설정된 Edge 출력 포맷이 실패하면 OpenClaw는 MP3로 재시도합니다.

OpenAI/ElevenLabs 포맷은 고정되어 있으며, Telegram의 음성 노트 UX는 Opus를 기대합니다.

## 자동 TTS 동작

활성화되면 OpenClaw는 다음과 같이 동작합니다.

- 응답에 이미 미디어나 `MEDIA:` 지시문이 있으면 TTS를 건너뜁니다.
- 너무 짧은 응답(< 10자)은 건너뜁니다.
- 긴 응답은 활성화된 경우 `agents.defaults.model.primary`(또는 `summaryModel`)를 사용해 요약합니다.
- 생성된 오디오를 응답에 첨부합니다.

응답이 `maxLength`를 초과하고 요약이 꺼져 있거나(또는 summary model용 API 키가 없으면), 오디오는 건너뛰고 일반 텍스트 응답만 전송합니다.

## 흐름도

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

## 슬래시 명령 사용법

명령은 하나뿐입니다: `/tts`
활성화 방법은 [Slash commands](/tools/slash-commands)를 참고하세요.

Discord 참고: `/tts`는 Discord 내장 명령이므로, OpenClaw는 기본 명령으로 `/voice`를 등록합니다. 텍스트 `/tts ...`는 여전히 동작합니다.

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

참고:

- 명령에는 승인된 발신자가 필요합니다(allowlist/owner 규칙은 그대로 적용).
- `commands.text` 또는 네이티브 명령 등록이 활성화되어 있어야 합니다.
- `off|always|inbound|tagged`는 세션별 토글이며(`/tts on`은 `/tts always`의 별칭)
- `limit`과 `summary`는 메인 설정이 아니라 로컬 prefs에 저장됩니다.
- `/tts audio`는 일회성 오디오 응답을 생성하며 TTS를 켜지는 않습니다.

## 에이전트 도구

`tts` 도구는 텍스트를 음성으로 변환하고 `MEDIA:` 경로를 반환합니다. 결과가 Telegram 호환이면, 이 도구는 `[[audio_as_voice]]`를 포함해 Telegram이 음성 버블로 전송하도록 합니다.

## Gateway RPC

Gateway 메서드:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
