---
summary: "Provider + CLI fallback을 갖춘 인바운드 image/audio/video 이해(선택 기능)"
read_when:
  - 미디어 이해 기능을 설계하거나 리팩터링할 때
  - 인바운드 audio/video/image 전처리를 조정할 때
title: "미디어 이해"
x-i18n:
  source_path: "nodes/media-understanding.md"
---

# 미디어 이해(인바운드) — 2026-01-17

OpenClaw는 reply pipeline이 실행되기 전에 **인바운드 미디어(image/audio/video)를 요약** 할 수 있습니다. 로컬 도구나 provider key가 있으면 자동 감지하며, 비활성화하거나 커스터마이즈할 수도 있습니다. 이해 기능이 꺼져 있어도 모델은 원본 파일/URL을 평소처럼 계속 받습니다.

## 목표

* 선택 사항: 인바운드 미디어를 짧은 텍스트로 먼저 소화해 routing과 명령 파싱을 더 빠르고 정확하게 만들기
* 원본 미디어 전달은 항상 유지
* **Provider API** 와 **CLI fallback** 둘 다 지원
* 다중 모델 + 순서 기반 fallback(error/size/timeout)

## 상위 동작 방식

1. 인바운드 첨부(`MediaPaths`, `MediaUrls`, `MediaTypes`)를 수집합니다.
2. 활성화된 각 capability(image/audio/video)에 대해 정책에 맞게 첨부를 선택합니다(기본: **first**).
3. size + capability + auth 기준으로 첫 번째 eligible model entry를 고릅니다.
4. 모델이 실패하거나 미디어가 너무 크면 **다음 엔트리로 fallback** 합니다.
5. 성공하면:
   * `Body`는 `[Image]`, `[Audio]`, `[Video]` 블록이 됩니다.
   * Audio는 `{{Transcript}}`를 설정합니다. 명령 파싱은 caption이 있으면 caption을, 없으면 transcript를 사용합니다.
   * Caption은 블록 안 `User text:`로 보존됩니다.

이해가 실패하거나 비활성화되어도 **reply flow는 원래 body + attachments로 계속** 진행됩니다.

## 설정 개요

`tools.media`는 **공용 models** 와 capability별 override를 지원합니다.

* `tools.media.models`: shared model list (`capabilities`로 제한 가능)
* `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  * defaults (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  * provider overrides (`baseUrl`, `headers`, `providerOptions`)
  * `tools.media.audio.providerOptions.deepgram`을 통한 Deepgram audio 옵션
  * audio transcript echo controls (`echoTranscript`, 기본 `false`; `echoFormat`)
  * 선택적 **capability별 `models` list** (shared models보다 우선)
  * `attachments` policy (`mode`, `maxAttachments`, `prefer`)
  * `scope` (channel/chatType/session key 기준 선택적 gating)
* `tools.media.concurrency`: capability별 최대 동시 실행 수(기본 **2**)

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

### 모델 엔트리

각 `models[]` 엔트리는 **provider** 또는 **CLI** 일 수 있습니다.

```json5
{
  type: "provider", // 생략하면 기본값
  provider: "openai",
  model: "gpt-5.2",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // 선택 사항, multi-modal 엔트리 제한
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

CLI templates는 다음도 사용할 수 있습니다.

* `{{MediaDir}}` (media file이 있는 디렉터리)
* `{{OutputDir}}` (이번 실행용 scratch dir)
* `{{OutputBase}}` (확장자 없는 scratch file base path)

## 기본값과 제한

권장 기본값:

* `maxChars`: image/video는 **500**(짧고 명령 친화적)
* `maxChars`: audio는 **설정 없음**(제한을 주지 않으면 전체 transcript)
* `maxBytes`:
  * image: **10MB**
  * audio: **20MB**
  * video: **50MB**

규칙:

* 미디어가 `maxBytes`를 넘으면 해당 모델을 건너뛰고 **다음 모델을 시도**합니다.
* 1024바이트보다 작은 오디오 파일은 빈 파일/손상 파일로 간주하고 provider/CLI 전사 전에 건너뜁니다.
* 모델 결과가 `maxChars`를 넘으면 잘라냅니다.
* `prompt` 기본값은 단순한 “Describe the {media}.”이며(image/video만) `maxChars` 안내를 덧붙입니다.
* `<capability>.enabled: true`이지만 models를 직접 구성하지 않았다면, OpenClaw는 해당 capability를 지원하는 **active reply model**을 시도합니다.

### 미디어 이해 자동 감지(기본값)

`tools.media.<capability>.enabled`가 `false`가 아니고 models도 따로 구성하지 않았다면, OpenClaw는 다음 순서로 자동 감지하고 **첫 번째로 동작하는 옵션에서 멈춥니다**.

1. **로컬 CLI** (audio 전용, 설치된 경우)
   * `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR`에 encoder/decoder/joiner/tokens 필요)
   * `whisper-cli` (`whisper-cpp`, `WHISPER_CPP_MODEL` 또는 번들 tiny 모델 사용)
   * `whisper` (Python CLI, 모델 자동 다운로드)
