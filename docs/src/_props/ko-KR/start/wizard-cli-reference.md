---
summary: "CLI 온보딩 워크플로우, 인증 및 모델 설정, 내부 동작 방식에 대한 상세 레퍼런스"
read_when:
  - "`openclaw onboard` 명령어의 세부 동작을 파악하고자 할 때"
  - 온보딩 결과 데이터를 디버깅하거나 커스텀 클라이언트를 통합할 때
title: "CLI 온보딩 상세 레퍼런스"
sidebarTitle: "CLI 레퍼런스"
x-i18n:
  source_path: "start/wizard-cli-reference.md"
---

# CLI 온보딩 레퍼런스 (CLI Onboarding Reference)

이 페이지는 `openclaw onboard` 명령어에 대한 종합적인 기술 레퍼런스임. 요약된 안내가 필요하다면 [온보딩 마법사 가이드](/start/wizard)를 참조함.

## 마법사 주요 기능

**로컬 모드 (기본값)** 실행 시 다음 절차를 단계별로 안내함:

* **모델 및 인증 설정**: OpenAI, Anthropic(API 키 또는 토큰), MiniMax, GLM, Moonshot 등 다양한 공급자 연동.
* **워크스페이스 초기화**: 저장 경로 지정 및 에이전트 구동에 필요한 초기 파일 생성.
* **Gateway 서버 설정**: 포트 번호, 바인딩 주소, 인증 방식, Tailscale 노출 여부 지정.
* **통신 채널 연동**: Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal 등 연동.
* **데몬 서비스 설치**: macOS(LaunchAgent), Linux/Windows(systemd 사용자 유닛) 기반 자동 실행 설정.
* **상태 점검**: Gateway 서버 가동 및 헬스 체크 수행.
* **스킬(Skills) 구성**: 에이전트가 사용할 도구 목록 확인 및 의존성 설치.

**원격 모드**는 현재 기기를 외부 서버(Gateway)에 연결하기 위한 클라이언트 전용 설정을 수행하며, 원격 호스트를 직접 수정하지 않음.

## 로컬 설정 워크플로우 상세

