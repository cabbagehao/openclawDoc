---
summary: "send, gateway, agent replies 전반의 이미지 및 미디어 처리 규칙"
description: "WhatsApp Web send, gateway replies, inbound media parsing 전반의 이미지·오디오·비디오 처리 규칙과 제한을 설명합니다."
read_when:
  - "미디어 파이프라인이나 첨부 처리를 수정할 때"
title: "이미지 및 미디어 지원"
x-i18n:
  source_path: "nodes/images.md"
---

# 이미지 및 미디어 지원 — 2025-12-05

WhatsApp 채널은 **Baileys Web**으로 동작합니다. 이 문서는 send, gateway, agent replies 전반의 현재 미디어 처리 규칙을 정리합니다.

## 목표

- `openclaw message send --media`로 선택적 caption과 함께 media 보내기
- web inbox의 auto-replies가 text와 함께 media도 포함할 수 있게 하기
- type별 제한을 예측 가능하고 합리적으로 유지하기

## CLI 표면

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media`는 선택 사항이며, media-only 전송을 위해 caption은 비어 있어도 됩니다.
  - `--dry-run`은 해석된 payload를 출력하고, `--json`은 `{ channel, to, messageId, mediaUrl, caption }`을 내보냅니다.

## WhatsApp Web 채널 동작

- 입력: 로컬 파일 경로 **또는** HTTP(S) URL
- 흐름: Buffer로 읽고 media kind를 감지한 뒤 올바른 payload를 구성합니다.
  - **Images:** JPEG로 resize 및 recompress합니다. 최대 변 길이는 2048px이며, `agents.defaults.mediaMaxMb`(기본 5MB)를 목표로 하고 상한은 6MB입니다.
  - **Audio/Voice/Video:** 16MB까지 pass-through하며, audio는 voice note(`ptt: true`)로 전송합니다.
  - **Documents:** 그 밖의 형식은 100MB까지 허용하며, 가능하면 원래 filename을 보존합니다.
- WhatsApp의 GIF-style playback은 `gifPlayback: true`인 MP4를 전송해 구현합니다. CLI에서는 `--gif-playback`을 사용하며 모바일 clients에서 inline loop 재생됩니다.
- MIME detection은 magic bytes, headers, file extension 순으로 우선합니다.
- caption은 `--message` 또는 `reply.text`에서 가져오며, 빈 caption도 허용합니다.
- logging은 non-verbose일 때 `↩️`/`✅`만 보이고, verbose일 때 size와 source path/URL까지 포함합니다.

## Auto-Reply 파이프라인

- `getReplyFromConfig`는 `{ text?, mediaUrl?, mediaUrls? }`를 반환합니다.
- media가 있으면 web sender는 `openclaw message send`와 동일한 파이프라인으로 로컬 경로나 URL을 해석합니다.
- 여러 media 항목이 있으면 순차적으로 전송합니다.

## 인바운드 미디어를 명령(Pi)으로 넘기기

- 인바운드 web messages에 media가 있으면 OpenClaw는 temp file로 다운로드하고 다음 templating variables를 노출합니다.
  - `{{MediaUrl}}`: 인바운드 media용 pseudo-URL
  - `{{MediaPath}}`: 명령 실행 전에 기록되는 로컬 temp path
- per-session Docker sandbox가 활성화되어 있으면, 인바운드 media를 sandbox workspace로 복사하고 `MediaPath`/`MediaUrl`을 `media/inbound/<filename>` 같은 상대 경로로 다시 씁니다.
- media understanding이 `tools.media.*` 또는 공용 `tools.media.models`로 구성되어 있으면 templating 전에 실행되어 `Body` 안에 `[Image]`, `[Audio]`, `[Video]` 블록을 삽입할 수 있습니다.
  - audio는 `{{Transcript}}`를 설정하고, slash commands가 계속 동작하도록 transcript를 command parsing에 사용합니다.
  - video와 image descriptions는 caption text를 command parsing용으로 유지합니다.
- 기본적으로는 처음 매칭된 image/audio/video attachment만 처리합니다. 여러 첨부를 처리하려면 `tools.media.<cap>.attachments`를 설정하세요.

## 제한 및 오류

**아웃바운드 send caps (WhatsApp web send)**

- Images: recompression 이후 약 6MB cap
- Audio/voice/video: 16MB cap, documents: 100MB cap
- oversized 또는 읽을 수 없는 media는 로그에 명확한 오류를 남기고, 해당 reply는 건너뜁니다.

**media understanding caps (transcription/description)**

- Image 기본값: 10MB (`tools.media.image.maxBytes`)
- Audio 기본값: 20MB (`tools.media.audio.maxBytes`)
- Video 기본값: 50MB (`tools.media.video.maxBytes`)
- oversized media는 understanding을 건너뛰지만, reply 자체는 원래 body와 함께 계속 진행됩니다.

## 테스트 시 참고

- image/audio/document 케이스에 대해 send + reply 흐름을 모두 커버하세요.
- image recompression의 size bound와 audio의 voice-note flag를 검증하세요.
- multi-media replies가 순차 send로 fan out되는지 확인하세요.
