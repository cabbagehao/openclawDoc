---
summary: "Talk mode: ElevenLabs TTS를 이용한 연속 음성 대화"
description: "Talk mode의 음성 대화 루프, voice directives, config, macOS overlay, interrupt 동작을 설명합니다."
read_when:
  - "macOS/iOS/Android의 Talk mode를 구현할 때"
  - "voice/TTS/interrupt 동작을 변경할 때"
title: "대화 모드"
x-i18n:
  source_path: "nodes/talk.md"
---

# Talk Mode

Talk mode는 연속 음성 대화 루프입니다.

1. 음성을 듣습니다.
2. transcript를 모델에 보냅니다 (`main` session, `chat.send`)
3. 응답을 기다립니다.
4. ElevenLabs를 통해 읽어 줍니다 (streaming playback)

## Behavior (macOS)

- Talk mode가 켜져 있는 동안 **always-on overlay**가 표시됩니다.
- **Listening → Thinking → Speaking** 단계 전환이 있습니다.
- **짧은 멈춤**(silence window)이 오면 현재 transcript를 전송합니다.
- 응답은 **WebChat에 기록**됩니다(직접 타이핑한 것과 동일).
- **interrupt on speech**가 기본 on입니다. assistant가 말하는 중 사용자가 다시 말하기 시작하면 playback을 멈추고, 다음 prompt를 위해 interruption timestamp를 기록합니다.

## Voice directives in replies

assistant는 응답 앞에 음성을 제어하는 **single JSON line**을 붙일 수 있습니다.

```json
{ "voice": "<voice-id>", "once": true }
```

Rules:

- 첫 번째 non-empty line만 사용
- 알 수 없는 keys는 무시
- `once: true`는 현재 reply에만 적용
- `once`가 없으면 해당 voice가 Talk mode의 새 default가 됨
- JSON line은 TTS playback 전에 제거

Supported keys:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Config (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Defaults:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 설정하지 않으면 플랫폼 기본 pause window를 사용해 transcript를 보냅니다 (`700 ms on macOS and Android, 900 ms on iOS`)
- `voiceId`: `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`로 fallback합니다. API key가 있으면 첫 번째 ElevenLabs voice를 사용할 수도 있습니다.
- `modelId`: 설정하지 않으면 `eleven_v3`
- `apiKey`: `ELEVENLABS_API_KEY`로 fallback합니다. 가능하면 gateway shell profile도 사용합니다.
- `outputFormat`: macOS/iOS는 `pcm_44100`, Android는 `pcm_24000`가 기본값입니다. `mp3_*`를 지정하면 MP3 streaming을 강제합니다.

## macOS UI

- 메뉴 바 토글: **Talk**
- Config 탭: **Talk Mode** 그룹(voice id + interrupt toggle)
- Overlay:
  - **Listening**: 마이크 레벨에 맞춰 구름이 맥동
  - **Thinking**: 가라앉는 애니메이션
  - **Speaking**: 바깥으로 퍼지는 링
  - 구름 클릭: 말하기 중지
  - X 클릭: Talk mode 종료

## 참고

- Speech + Microphone 권한이 필요합니다.
- `chat.send`는 session key `main`을 대상으로 사용됩니다.
- TTS는 ElevenLabs streaming API와 `ELEVENLABS_API_KEY`를 사용하며, macOS/iOS/Android에서 incremental playback으로 latency를 낮춥니다.
- `eleven_v3`의 `stability`는 `0.0`, `0.5`, `1.0`만 허용되며, 다른 models는 `0..1`을 허용합니다.
- `latency_tier`는 설정 시 `0..4` 범위인지 검증합니다.
- Android는 저지연 AudioTrack streaming을 위해 `pcm_16000`, `pcm_22050`, `pcm_24000`, `pcm_44100` output formats를 지원합니다.
