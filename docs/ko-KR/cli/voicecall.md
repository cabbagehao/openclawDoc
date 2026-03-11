---
summary: "Voice-call 플러그인 기능 제어를 위한 `openclaw voicecall` 명령어 레퍼런스"
read_when:
  - Voice-call 플러그인을 활성화하고 CLI 진입점을 확인하고자 할 때
  - 전화 발신, 상태 확인 및 웹훅 노출 등의 명령어 예시가 필요할 때
title: "voicecall"
x-i18n:
  source_path: "cli/voicecall.md"
---

# `openclaw voicecall`

`voicecall`은 플러그인을 통해 제공되는 명령어로, **Voice-call 플러그인**이 설치되어 있고 활성화된 상태에서만 사용 가능함.

**관련 문서:**
- Voice-call 플러그인 가이드: [Voice Call](/plugins/voice-call)

## 주요 명령어

```bash
# 특정 통화의 상태 확인
openclaw voicecall status --call-id <id>

# 특정 번호로 전화를 걸고 메시지 전달 (알림 모드)
openclaw voicecall call --to "+821012345678" --message "안녕하세요" --mode notify

# 진행 중인 통화에 메시지 추가 전달
openclaw voicecall continue --call-id <id> --message "다른 궁금한 점이 있으신가요?"

# 통화 강제 종료
openclaw voicecall voicecall end --call-id <id>
```

## 웹훅 노출 설정 (Tailscale)

```bash
# Tailscale Serve를 통해 웹훅 노출
openclaw voicecall expose --mode serve

# Tailscale Funnel(공개 인터넷)을 통해 웹훅 노출
openclaw voicecall expose --mode funnel

# 웹훅 노출 비활성화
openclaw voicecall expose --mode off
```

<Warning>
**보안 주의**: 웹훅 엔드포인트는 신뢰할 수 있는 네트워크 환경에만 노출해야 함. 보안을 위해 가급적 Funnel보다는 **Tailscale Serve** 사용을 권장함.
</Warning>