<Steps>
  <Step title="기존 설정 감지">
    * `~/.openclaw/openclaw.json` 파일이 이미 존재하는 경우 '유지(Keep)', '수정(Modify)', '초기화(Reset)' 중 하나를 선택함.
    * 단순히 마법사를 다시 실행한다고 해서 데이터가 삭제되지는 않음. 초기화가 필요한 경우에만 명시적으로 `Reset`을 선택하거나 `--reset` 플래그를 사용함.
    * `--reset`의 기본 범위는 `config+creds+sessions`이며, 워크스페이스까지 삭제하려면 `--reset-scope full`을 지정함.
    * 기존 설정이 유효하지 않거나 레거시 키가 포함된 경우, 진행 전 `openclaw doctor` 실행을 권장하며 중단될 수 있음.
  </Step>

  <Step title="모델 및 인증 정보 입력">
    * 상세 연동 옵션은 아래 [인증 및 모델 옵션](#인증-및-모델-옵션) 섹션을 참조함.
  </Step>

  <Step title="워크스페이스 구성">
    * 기본 경로: `~/.openclaw/workspace` (변경 가능).
    * 최초 실행 시 에이전트 구동에 필수적인 초기 파일들을 생성(Seeding)함.
    * 워크스페이스 구조 상세: [에이전트 워크스페이스](/concepts/agent-workspace).
  </Step>

  <Step title="Gateway 서버 설정">
    * 포트, 바인딩 주소, 인증 모드, Tailscale 활성화 여부를 선택함.
    * **보안 권장**: 루프백(Loopback) 연결만 사용하더라도 토큰(Token) 인증을 활성화하여 로컬 클라이언트의 비인가 접근을 방지할 것을 권장함.
    * 토큰 인증 모드에서 대화형 온보딩 시 다음 중 선택 가능:
      * **평문 토큰 생성/저장** (기본값)
      * **시크릿 참조(SecretRef) 활용** (고급 사용자용)
    * 암호 인증 모드 역시 평문 또는 SecretRef 저장을 지원함.
    * 비대화형 토큰 설정 시: `--gateway-token-ref-env <ENV_VAR>` 사용 (해당 환경 변수가 미리 설정되어 있어야 함).
  </Step>

  <Step title="통신 채널 설정">
    * [WhatsApp](/channels/whatsapp): QR 코드를 통한 로그인 연동.
    * [Telegram](/channels/telegram) / [Discord](/channels/discord): 봇 토큰 입력.
    * [Google Chat](/channels/googlechat): 서비스 계정 JSON 및 웹훅 정보 입력.
    * [Mattermost](/channels/mattermost): 플러그인 기반 연동.
    * [Signal](/channels/signal): `signal-cli` 설치 및 계정 연동.
    * [BlueBubbles](/channels/bluebubbles): iMessage 연동을 위한 권장 방식.
    * **DM 보안 정책**: 기본적으로 '페어링(Pairing)' 방식을 사용함. 최초 메시지 수신 시 인증 코드를 전송하며, `openclaw pairing approve <channel> <code>` 명령어로 승인하거나 허용 목록(Allowlist)을 직접 관리함.
  </Step>

  <Step title="데몬(Daemon) 서비스 설치">
    * **macOS**: `LaunchAgent`로 설치됨 (사용자 로그인 세션 필요). 헤드리스 서버의 경우 별도의 LaunchDaemon 구성이 필요함.
    * **Linux / Windows (WSL2)**: `systemd` 사용자 유닛으로 설치됨. 로그아웃 후에도 서버가 유지되도록 `loginctl enable-linger` 활성화를 시도함 (필요 시 sudo 권한 요청).
    * **런타임**: Node.js 권장 (WhatsApp, Telegram 채널 사용 시 필수). Bun은 권장하지 않음.
  </Step>

  <Step title="시스템 상태 점검">
    * Gateway 서버를 시작하고 `openclaw health`를 통해 정상 작동 여부를 확인함.
    * `openclaw status --deep` 명령어를 사용하면 상세한 네트워크 헬스 체크 결과를 포함하여 출력함.
  </Step>

  <Step title="에이전트 스킬 설정">
    * 사용 가능한 스킬 목록을 불러오고 환경 요구 사항을 확인함.
    * 패키지 매니저(npm 또는 pnpm)를 선택하여 필요한 의존성을 설치함.
  </Step>

  <Step title="완료 및 다음 단계 안내">
    * 설정 요약 정보를 출력하고, 모바일 앱(iOS, Android) 연동 등 이후 단계를 안내함.
  </Step>
</Steps>

<Note>
  GUI 환경이 감지되지 않을 경우, 브라우저 자동 실행 대신 SSH 포트 포워딩을 통한 Control UI 접속 방법을 안내함. UI 리소스가 누락된 경우 `pnpm ui:build`를 통해 자동 빌드를 시도함.
</Note>

## 원격 모드 (Remote Mode) 상세

원격 모드는 현재 기기를 이미 실행 중인 외부 Gateway 서버에 연결하는 '클라이언트 모드'임.

<Info>
  원격 모드는 대상 서버(Remote Host)에 어떠한 파일도 설치하거나 설정을 변경하지 않음.
</Info>

* **설정 항목**: 원격 서버 URL (`ws://...`), 인증용 토큰(Token).
* **접근 팁**: 서버가 루프백 전용으로 바인딩된 경우 SSH 터널링이나 Tailscale 네트워크를 사용함.
* **탐색 도구**: macOS는 `dns-sd`, Linux는 `avahi-browse`를 통해 네트워크상의 Gateway를 찾을 수 있음.

## 인증 및 모델 옵션

<AccordionGroup>
  <Accordion title="Anthropic API Key">
    `ANTHROPIC_API_KEY` 환경 변수를 사용하거나 키를 직접 입력받아 저장함.
  </Accordion>

  <Accordion title="Anthropic OAuth (Claude Code 연동)">
    * macOS: 키체인(Keychain)의 "Claude Code-credentials" 항목을 확인함.
    * Linux/Windows: `~/.claude/.credentials.json` 파일이 존재할 경우 해당 정보를 재사용함.
  </Accordion>

  <Accordion title="OpenAI API Key">
    `OPENAI_API_KEY` 환경 변수를 사용하거나 키를 입력받아 인증 프로필에 저장함. 모델 미지정 시 기본값으로 최신 GPT 모델을 제안함.
  </Accordion>

  <Accordion title="OpenCode Zen">
    [opencode.ai/auth](https://opencode.ai/auth)에서 발급받은 키를 입력함.
  </Accordion>

  <Accordion title="커스텀 공급자 (Custom Provider)">
    OpenAI 또는 Anthropic API 규격을 지원하는 모든 엔드포인트와 연동 가능함.

    * **대화형 설정**: 평문 키 입력 또는 시크릿 참조(SecretRef) 방식 지원.
    * **비대화형 설정 플래그**: `--custom-base-url`, `--custom-model-id`, `--custom-compatibility` 등 사용.
  </Accordion>
</AccordionGroup>

### 자격 증명 저장 및 보안 (SecretRef)

* **평문 저장**: 기본적으로 온보딩 시 입력한 API 키는 인증 프로필 파일 내에 평문으로 저장됨.
* **참조(Ref) 모드**: `--secret-input-mode ref` 플래그를 사용하면 실제 키 대신 환경 변수나 외부 시크릿 공급자를 참조하는 정보만 저장함.
  * **환경 변수 참조**: `{ source: "env", provider: "default", id: "KEY_NAME" }` 구조로 저장됨.
  * **검증 프로세스**: 참조 모드 설정 시, 해당 환경 변수가 현재 세션에 존재하는지 및 유효한 값인지를 즉석에서 검증함(Preflight validation).
* **Gateway 인증**: 서버 접근용 토큰이나 비밀번호 역시 SecretRef 방식을 통해 안전하게 관리할 수 있음.

## 내부 동작 및 출력 데이터

`~/.openclaw/openclaw.json` 파일의 주요 필드 구성:

* `agents.defaults.workspace`: 에이전트 워크스페이스 경로.
* `tools.profile`: 도구 권한 프로필 (로컬 초기 설정 시 `"coding"` 권장).
* `gateway.*`: 서버 모드, 포트, 인증 및 네트워크 노출 설정.
* `session.dmScope`: DM 대화 맥락 유지 범위 (기본값 `"per-channel-peer"`).
* `channels.*`: 각 통신 채널별 봇 토큰 및 세부 설정.
* `wizard.*`: 마지막 온보딩 실행 시간, 버전, 커밋 및 명령어 이력 정보.

WhatsApp 자격 증명: `~/.openclaw/credentials/whatsapp/`
세션 데이터 저장소: `~/.openclaw/agents/<agentId>/sessions/`

## 관련 문서 목록

* **온보딩 통합 허브**: [온보딩 마법사 가이드](/start/wizard)
* **자동화 가이드**: [CLI 자동화 상세](/start/wizard-cli-automation)
* **명령어 상세 설명**: [`openclaw onboard` 명령어](/cli/onboard)
