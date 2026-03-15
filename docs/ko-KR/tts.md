---
summary: "발신 응답을 위한 텍스트 음성 변환(TTS) 설정 및 사용 가이드"
read_when:
  - 에이전트 응답에 TTS 기능을 활성화하고자 할 때
  - TTS 공급자 설정 및 텍스트 제한을 변경할 때
  - "`/tts` 슬래시 명령어 사용법이 궁금할 때"
title: "텍스트 음성 변환 (TTS)"
x-i18n:
  source_path: "tts.md"
---

# 텍스트 음성 변환 (TTS)

OpenClaw는 ElevenLabs, OpenAI 또는 Edge TTS를 사용하여 에이전트의 응답을 오디오 데이터로 변환할 수 있음. 오디오 전송이 가능한 모든 채널에서 작동하며, 특히 Telegram에서는 원형 음성 메시지(Voice Note) 형태로 전송됨.

## 지원 서비스 목록

- **ElevenLabs**: 고품질 음성을 제공하는 주요 또는 폴백(Fallback) 공급자.
- **OpenAI**: 주요 또는 폴백 공급자로 사용되며, 자동 요약 기능에도 활용됨.
- **Edge TTS**: Microsoft Edge의 신경망 기반 TTS 서비스를 활용함. API 키 없이 사용 가능한 기본 공급자임.

### Edge TTS 참고 사항

Edge TTS는 `node-edge-tts` 라이브러리를 통해 Microsoft의 공개 엔드포인트를 사용함. 이는 로컬 실행이 아닌 호스팅 서비스이며 별도의 API 키가 필요하지 않음.

**주의:** Edge TTS는 별도의 서비스 수준 계약(SLA)이나 할당량(Quota)이 명시되지 않은 공용 웹 서비스이므로 최선 노력(Best-effort) 방식으로 제공됨. 안정적인 서비스가 필요한 경우 OpenAI나 ElevenLabs 사용을 권장함. 일반적으로 요청당 약 10분 정도의 오디오 생성 제한이 있는 것으로 간주함.

## 인증 및 키 설정

OpenAI 또는 ElevenLabs를 사용하려면 다음 환경 변수가 필요함:

- `ELEVENLABS_API_KEY` (또는 `XI_API_KEY`)
- `OPENAI_API_KEY`

Edge TTS는 API 키가 필요하지 않음. 설정된 키가 없을 경우 OpenClaw는 자동으로 Edge TTS를 기본 공급자로 선택함.

여러 공급자가 설정된 경우, 지정된 공급자를 우선 사용하고 나머지는 폴백 옵션으로 활용함. 자동 요약 기능을 활성화한 경우, 해당 모델(`summaryModel`) 공급자의 인증도 완료되어 있어야 함.

## 기본 활성화 여부

자동 TTS 기능은 기본적으로 **비활성화(Off)** 상태임. 활성화하려면 `openclaw.json` 설정 파일의 `messages.tts.auto` 값을 수정하거나, 세션 내에서 `/tts always`(또는 `/tts on`) 명령어를 입력함.

## 설정 가이드

TTS 설정은 `openclaw.json`의 `messages.tts` 섹션에서 관리함. 상세 스키마는 [Gateway 설정 레퍼런스](/gateway/configuration)를 참조함.

### 기본 설정 예시 (공급자 지정)

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

### OpenAI를 주 공급자로, ElevenLabs를 폴백으로 설정

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4o-mini", // 요약용 모델
      openai: {
        apiKey: "YOUR_OPENAI_KEY",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
      elevenlabs: {
        apiKey: "YOUR_ELEVENLABS_KEY",
        voiceId: "pMsXgVXv3BLzUgSXRplE",
      },
    },
  },
}
```

### Edge TTS 설정 (API 키 미사용)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "edge",
      edge: {
        voice: "ko-KR-SunHiNeural", // 한국어 음성 예시
        rate: "+10%",
        pitch: "-5%",
      },
    },
  },
}
```

### 주요 설정 필드 설명

- `auto`: 자동 TTS 모드 설정 (`off`, `always`, `inbound`, `tagged`).
  - `inbound`: 사용자가 음성 메시지를 보냈을 때만 오디오로 응답함.
  - `tagged`: 응답 텍스트에 `[[tts]]` 태그가 포함된 경우에만 오디오를 생성함.
- `provider`: 사용할 공급자 (`elevenlabs`, `openai`, `edge`). 미지정 시 키 존재 여부에 따라 자동 선택됨.
- `summaryModel`: 긴 응답을 요약할 때 사용할 모델. 미지정 시 기본 모델을 사용함.
- `maxTextLength`: TTS 입력 텍스트의 최대 길이 제한. 초과 시 오디오 생성이 취소됨.
- `timeoutMs`: 오디오 생성 요청 타임아웃 시간 (ms 단위).

## 모델 주도 제어 (Model-driven Overrides)

에이전트 모델이 응답 시 직접 TTS 동작을 제어할 수 있음. 이를 통해 특정 문장에서만 목소리를 바꾸거나, 텍스트에는 나타나지 않는 감정 표현(웃음 등)을 추가할 수 있음.

**응답 예시:**

```text
여기 요청하신 내용입니다.

[[tts:voiceId=EXAV8IDyx9mFs7qc9R28 speed=1.1]]
[[tts:text]](웃음) 노래를 한 번 더 들려드릴까요?[[/tts:text]]
```

## 출력 포맷 정보

- **Telegram**: Opus 포맷 음성 메시지로 전송됨 (원형 UI 지원).
- **기타 채널**: 가독성과 호환성을 고려하여 MP3 포맷(44.1kHz / 128kbps)으로 전송됨.
- **Edge TTS**: 지정된 `outputFormat`을 따르며, 실패 시 MP3로 자동 재시도함.

## 자동 TTS 처리 흐름

1. 응답에 이미 이미지/비디오 등 미디어가 포함된 경우 TTS를 건너뜀.
2. 10자 미만의 매우 짧은 응답은 건너뜀.
3. 응답이 설정된 `maxLength`보다 긴 경우, 요약 모델을 통해 내용을 요약한 후 오디오를 생성함.
4. 생성된 오디오 파일을 메시지에 첨부하여 전송함.

## 슬래시 명령어 사용법

모든 채널에서 `/tts` 명령어를 사용할 수 있음. (단, Discord에서는 `/voice` 명령어로 대체됨)

- `/tts off`: TTS 기능 끄기.
- `/tts always`: 모든 응답을 오디오로 변환.
- `/tts status`: 현재 TTS 설정 상태 확인.
- `/tts provider openai`: 공급자 즉시 변경.
- `/tts audio [텍스트]`: 일회성 음성 메시지 생성.

## Gateway RPC 메서드

시스템 연동을 위해 다음 RPC 메서드를 제공함:

- `tts.status`, `tts.enable`, `tts.disable`, `tts.convert`, `tts.setProvider`
