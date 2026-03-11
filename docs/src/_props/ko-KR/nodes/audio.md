---
summary: "인바운드 오디오/음성 메모가 다운로드, 전사, 응답에 주입되는 방식"
read_when:
  - 오디오 전사나 미디어 처리를 변경할 때
title: "오디오와 음성 메모"
x-i18n:
  source_path: "nodes/audio.md"
---

# 오디오 / 음성 메모 — 2026-01-17

## 동작하는 것

* **미디어 이해(오디오)**: 오디오 이해가 활성화되어 있거나 자동 감지되면, OpenClaw는 다음을 수행합니다.
  1. 첫 번째 오디오 첨부(local path 또는 URL)를 찾고 필요하면 다운로드합니다.
  2. 각 모델 엔트리에 보내기 전에 `maxBytes`를 적용합니다.
  3. 순서대로 첫 번째 사용 가능한 모델 엔트리(provider 또는 CLI)를 실행합니다.
  4. 실패하거나 건너뛰면(size/timeout), 다음 엔트리를 시도합니다.
  5. 성공하면 `Body`를 `[Audio]` 블록으로 바꾸고 `{{Transcript}}`를 설정합니다.
* **명령 파싱**: 전사에 성공하면 `CommandBody` / `RawBody`가 transcript로 설정되어 slash command도 계속 동작합니다.
* **Verbose logging**: `--verbose`에서는 전사가 실행될 때와 body를 교체할 때를 로그로 남깁니다.

## 자동 감지(기본값)

모델을 **직접 구성하지 않았고** `tools.media.audio.enabled`가 `false`가 아니라면, OpenClaw는 다음 순서로 자동 감지하고 첫 번째로 동작하는 옵션에서 멈춥니다.

1. **로컬 CLI**(설치되어 있는 경우)
   * `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR`에 encoder/decoder/joiner/tokens 필요)
   * `whisper-cli` (`whisper-cpp`에서 제공, `WHISPER_CPP_MODEL` 또는 번들 tiny 모델 사용)
   * `whisper` (Python CLI, 모델 자동 다운로드)
2. **Gemini CLI** (`gemini`) + `read_many_files`
3. **Provider keys** (OpenAI → Groq → Deepgram → Google)

자동 감지를 끄려면 `tools.media.audio.enabled: false`로 설정하세요.
커스터마이즈하려면 `tools.media.audio.models`를 설정하세요.
참고: 바이너리 감지는 macOS/Linux/Windows 전반에서 best-effort입니다. CLI가 `PATH`에 있어야 하며( `~` 확장 지원), 아니면 전체 명령 경로를 가진 명시적 CLI 모델을 설정하세요.

## 설정 예시

### Provider + CLI fallback (OpenAI + Whisper CLI)

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

### Provider-only with scope gating

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

### Provider-only (Deepgram)

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

### Provider-only (Mistral Voxtral)

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

### 전사 내용을 채팅에 다시 보내기(opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // 기본값은 false
        echoFormat: '📝 "{transcript}"', // 선택 사항, {transcript} 지원
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## 참고 및 제한 사항

* Provider auth는 표준 model auth 순서(auth profiles, env vars, `models.providers.*.apiKey`)를 따릅니다.
* `provider: "deepgram"`을 쓰면 `DEEPGRAM_API_KEY`를 사용합니다.
* Deepgram 설정 상세: [Deepgram (audio transcription)](/providers/deepgram)
* Mistral 설정 상세: [Mistral](/providers/mistral)
* 오디오 provider는 `tools.media.audio`를 통해 `baseUrl`, `headers`, `providerOptions`를 override할 수 있습니다.
* 기본 size cap은 20MB(`tools.media.audio.maxBytes`)입니다. 초과 오디오는 해당 모델에서 건너뛰고 다음 엔트리를 시도합니다.
* 1024바이트보다 작은 tiny/empty 오디오 파일은 provider/CLI 전사 전에 건너뜁니다.
* 오디오 기본 `maxChars`는 **설정되지 않음**(전체 transcript). 출력 길이를 자르려면 `tools.media.audio.maxChars` 또는 엔트리별 `maxChars`를 설정하세요.
* OpenAI 기본값은 `gpt-4o-mini-transcribe`이며, 더 높은 정확도가 필요하면 `model: "gpt-4o-transcribe"`를 설정하세요.
* 여러 음성 메모를 처리하려면 `tools.media.audio.attachments`를 사용하세요(`mode: "all"` + `maxAttachments`).
* transcript는 템플릿에서 `{{Transcript}}`로 사용할 수 있습니다.
* `tools.media.audio.echoTranscript`는 기본적으로 꺼져 있으며, 원본 채팅으로 transcript 확인 메시지를 먼저 보내려면 활성화하세요.
* `tools.media.audio.echoFormat`은 echo 텍스트를 커스터마이즈합니다(placeholder: `{transcript}`).
* CLI stdout은 5MB로 제한됩니다. CLI 출력은 간결하게 유지하세요.

