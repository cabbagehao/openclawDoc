---
summary: "Voice Call 플러그인: Twilio/Telnyx/Plivo를 통한 outbound + inbound 통화(플러그인 설치 + config + CLI)"
read_when:
  - OpenClaw에서 outbound 음성 통화를 걸고 싶을 때
  - voice-call 플러그인을 설정하거나 개발할 때
title: "Voice Call 플러그인"
x-i18n:
  source_path: "plugins/voice-call.md"
---

# Voice Call (플러그인)

플러그인을 통해 OpenClaw에서 음성 통화를 처리합니다. outbound 알림과
inbound 정책이 적용된 multi-turn 대화를 지원합니다.

현재 provider:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (개발용/네트워크 없음)

빠른 개념 정리:

- 플러그인 설치
- Gateway 재시작
- `plugins.entries.voice-call.config` 아래에서 설정
- `openclaw voicecall ...` 또는 `voice_call` 도구 사용

## 실행 위치(로컬 vs 원격)

Voice Call 플러그인은 **Gateway 프로세스 내부**에서 실행됩니다.

원격 Gateway를 사용 중이라면, **Gateway가 실행되는 머신**에 플러그인을
설치/설정한 뒤 Gateway를 재시작해 로드하세요.

## 설치

### 옵션 A: npm에서 설치(권장)

```bash
openclaw plugins install @openclaw/voice-call
```

이후 Gateway를 재시작하세요.

### 옵션 B: 로컬 폴더에서 설치(dev, 복사 없음)

```bash
openclaw plugins install ./extensions/voice-call
cd ./extensions/voice-call && pnpm install
```

이후 Gateway를 재시작하세요.

## 설정

config는 `plugins.entries.voice-call.config` 아래에 둡니다.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // 또는 "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx Mission Control Portal에서 발급한
            // Telnyx webhook 공개 키(Base64 문자열, TELNYX_PUBLIC_KEY로도 설정 가능).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook 서버
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook 보안(터널/프록시 사용 시 권장)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 공개 노출 방식(하나만 선택)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            streamPath: "/voice/stream",
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

참고:

- Twilio/Telnyx는 **외부에서 접근 가능한** webhook URL이 필요합니다.
- Plivo도 **외부에서 접근 가능한** webhook URL이 필요합니다.
- `mock`은 로컬 개발용 provider입니다(네트워크 호출 없음).
- Telnyx는 `skipSignatureVerification`이 true가 아닌 한 `telnyx.publicKey`(또는 `TELNYX_PUBLIC_KEY`)가 필요합니다.
- `skipSignatureVerification`은 로컬 테스트 전용입니다.
- ngrok 무료 티어를 쓴다면 `publicUrl`을 정확한 ngrok URL로 설정하세요. 서명 검증은 항상 강제됩니다.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true`는 `tunnel.provider="ngrok"`이고 `serve.bind`가 loopback(ngrok 로컬 에이전트)일 때만 **유효하지 않은 서명을 가진** Twilio webhook을 허용합니다. 로컬 개발 전용입니다.
- ngrok 무료 티어 URL은 바뀌거나 interstitial 동작이 추가될 수 있습니다. `publicUrl`이 어긋나면 Twilio 서명 검증이 실패합니다. 프로덕션에서는 안정적인 도메인이나 Tailscale funnel을 권장합니다.
- 스트리밍 보안 기본값:
  - `streaming.preStartTimeoutMs`는 유효한 `start` 프레임을 보내지 않는 소켓을 닫습니다.
  - `streaming.maxPendingConnections`는 인증 전 pre-start 소켓의 전체 개수를 제한합니다.
  - `streaming.maxPendingConnectionsPerIp`는 인증 전 pre-start 소켓의 IP별 개수를 제한합니다.
  - `streaming.maxConnections`는 열린 미디어 스트림 소켓 전체 개수(pending + active)를 제한합니다.

## 오래된 호출 정리기

`staleCallReaperSeconds`를 사용하면 종료 webhook을 끝내 받지 못한 호출을
종료할 수 있습니다(예: 끝까지 완료되지 않는 notify 모드 통화). 기본값은
`0`(비활성화)입니다.

권장 범위:

- **프로덕션:** notify 스타일 흐름에는 `120`–`300`초
- 일반 통화가 정상 종료될 수 있도록 이 값은 **`maxDurationSeconds`보다 크게** 유지하세요. 시작점으로는 `maxDurationSeconds + 30–60`초가 적당합니다.

예시:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Webhook 보안

프록시나 터널이 Gateway 앞에 있을 때, 플러그인은 서명 검증을 위해 공개 URL을
재구성합니다. 아래 옵션으로 어떤 forwarded header를 신뢰할지 제어합니다.

`webhookSecurity.allowedHosts`는 forwarded header에서 허용할 host를
allowlist로 제한합니다.

`webhookSecurity.trustForwardingHeaders`는 allowlist 없이 forwarded header를
신뢰합니다.

`webhookSecurity.trustedProxyIPs`는 요청의 remote IP가 목록과 일치할 때만
forwarded header를 신뢰합니다.

Twilio와 Plivo에는 webhook 재전송 방지가 활성화되어 있습니다. 재전송된 유효
webhook 요청은 응답은 하지만 부수효과는 건너뜁니다.

Twilio 대화 턴에는 `<Gather>` callback마다 턴별 토큰이 포함되므로,
오래되었거나 재전송된 speech callback이 더 최신의 pending transcript turn을
만족시키지 못합니다.

안정적인 공개 host를 사용하는 예시:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## 통화용 TTS

Voice Call은 통화 중 스트리밍 음성을 위해 core `messages.tts` 설정(OpenAI
또는 ElevenLabs)을 사용합니다. 플러그인 config 아래에서 **같은 형태**로
override할 수도 있으며, 이 값은 `messages.tts`와 deep-merge됩니다.

```json5
{
  tts: {
    provider: "elevenlabs",
    elevenlabs: {
      voiceId: "pMsXgVXv3BLzUgSXRplE",
      modelId: "eleven_multilingual_v2",
    },
  },
}
```

참고:

- **Edge TTS는 음성 통화에서 무시됩니다**(전화 오디오는 PCM이 필요하고, Edge 출력은 신뢰성이 낮습니다).
- Twilio 미디어 스트리밍이 활성화된 경우에는 core TTS를 사용하고, 그렇지 않으면 provider 기본 음성으로 fallback합니다.

### 추가 예시

core TTS만 사용(override 없음):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      openai: { voice: "alloy" },
    },
  },
}
```

통화에만 ElevenLabs로 override(core 기본값은 다른 곳에서 유지):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            elevenlabs: {
              apiKey: "elevenlabs_key",
              voiceId: "pMsXgVXv3BLzUgSXRplE",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

통화용 OpenAI 모델만 override(deep-merge 예시):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            openai: {
              model: "gpt-4o-mini-tts",
              voice: "marin",
            },
          },
        },
      },
    },
  },
}
```

## 수신 통화

기본 inbound policy는 `disabled`입니다. 수신 통화를 활성화하려면 다음을
설정하세요.

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

자동 응답은 에이전트 시스템을 사용합니다. 다음 항목으로 조정할 수 있습니다.

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall expose --mode funnel
```

## 에이전트 도구

도구 이름: `voice_call`

액션:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

이 저장소에는 대응되는 스킬 문서 `skills/voice-call/SKILL.md`도 함께 들어 있습니다.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
