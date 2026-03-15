---
summary: "채팅 UI용 루프백 WebChat 정적 호스트와 Gateway WS 사용 방식"
read_when:
  - WebChat 접근을 디버깅하거나 설정할 때
title: "WebChat"
x-i18n:
  source_path: "web/webchat.md"
---

# WebChat (Gateway WebSocket UI)

상태: macOS/iOS SwiftUI 채팅 UI는 Gateway WebSocket에 직접 연결합니다.

## 무엇인가요

- Gateway용 네이티브 채팅 UI입니다(임베디드 브라우저나 로컬 정적 서버 없음).
- 다른 채널과 동일한 session 및 라우팅 규칙을 사용합니다.
- 결정적 라우팅: 응답은 항상 WebChat으로 되돌아옵니다.

## 빠른 시작

1. Gateway를 시작합니다.
2. WebChat UI(macOS/iOS 앱) 또는 Control UI의 채팅 탭을 엽니다.
3. gateway auth가 구성돼 있는지 확인합니다(기본적으로 필요하며, 루프백에서도 마찬가지입니다).

## 동작 방식

- UI는 Gateway WebSocket에 연결해 `chat.history`, `chat.send`, `chat.inject`를 사용합니다.
- `chat.history`는 안정성을 위해 크기 제한이 있습니다. Gateway는 긴 텍스트 필드를 자르거나, 무거운 메타데이터를 생략하거나, 지나치게 큰 항목을 `\[chat.history omitted: message too large]`로 대체할 수 있습니다.
- `chat.inject`는 어시스턴트 메모를 transcript에 직접 추가하고 UI로 브로드캐스트합니다(에이전트 실행 없음).
- 중단된 실행도 어시스턴트 부분 출력을 UI에 계속 보여줄 수 있습니다.
- 버퍼된 출력이 있으면 Gateway는 중단된 어시스턴트 부분 출력을 transcript history에 저장하고, 해당 항목에 중단 메타데이터를 표시합니다.
- History는 항상 gateway에서 가져옵니다(로컬 파일 감시 없음).
- gateway에 접근할 수 없으면 WebChat은 읽기 전용이 됩니다.

## Control UI agents tools 패널

- Control UI의 `/agents` Tools 패널은 `tools.catalog`를 통해 런타임 카탈로그를 가져오고, 각 도구를 `core` 또는 `plugin:<id>`(선택적 플러그인 도구는 추가로 `optional`)로 표시합니다.
- `tools.catalog`를 사용할 수 없으면 패널은 내장 정적 목록으로 대체합니다.
- 패널은 profile 및 재정의 config를 수정할 수 있지만, 실제 런타임 접근은 정책 우선순위(`allow`/`deny`, agent별 및 provider/channel 재정의)를 따릅니다.

## 원격 사용

- 원격 모드에서는 Gateway WebSocket을 SSH/Tailscale로 터널링합니다.
- 별도의 WebChat 서버를 실행할 필요는 없습니다.

## 설정 참조(WebChat)

전체 설정: [Configuration](/gateway/configuration)

채널 옵션:

- 전용 `webchat.*` 블록은 없습니다. WebChat은 아래 gateway endpoint + auth 설정을 사용합니다.

관련 전역 옵션:

- `gateway.port`, `gateway.bind`: WebSocket 호스트/포트
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`: WebSocket auth(token/password)
- `gateway.auth.mode: "trusted-proxy"`: 브라우저 클라이언트용 리버스 프록시 인증([Trusted Proxy Auth](/gateway/trusted-proxy-auth) 참고)
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: 원격 gateway 대상
- `session.*`: session 저장소 및 기본 main key
