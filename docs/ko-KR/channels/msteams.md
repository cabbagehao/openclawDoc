---
summary: "Microsoft Teams 봇 연동 상태, 지원 기능 및 세부 설정 가이드"
read_when:
  - Microsoft Teams 채널 기능을 구축하거나 수정하고자 할 때
title: "Microsoft Teams"
x-i18n:
  source_path: "channels/msteams.md"
---

# Microsoft Teams (플러그인)

> "이곳에 들어오는 자여, 모든 희망을 버려라."

최종 업데이트: 2026-01-21

**상태**: 텍스트 메시지 및 개인 대화(DM) 첨부 파일 지원. 채널 및 그룹 대화에서의 파일 전송은 `sharePointSiteId` 설정과 Graph API 권한이 필수임 ([그룹 채팅 파일 전송 섹션](#그룹-채팅에서-파일-보내기) 참조). 투표(Polls) 기능은 어댑티브 카드(Adaptive Cards)를 통해 제공됨.

## 플러그인 설치 안내

Microsoft Teams 연동 기능은 플러그인 형태로 제공되며 코어 패키지에 포함되어 있지 않음.

**중요 변경 사항 (2026.1.15)**: MS Teams 기능이 코어에서 분리됨. 사용을 위해서는 반드시 별도로 플러그인을 설치해야 함. (목적: 코어 패키지 경량화 및 MS Teams 의존성 독립 업데이트)

**CLI를 통한 설치 (npm):**
```bash
openclaw plugins install @openclaw/mattermost
```

**로컬 소스 환경 설치:**
```bash
openclaw plugins install ./extensions/msteams
```

상세 내용은 [플러그인 가이드](/tools/plugin) 참조.

## 빠른 설정 가이드 (초보자용)

1. **플러그인 설치**: 위 안내에 따라 MS Teams 플러그인을 설치함.
2. **Azure Bot 생성**: [Azure 포털](https://portal.azure.com/)에서 앱 ID, 클라이언트 시크릿, 테넌트 ID를 발급받음.
3. **OpenClaw 구성**: 발급받은 자격 증명을 `openclaw.json`에 입력함.
4. **엔드포인트 노출**: 공개 URL 또는 터널링을 통해 `/api/messages` 경로(기본 포트 3978)를 외부에 노출함.
5. **앱 패키지 설치**: 생성한 Teams 앱 패키지를 업로드하고 Gateway를 시작함.

### 최소 설정 예시
```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

<Note>
**주의**: 그룹 대화는 기본적으로 차단 상태(`groupPolicy: "allowlist"`)임. 응답을 허용하려면 `groupAllowFrom`에 발신자를 추가하거나, `groupPolicy: "open"`으로 변경(멘션 게이팅은 유지됨)해야 함.
</Note>

## 주요 목표 및 원칙

- Teams DM, 그룹 대화 및 채널을 통해 에이전트와 원활하게 소통함.
- **결정론적 라우팅**: 모든 응답은 메시지가 수신된 원래 채널로 정확히 회신됨.
- **안전한 기본 동작**: 별도 설정이 없는 한 그룹 환경에서는 반드시 에이전트를 @멘션해야 응답함.

## 접근 제어 정책

### 개인 대화 (DM)
- **기본값**: `"pairing"` 모드. 승인되지 않은 발신자의 메시지는 무시됨.
- **권장 사항**: `allowFrom` 설정 시 안정적인 **AAD 오브젝트 ID** 사용을 권장함. UPN이나 표시 이름은 가변적이므로 `dangerouslyAllowNameMatching: true` 설정 시에만 매칭이 허용됨.

### 그룹 및 채널 대화
- **기본값**: `"allowlist"` 모드 (허용 목록에 없는 경우 차단).
- **개방 모드**: 모든 멤버의 호출을 허용하려면 `groupPolicy: "open"`을 사용함 (멘션 게이팅은 여전히 적용됨).
- **전체 차단**: 그룹 메시지를 받지 않으려면 `"disabled"`로 설정함.

### 서버 및 채널 허용 목록 (Allowlist)
`channels.msteams.teams` 하위에 팀 ID(또는 이름)와 채널 ID(또는 이름)를 나열하여 응답 범위를 제한할 수 있음.

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "프로젝트 팀": {
          channels: {
            "일반": { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Azure Bot 설정 (사전 요구 사항)

1. **Azure Bot 리소스 생성**: [Azure 포털](https://portal.azure.com/#create/Microsoft.AzureBot)에서 생성함.
   - **앱 유형**: **Single Tenant** 권장 (2025-07-31 이후 Multi-tenant 생성은 권장되지 않음).
2. **자격 증명 획득**:
   - **App ID**: '구성(Configuration)' 메뉴의 Microsoft 앱 ID 복사.
   - **App Password**: '비밀번호 관리'에서 새 클라이언트 시크릿 생성 후 **값(Value)** 복사.
   - **Tenant ID**: '개요' 메뉴의 디렉터리(테넌트) ID 복사.
3. **메시징 엔드포인트 설정**: '구성' 메뉴에서 본인의 웹훅 URL 입력 (예: `https://your-domain.com/api/messages`).
4. **Teams 채널 활성화**: '채널' 메뉴에서 **Microsoft Teams**를 선택하고 저장함.

## 로컬 개발 및 터널링

Teams 서버는 `localhost`에 직접 도달할 수 없으므로 ngrok이나 **Tailscale Funnel**을 활용함:

```bash
# ngrok 사용 예시
ngrok http 3978

# Tailscale Funnel 사용 예시
tailscale funnel 3978
```

## 앱 매니페스트 및 업로드

[Teams Developer Portal](https://dev.teams.microsoft.com/apps)을 사용하면 JSON 파일을 직접 수정하지 않고도 편리하게 앱 패키지(ZIP)를 생성하고 다운로드할 수 있음.

**필수 포함 권한 (RSC):**
- 채널: `ChannelMessage.Read.Group`, `ChannelMessage.Send.Group` 등.
- 그룹 대화: `ChatMessage.Read.Chat`.

<Warning>
**업데이트 시 주의**: 매니페스트 내용을 수정한 후에는 반드시 **버전(Version)** 번호를 올리고 다시 ZIP으로 묶어 업로드해야 함. 또한 변경 사항이 즉시 반영되지 않을 수 있으므로 Teams 앱을 완전히 종료했다가 다시 실행할 것을 권장함.
</Warning>

## Graph API 활용 (고급 기능)

기본 RSC 권한만으로는 채널 내의 **이미지 확인**이나 **과거 대화 이력 조회**가 불가능함. 이러한 기능이 필요하다면 Microsoft Graph API 앱 권한을 추가하고 **관리자 동의**를 받아야 함.

- **추가 권한**: `ChannelMessage.Read.All`, `Chat.Read.All` 등.
- **이점**: 오프라인 상태에서 놓친 메시지 추적 및 채널 내 미디어 파일 다운로드 가능.

## 그룹 채팅에서 파일 보내기

에이전트가 그룹 대화방에 파일을 전송하려면 **SharePoint** 연동이 필요함.

1. **Graph 권한 추가**: `Sites.ReadWrite.All` (앱 권한).
2. **SharePoint 사이트 ID 획득**: Graph Explorer 등을 통해 확인.
3. **OpenClaw 설정**: `channels.msteams.sharePointSiteId` 필드에 ID 입력.

이 설정이 완료되면 에이전트는 파일을 SharePoint에 업로드한 후 공유 링크를 채팅방에 게시함.

## 어댑티브 카드 (Adaptive Cards) 활용

에이전트 응답 시 `card` 파라미터에 JSON 객체를 전달하여 리치한 UI를 구성할 수 있음. 투표 기능 역시 내부적으로 어댑티브 카드를 사용함.

**CLI 사용 예시:**
```bash
openclaw message send --channel msteams --target "user:<ID>" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"안녕하세요!"}]}'
```

## 문제 해결 (Troubleshooting)

- **이미지 표시 안 됨**: Graph API 권한 누락 또는 관리자 동의 미비 여부를 확인함.
- **채널 무응답**: 기본적으로 멘션이 필수임. 설정을 확인하거나 테스트 시 봇을 직접 @멘션함.
- **401 Unauthorized**: 수동 테스트 시 발생하는 정상적인 반응임. 실제 작동 여부는 Azure 포털의 'Web Chat에서 테스트' 기능을 사용함.
- **사이드로드 실패**: 조직의 앱 카탈로그에 직접 업로드하는 방식을 시도해 봄.

상세한 설정 옵션과 스키마는 [Gateway 설정 레퍼런스](/gateway/configuration-reference#msteams)를 참조함.
