---
summary: "Telegram 봇 연동 상태, 지원 기능 및 세부 설정 가이드"
read_when:
  - Telegram 채널 기능을 구현하거나 웹훅 관련 설정을 수정할 때
title: "Telegram"
x-i18n:
  source_path: "channels/telegram.md"
---

# Telegram (봇 API)

**상태**: grammY 프레임워크를 기반으로 개인 대화(DM) 및 그룹 연동이 가능한 운영 준비 단계임. 기본적으로 **롱 폴링(Long polling)** 방식을 사용하며, 필요에 따라 웹훅(Webhook) 모드 선택이 가능함.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/channels/pairing">
    Telegram DM은 기본적으로 페어링 모드로 작동함.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/channels/troubleshooting">
    채널 전반의 진단 및 복구 가이드.
  </Card>
  <Card title="Gateway 설정" icon="settings" href="/gateway/configuration">
    채널 설정 패턴 및 다양한 예시.
  </Card>
</CardGroup>

## 빠른 설정 가이드

<Steps>
  <Step title="BotFather를 통한 봇 생성">
    Telegram 앱에서 **@BotFather**와 대화를 시작함 (공식 계정 여부 확인 필수).
    `/newbot` 명령어를 입력하고 안내에 따라 봇 이름과 사용자명을 설정한 뒤 발급된 **봇 토큰(Bot Token)**을 안전하게 보관함.
  </Step>

  <Step title="토큰 및 보안 정책 설정">
```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```
환경 변수 사용 (기본 계정 전용): `TELEGRAM_BOT_TOKEN=...`
  </Step>

  <Step title="Gateway 시작 및 첫 DM 승인">
```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <코드>
```
발급된 페어링 코드는 1시간 동안 유효함.
  </Step>

  <Step title="그룹 대화 연동">
    봇을 그룹에 추가한 후, `channels.telegram.groups` 및 `groupPolicy` 설정을 통해 응답 규칙을 지정함.
  </Step>
</Steps>

<Note>
토큰 해석 시 설정 파일(`openclaw.json`)의 값이 환경 변수보다 우선함. `TELEGRAM_BOT_TOKEN` 환경 변수는 오직 기본(`default`) 계정에만 적용됨.
</Note>

---

## Telegram 서버 측 설정

<AccordionGroup>
  <Accordion title="개인정보 보호 모드 및 그룹 가시성">
    봇은 기본적으로 **Privacy Mode**가 활성화되어 있어 모든 그룹 메시지를 읽을 수 없음. 봇이 모든 메시지를 수신하게 하려면 다음 중 하나를 수행함:
    - BotFather에서 `/setprivacy` 명령어를 통해 기능을 비활성화함.
    - 봇을 해당 그룹의 관리자(Admin)로 승격함.
    *주의: 설정을 변경한 후에는 각 그룹에서 봇을 삭제했다가 다시 추가해야 변경 사항이 반영됨.*
  </Accordion>

  <Accordion title="그룹 권한 관리">
    관리자 권한을 부여받은 봇은 모든 메시지를 수신할 수 있으며, 이는 상시 모니터링이 필요한 그룹 운영 시 유용함.
  </Accordion>

  <Accordion title="유용한 BotFather 명령어">
    - `/setjoingroups`: 그룹 초대 허용 여부 설정.
    - `/setprivacy`: 그룹 메시지 가시성 제어.
  </Accordion>
</AccordionGroup>

---

## 접근 제어 및 활성화 정책

### 개인 대화 (DM)
- **정책 (`dmPolicy`)**: `pairing` (기본값), `allowlist`, `open`, `disabled` 중 선택.
- **ID 확인**: `openclaw logs --follow` 실행 상태에서 봇에게 메시지를 보내 `from.id` 값을 확인하거나, `@userinfobot` 등을 활용함.
- **권장 사항**: 1인 소유 봇의 경우, 인증 이력에 의존하기보다 명시적인 숫자 ID를 `allowFrom` 목록에 등록하여 관리할 것을 권장함.

### 그룹 대화 및 허용 목록
- **그룹 참여 제어**: `channels.telegram.groups`에 등록된 그룹이나 `"*"` 설정이 포함된 경우에만 응답함.
- **발신자 제어 (`groupPolicy`)**: 그룹 내에서 응답할 사용자를 `groupAllowFrom`으로 관리함. 미설정 시 DM 허용 목록을 상속함.
- **보안 경계**: 2026.2.25 버전 이후, 그룹 발신자 인증은 DM 페어링 승인 내역을 자동으로 공유하지 않음. 그룹별로 명시적인 허용 목록 설정이 필요함.

