---
summary: "세션 목록 조회, 이력 확인 및 세션 간 메시지 전송을 위한 에이전트 전용 세션 도구 가이드"
read_when:
  - 세션 관련 도구를 추가하거나 수정하고자 할 때
  - 에이전트 간의 통신 및 세션 데이터 활용 방식을 이해하고 싶을 때
title: "세션 도구"
x-i18n:
  source_path: "concepts/session-tool.md"
---

# 세션 도구 (Session Tools)

세션 도구의 목적은 에이전트가 세션 목록을 확인하고, 대화 이력을 조회하며, 다른 세션으로 메시지를 안전하게 보낼 수 있도록 오용 가능성이 낮은 도구 집합을 제공하는 것임.

## 도구 목록

* `sessions_list`: 전체 또는 특정 유형의 세션 목록 조회.
* `sessions_history`: 특정 세션의 대화 이력(Transcript) 조회.
* `sessions_send`: 다른 세션으로 메시지 전송 및 상호작용.
* `sessions_spawn`: 격리된 환경에서 하위 에이전트 실행 및 결과 보고.

## 세션 키 모델 (Key Model)

* **메인 세션**: 에이전트의 기본 개인 대화는 항상 리터럴 키인 `"main"`으로 참조됨 (현재 에이전트의 실제 메인 키로 자동 해석됨).
* **그룹 대화**: `agent:<agentId>:<channel>:group:<id>` 또는 `agent:<agentId>:<channel>:channel:<id>` 형식의 전체 키를 사용함.
* **예약 작업**: 크론 작업은 `cron:<job.id>` 형식을 사용함.
* **훅(Hooks)**: 명시적 설정이 없을 경우 `hook:<uuid>` 형식을 사용함.
* **노드(Nodes)**: 명시적 설정이 없을 경우 `node-<nodeId>` 형식을 사용함.

`global` 및 `unknown`은 시스템 예약어이며 목록에 나타나지 않음.

## sessions\_list

세션 목록을 배열 형태로 반환함.

**주요 파라미터:**

* `kinds`: `"main"`, `"group"`, `"cron"`, `"hook"`, `"node"`, `"other"` 중 필터링할 유형 목록.
* `limit`: 반환할 최대 행 수 (서버 제한에 의해 조정될 수 있음).
* `activeMinutes`: 지정된 시간(분) 이내에 업데이트된 세션만 포함.
* `messageLimit`: 각 세션의 마지막 N개 메시지를 포함하여 반환 (0은 미포함).

**동작 특징:**

* `messageLimit > 0`인 경우 각 세션의 최근 대화 내용을 함께 가져옴.
* 보안을 위해 도구 실행 결과(toolResult)는 목록 출력에서 제외됨. 상세 내용이 필요하면 `sessions_history`를 사용함.
* **샌드박스** 환경에서는 가시성 설정에 따라 자신이 생성한 세션만 보일 수 있음.

## sessions\_history

특정 세션의 대화 이력 전문 또는 일부를 가져옴.

**주요 파라미터:**

* `sessionKey`: 대상 세션 키 또는 `sessionId`.
* `limit`: 가져올 최대 메시지 수.
* `includeTools`: 도구 실행 결과 포함 여부 (기본값: `false`).

**동작 특징:**

* `includeTools=false`일 경우 `role: "toolResult"` 메시지를 필터링하여 가독성을 높임.
* 원시 대화 이력(Raw transcript) 포맷으로 데이터를 반환함.

## sessions\_send

다른 세션으로 메시지를 전송하고 응답을 수신함.

**주요 파라미터:**

* `sessionKey`: 메시지를 보낼 대상 세션.
* `message`: 전달할 메시지 내용.
* `timeoutSeconds`: 응답을 기다릴 시간 (0은 비동기 전송 후 즉시 종료).

**동작 특징:**

* **비동기 모드 (timeout=0)**: 대기열에 추가하고 즉시 `runId`를 반환함.
* **동기 모드 (timeout>0)**: 작업 완료 시까지 대기 후 상대 에이전트의 응답(`reply`)을 반환함.
* **에이전트 간 핑퐁 (Ping-pong)**: 전송 후 두 에이전트 간에 최대 5회(기본값)까지 추가 대화를 주고받는 루프를 실행함. 대화를 중단하려면 `REPLY_SKIP`을 반환함.
* **알림 (Announce)**: 루프가 종료되면 대상 채널에 최종 결과를 알림. 알림을 생략하려면 `ANNOUNCE_SKIP`을 반환함.

## sessions\_spawn

격리된 신규 세션에서 하위 에이전트(Sub-agent)를 실행하고 결과를 현재 채널에 보고함.

**주요 파라미터:**

* `task`: 수행할 작업 지침.
* `label`: 로그 및 UI 표시용 라벨.
* `model` / `thinking`: 하위 에이전트의 모델 및 사고 수준 오버라이드.
* `thread`: 지원되는 채널에서 스레드 기반 라우팅 사용 여부.
* `sandbox`: 샌드박스 강제 여부 (`require` 시 대상이 샌드박스 미지원 시 실행 거부).
* `attachments`: 하위 에이전트 워크스페이스에 주입할 파일 배열.

**동작 특징:**

* 새 `subagent:<uuid>` 세션을 생성하여 비동기로 실행함.
* 하위 에이전트는 기본적으로 **세션 도구를 사용할 수 없음** (무한 증식 방지).
* 실행 완료 후 `Status`, `Result`, `Notes`로 구성된 요약 리포트를 현재 채널에 게시함.
* 결과 알림 시 실행 시간, 토큰 사용량, 이력 경로 등 통계 정보를 함께 제공함.

## 세션 보안 및 전송 정책 (Send Policy)

채널 및 채팅 유형별로 메시지 발신 권한을 제어할 수 있음:

```json
{
  "session": {
    "sendPolicy": {
      "rules": [
        { "match": { "channel": "discord", "chatType": "group" }, "action": "deny" }
      ],
      "default": "allow"
    }
  }
}
```

* **실시간 변경**: 세션 내에서 `/send on|off|inherit` 명령어를 통해 해당 세션의 발신 권한을 즉시 조정할 수 있음.

## 샌드박스 세션 가시성 (Visibility)

세션 도구가 접근할 수 있는 범위를 제한하여 보안을 강화함:

* **`self`**: 현재 세션 정보만 접근 가능.
* **`tree` (기본값)**: 현재 세션 및 해당 세션이 생성한 하위 세션들만 접근 가능.
* **`agent`**: 동일한 에이전트 ID에 속한 모든 세션 접근 가능.
* **`all`**: 시스템 내 모든 세션 접근 가능 (에이전트 간 통신 권한 필요).

**샌드박스 보안**: 세션이 샌드박스에서 실행 중이고 `sessionToolsVisibility` 설정이 `"spawned"`인 경우, 도구 설정을 `"all"`로 지정하더라도 시스템은 보안을 위해 `"tree"` 범위로 강제 제한함.
