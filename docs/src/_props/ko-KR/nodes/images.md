---
summary: "send, gateway, agent replies 전반의 이미지 및 미디어 처리 규칙"
read_when:
  - 미디어 파이프라인이나 첨부 처리를 수정할 때
title: "이미지 및 미디어 지원"
x-i18n:
  source_path: "nodes/images.md"
---

# 이미지 및 미디어 지원 — 2025-12-05

WhatsApp 채널은 **Baileys Web** 으로 동작합니다. 이 문서는 send, gateway, agent reply에 대한 현재 미디어 처리 규칙을 정리합니다.

## 목표

* `openclaw message send --media`로 선택적 caption과 함께 미디어 보내기
* 웹 inbox의 auto-reply가 텍스트와 함께 미디어도 포함할 수 있게 하기
* 타입별 제한을 예측 가능하고 합리적으로 유지하기

## CLI 표면

* `openclaw message send --media <path-or-url> [--message <caption>]`
  * `--media`는 선택 사항이며, media-only 전송을 위해 caption은 비어 있어도 됩니다.
  * `--dry-run`은 해석된 payload를 출력하고, `--json`은 `{ channel, to, messageId, mediaUrl, caption }`을 출력합니다.

## WhatsApp Web 채널 동작

* 입력: 로컬 파일 경로 **또는** HTTP(S) URL
* 흐름: Buffer로 읽고, 미디어 종류를 감지한 뒤 올바른 payload를 구성
  * **Images:** JPEG로 resize & recompress(max side 2048px), `agents.defaults.mediaMaxMb`(기본 5MB)를 목표로 하되 6MB cap 적용
  * **Audio/Voice/Video:** 16MB까지 pass-through, 오디오는 voice note(`ptt: true`)로 전송
  * **Documents:** 그 외 모든 형식, 100MB까지, 가능하면 원래 filename 보존
* WhatsApp GIF-style 재생: `gifPlayback: true`인 MP4 전송(CLI: `--gif-playback`)으로 모바일 클라이언트에서 inline loop 재생
* MIME 감지는 magic bytes → headers → file extension 순으로 우선
* Caption은 `--message` 또는 `reply.text`에서 가져오며, 빈 caption도 허용
* Logging: non-verbose는 `↩️` / `✅`만 보이고, verbose는 size와 source path/URL을 포함

## Auto-Reply 파이프라인

* `getReplyFromConfig`는 `{ text?, mediaUrl?, mediaUrls? }`를 반환합니다.
* media가 있으면 web sender는 `openclaw message send`와 동일한 파이프라인으로 로컬 경로나 URL을 해석합니다.
* 여러 media 항목이 있으면 순차적으로 전송합니다.

## 인바운드 미디어를 명령(Pi)으로 넘기기

* 인바운드 웹 메시지에 media가 있으면 OpenClaw는 temp file로 다운로드하고 다음 템플릿 변수를 노출합니다.
  * `{{MediaUrl}}`: 인바운드 media용 pseudo-URL
  * `{{MediaPath}}`: 명령 실행 전에 작성되는 로컬 temp path
* per-session Docker sandbox가 활성화되어 있으면, 인바운드 media를 sandbox workspace로 복사하고 `MediaPath` / `MediaUrl`을 `media/inbound/<filename>` 같은 상대 경로로 다시 씁니다.
* 미디어 이해가 `tools.media.*` 또는 공용 `tools.media.models`로 구성되어 있으면 템플릿 적용 전에 실행되어 `Body` 안에 `[Image]`, `[Audio]`, `[Video]` 블록을 삽입할 수 있습니다.
  * Audio는 `{{Transcript}}`를 설정하고, slash command가 계속 동작하도록 transcript를 명령 파싱에 사용합니다.
  * Video와 image 설명은 caption text를 명령 파싱용으로 유지합니다.
* 기본적으로는 첫 번째 matching image/audio/video attachment만 처리합니다. 여러 첨부를 처리하려면 `tools.media.<cap>.attachments`를 설정하세요.

## 제한 및 오류

**아웃바운드 send cap(WhatsApp web send)**

* Images: recompression 이후 약 6MB cap
* Audio/voice/video: 16MB cap, documents: 100MB cap
* oversized 또는 읽을 수 없는 media → 로그에 명확한 오류, 해당 reply는 skip

**미디어 이해 cap(transcription/description)**

* Image 기본값: 10MB (`tools.media.image.maxBytes`)
* Audio 기본값: 20MB (`tools.media.audio.maxBytes`)
* Video 기본값: 50MB (`tools.media.video.maxBytes`)
* oversized media는 이해를 건너뛰지만, reply 자체는 원래 body와 함께 계속 진행됩니다.

## 테스트 시 참고

* image/audio/document 케이스에 대해 send + reply 흐름을 모두 커버하세요.
* image의 recompression(size bound)과 audio의 voice-note flag를 검증하세요.
* multi-media reply가 순차 send로 fan-out되는지 확인하세요.
