---
summary: "Nextcloud Talk 연동 상태, 지원 기능 및 세부 설정 가이드"
read_when:
  - Nextcloud Talk 채널 기능을 구축하거나 수정하고자 할 때
title: "Nextcloud Talk"
x-i18n:
  source_path: "channels/nextcloud-talk.md"
---

# Nextcloud Talk (플러그인)

**상태**: 웹훅(Webhook) 봇 방식의 플러그인을 통해 지원됨. 개인 대화(DM), 룸(Rooms), 리액션 및 마크다운 메시지 형식을 지원함.

## 플러그인 설치 안내

Nextcloud Talk 연동 기능은 플러그인 형태로 제공되며 코어 패키지에 포함되어 있지 않음.

**CLI를 통한 설치 (npm):**
```bash
openclaw plugins install @openclaw/nextcloud-talk
```

**로컬 소스 환경 설치:**
```bash
openclaw plugins install ./extensions/nextcloud-talk
```

상세 내용은 [플러그인 가이드](/tools/plugin) 참조.

## 빠른 설정 가이드 (초보자용)

1. **플러그인 설치**: 위 안내에 따라 설치를 완료함.
2. **Nextcloud 서버 봇 생성**: Nextcloud 서버 터미널에서 `occ` 명령어를 사용하여 봇을 등록함.
   ```bash
   ./occ talk:bot:install "OpenClaw" "<공유-시크릿>" "<웹훅-URL>" --feature reaction
   ```
3. **룸 활성화**: 대상 대화방 설정에서 생성한 봇을 활성화함.
4. **OpenClaw 구성**:
   - 설정 파일: `channels.nextcloud-talk.baseUrl` 및 `botSecret` 입력.
   - 환경 변수: `NEXTCLOUD_TALK_BOT_SECRET` (기본 계정 전용).
5. **Gateway 시작**: 설정을 마친 후 서버를 가동함.

### 최소 설정 예시
```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "your-shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## 참고 사항

- **발신 제약**: 봇이 먼저 사용자에게 DM을 시작할 수 없음. 사용자가 봇에게 먼저 메시지를 보내야 대화가 시작됨.
- **웹훅 도달 가능성**: 웹훅 URL은 외부(Nextcloud 서버)에서 Gateway로 접근 가능해야 함. 프록시 환경인 경우 `webhookPublicUrl`을 정확히 설정함.
- **미디어 처리**: 봇 API 제약으로 인해 파일 업로드는 지원하지 않음. 미디어 전송 시 파일 URL 링크 형식으로 전달됨.
- **세션 구분**: 기본 웹훅 페이로드는 DM과 룸을 구분하지 않음. 정확한 구분이 필요한 경우 `apiUser` 및 `apiPassword`를 설정하여 룸 유형 조회 기능을 활성화해야 함. 그렇지 않으면 모든 대화가 룸 세션으로 취급될 수 있음.

## 접근 제어 정책

### 개인 대화 (DM)
- **기본값**: `"pairing"` 모드. 승인되지 않은 발신자에게는 페어링 코드가 전송됨.
- **허용 목록**: `allowFrom`에 Nextcloud 사용자 ID를 등록하여 관리함. 표시 이름은 매칭 대상에서 제외됨.

### 룸 (그룹)
- **기본값**: `"allowlist"` 모드 (멘션 게이팅 적용).
- **룸 허용 목록**: `channels.nextcloud-talk.rooms` 섹션에 룸 토큰을 등록하여 관리함.

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token-xyz": { requireMention: true },
      },
    },
  },
}
```

## 지원 기능 요약

| 기능 | 지원 상태 |
| :--- | :--- |
| 개인 대화 (DM) | ✅ 지원 |
| 룸 (Groups) | ✅ 지원 |
| 스레드 (Threads) | ❌ 미지원 |
| 미디어 전송 | ⚠️ URL 링크만 지원 |
| 리액션 | ✅ 지원 |
| 네이티브 명령어 | ❌ 미지원 |

## 주요 설정 레퍼런스

- **`baseUrl`**: Nextcloud 인스턴스 주소.
- **`botSecret`**: 봇 생성 시 설정한 공유 시크릿.
- **`apiUser` / **`apiPassword`**: 룸 정보 조회 및 DM 판별을 위한 API 계정 정보.
- **`webhookPort`**: 웹훅 리스너 포트 (기본값: 8788).
- **`webhookPath`**: 웹훅 엔드포인트 경로 (기본값: `/nextcloud-talk-webhook`).
- **`dmPolicy`**: `pairing`, `allowlist`, `open`, `disabled` 중 선택.
- **`chunkMode`**: 긴 응답 전송 시 `length` (글자 수) 또는 `newline` (문단 단위) 분할 방식 선택.

상세 설정 스키마는 [Gateway 설정 가이드](/gateway/configuration)를 참조함.
