---
summary: "채팅 채널 계정 관리, 상태 확인, 로그인/로그아웃 및 로그 스트리밍을 위한 `openclaw channels` 명령어 레퍼런스"
read_when:
  - WhatsApp, Telegram, Discord, Slack 등 채팅 채널 계정을 추가하거나 삭제하고자 할 때
  - 특정 채널의 연결 상태를 확인하거나 실시간 로그를 모니터링해야 할 때
title: "channels"
x-i18n:
  source_path: "cli/channels.md"
---

# `openclaw channels`

채팅 채널 계정 및 Gateway에서의 런타임 상태를 관리함.

**관련 문서:**

* 채널 통합 가이드: [Channels](/channels/index)
* Gateway 설정 레퍼런스: [Configuration](/gateway/configuration)

## 주요 명령어

```bash
# 설정된 전체 채널 및 계정 목록 조회
openclaw channels list

# 채널별 연결 상태 및 API 연동 확인
openclaw channels status

# 채널별 지원 기능 및 권한(Scopes) 확인
openclaw channels capabilities

# 특정 Discord 채널의 상세 권한 확인
openclaw channels capabilities --channel discord --target channel:123

# Slack 채널명이나 사용자명을 ID로 해석(Resolve)
openclaw channels resolve --channel slack "#general" "@jane"

# 모든 채널의 실시간 로그 스트리밍 (Tail)
openclaw channels logs --channel all
```

## 계정 추가 및 삭제

```bash
# 새로운 Telegram 봇 계정 추가
openclaw channels add --channel telegram --token <bot-token>

# 특정 Telegram 계정 삭제 및 관련 데이터 제거
openclaw channels remove --channel telegram --delete
```

**팁**: `openclaw channels add --help` 실행 시 각 채널별 전용 플래그(토큰, 앱 토큰, 실행 경로 등) 정보를 확인할 수 있음.

플래그 없이 `openclaw channels add` 명령어를 실행하면 다음과 같은 대화형 설정 마법사가 시작됨:

* 채널별 계정 ID(`accountId`) 지정.
* 해당 계정의 표시 이름(Display name) 설정.
* **에이전트 바인딩**: 설정된 계정을 어떤 에이전트가 관리할지 즉시 지정 가능. 승인 시 계정 범위의 라우팅 바인딩이 자동 생성됨.

라우팅 규칙은 나중에 `openclaw agents` 명령어를 통해 수정할 수도 있음. 상세 내용은 [에이전트 관리](/cli/agents) 참조.

### 다중 계정 마이그레이션 동작

기존에 단일 계정 전용 설정을 사용하던 채널에 새로운 계정을 추가할 경우, OpenClaw는 기존의 최상위 설정값들을 자동으로 `accounts.default` 하위로 이동시킨 후 새 계정 정보를 기록함. 이를 통해 기존 동작을 유지하면서 자연스럽게 다중 계정 구조로 전환됨.

* 기존에 `accountId`가 없는 바인딩은 계속해서 `default` 계정과 매칭됨.
* 비대화형 모드(`--non-interactive`)에서는 바인딩을 자동으로 생성하거나 수정하지 않음.
* 설정 파일 상태가 복합적인 경우(이름 있는 계정은 있으나 `default`가 누락된 경우 등), `openclaw doctor --fix` 명령어를 통해 구조를 정규화할 수 있음.

## 로그인 및 로그아웃 (대화형)

```bash
# WhatsApp QR 로그인 등 세션 연결 시작
openclaw channels login --channel whatsapp

# 특정 채널의 세션 연결 해제 및 로그아웃
openclaw channels logout --channel whatsapp
```

## 문제 해결 (Troubleshooting)

* **상세 진단**: `openclaw status --deep` 명령어를 실행함.
* **자동 수정**: `openclaw doctor` 명령어를 활용하여 발견된 설정 오류를 해결함.
* **사용량 정보 오류**: `channels list` 실행 시 `HTTP 403` 에러가 발생하면 사용량 조회를 위해 `user:profile` 권한이 부족한 것이므로, `--no-usage` 플래그를 사용하거나 적절한 세션 키를 제공해야 함.
* **Gateway 미접속 시**: 서버에 연결할 수 없는 경우 로컬 설정 파일 기반의 요약 정보만 출력함. 시크릿 참조(SecretRef)를 사용하는 계정의 경우, 자격 증명이 유효하지 않더라도 '설정됨(Configured)' 상태로 표시하며 기능 제한에 대한 안내 문구(Degraded notes)를 포함함.

## 기능 프로브 (Capabilities Probe)

각 공급자가 지원하는 의도(Intents), 권한 범위(Scopes) 및 정적 기능 지원 여부를 확인함:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

* `--channel` 옵션 생략 시 플러그인을 포함한 모든 채널을 나열함.
* **조사 항목**: Discord의 인텐트 및 채널별 권한, Slack의 봇 및 사용자 스코프, Telegram의 웹훅 설정 상태, MS Teams의 Graph API 역할 정보 등. 조사를 지원하지 않는 채널은 `Probe: unavailable`로 표시됨.

## 이름 기반 ID 해석 (Resolve)

채널 이름이나 사용자 이름을 공급자 디렉터리를 검색하여 실제 ID값으로 변환함:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "서버명/#채널명" "@사용자"
openclaw channels resolve --channel matrix "프로젝트 룸"
```

* `--kind user|group|auto` 옵션으로 대상 유형을 강제 지정할 수 있음.
* 동일한 이름이 여러 개 존재할 경우 현재 활성 상태인 항목을 우선적으로 반환함.
* 이 기능은 읽기 전용 작업임. SecretRef 기반 자격 증명을 현재 환경에서 사용할 수 없는 경우 실행을 중단하지 않고 '해석 불가' 결과와 함께 사유를 안내함.
