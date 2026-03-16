---
summary: "인바운드 음성 메모용 Deepgram 전사"
description: "OpenClaw에서 Deepgram으로 인바운드 음성 메모를 전사하고 audio 옵션과 provider setting을 구성하는 방법을 설명합니다."
read_when:
  - 오디오 첨부 파일에 Deepgram speech-to-text 를 사용하고 싶을 때
  - 빠른 Deepgram 설정 예시가 필요할 때
title: "Deepgram"
---

# Deepgram (오디오 전사)

Deepgram 은 speech-to-text API 입니다. OpenClaw 에서는 `tools.media.audio` 를 통한 **인바운드 오디오/음성 메모 전사** 에 사용됩니다.

활성화되면 OpenClaw 는 오디오 파일을 Deepgram 으로 업로드하고, 전사 결과를 reply pipeline (`{{Transcript}}` + `[Audio]` block) 안에 주입합니다. 이것은 **스트리밍이 아니며** 사전 녹음 전사 엔드포인트를 사용합니다.

Website: [https://deepgram.com](https://deepgram.com)  
Docs: [https://developers.deepgram.com](https://developers.deepgram.com)

## 빠른 시작

1. API 키 설정:

```
DEEPGRAM_API_KEY=dg_...
```

2. 프로바이더 활성화:

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

## 옵션

- `model`: Deepgram 모델 id (기본값: `nova-3`)
- `language`: 언어 힌트 (선택 사항)
- `tools.media.audio.providerOptions.deepgram.detect_language`: 언어 감지 활성화 (선택 사항)
- `tools.media.audio.providerOptions.deepgram.punctuate`: 구두점 활성화 (선택 사항)
- `tools.media.audio.providerOptions.deepgram.smart_format`: smart formatting 활성화 (선택 사항)

언어를 지정한 예시:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
      },
    },
  },
}
```

Deepgram 옵션 예시:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        providerOptions: {
          deepgram: {
            detect_language: true,
            punctuate: true,
            smart_format: true,
          },
        },
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

## 메모

- 인증은 표준 프로바이더 auth 순서를 따르며, 가장 간단한 방법은 `DEEPGRAM_API_KEY` 입니다.
- proxy 를 사용할 때는 `tools.media.audio.baseUrl` 과 `tools.media.audio.headers` 로 엔드포인트나 헤더를 재정의할 수 있습니다.
- 출력은 다른 프로바이더 와 같은 오디오 규칙(size cap, timeout, transcript injection)을 따릅니다.
