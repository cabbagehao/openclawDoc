---
summary: "채팅 채널 상태 점검, 실시간 프로브 및 사용량 정보를 확인하는 `openclaw status` 명령어 레퍼런스"
read_when:
  - 채널 연결 상태 및 최근 세션 참여자 정보를 빠르게 진단하고자 할 때
  - 디버깅을 위해 시스템의 전체적인 상태 요약 정보가 필요할 때
title: "status"
x-i18n:
  source_path: "cli/status.md"
---

# `openclaw status`

채팅 채널 및 세션 상태에 대한 종합적인 진단 정보를 제공함.

## 사용 예시

```bash
# 기본 상태 요약 정보 출력
openclaw status

# 전체 진단 내역을 포함하여 상세 출력
openclaw status --all

# 실시간 프로브를 포함한 정밀 진단 실행
openclaw status --deep

# 공급자별 사용량 및 할당량 정보 조회
openclaw status --usage
```

## 참고 사항

* **정밀 진단 (`--deep`)**: 각 채널(WhatsApp Web, Telegram, Discord, Google Chat, Slack, Signal 등)에 대해 실제 API 요청을 보내 실시간 상태를 점검함.
* **멀티 에이전트 지원**: 여러 에이전트가 구성된 경우, 각 에이전트별 세션 저장소 현황을 함께 표시함.
* **서비스 상태 정보**: 사용 가능한 경우 Gateway 서버 및 노드 호스트 서비스의 설치 상태와 런타임 가동 여부를 개요에 포함함.
* **업데이트 정보**: 현재 사용 중인 업데이트 채널과 Git SHA 정보(소스 설치 시)를 표시함. 사용 가능한 신규 버전이 있을 경우 `openclaw update` 명령어를 실행하도록 안내 메시지를 출력함 ([업데이트 가이드](/install/updating) 참조).
* **시크릿 관리 (SecretRef)**:
  * 읽기 전용 상태 조회 명령어(`status`, `--json`, `--all`)는 가능한 경우 설정된 시크릿 참조(SecretRef)를 자동으로 해석함.
  * 만약 시크릿 참조가 설정되어 있으나 현재 실행 환경에서 해석할 수 없는 경우, 프로그램은 중단되지 않고 '제한적 출력(Degraded output)' 상태로 결과를 보고함. 이때 사용자 화면에는 "설정된 토큰을 현재 경로에서 사용할 수 없음"과 같은 경고 문구가 표시되며, JSON 출력에는 `secretDiagnostics` 필드가 포함됨.
