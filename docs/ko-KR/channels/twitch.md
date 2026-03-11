---
summary: "Twitch 채팅 봇 설정 방법 및 연동 가이드 (IRC 연결 방식)"
read_when:
  - OpenClaw에 Twitch 채팅 기능을 통합하고자 할 때
title: "Twitch"
x-i18n:
  source_path: "channels/twitch.md"
---

# Twitch (플러그인)

Twitch 채팅 기능을 IRC 연결 방식을 통해 지원함. OpenClaw는 일반 Twitch 사용자(봇 계정)로 로그인하여 지정된 채널에서 메시지를 송수신함.

## 플러그인 설치 안내

Twitch 연동 기능은 플러그인 형태로 제공되며 코어 패키지에 포함되어 있지 않음.

**CLI를 통한 설치 (npm):**
```bash
openclaw plugins install @openclaw/twitch
```

**로컬 소스 환경 설치:**
```bash
openclaw plugins install ./extensions/twitch
```

상세 내용은 [플러그인 가이드](/tools/plugin) 참조.

## 빠른 설정 가이드 (초보자용)

1. **전용 계정 생성**: 봇으로 사용할 별도의 Twitch 계정을 생성하거나 기존 계정을 준비함.
2. **자격 증명 생성**: [Twitch Token Generator](https://twitchtokengenerator.com/)에 접속함.
   - **Bot Token** 옵션을 선택함.
   - 필수 권한인 `chat:read` 및 `chat:write`가 선택되어 있는지 확인하고 **Client ID**와 **Access Token**을 복사함.
3. **사용자 ID 확인**: [ID 변환 도구](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)를 사용하여 봇의 숫자형 사용자 ID를 확인함.
4. **토큰 구성**:
   - 환경 변수: `OPENCLAW_TWITCH_ACCESS_TOKEN` (기본 계정 전용).
   - 설정 파일: `channels.twitch.accessToken` 필드에 입력.
   - *팁: 두 곳에 모두 설정된 경우 설정 파일의 값이 우선 적용됨.*
5. **Gateway 시작**: 서버를 가동하여 연동 여부를 확인함.

⚠️ **중요**: 보안을 위해 반드시 접근 제어(`allowFrom` 또는 `allowedRoles`) 설정을 추가하여 승인된 사용자만 봇을 호출할 수 있도록 함. 기본적으로 `requireMention: true` 설정이 적용됨.

### 최소 설정 예시
```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // 봇의 Twitch 계정명
      accessToken: "oauth:abc123...", // 'oauth:' 접두사를 포함한 액세스 토큰
      clientId: "xyz789...", // 발급받은 클라이언트 ID
      channel: "streamer_nick", // 참여할 스트리머 채널명 (필수)
      allowFrom: ["123456789"], // (권장) 본인의 숫자형 사용자 ID만 허용
    },
  },
}
```

## 핵심 동작 방식

- **통신 모델**: Gateway 프로세스가 IRC 방식으로 Twitch 서버에 상주함.
- **결정론적 라우팅**: 모든 응답은 메시지가 수신된 원래 채널로 정확히 회신됨.
- **세션 관리**: 각 계정은 `agent:<agentId>:twitch:<accountName>` 형식의 격리된 세션 키를 사용함.
- **계정 및 채널**: `username`은 인증 주체(봇)이며, `channel`은 실제 활동할 채팅방을 의미함.

## 설정 상세 가이드

### 자격 증명 관리
[Twitch Token Generator](https://twitchtokengenerator.com/)를 통한 간편 생성 방식은 수동 앱 등록이 필요 없으나, 발급된 토큰이 수 시간 내에 만료되므로 주기적인 재발급이 필요함.

### 자동 토큰 갱신 (선택 사항)
토큰을 자동으로 갱신하려면 [Twitch Developer Console](https://dev.twitch.tv/console)에서 직접 애플리케이션을 생성하고 다음 설정을 추가함:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```
설정 완료 시 봇은 만료 전 토큰을 자동 갱신하고 로그를 남김.

## 접근 제어 정책

### 역할 기반 제한 (Roles)
```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"], // 모더레이터와 VIP만 허용
        },
      },
    },
  },
}
```
**지원 역할**: `"moderator"`, `"owner"` (채널 소유자), `"vip"`, `"subscriber"`, `"all"`.

### 사용자 ID 기반 허용 (가장 안전)
사용자명은 변경될 수 있으므로 영구적인 숫자 ID 기반의 허용 목록(`allowFrom`) 사용을 강력히 권장함.
```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789", "987654321"],
    },
  },
}
```

### 멘션 필수 여부 설정
기본값은 `true`임. 멘션 없이 모든 메시지에 응답하게 하려면 다음과 같이 설정함:
```json5
{
  channels: {
    twitch: {
      accounts: {
        default: { requireMention: false },
      },
    },
  },
}
```

## 문제 해결 (Troubleshooting)

진단 단계:
1. `openclaw doctor` 실행.
2. `openclaw channels status --probe`로 연결 상태 확인.

**응답 없음**: 발신자의 사용자 ID가 `allowFrom`에 정확히 포함되어 있는지, 봇이 지정된 `channel`에 정상적으로 입장했는지 확인함.
**인증 오류**: 액세스 토큰에 `chat:read`, `chat:write` 권한이 누락되었는지, 혹은 토큰이 만료되었는지 점검함. 자동 갱신 사용 시 `clientSecret`과 `refreshToken`이 정확한지 확인함.

## 운영 및 보안 가이드라인

- **비밀 유지**: 액세스 토큰은 비밀번호와 같으므로 절대로 코드 저장소에 직접 커밋하지 말 것.
- **최소 권한**: 토큰 생성 시 반드시 필요한 권한(`chat:read`, `chat:write`)만 요청할 것.
- **로그 모니터링**: 실시간 로그를 통해 토큰 갱신 이벤트와 연결 상태를 주기적으로 모니터링함.

## 기능 제한

- **메시지 길이**: 최대 **500자** 제한 (단어 경계 기준으로 자동 분할됨).
- **서식**: 전송 전 마크다운 서식은 자동으로 제거됨.
- **속도 제한**: 별도의 OpenClaw 자체 제한은 없으나 Twitch 서버의 네이티브 속도 제한 정책을 따름.
