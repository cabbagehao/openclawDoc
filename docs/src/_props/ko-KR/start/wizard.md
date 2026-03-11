---
summary: "OpenClaw CLI 온보딩 마법사: Gateway, 워크스페이스, 채널 및 스킬 통합 설정 가이드"
read_when:
  - 온보딩 마법사를 실행하거나 구성하고자 할 때
  - 새로운 기기에 OpenClaw 환경을 구축할 때
title: "온보딩 마법사 (CLI)"
sidebarTitle: "온보딩: CLI"
x-i18n:
  source_path: "start/wizard.md"
---

# 온보딩 마법사 (CLI)

온보딩 마법사는 macOS, Linux 또는 Windows (WSL2 환경 권장)에서 OpenClaw를 설정하는 가장 **권장되는** 방법임. 한 번의 실행으로 로컬 또는 원격 Gateway 연결 설정은 물론, 통신 채널, 에이전트 스킬, 워크스페이스 기본값 구성을 완료할 수 있음.

```bash
openclaw onboard
```

<Info>
  **가장 빠르게 대화를 시작하는 방법**: 별도의 채널 설정 없이 바로 대화하고 싶다면 Control UI를 활용함. `openclaw dashboard` 실행 후 브라우저에서 즉시 채팅이 가능함. 관련 문서: [대시보드 가이드](/web/dashboard).
</Info>

추후 설정을 변경하거나 에이전트를 추가하려면 다음 명령어를 사용함:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
  `--json` 플래그 사용 시 출력이 구조화되지만, 비대화형 모드가 자동으로 활성화되지는 않음. 스크립트 자동화 시에는 반드시 `--non-interactive` 플래그를 함께 사용함.
</Note>

<Tip>
  온보딩 과정에 웹 검색 설정 단계가 포함되어 있음. Perplexity, Brave, Gemini, Grok, Kimi 중 공급자를 선택하고 API 키를 입력하면 에이전트가 `web_search` 기능을 사용할 수 있게 됨. 이 설정은 나중에 `openclaw configure --section web` 명령어로도 변경 가능함. 관련 문서: [Web 도구 상세](/tools/web).
</Tip>

## 빠른 시작(QuickStart) vs 고급 설정(Advanced)

마법사 시작 시 기본값을 사용하는 **QuickStart**와 세부 제어가 가능한 **Advanced** 모드 중 선택할 수 있음.

<Tabs>
  <Tab title="QuickStart (권장 기본값)">
    * 로컬 Gateway 모드 (Loopback 연결).
    * 기본 워크스페이스 경로 사용.
    * Gateway 포트: **18789**.
    * Gateway 인증: **토큰(Token)** 방식 (자동 생성됨).
    * 도구 권한 프로필: `tools.profile: "coding"` (로컬 환경 최적화).
    * DM 격리 정책: `session.dmScope: "per-channel-peer"` 자동 적용.
    * Tailscale 노출: **비활성(Off)**.
    * Telegram 및 WhatsApp DM: **허용 목록(Allowlist)** 기반 (본인의 전화번호 입력 필요).
  </Tab>

  <Tab title="Advanced (세부 제어)">
    * 연결 모드, 워크스페이스 경로, 서버 상세 설정, 채널 개별 구성, 데몬 설치 옵션, 스킬 선택 등 모든 단계를 수동으로 지정함.
  </Tab>
</Tabs>

## 마법사 설정 프로세스

**로컬 모드 (기본값)** 선택 시 다음 단계를 거침:

1. **모델 및 인증 설정**: API 키, OAuth, 또는 설정 토큰을 통해 공급자를 연동함. 커스텀 공급자(Custom Provider) 연동도 지원함.
   * **보안 참고**: 에이전트가 시스템 도구를 실행하거나 외부 웹훅 데이터를 처리하는 경우, 가급적 최신 세대의 고성능 모델 사용을 권장함. 하위 모델은 프롬프트 주입(Prompt Injection) 공격에 상대적으로 취약할 수 있음.
   * **자동화 팁**: `--secret-input-mode ref` 플래그를 사용하면 평문 키 대신 환경 변수 참조 정보를 저장하여 보안을 강화할 수 있음.
2. **워크스페이스 구성**: 에이전트 데이터가 저장될 경로(기본: `~/.openclaw/workspace`)를 지정하고 초기 구동 파일을 생성함.
3. **Gateway 서버 설정**: 서버 포트, 바인딩 주소, 인증 모드 및 외부 노출 여부를 결정함.
4. **채널 연동**: 사용하고자 하는 채팅 플랫폼(WhatsApp, Telegram, Discord 등)을 선택하고 인증함.
5. **데몬(Daemon) 설치**: 백그라운드 자동 실행을 위해 macOS는 LaunchAgent를, Linux/WSL2는 systemd 유닛을 설치함.
6. **상태 점검**: 설정된 내용으로 Gateway를 실제 가동하여 정상 작동 여부를 검증함.
7. **스킬 구성**: 에이전트에게 부여할 기능(Skills)을 선택하고 필요한 의존성 라이브러리를 설치함.

<Note>
  마법사를 다시 실행해도 기존 데이터가 삭제되지는 않음. 초기화가 필요한 경우에만 명시적으로 **Reset** 옵션을 선택하거나 `--reset` 플래그를 사용함. 설정 파일에 오류가 있을 경우 `openclaw doctor` 실행을 먼저 요청할 수 있음.
</Note>

\*\*원격 모드 (Remote Mode)\*\*는 로컬 기기를 외부의 이미 실행 중인 Gateway 서버에 연결하는 용도로만 사용되며, 대상 서버의 설정을 변경하지 않음.

## 추가 에이전트 생성

`openclaw agents add <name>` 명령어로 각각 독립된 워크스페이스와 설정을 가진 멀티 에이전트 환경을 구축할 수 있음.

* 별도의 워크스페이스 및 데이터 디렉터리 할당 가능.
* 인바운드 메시지 라우팅(Bindings) 설정 지원.
* 주요 자동화 플래그: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## 상세 기술 레퍼런스

각 단계의 세부 기술 사양, 비대화형 스크립팅 방법, Signal 설치 절차 및 RPC API 명세는 [온보딩 상세 레퍼런스](/reference/wizard)를 참조함.

## 관련 문서 목록

* **명령어 레퍼런스**: [`openclaw onboard`](/cli/onboard)
* **온보딩 전체 개요**: [온보딩 개요 가이드](/start/onboarding-overview)
* **macOS 앱 사용자 전용**: [온보딩 (macOS 앱)](/start/onboarding)
* **에이전트 초기화 절차**: [부트스트래핑 안내](/start/bootstrapping)