### 멘션 게이팅 (Mention Gating)
- 그룹 내에서는 기본적으로 @멘션 시에만 응답함.
- 실시간 모드 변경: `/activation always` (모든 메시지 응답), `/activation mention` (멘션 시 응답).

---

## 런타임 동작 상세

- **세션 격리**: 그룹별로 독립된 세션을 유지함. **포럼 주제(Topic)** 기능을 사용하는 경우, 각 주제마다 별도의 세션 접미사(`:topic:<threadId>`)가 붙어 맥락이 격리됨.
- **스레드 인식**: `message_thread_id`가 포함된 메시지 수신 시, 응답 시에도 해당 스레드 ID를 보존하여 일관된 대화 흐름을 유지함.
- **이벤트 정규화**: 수신된 메시지는 공통 채널 엔벨로프(Envelope)로 변환되어 에이전트에게 전달됨.

---

## 주요 기능 레퍼런스

<AccordionGroup>
  <Accordion title="라이브 스트림 미리보기 (메시지 수정)">
    답변이 생성되는 동안 미리보기 메시지를 실시간으로 업데이트함.
    - 설정: `streaming: "partial"` (기본값).
    - 동작: 텍스트 답변의 경우 하나의 미리보기 메시지를 제자리에서 수정하여 최종 답변을 완성함 (중복 알림 방지).
    - 추론 과정 노출: `/reasoning stream` 설정 시 답변 생성 전 사고 과정을 실시간으로 보여줄 수 있음.
  </Accordion>

  <Accordion title="서식 처리 및 HTML 폴백">
    아웃바운드 메시지는 기본적으로 **HTML 모드**를 사용함. 마크다운 서식을 Telegram 규격에 맞는 HTML로 변환하며, 파싱 에러 발생 시 안전하게 일반 텍스트(Plain text)로 전환하여 재전송함.
  </Accordion>

  <Accordion title="네이티브 명령어 및 메뉴 등록">
    `commands.native: "auto"` 설정 시 Telegram 앱의 `/` 메뉴에 OpenClaw 명령어가 자동으로 등록됨. `customCommands` 섹션을 통해 자주 사용하는 커스텀 명령어를 메뉴에 추가할 수 있음.
  </Accordion>

  <Accordion title="인라인 버튼 (Inline Buttons)">
    채널 역량(`capabilities`)에 `inlineButtons: "all"` 또는 `"allowlist"`를 추가하여 클릭 가능한 버튼이 포함된 메시지를 발송할 수 있음. 사용자의 버튼 클릭 이벤트는 에이전트에게 텍스트 형태로 전달됨.
  </Accordion>

  <Accordion title="오디오, 비디오 및 스티커">
    - **음성 메시지**: `[[audio_as_voice]]` 태그를 사용하여 오디오 파일을 원형 음성 메시지(Voice Note) 형식으로 발송 가능.
    - **비디오 노트**: `asVideoNote: true` 옵션 지원.
    - **스티커**: 수신된 스티커의 의미를 분석하여 컨텍스트에 포함하며, 스티커 전송 및 검색 기능을 지원함.
  </Accordion>

  <Accordion title="리액션 알림 (Reaction Notifications)">
    사용자가 봇의 메시지에 추가한 리액션을 시스템 이벤트로 수신함. 기본적으로 봇 본인의 메시지에 대한 리액션만 감시함 (`reactionNotifications: "own"`).
  </Accordion>
</AccordionGroup>

## 문제 해결 (Troubleshooting)

- **비멘션 메시지 무응답**: 봇의 **Privacy Mode**가 비활성화되어 있는지, 봇이 그룹 관리자 권한을 가졌는지 확인함.
- **명령어 메뉴 미표시**: `api.telegram.org` 서버와의 통신 지연이나 차단 여부를 점검하고 `openclaw doctor`를 실행함.
- **네트워크 불안정**: IPv6 관련 이슈가 의심될 경우 `network.autoSelectFamily: false` 설정을 통해 IPv4 전용 모드 사용을 고려하거나 전용 프록시(`channels.telegram.proxy`)를 구성함.

상세 설정 스키마 및 전체 옵션은 [Gateway 설정 가이드](/gateway/configuration)를 참조함.
