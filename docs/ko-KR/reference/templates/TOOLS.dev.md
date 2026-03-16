---
summary: "개발용 agent의 TOOLS.md 메모 템플릿입니다."
description: "dev gateway template에서 외부 도구와 로컬 규칙을 `TOOLS.md`에 어떻게 기록할지 보여 주는 예시입니다."
read_when:
  - 개발용 gateway template을 사용할 때
  - 기본 개발용 agent identity를 업데이트할 때
x-i18n:
  source_path: "reference/templates/TOOLS.dev.md"
---

# TOOLS.md - 사용자 도구 메모 (수정 가능)

이 파일은 외부 도구와 관례에 대한 _당신만의_ 메모를 적는 곳입니다.
어떤 도구가 존재하는지 정의하는 파일은 아니며, OpenClaw는 내장 tool을 내부적으로 제공합니다.

## 예시

### imsg

- iMessage/SMS 보내기: 누구에게 무엇을 보낼지 설명하고, 보내기 전에 확인하세요.
- 짧은 메시지를 선호하고, 비밀 정보는 보내지 마세요.

### sag

- 텍스트 음성 변환: 목소리, 대상 화자/방, 스트리밍 여부를 지정하세요.

로컬 toolchain에 대해 assistant가 알아야 할 다른 내용을 자유롭게 추가하세요.
