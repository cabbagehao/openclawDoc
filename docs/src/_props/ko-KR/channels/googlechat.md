---
summary: "Google Chat 앱 연동 상태, 지원 기능 및 세부 설정 가이드"
read_when:
  - Google Chat 채널 기능을 구축하거나 수정하고자 할 때
title: "Google Chat"
x-i18n:
  source_path: "channels/googlechat.md"
---

# Google Chat (Chat API)

**상태**: Google Chat API 웹훅(HTTP 전용)을 통해 개인 대화(DM) 및 스페이스(Spaces) 연동 가능.

## 빠른 설정 가이드 (초보자용)

1. **Google Cloud 프로젝트 생성 및 API 활성화**:
   * [Google Chat API 자격 증명 페이지](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)로 이동함.
   * API가 활성화되어 있지 않다면 활성화 버튼을 클릭함.
2. **서비스 계정(Service Account) 생성**:
   * **사용자 인증 정보 만들기** > **서비스 계정**을 클릭함.
   * 이름은 자유롭게 지정함 (예: `openclaw-chat`).
   * 권한 및 사용자 액세스 설정 단계는 생략하고 완료함.
3. **JSON 키 생성 및 다운로드**:
   * 생성된 서비스 계정 이름을 클릭하여 상세 페이지로 이동함.
   * **키** 탭에서 **키 추가** > **새 키 만들기**를 선택함.
   * **JSON** 형식을 선택하고 생성하여 파일을 다운로드함.
4. **키 파일 저장**:
   * 다운로드한 JSON 파일을 Gateway 호스트의 안전한 경로에 저장함 (예: `~/.openclaw/googlechat-service-account.json`).
5. **Google Chat 앱 구성**:
   * [Google Cloud 콘솔 Chat 구성 페이지](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)에서 다음을 입력함:
     * **앱 이름**: 에이전트 이름 (예: `OpenClaw`).
     * **아바타 URL**: 앱 아이콘 이미지 주소.
     * **대화형 기능**: 활성화함.
     * **기능**: '스페이스 및 그룹 대화 참여' 체크.
     * **연결 설정**: 'HTTP 엔드포인트 URL' 선택.
     * **트리거**: '모든 트리거에 공통 HTTP 엔드포인트 URL 사용'을 선택하고, 본인의 Gateway 공개 URL 뒤에 `/googlechat`을 붙여 입력함.
       * *팁: `openclaw status` 명령어로 현재 Gateway의 공개 URL을 확인 가능함.*
     * **가시성**: '특정 사용자 및 그룹에게 공개' 체크 후 본인의 이메일 주소를 입력함.
6. **앱 상태 활성화**:
   * 저장 후 **페이지를 새로고침**함.
   * **앱 상태(App status)** 섹션에서 **Live - 사용자에게 제공 가능**으로 상태를 변경하고 다시 저장함.
7. **OpenClaw 설정**:
   * 서비스 계정 경로 지정: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. **오디언스(Audience) 설정**:
   * Chat 앱 설정과 일치하도록 오디언스 유형 및 값을 지정함.
9. **Gateway 시작**: 서버가 가동되면 Google Chat으로부터 웹훅 요청을 수신하기 시작함.

## Google Chat에서 봇 추가하기

1. [Google Chat](https://chat.google.com/)에 접속함.
2. **새 대화** 아이콘을 클릭함.
3. 검색창에 설정한 **앱 이름**을 입력함. (비공개 앱이므로 마켓플레이스 목록에는 나타나지 않으며 이름으로 직접 검색해야 함)
4. 검색 결과에서 본인의 봇을 선택하고 **추가** 또는 **채팅**을 클릭하여 대화를 시작함.

## 공개 URL 구성 (웹훅 전용)

Google Chat 웹훅은 공개 HTTPS 엔드포인트를 요구함. 보안을 위해 **`/googlechat` 경로만 외부로 노출**하고, 관리 대시보드 등 민감한 경로는 사설 네트워크에 유지할 것을 권장함.

### 방법 A: Tailscale Funnel (권장)

Tailscale Serve로 대시보드를 보호하고, Funnel로 웹훅 경로만 공개함.

1. **포트 확인**: Gateway가 실행 중인 포트(기본 18789) 확인.
2. **대시보드 노출 (Tailnet 전용)**:
   ```bash
   tailscale serve --bg --https 8443 http://127.0.0.1:18789
   ```
3. **웹훅 경로 공개 (인터넷)**:
   ```bash
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat
   ```

최종 웹훅 URL 예시: `https://<node-name>.<tailnet>.ts.net/googlechat`

### 방법 B: 리버스 프록시 (Caddy 등)

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

위와 같이 설정하면 루트(`/`) 접근은 차단되거나 404를 반환하며, `/googlechat` 요청만 안전하게 전달됨.

***

## 동작 원리

1. **인증**: Google Chat은 요청 시 `Authorization: Bearer <token>` 헤더를 포함함. OpenClaw는 본문을 파싱하기 전 단계에서 이 베어러 토큰을 즉시 검증함.
2. **오디언스 검증**: 설정된 `audienceType`에 따라 토큰의 유효성을 확인함.
   * `app-url`: HTTPS 웹훅 URL 기준.
   * `project-number`: Google Cloud 프로젝트 번호 기준.
3. **라우팅**:
   * 개인 대화(DM): `agent:<agentId>:googlechat:dm:<spaceId>`
   * 스페이스(Spaces): `agent:<agentId>:googlechat:group:<spaceId>`
4. **접근 제어**: DM은 기본적으로 페어링 모드로 작동하며, `openclaw pairing approve googlechat <code>` 명령어로 승인함.

## 주요 설정 요약

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // 멘션 감지 도우미 (선택)
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

* **`serviceAccountRef`**: 환경 변수나 외부 시크릿 관리 도구(SecretRef)를 통한 자격 증명 주입 지원.
* **`typingIndicator`**: `none`, `message` (기본값), `reaction` 모드 지원.
* **미디어 처리**: 첨부 파일은 Chat API를 통해 다운로드되며 `mediaMaxMb` 설정으로 용량을 제한함.

## 문제 해결 (Troubleshooting)

### 405 Method Not Allowed

웹훅 핸들러가 정상적으로 등록되지 않은 경우 발생함:

1. `channels.googlechat` 설정 섹션이 누락되지 않았는지 확인함.
2. `googlechat` 플러그인이 활성화 상태인지 확인함 (`openclaw plugins list`).
3. 설정을 변경한 후 반드시 Gateway 서버를 재시작함.

### 기타 이슈

* **인증 오류**: `openclaw channels status --probe` 명령어로 오디언스 설정 및 권한 상태를 점검함.
* **메시지 미수신**: Google Cloud 콘솔에서 앱의 웹훅 URL 및 이벤트 구독 항목이 올바른지 확인함.
* **로그 모니터링**: `openclaw logs --follow`를 실행한 상태에서 테스트 메시지를 보내 요청이 서버에 도달하는지 실시간으로 확인함.
