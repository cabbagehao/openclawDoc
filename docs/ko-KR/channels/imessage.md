---
summary: "imsg를 활용한 레거시 iMessage 연동 가이드 (JSON-RPC 기반). 신규 환경에는 BlueBubbles 사용을 권장함."
read_when:
  - iMessage 연동 환경을 구축하거나 관련 기능을 작업할 때
  - iMessage 메시지 송수신 문제를 디버깅할 때
title: "iMessage"
x-i18n:
  source_path: "channels/imessage.md"
---

# iMessage (레거시: imsg)

<Warning>
신규 iMessage 연동 환경을 구축하는 경우, 가급적 <a href="/channels/bluebubbles">BlueBubbles</a> 방식을 사용할 것을 권장함.

`imsg` 기반의 통합 방식은 현재 레거시(Legacy)로 분류되며, 향후 버전에서 지원이 중단될 수 있음.
</Warning>

**상태**: 외부 CLI 도구를 활용한 레거시 통합 방식임. Gateway가 `imsg rpc` 프로세스를 실행하고 표준 입출력(stdio)을 통해 JSON-RPC로 통신함 (별도의 데몬이나 포트 점유 없음).

<CardGroup cols={3}>
  <Card title="BlueBubbles (권장)" icon="message-circle" href="/channels/bluebubbles">
    신규 설정을 위한 최적의 iMessage 연동 경로.
  </Card>
  <Card title="페어링" icon="link" href="/channels/pairing">
    iMessage DM은 기본적으로 페어링 모드를 사용함.
  </Card>
  <Card title="설정 레퍼런스" icon="settings" href="/gateway/configuration-reference#imessage">
    iMessage 관련 전체 설정 필드 안내.
  </Card>
</CardGroup>

## 빠른 설정 가이드