### 프록시 환경 변수 지원

Provider 기반 오디오 전사는 표준 outbound proxy 환경 변수를 따릅니다.

* `HTTPS_PROXY`
* `HTTP_PROXY`
* `https_proxy`
* `http_proxy`

프록시 환경 변수가 없으면 direct egress를 사용합니다. 프록시 설정이 잘못되면 OpenClaw는 경고를 로그에 남기고 direct fetch로 fallback합니다.

## 그룹에서의 멘션 감지

그룹 채팅에 `requireMention: true`가 설정되면, OpenClaw는 이제 멘션 검사 **전에** 오디오를 전사합니다. 이렇게 하면 멘션이 포함된 음성 메모도 처리할 수 있습니다.

**동작 방식:**

1. 음성 메시지에 텍스트 body가 없고 그룹이 멘션을 요구하면, OpenClaw는 “preflight” 전사를 수행합니다.
2. transcript에서 멘션 패턴(예: `@BotName`, emoji trigger)을 검사합니다.
3. 멘션이 발견되면 메시지는 전체 reply pipeline으로 진행됩니다.
4. 멘션 감지에 transcript를 사용하므로 음성 메모도 멘션 게이트를 통과할 수 있습니다.

**Fallback 동작:**

* preflight 도중 전사가 실패하면(timeout, API error 등), 메시지는 텍스트 전용 멘션 감지 기준으로 처리됩니다.
* 따라서 혼합 메시지(text + audio)가 잘못 drop되는 일은 없습니다.

**Telegram 그룹/토픽별 opt-out:**

* 해당 그룹의 preflight transcript mention 검사를 건너뛰려면 `channels.telegram.groups.<chatId>.disableAudioPreflight: true`를 설정하세요.
* 토픽별로 override하려면 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`를 설정하세요(`true`면 skip, `false`면 강제 활성화).
* 기본값은 `false`이며, mention-gated 조건이 맞으면 preflight가 활성화됩니다.

**예시:** 사용자가 `requireMention: true`가 있는 Telegram 그룹에서 “Hey @Claude, what's the weather?”라고 말하는 음성 메모를 보내면, OpenClaw가 이를 전사해 멘션을 감지하고 에이전트가 응답합니다.

## 주의할 점

* Scope rule은 first-match wins입니다. `chatType`은 `direct`, `group`, `room`으로 정규화됩니다.
* CLI는 종료 코드 0으로 끝나고 plain text를 출력해야 합니다. JSON은 `jq -r .text` 등으로 정리해야 합니다.
* `parakeet-mlx`에서 `--output-dir`를 주면, `--output-format`이 `txt`이거나 생략된 경우 OpenClaw는 `<output-dir>/<media-basename>.txt`를 읽습니다. `txt`가 아닌 형식은 stdout parsing으로 fallback합니다.
* reply queue를 막지 않도록 `timeoutSeconds`(기본 60s)는 적당한 값으로 유지하세요.
* preflight 전사는 멘션 감지를 위해 **첫 번째** 오디오 첨부만 처리합니다. 추가 오디오는 본 미디어 이해 단계에서 처리됩니다.
