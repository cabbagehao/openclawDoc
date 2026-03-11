---
summary: "Synology Chat 웹훅 설정 방법 및 OpenClaw 연동 가이드"
read_when:
  - Synology Chat을 OpenClaw와 연동하고자 할 때
  - Synology Chat 웹훅 라우팅 관련 문제를 디버깅할 때
title: "Synology Chat"
x-i18n:
  source_path: "channels/synology-chat.md"
---

# Synology Chat (플러그인)

**상태**: 시놀로지(Synology) Chat 웹훅을 활용한 개인 대화(DM) 채널용 플러그인으로 지원됨. 이 플러그인은 Synology Chat의 **발신 웹훅(Outgoing Webhook)**을 통해 메시지를 수신하고, **수신 웹훅(Incoming Webhook)**을 통해 답변을 전송함.

## 플러그인 설치 안내

Synology Chat 연동 기능은 플러그인 형태로 제공되며 코어 패키지에 포함되어 있지 않음.

**로컬 소스 환경 설치:**
```bash
openclaw plugins install ./extensions/synology-chat
```

상세 내용은 [플러그인 가이드](/tools/plugin) 참조.

## 빠른 설정 가이드 (초보자용)

1. **플러그인 설치**: 위 안내에 따라 Synology Chat 플러그인을 설치하고 활성화함.
2. **Synology Chat 통합 설정**:
   - **수신 웹훅(Incoming Webhook)**을 생성하고 해당 URL을 복사함.
   - **발신 웹훅(Outgoing Webhook)**을 생성하고 발급된 시크릿 토큰을 복사함.
3. **웹훅 대상 지정**: 발신 웹훅의 대상 URL을 본인의 OpenClaw Gateway 주소로 설정함.
   - 기본 경로: `https://your-gateway-host/webhook/synology`
   - 커스텀 경로가 필요한 경우 `channels.synology-chat.webhookPath` 설정을 사용함.
4. **OpenClaw 구성**: `openclaw.json` 파일에 복사한 토큰과 URL 정보를 입력함.
5. **Gateway 시작**: 서버를 재시작하고 Synology Chat 내의 봇에게 DM을 보내 연동 여부를 확인함.

### 최소 설정 예시
```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "your-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## 환경 변수 지원 (기본 계정 전용)

설정 파일 대신 다음 환경 변수를 사용할 수 있음:
- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (쉼표로 구분된 목록)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

<Note>
설정 파일(`openclaw.json`)의 값이 환경 변수 설정보다 우선적으로 적용됨.
</Note>

## 접근 제어 및 DM 정책

- **`dmPolicy: "allowlist"`**: 권장되는 기본값임. `allowedUserIds`에 등록된 사용자만 에이전트와 대화할 수 있음.
- **`allowedUserIds`**: Synology 사용자 ID 목록을 입력함. 이 목록이 비어 있으면 보안을 위해 웹훅 라우트가 시작되지 않음. (모든 사용자 허용 시 `"open"` 모드 사용)
- **`dmPolicy: "open"`**: 모든 발신자의 메시지를 처리함.
- **`dmPolicy: "disabled"`**: 모든 개인 대화를 차단함.
- **페어링 승인**: `openclaw pairing approve synology-chat <CODE>` 명령어를 통해 대기 중인 사용자를 승인할 수 있음.

## 아웃바운드 대상 지정

메시지 전송 시 대상 식별자로 숫자형 Synology Chat 사용자 ID를 사용함.

**사용 예시:**
```bash
# 특정 사용자에게 메시지 전송
openclaw message send --channel synology-chat --target 123456 --message "OpenClaw에서 보낸 메시지입니다."

# 채널 접두사를 포함한 대상 지정
openclaw message send --channel synology-chat --target synology-chat:123456 --message "다시 확인 부탁드립니다."
```

이미지 및 파일 전송은 URL 기반의 파일 전달 방식을 통해 지원됨.

## 다중 계정 설정 (Multi-account)

`channels.synology-chat.accounts` 섹션을 통해 여러 개의 NAS 계정을 동시에 운영할 수 있음. 각 계정은 독립적인 토큰, 웹훅 경로 및 허용 목록을 가질 수 있음.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/..."
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## 보안 주의사항

- **토큰 보안**: `token` 값은 외부로 유출되지 않도록 주의하며, 유출 의심 시 즉시 로테이션함.
- **SSL 검증**: 로컬 네트워크 내의 자가 서명 인증서(Self-signed cert)를 사용하는 경우가 아니라면, 보안을 위해 `allowInsecureSsl: false` 설정을 유지할 것을 권장함.
- **웹훅 검증**: 수신되는 모든 웹훅 요청은 토큰 기반으로 인증되며, 발신자별로 속도 제한(Rate limit)이 적용됨.
- **운영 권장**: 실제 서비스 환경에서는 가급적 `allowlist` 정책 사용을 권장함.
