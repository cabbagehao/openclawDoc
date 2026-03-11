---
summary: "Matrix 채널 연동 상태, 주요 기능 및 세부 설정 가이드"
read_when:
  - Matrix 채널 기능을 구현하거나 수정하고자 할 때
title: "Matrix"
x-i18n:
  source_path: "channels/matrix.md"
---

# Matrix (플러그인)

Matrix는 개방형 탈중앙화 메시징 프로토콜임. OpenClaw는 모든 홈서버(Homeserver)에 일반 **사용자(User)** 계정으로 연결되므로, 봇으로 사용할 별도의 Matrix 계정이 필요함. 로그인이 완료되면 봇에게 직접 DM을 보내거나 룸(Rooms, Matrix의 그룹)에 초대하여 대화할 수 있음. Beeper 클라이언트도 지원하나, 이 경우 종단간 암호화(E2EE) 활성화가 필수임.

**상태**: 플러그인(`@vector-im/matrix-bot-sdk`)을 통해 지원됨. 개인 대화(DM), 룸, 스레드, 미디어 전송, 리액션, 투표(발신 및 수신 텍스트 변환), 위치 정보 및 E2EE(암호화 모듈 필요)를 지원함.

## 플러그인 설치 안내

Matrix 연동 기능은 플러그인 형태로 제공되며 코어 패키지에 포함되어 있지 않음.

**CLI를 통한 설치 (npm):**
```bash
openclaw plugins install @openclaw/matrix
```

**로컬 소스 환경 설치:**
```bash
openclaw plugins install ./extensions/matrix
```

설정 마법사(`onboard`) 진행 중 Matrix를 선택하고 Git 소스 환경이 감지되면, 시스템은 자동으로 로컬 설치 경로 사용을 제안함. 상세 내용은 [플러그인 가이드](/tools/plugin) 참조.

## 설정 가이드