2. **Gemini CLI** (`gemini`) + `read_many_files`
3. **Provider keys**
   * Audio: OpenAI → Groq → Deepgram → Google
   * Image: OpenAI → Anthropic → Google → MiniMax
   * Video: Google

자동 감지를 끄려면:

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

참고: 바이너리 감지는 macOS/Linux/Windows 전반에서 best-effort입니다. CLI가 `PATH`에 있어야 하며(`~` 확장 지원), 아니면 전체 경로를 포함한 명시적 CLI model을 사용하세요.

### 프록시 환경 변수 지원(provider models)

Provider 기반 **audio** 및 **video** media understanding이 활성화되면, OpenClaw는 provider HTTP 호출에 표준 outbound proxy 환경 변수를 사용합니다.

* `HTTPS_PROXY`
* `HTTP_PROXY`
* `https_proxy`
* `http_proxy`

프록시 환경 변수가 없으면 direct egress를 사용합니다. 프록시 값이 잘못되면 경고를 로그에 남기고 direct fetch로 fallback합니다.

## Capabilities (선택 사항)

`capabilities`를 설정하면 그 엔트리는 지정한 media type에만 실행됩니다. Shared list에서는 OpenClaw가 기본 capability를 유추할 수 있습니다.

* `openai`, `anthropic`, `minimax`: **image**
* `google` (Gemini API): **image + audio + video**
* `groq`: **audio**
* `deepgram`: **audio**

CLI 엔트리는 surprise match를 피하기 위해 **반드시 `capabilities`를 명시** 하는 편이 좋습니다. 생략하면 해당 엔트리가 속한 list에 대해 eligible이 됩니다.

## Provider 지원 매트릭스(OpenClaw 통합 기준)

| Capability | Provider integration                             | Notes                                                    |
| ---------- | ------------------------------------------------ | -------------------------------------------------------- |
| Image      | OpenAI / Anthropic / Google / others via `pi-ai` | 레지스트리의 image-capable model이면 동작                          |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral          | Provider transcription (Whisper/Deepgram/Gemini/Voxtral) |
| Video      | Google (Gemini API)                              | Provider video understanding                             |

## 모델 선택 가이드

* 품질과 안전이 중요하면 각 media capability에 대해 사용 가능한 최신 세대 강한 모델을 우선하세요.
* 도구를 실행하는 에이전트가 신뢰할 수 없는 입력을 처리한다면 오래되거나 약한 media model은 피하세요.
* availability를 위해 capability마다 최소 1개의 fallback을 두세요(고품질 모델 + 더 빠르거나 저렴한 모델).
* `whisper-cli`, `whisper`, `gemini` 같은 CLI fallback은 provider API가 없을 때 유용합니다.
* `parakeet-mlx` 참고: `--output-dir`와 함께 쓸 때, 출력 형식이 `txt`이거나 지정하지 않았으면 OpenClaw는 `<output-dir>/<media-basename>.txt`를 읽습니다. `txt`가 아닌 경우 stdout parsing으로 fallback합니다.

## 첨부 선택 정책

Capability별 `attachments`는 어떤 첨부를 처리할지 제어합니다.

* `mode`: `first` (기본) 또는 `all`
* `maxAttachments`: 처리 개수 제한(기본 **1**)
* `prefer`: `first`, `last`, `path`, `url`

`mode: "all"`이면 출력에 `[Image 1/2]`, `[Audio 2/2]`처럼 라벨이 붙습니다.

## 설정 예시

### 1) Shared models list + overrides

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

### 2) Audio + Video only (image off)

```json5
{
  tools: {
    media: {
      image: {
        enabled: false,
      },
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

### 3) Optional image understanding

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

### 4) Multi-modal single entry (explicit capabilities)

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

## Status output

미디어 이해가 실행되면 `/status`에 짧은 요약 줄이 포함됩니다.

```
📎 Media: image ok (openai/gpt-5.2) · audio skipped (maxBytes)
```

이 줄은 capability별 결과와, 해당할 때 선택된 provider/model을 보여 줍니다.

## Notes

* 이해 기능은 **best-effort** 입니다. 오류가 나도 reply는 막지 않습니다.
* 이해 기능이 꺼져 있어도 첨부는 계속 모델에 전달됩니다.
* 이해를 특정 범위에서만 실행하려면 `scope`를 사용하세요(예: DM에서만).

## Related docs

* [Configuration](/gateway/configuration)
* [Image & Media Support](/nodes/images)
