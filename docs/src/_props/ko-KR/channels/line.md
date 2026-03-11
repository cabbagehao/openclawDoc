---
summary: "LINE Messaging API 플러그인 설정 방법, 세부 옵션 및 사용 가이드"
read_when:
  - OpenClaw를 LINE 채널에 연동하고자 할 때
  - LINE 웹훅 설정 및 자격 증명 구성을 수행할 때
  - LINE 전용 리치 메시지(Flex, Template 등) 기능을 활용하고 싶을 때
title: "LINE"
x-i18n:
  source_path: "channels/line.md"
---

# LINE (플러그인)

LINE은 LINE Messaging API를 통해 OpenClaw와 연동됨. 이 플러그인은 Gateway 서버 내에서 웹훅(Webhook) 수신기로 작동하며, 채널 액세스 토큰과 채널 시크릿을 사용하여 인증을 수행함.

**상태**: 플러그인을 통해 지원됨. 개인 대화(DM), 그룹 대화, 미디어 전송, 위치 정보, 플렉스(Flex) 메시지, 템플릿 메시지 및 퀵 리플라이 기능을 지원함. (단, 리액션 및 스레드 기능은 지원하지 않음)

## 플러그인 설치

먼저 LINE 플러그인을 설치해야 함:

```bash
openclaw plugins install @openclaw/line
```

로컬 소스 환경(Git 저장소)에서 실행 중인 경우:

```bash
openclaw plugins install ./extensions/line
```

## 설정 가이드

1. [LINE Developers 콘솔](https://developers.line.biz/console/)에 접속하여 계정을 생성함.
2. 제공자(Provider)를 만들거나 선택한 후 **Messaging API** 채널을 추가함.
3. 채널 설정에서 **Channel access token**과 **Channel secret**을 복사함.
4. Messaging API 설정 메뉴에서 **Use webhook** 옵션을 활성화함.
5. 웹훅 URL을 본인의 Gateway 엔드포인트 주소로 설정함 (HTTPS 필수):

   ```text
   https://your-gateway-host/line/webhook
   ```

Gateway 서버는 LINE의 웹훅 검증(GET 요청) 및 실제 이벤트 수신(POST 요청)을 처리함. 커스텀 경로가 필요한 경우 `channels.line.webhookPath` 설정을 통해 경로를 변경할 수 있음.

<Note>
  **보안 주의**: LINE의 서명 검증은 원시 본문(Raw body)에 대한 HMAC 방식을 따름. OpenClaw는 보안을 위해 검증 전 단계에서 엄격한 본문 크기 제한 및 타임아웃을 적용함.
</Note>

## 상세 설정 예시

### 최소 구성

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "YOUR_ACCESS_TOKEN",
      channelSecret: "YOUR_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

### 환경 변수 활용 (기본 계정 전용)

* `LINE_CHANNEL_ACCESS_TOKEN`
* `LINE_CHANNEL_SECRET`

### 파일 기반 자격 증명

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

### 다중 계정 설정

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## 접근 제어 정책

개인 대화(DM)는 기본적으로 **페어링(Pairing)** 모드로 작동함. 승인되지 않은 사용자가 메시지를 보내면 페어링 코드가 전송되며, 승인 전까지 모든 메시지는 무시됨.

```bash
# 페어링 대기 목록 확인
openclaw pairing list line

# 특정 코드를 사용하여 페어링 승인
openclaw pairing approve line <CODE>
```

* **`dmPolicy`**: `pairing` (기본값), `allowlist`, `open`, `disabled`.
* **허용 목록**: `allowFrom` (DM용), `groupAllowFrom` (그룹용).
* **ID 형식**: LINE ID는 대소문자를 구분하며, 사용자(`U...`), 그룹(`C...`), 룸(`R...`) 마다 고유한 접두사가 붙은 32자리 16진수 문자열임.

## 메시지 처리 동작

* **텍스트 분할**: 발신 메시지는 최대 5,000자 단위로 자동 청킹(Chunking)됨.
* **포맷 변환**: 마크다운 서식은 제거되나, 코드 블록이나 표(Table) 데이터는 가능한 경우 시각적으로 우수한 **플렉스(Flex) 카드** 형식으로 자동 변환되어 전송됨.
* **응답 스트리밍**: 실시간 스트리밍 답변 시, 에이전트가 답변을 생성하는 동안 사용자에게는 로딩 애니메이션이 표시되며 완성된 블록 단위로 메시지가 전송됨.
* **미디어 제한**: 미디어 파일 다운로드 용량은 `mediaMaxMb` 설정(기본 10MB)을 따름.

## 리치 메시지 활용 (Channel Data)

에이전트 응답 시 `channelData.line` 필드를 통해 퀵 리플라이, 위치 정보, 플렉스 카드 또는 템플릿 메시지를 보낼 수 있음.

```json5
{
  text: "요청하신 정보입니다.",
  channelData: {
    line: {
      quickReplies: ["상태 확인", "도움말"],
      location: {
        title: "사무실 위치",
        address: "서울특별시 강남구 ...",
        latitude: 37.5665,
        longitude: 126.9780,
      },
      flexMessage: {
        altText: "상태 카드 도착",
        contents: { /* Flex 메시지 JSON 페이로드 */ },
      },
    },
  },
}
```

또한 LINE 플러그인에서 제공하는 `/card` 명령어를 사용하여 미리 정의된 플렉스 메시지 프리셋을 간편하게 전송할 수 있음:

```text
/card info "환영합니다" "OpenClaw 채널에 참여해 주셔서 감사합니다!"
```

## 문제 해결 (Troubleshooting)

* **웹훅 검증 실패**: 웹훅 URL이 `https`로 시작하는지, 그리고 `channelSecret` 값이 LINE 개발자 콘솔의 정보와 일치하는지 확인함.
* **이벤트 수신 불가**: 설정한 웹훅 경로(`webhookPath`)와 실제 Gateway의 엔드포인트 설정이 일치하는지, 서버가 외부에서 접근 가능한 상태인지 점검함.
* **미디어 다운로드 에러**: 고용량 파일을 자주 주고받는 경우 `mediaMaxMb` 설정값을 높여줌.
