---
summary: "Zalo 봇 연동 상태, 지원 기능 및 세부 설정 가이드"
read_when:
  - Zalo 채널 기능을 구현하거나 웹훅 설정을 수정하고자 할 때
title: "Zalo"
x-i18n:
  source_path: "channels/zalo.md"
---

# Zalo (봇 API)

**상태**: 실험적 기능 (Experimental). 개인 대화(DM)를 지원하며, 명시적인 그룹 정책 설정을 통해 그룹 대화 처리도 가능함.

## 플러그인 설치 안내

Zalo 연동 기능은 플러그인 형태로 제공되며 코어 패키지에 포함되어 있지 않음.

**CLI를 통한 설치 (npm):**
```bash
openclaw plugins install @openclaw/zalo
```

**로컬 소스 환경 설치:**
```bash
openclaw plugins install ./extensions/zalo
```

상세 내용은 [플러그인 가이드](/tools/plugin) 참조.

## 빠른 설정 가이드 (초보자용)

1. **플러그인 설치**: 위 안내에 따라 Zalo 플러그인을 설치함.
2. **토큰 설정**:
   - 환경 변수: `ZALO_BOT_TOKEN` (기본 계정 전용).
   - 설정 파일: `channels.zalo.botToken` 필드에 입력.
3. **Gateway 시작**: 설정을 마친 후 서버를 가동하거나 온보딩 과정을 완료함.
4. **페어링 승인**: DM 접근 정책은 기본적으로 **페어링(Pairing)** 모드임. 봇에게 첫 메시지를 보낸 후 발급된 코드를 승인함.

### 최소 설정 예시
```json5
{
  channels: {
    zalo: {
      enabled: true,
      botToken: "12345689:abc-xyz",
      dmPolicy: "pairing",
    },
  },
}
```

## 핵심 동작 방식

Zalo는 베트남 시장에 특화된 메시징 앱이며, OpenClaw는 봇 API를 통해 1:1 대화 환경을 구축함.

- **결정론적 라우팅**: 모든 응답은 메시지가 수신된 원래 Zalo 채팅방으로 정확히 회신됨.
- **세션 관리**: 개인 대화(DM)는 에이전트의 메인 세션을 공유함.
- **그룹 지원**: `groupPolicy` 및 `groupAllowFrom` 설정을 통해 그룹 메시지를 수락할 수 있으며, 기본값은 안전을 위해 차단 상태(`allowlist`이나 목록이 비어 있음)임.

## 설정 상세 가이드

### 1. 봇 토큰 생성 (Zalo Bot Platform)
1. [Zalo Bot Platform](https://bot.zaloplatforms.com)에 접속하여 로그인함.
2. 새로운 봇을 생성하고 필요한 환경 설정을 마침.
3. 발급된 **봇 토큰** (형식: `12345689:abc-xyz`)을 복사함.

### 2. 토큰 및 다중 계정 구성
- **단일 계정**: `ZALO_BOT_TOKEN` 환경 변수 또는 `channels.zalo.botToken` 설정 사용.
- **다중 계정**: `channels.zalo.accounts` 섹션을 활용하여 계정별 토큰과 이름을 지정함.

---

## 접근 제어 정책

### 개인 대화 (DM)
- **기본값**: `"pairing"` 모드. 승인되지 않은 발신자에게는 페어링 코드가 전송되며, 승인 전까지 메시지는 무시됨. (코드는 1시간 동안 유효)
- **승인 명령어**:
  ```bash
  openclaw pairing list zalo
  openclaw pairing approve zalo <CODE>
  ```
- **사용자 식별**: `allowFrom` 목록에는 사용자명을 대신하여 숫자형 사용자 ID를 등록해야 함.

### 그룹 대화
- **정책 (`groupPolicy`)**: `open` (모두 허용), `allowlist` (기본값), `disabled` 중 선택.
- **발신자 제한**: `groupAllowFrom`에 등록된 ID만 에이전트를 호출할 수 있음. 미설정 시 DM 허용 목록을 상속함.
- **보안**: `channels.zalo` 설정 섹션이 통째로 누락된 경우에도 시스템은 안전을 위해 `"allowlist"` 정책을 기본 적용함.

## 통신 모드: 롱 폴링 vs 웹훅

- **롱 폴링 (Long polling)**: 기본 동작 방식이며 별도의 공개 URL이 필요 없음.
- **웹훅 (Webhook) 모드**: `webhookUrl` 및 `webhookSecret` 설정 필요.
  - **HTTPS 필수**: 웹훅 URL은 반드시 보안 프로토콜을 사용해야 함.
  - **보안 검증**: `X-Bot-Api-Secret-Token` 헤더를 통해 요청의 유효성을 검증함.
  - **상호 배타성**: Zalo API 제약상 롱 폴링과 웹훅은 동시에 사용할 수 없음.

## 지원 메시지 유형

- **텍스트**: 최대 2,000자 단위로 자동 청킹(Chunking)하여 발송함.
- **이미지**: 수신 이미지 분석 및 `sendPhoto`를 통한 발신 지원.
- **스티커**: 수신 로그는 기록되나 에이전트의 직접적인 응답은 트리거하지 않음.

## 지원 기능 요약

| 기능 | 지원 상태 |
| :--- | :--- |
| 개인 대화 (DM) | ✅ 지원 |
| 그룹 대화 | ⚠️ 정책 설정 시 지원 (기본값: 차단) |
| 이미지 전송 | ✅ 지원 |
| 리액션 / 스레드 | ❌ 미지원 |
| 투표 (Polls) | ❌ 미지원 |
| 네이티브 명령어 | ❌ 미지원 |
| 실시간 스트리밍 | ⚠️ 텍스트 길이 제한(2000자)으로 인해 차단됨 |

## 문제 해결 (Troubleshooting)

- **응답 없음**: `openclaw channels status --probe` 명령어로 토큰 유효성을 확인하고, 발신자가 페어링 승인 상태인지 점검함.
- **웹훅 수신 불가**: URL이 `https`인지, 시크릿 토큰의 길이가 규격(8~256자)에 맞는지 확인함. 또한 롱 폴링 기능이 중단된 상태인지 재점검함.

상세한 설정 옵션은 [Gateway 설정 가이드](/gateway/configuration)를 참조함.
