---
summary: "몇 분 안에 OpenClaw를 설치하고 첫 채팅을 실행하세요."
read_when:
  - 처음부터 시작하는 초기 설정
  - 작동하는 채팅으로 가는 가장 빠른 경로를 원할 때
title: "시작하기"
x-i18n:
  source_path: "start/getting-started.md"
  source_hash: "4ec86bd0345cc7a70236e566da2ccb9ff17764cc5a7c3b23eab8d5d558251520"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T08:14:56.929Z"
---


# 시작하기

목표: 최소한의 설정으로 처음 작동하는 채팅까지 진행합니다.

<Info>
가장 빠른 채팅: Control UI를 엽니다(채널 설정 불필요). `openclaw dashboard`를 실행하고
브라우저에서 채팅하거나, <Tooltip headline="게이트웨이 호스트" tip="OpenClaw 게이트웨이 서비스를 실행하는 머신입니다.">게이트웨이 호스트</Tooltip>에서 `http://127.0.0.1:18789/`를 엽니다.
문서: [Dashboard](/web/dashboard) 및 [Control UI](/web/control-ui).
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
    다른 설치 방법 및 요구사항: [Install](/install).
    </Note>

  </Step>
  <Step title="온보딩 마법사 실행">
    ```bash
    openclaw onboard --install-daemon
    ```

    마법사는 인증, 게이트웨이 설정 및 선택적 채널을 구성합니다.
    자세한 내용은 [Onboarding Wizard](/start/wizard)를 참조하세요.

  </Step>
  <Step title="게이트웨이 확인">
    서비스를 설치했다면 이미 실행 중이어야 합니다:

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
Control UI가 로드되면 게이트웨이를 사용할 준비가 된 것입니다.
</Check>

## 선택적 확인 및 추가 사항

<AccordionGroup>
  <Accordion title="포그라운드에서 게이트웨이 실행">
    빠른 테스트나 문제 해결에 유용합니다.

    ```bash
    openclaw gateway --port 18789
    ```

  </Accordion>
  <Accordion title="테스트 메시지 전송">
    구성된 채널이 필요합니다.

    ```bash
    openclaw message send --target +15555550123 --message "Hello from OpenClaw"
    ```

  </Accordion>
</AccordionGroup>

## 유용한 환경 변수

서비스 계정으로 OpenClaw를 실행하거나 사용자 정의 구성/상태 위치를 원하는 경우:

- `OPENCLAW_HOME`은 내부 경로 확인에 사용되는 홈 디렉토리를 설정합니다.
- `OPENCLAW_STATE_DIR`은 상태 디렉토리를 재정의합니다.
- `OPENCLAW_CONFIG_PATH`는 구성 파일 경로를 재정의합니다.

전체 환경 변수 참조: [Environment vars](/help/environment).

## 더 깊이 알아보기

<Columns>
  <Card title="Onboarding Wizard (세부사항)" href="/start/wizard">
    전체 CLI 마법사 참조 및 고급 옵션.
  </Card>
  <Card title="macOS 앱 온보딩" href="/start/onboarding">
    macOS 앱의 첫 실행 흐름.
  </Card>
</Columns>

## 완료된 항목

- 실행 중인 게이트웨이
- 구성된 인증
- Control UI 액세스 또는 연결된 채널

## 다음 단계

- DM 안전 및 승인: [Pairing](/channels/pairing)
- 더 많은 채널 연결: [Channels](/channels)
- 고급 워크플로우 및 소스에서 설치: [Setup](/start/setup)
