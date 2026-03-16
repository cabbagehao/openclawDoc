---
summary: "몇 분 안에 OpenClaw를 설치하고 첫 채팅을 실행하세요."
read_when:
  - 처음부터 설정을 시작할 때
  - 작동하는 채팅까지 가장 빠르게 가고 싶을 때
title: "시작하기"
description: "OpenClaw를 설치하고 온보딩, Gateway 확인, Control UI 접속까지 가장 빠르게 완료하는 시작 가이드"
x-i18n:
  source_path: "start/getting-started.md"
---


# 시작하기

목표: 최소한의 설정으로 아무것도 없는 상태에서 첫 번째 작동하는 채팅까지 가는 것입니다.

<Info>
가장 빠른 시작 방법은 Control UI를 여는 것입니다(채널 설정 불필요). `openclaw dashboard`를 실행해 브라우저에서 채팅하거나,
<Tooltip headline="게이트웨이 호스트" tip="OpenClaw Gateway 서비스가 실행 중인 머신입니다.">게이트웨이 호스트</Tooltip>에서 `http://127.0.0.1:18789/`를 여세요.
관련 문서: [대시보드](/web/dashboard), [Control UI](/web/control-ui).
</Info>

## 사전 요구사항

- Node 22 이상

<Tip>
확실하지 않다면 `node --version`으로 Node 버전을 확인하세요.
</Tip>

## 빠른 설정 (CLI)

<Steps>
  <Step title="OpenClaw 설치 (권장)">
    <Tabs>
      <Tab title="macOS/Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    다른 설치 방법과 요구사항은 [Install](/install)을 참고하세요.
    </Note>

  </Step>
  <Step title="온보딩 마법사 실행">
    ```bash
    openclaw onboard --install-daemon
    ```

    마법사가 인증, Gateway 설정, 선택적 채널 구성을 안내합니다.
    자세한 내용은 [온보딩 마법사](/start/wizard)를 참고하세요.

  </Step>
  <Step title="Gateway 상태 확인">
    서비스를 설치했다면 이미 실행 중이어야 합니다.

    ```bash
    openclaw gateway status
    ```

  </Step>
  <Step title="Control UI 열기">
    ```bash
    openclaw dashboard
    ```
  </Step>
</Steps>

<Check>
Control UI가 정상적으로 로드되면 Gateway를 사용할 준비가 된 것입니다.
</Check>

## 선택적 확인 및 추가 사항

<AccordionGroup>
  <Accordion title="Gateway를 포그라운드에서 실행">
    빠른 테스트나 문제 해결이 필요한 경우 유용합니다.

    ```bash
    openclaw gateway --port 18789
    ```

  </Accordion>
  <Accordion title="테스트 메시지 전송">
    이 기능은 구성된 채널이 필요합니다.

    ```bash
    openclaw message send --target +15555550123 --message "Hello from OpenClaw"
    ```

  </Accordion>
</AccordionGroup>

## 유용한 환경 변수

서비스 계정으로 OpenClaw를 실행하거나 config/state 위치를 직접 지정하려면 다음 환경 변수를 사용할 수 있습니다.

- `OPENCLAW_HOME`은 내부 경로 해석에 사용할 홈 디렉터리를 설정합니다.
- `OPENCLAW_STATE_DIR`은 상태 디렉터리를 재정의합니다.
- `OPENCLAW_CONFIG_PATH`는 설정 파일 경로를 재정의합니다.

전체 환경 변수 목록: [Environment vars](/help/environment).

## 더 알아보기

<Columns>
  <Card title="온보딩 마법사 (상세)" href="/start/wizard">
    전체 CLI 마법사 레퍼런스와 고급 옵션입니다.
  </Card>
  <Card title="macOS 앱 온보딩" href="/start/onboarding">
    macOS 앱의 첫 실행 흐름입니다.
  </Card>
</Columns>

## 완료 후 갖추게 되는 것

- 실행 중인 Gateway
- 구성된 인증
- Control UI 액세스 또는 연결된 채널

## 다음 단계

- DM 안전성과 승인: [페어링](/channels/pairing)
- 채널 더 연결하기: [채널](/channels)
- 고급 워크플로우와 소스 기준 설정: [설정](/start/setup)