1. **Matrix 플러그인 설치**: 위 안내에 따라 설치를 완료함.
2. **Matrix 계정 생성**: [Matrix.org](https://matrix.org/ecosystem/hosting/) 등 호스팅 서비스를 이용하거나 직접 홈서버를 구축하여 계정을 생성함.
3. **액세스 토큰(Access Token) 발급**:
   - 홈서버의 로그인 API를 호출하여 토큰을 얻거나,
   - `openclaw.json`에 `userId`와 `password`를 직접 설정하면 OpenClaw가 최초 실행 시 자동으로 로그인하고 토큰을 `~/.openclaw/credentials/matrix/credentials.json`에 저장하여 재사용함.
4. **자격 증명 구성**:
   - 환경 변수: `MATRIX_HOMESERVER`, `MATRIX_ACCESS_TOKEN` (또는 `MATRIX_USER_ID` + `MATRIX_PASSWORD`).
   - 설정 파일: `channels.matrix.*` (환경 변수보다 우선 적용됨).
   - 토큰 사용 시 사용자 ID는 `/whoami` 엔드포인트를 통해 자동 조회됨. `userId` 입력 시 반드시 전체 Matrix ID 형식(예: `@bot:example.org`)을 사용함.
5. **Gateway 시작**: 설정을 마친 후 서버를 가동함.
6. **대화 시작**: Element, Beeper 등 원하는 Matrix 클라이언트에서 봇과 DM을 시작하거나 룸에 초대함.

### 설정 예시 (최소 구성)
```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      dm: { policy: "pairing" },
    },
  },
}
```

## 종단간 암호화 (E2EE)

OpenClaw는 Rust 기반 크립토 SDK를 통해 종단간 암호화(E2EE)를 지원함.

**활성화 방법**: `channels.matrix.encryption: true` 설정.

- 암호화 모듈 로드 시, 암호화된 룸의 메시지를 자동으로 복호화함.
- 암호화된 룸으로 발신하는 미디어 파일도 자동으로 암호화됨.
- **기기 검증 (Device Verification)**: 최초 연결 시 OpenClaw는 사용자의 다른 세션으로 기기 검증 요청을 보냄. Element 등 다른 클라이언트에서 이를 승인해야 정상적인 키 공유 및 복호화가 가능함.
- 암호화 모듈(`@matrix-org/matrix-sdk-crypto-nodejs`) 로드 실패 시 E2EE 기능은 비활성화되며 로그에 경고가 기록됨. 이 경우 `pnpm rebuild @matrix-org/matrix-sdk-crypto-nodejs` 명령어로 모듈을 재빌드해야 함.

암호화 상태는 계정 및 토큰별로 `~/.openclaw/matrix/accounts/.../crypto/` (SQLite DB) 경로에 안전하게 저장됨.

## 다중 계정 지원 (Multi-account)

`channels.matrix.accounts` 섹션을 통해 여러 홈서버의 계정을 동시에 운영할 수 있음.

- 각 계정은 독립적인 Matrix 사용자로서 작동함.
- 계정별 설정은 전역 `channels.matrix` 설정을 상속받으며, 필요한 필드만 개별적으로 덮어쓸 수 있음.
- 암호화 상태 데이터는 계정별로 엄격히 분리되어 저장됨.

## 라우팅 및 접근 제어

- **응답 경로**: 수신된 메시지의 원본 채널과 대상을 추적하여 Matrix로 정확히 회신함.
- **DM 정책**: 기본값은 `"pairing"` 모드임. 승인되지 않은 발신자는 페어링 코드를 받게 되며, `openclaw pairing approve matrix <CODE>` 명령어로 승인 전까지 메시지는 무시됨.
- **허용 목록(Allowlist)**: 사용자 ID 지정 시 반드시 `@사용자:서버` 형식을 사용해야 함. 단순 이름(Alice) 등은 모호성 방지를 위해 무시됨.
- **룸(Rooms) 관리**: `groupPolicy` 설정을 통해 룸 메시지 처리 방식을 제어함.
  - `allowlist` (기본값): 지정된 룸만 허용.
  - `requireMention: false` 설정 시 해당 룸에서는 멘션 없이도 자동 응답이 가능함.
  - 초대 수락 여부는 `autoJoin` 및 `autoJoinAllowlist` 설정으로 제어 가능함.

## 스레드(Threads) 지원

- 답장 스레드 기능을 지원함.
- `threadReplies` 설정을 통해 응답을 스레드 내에 유지할지 여부 결정 (`off`, `inbound`, `always`).
- `replyToMode` 설정을 통해 스레드 미사용 시의 인용(Reply-to) 메타데이터 포함 방식 제어.

## 지원 기능 요약

| 기능 | 지원 상태 |
| :--- | :--- |
| 개인 대화 (DM) | ✅ 지원 |
| 룸 (Groups) | ✅ 지원 |
| 스레드 (Threads) | ✅ 지원 |
| 미디어 전송 | ✅ 지원 |
| E2EE 암호화 | ✅ 지원 (크립토 모듈 필요) |
| 리액션 | ✅ 지원 (도구 활용) |
| 투표 (Polls) | ✅ 발신 지원 (수신은 텍스트 변환) |
| 위치 정보 | ✅ 지원 (Geo URI 방식) |

## 문제 해결 (Troubleshooting)

먼저 다음 진단 단계를 수행함:
1. `openclaw status` 및 `gateway status` 확인.
2. `openclaw logs --follow`로 실시간 로그 모니터링.
3. `openclaw channels status --probe`로 인증 및 연결 상태 정밀 점검.

**일반적인 문제 해결:**
- **룸 메시지 무시**: `groupPolicy` 또는 룸 허용 목록 설정을 확인함.
- **DM 무시**: 발신자가 페어링 승인 대기 상태인지 확인함.
- **암호화 룸 오류**: 크립토 모듈 설치 여부 및 기기 검증 완료 여부를 재점검함.

상세한 장애 조치 흐름은 [채널 문제 해결 가이드](/channels/troubleshooting)를 참조함.