<Tabs>
  <Tab title="로컬 Mac 환경">
    <Steps>
      <Step title="imsg 설치 및 확인">
        ```bash
        brew install steipete/tap/imsg
        imsg rpc --help
        ```
      </Step>

      <Step title="OpenClaw 설정">
        `openclaw.json` 파일에 아래 설정을 추가함:
        ```json5
        {
          channels: {
            imessage: {
              enabled: true,
              cliPath: "/usr/local/bin/imsg",
              dbPath: "/Users/<사용자명>/Library/Messages/chat.db",
            },
          },
        }
        ```
      </Step>

      <Step title="Gateway 시작">
        ```bash
        openclaw gateway
        ```
      </Step>

      <Step title="첫 DM 페어링 승인">
        ```bash
        openclaw pairing list imessage
        openclaw pairing approve imessage <CODE>
        ```
        페어링 코드는 1시간 동안 유효함.
      </Step>
    </Steps>
  </Tab>

  <Tab title="SSH 원격 Mac 환경">
    OpenClaw는 표준 입출력과 호환되는 `cliPath`만 있으면 되므로, 원격 Mac에 SSH로 접속하여 `imsg`를 실행하는 래퍼 스크립트를 지정할 수 있음.

    **래퍼 스크립트 예시 (`imsg-ssh`):**
    ```bash
    #!/usr/bin/env bash
    exec ssh -T gateway-host imsg "$@"
    ```

    **첨부 파일 활성화 시 권장 설정:**
    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "user@gateway-host", // SCP 첨부 파일 전송에 사용됨
          includeAttachments: true,
          attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
          remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
        },
      },
    }
    ```

    - `remoteHost` 미설정 시 SSH 래퍼 스크립트 내용을 분석하여 자동 감지를 시도함.
    - SCP 통신 시 엄격한 호스트 키 검사가 수행되므로, 대상 서버의 키가 이미 `~/.ssh/known_hosts`에 등록되어 있어야 함.
  </Tab>
</Tabs>

## 시스템 요구 사항 및 권한 (macOS)

- `imsg`가 실행되는 Mac에서 iMessage(Messages.app) 로그인이 완료되어 있어야 함.
- OpenClaw 및 `imsg` 실행 프로세스에 **전체 디스크 접근 권한(Full Disk Access)**이 필요함 (메시지 DB 접근용).
- 메시지 발신을 위해 Messages.app에 대한 **자동화(Automation) 권한**이 필요함.

<Tip>
권한은 프로세스 실행 컨텍스트별로 부여됨. 만약 Gateway가 헤드리스(LaunchAgent 또는 SSH) 환경에서 실행된다면, 동일한 세션의 대화형 터미널에서 아래 명령어를 한 번 실행하여 권한 승인 팝업을 유도해야 함:
```bash
imsg chats --limit 1
# 또는
imsg send <대상ID> "test"
```
</Tip>

## 접근 제어 및 라우팅 정책

- **DM 정책**: `dmPolicy` 설정을 통해 `pairing` (기본값), `allowlist`, `open`, `disabled` 중 선택.
- **그룹 정책**: `groupPolicy`를 통해 허용 목록(`allowlist`) 기반 운영 가능. `groupAllowFrom`이 비어 있으면 일반 `allowFrom` 설정을 폴백으로 사용함.
- **멘션 게이팅**: iMessage는 네이티브 멘션 메타데이터를 제공하지 않음. 따라서 `mentionPatterns` 정규표현식 설정을 기반으로 멘션 여부를 판별함. 패턴이 설정되지 않은 경우 모든 그룹 메시지에 응답하지 않을 수 있음.
- **세션 격리**: DM은 에이전트 메인 세션을 공유하며, 그룹 대화는 `agent:<agentId>:imessage:group:<chat_id>` 키를 사용하여 격리된 세션으로 관리됨.

## 주요 배포 패턴

- **전용 봇 계정 운영**: 개인 계정 보호를 위해 별도의 Apple ID를 가진 macOS 사용자 계정을 생성하고, 해당 세션에서만 `imsg`를 구동하는 방식을 권장함.
- **Tailscale 원격 연동**: Linux 서버 등에서 Gateway를 실행하고, Tailscale 네트워크 내의 Mac을 SSH 래퍼를 통해 원격 iMessage 노드로 활용함.
- **다중 계정 지원**: `channels.imessage.accounts` 하위에 여러 계정을 등록하여 각기 다른 `cliPath`나 `dbPath`를 할당할 수 있음.

## 미디어 및 전송 관리

- **첨부 파일 수집**: `includeAttachments: true` 설정 시 수신된 파일을 에이전트가 처리할 수 있음. 원격 환경인 경우 SCP를 통해 파일을 가져옴.
- **전송 청킹 (Chunking)**: `textChunkLimit` (기본 4000자) 및 `chunkMode` (`length` 또는 `newline`) 설정을 통해 긴 응답을 적절히 나누어 보냄.
- **대상 지정 형식**: 안정적인 라우팅을 위해 `chat_id:123` 형식을 권장함. 핸들(이메일, 전화번호) 형식도 지원됨.

## 문제 해결 (Troubleshooting)

- **RPC 미지원 오류**: `imsg rpc --help` 명령어로 바이너리 정상 여부를 확인하고, 최신 버전으로 업데이트함.
- **메시지 무시 현상**: `dmPolicy` 설정과 페어링 승인 여부를 `openclaw pairing list imessage` 명령어로 확인함.
- **권한 문제**: macOS 시스템 설정에서 OpenClaw/터미널/SSH 프로세스에 '전체 디스크 접근 권한' 및 '자동화 권한'이 올바르게 부여되었는지 재점검함.
- **원격 첨부 파일 실패**: Gateway 호스트에서 대상 Mac으로의 SSH 키 기반 인증이 정상 작동하는지, `known_hosts`에 등록되었는지 확인함.

상세한 설정 옵션은 [Gateway 설정 레퍼런스](/gateway/configuration-reference#imessage)를 참조함.
