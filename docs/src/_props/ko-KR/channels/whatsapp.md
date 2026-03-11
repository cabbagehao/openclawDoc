---
summary: "WhatsApp 채널 연동 가이드: 접근 제어 정책, 메시지 전달 방식 및 운영 최적화 안내"
read_when:
  - WhatsApp 웹 채널의 동작 방식이나 메시지 라우팅 설정을 수정할 때
title: "WhatsApp"
x-i18n:
  source_path: "channels/whatsapp.md"
---

# WhatsApp (웹 채널)

**상태**: WhatsApp Web(Baileys) 기술을 기반으로 하며, 실제 운영 환경에서 사용 가능한 준비 단계임. Gateway 서버가 연결된 세션을 직접 관리함.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/channels/pairing">
    알 수 없는 발신자의 DM에 대해 기본적으로 페어링 모드를 적용함.
  </Card>

  <Card title="채널 문제 해결" icon="wrench" href="/channels/troubleshooting">
    채널 전반의 진단 및 복구 가이드.
  </Card>

  <Card title="Gateway 설정" icon="settings" href="/gateway/configuration">
    전체 채널 설정 패턴 및 다양한 예시.
  </Card>
</CardGroup>

## 빠른 설정 가이드

<Steps>
  <Step title="접근 정책 설정">
    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "pairing",
          allowFrom: ["+821012345678"],
          groupPolicy: "allowlist",
          groupAllowFrom: ["+821012345678"],
        },
      },
    }
    ```
  </Step>

  <Step title="WhatsApp 연동 (QR 코드)">
    ```bash
    # 기본 계정 로그인
    openclaw channels login --channel whatsapp

    # 특정 계정('work') 로그인
    openclaw channels login --channel whatsapp --account work
    ```
  </Step>

  <Step title="Gateway 시작">
    ```bash
    openclaw gateway
    ```
  </Step>

  <Step title="첫 DM 페어링 승인">
    ```bash
    openclaw pairing list whatsapp
    openclaw pairing approve whatsapp <코드>
    ```

    발급된 코드는 1시간 동안 유효하며, 채널당 최대 3개의 대기 요청을 유지함.
  </Step>
</Steps>

<Note>
  **권장 사항**: 가급적 개인 번호가 아닌 **별도의 전용 번호**로 운영할 것을 권장함. (채널 메타데이터 및 온보딩 워크플로우가 전용 번호 환경에 최적화되어 있음)
</Note>

***

## 배포 및 운영 패턴

### 전용 번호 운영 (강력 권장)

가장 안정적이고 깔끔한 운영 모드임:

* 에이전트 전용의 독립적인 WhatsApp 아이덴티티 확보.
* DM 허용 목록 및 라우팅 경계가 명확함.
* 본인과의 대화 시 발생할 수 있는 혼선 방지.

### 개인 번호 활용 (폴백 모드)

온보딩 마법사를 통해 개인 번호 설정을 지원하며, 다음과 같은 기본 보안 설정을 적용함:

* `dmPolicy: "allowlist"`
* 본인 번호를 `allowFrom`에 포함.
* `selfChatMode: true` 활성화 (자신과의 대화 보호 로직 작동).

***

## 런타임 동작 모델

* **연결 관리**: Gateway가 WhatsApp 소켓 연결 및 재연결 루프를 전담함.
* **라우팅**: 수신된 채널 및 계정 정보를 추적하여 정확히 회신함.
* **제외 대상**: 상태(Status) 업데이트 및 브로드캐스트 대화는 무시함 (`@status`, `@broadcast`).
* **세션 구분**: DM은 설정된 범위(`dmScope`)에 따라 처리되며, 그룹 대화는 `agent:<agentId>:whatsapp:group:<jid>` 형식의 격리된 세션을 사용함.

***

## 접근 제어 및 활성화

### DM 정책 (`dmPolicy`)

* **`pairing`** (기본값): 승인 전까지 메시지 무시.
* **`allowlist`**: 등록된 번호만 허용.
* **`open`**: 모든 사용자 허용 (`allowFrom: ["*"]` 필요).
* **`disabled`**: 수신 차단.
* 번호 형식: 국제 표준인 E.164 형식을 사용함 (예: `+8210...`).

### 그룹 정책 및 허용 목록

1. **그룹 참여 제어 (`groups`)**: 등록된 그룹이나 `"*"` 설정이 포함된 경우에만 응답함.
2. **발신자 제어 (`groupPolicy`)**: `groupAllowFrom`에 등록된 사용자만 에이전트를 호출할 수 있음. 미설정 시 DM 허용 목록을 상속함.

### 멘션 및 활성화 (`/activation`)

* 그룹 내에서는 기본적으로 @멘션 시에만 응답함.
* **실시간 모드 변경**: `/activation mention` (멘션 시 응답), `/activation always` (모든 메시지 응답). 이 설정은 세션 상태에만 저장되며 영구 반영하려면 설정 파일을 수정해야 함.

***

## 개인 번호 및 셀프 채팅(Self-chat) 보호

연동된 본인 번호가 `allowFrom`에 포함된 경우, 시스템은 자동으로 보호 기능을 활성화함:

* 본인과의 대화에서는 **읽음 확인(Read receipt)** 전송을 건너뜀.
* 본인 번호를 멘션하여 발생하는 자동 트리거 루프를 차단함.
* 응답 접두사가 없을 경우 기본적으로 `[{에이전트이름}]` 형식을 사용하여 답변을 구분함.

***

## 메시지 표준화 및 컨텍스트

### 수신 엔벨로프 및 답장 맥락

수신된 모든 메시지는 공통 규격으로 래핑됨. 인용 답장의 경우 다음과 같은 마커가 본문에 추가됨:

```text
[Replying to <발신자> id:<메시지ID>]
<인용된 본문 또는 미디어 정보>
[/Replying]
```

### 대기 중인 그룹 이력 주입 (Context Injection)

에이전트가 호출되기 전 발생한 이전 메시지들(최대 50개)을 버퍼링했다가, 활성화 시점에 문맥 정보로 주입함. 이를 통해 에이전트는 앞선 대화 흐름을 파악한 뒤 답변할 수 있음.

***

## 미디어 처리 및 전송

* **텍스트 청킹 (Chunking)**: 발신 메시지는 최대 4,000자 단위로 자동 분할됨. `chunkMode="newline"` 설정 시 문단 단위 분할을 우선함.
* **지원 미디어**: 이미지, 비디오, 오디오(음성 메시지), 문서 지원.
* **자동 최적화**: 고용량 이미지는 전송 한도에 맞춰 자동으로 크기 및 품질이 조정됨.
* **용량 제한**: 수발신 미디어의 기본 한도는 50MB이며, `mediaMaxMb` 설정을 통해 변경 가능함.

***

## 확인 리액션 (Ack Reactions)

메시지 수신 시 에이전트가 답변을 생성하는 동안 즉시 이모지 리액션을 표시하도록 설정할 수 있음.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

***

## 문제 해결 (Troubleshooting)

* **연동 해제 상태**: `openclaw channels status` 명령어로 상태를 확인하고, `login` 명령어를 통해 QR 코드를 다시 스캔함.
* **반복적인 연결 끊김**: `openclaw doctor` 명령어를 실행하여 자격 증명 디렉터리 권한을 점검하고 로그를 모니터링함.
* **그룹 메시지 무응답**: `groupPolicy`, `groupAllowFrom`, 멘션 게이팅 설정을 순서대로 점검함.
* **런타임 주의**: WhatsApp 연동은 안정성을 위해 반드시 **Node.js** 환경에서 실행해야 함. **Bun** 런타임은 현재 공식적으로 지원하지 않음.

상세한 설정 옵션과 스키마는 [Gateway 설정 레퍼런스](/gateway/configuration-reference#whatsapp)를 참조함.
