---
summary: "signal-cli(JSON-RPC + SSE)를 활용한 Signal 연동 방식, 설정 절차 및 번호 모델 안내"
read_when:
  - Signal 채널 연동을 구성하고자 할 때
  - Signal 메시지 송수신 문제를 디버깅할 때
title: "Signal"
x-i18n:
  source_path: "channels/signal.md"
---

# Signal (signal-cli)

**상태**: 외부 CLI 도구를 활용한 통합 방식임. Gateway 서버는 `signal-cli` 데몬과 HTTP JSON-RPC 및 SSE를 통해 통신함.

## 사전 요구 사항

* OpenClaw 서버 설치 완료 (Ubuntu 24 환경에서 테스트됨).
* Gateway가 실행되는 호스트에 `signal-cli` 설치 및 가용 상태 확인.
* SMS 인증 문자 수신이 가능한 전화번호 (신규 번호 등록 시 필요).
* 등록 과정 중 캡차(Captcha) 해결을 위한 웹 브라우저 접근 권한 (`signalcaptchas.org`).

## 빠른 설정 가이드 (초보자용)

1. **전용 번호 사용**: 에이전트용으로 사용할 별도의 Signal 전화번호를 준비할 것을 권장함.
2. **`signal-cli` 설치**: JVM 빌드 사용 시 Java 설치가 필요함.
3. **연동 방식 선택**:
   * **방법 A (QR 연결)**: 기존 앱 계정을 연결함. `signal-cli link -n "OpenClaw"` 실행 후 생성된 QR 코드를 Signal 앱으로 스캔.
   * **방법 B (SMS 등록)**: 전용 번호를 사용하여 캡차 및 SMS 인증 절차를 거쳐 신규 등록.
4. **OpenClaw 구성**: `openclaw.json`에 자격 증명을 입력하고 Gateway를 시작함.
5. **페어링 승인**: 봇에게 첫 메시지를 보낸 후 서버에서 승인함 (`openclaw pairing approve signal <CODE>`).

### 최소 설정 예시

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+821012345678",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+821087654321"],
    },
  },
}
```

## 핵심 동작 방식

* **통신 모델**: `signal-cli`는 데몬(Daemon)으로 실행되며, Gateway는 SSE를 통해 실시간 이벤트를 수신함.
* **결정론적 라우팅**: 모든 응답은 메시지가 유입된 동일한 Signal 번호 또는 그룹으로 회신됨.
* **세션 관리**: 개인 대화(DM)는 메인 세션을 공유하며, 그룹 대화는 `agent:<agentId>:signal:group:<groupId>` 키를 사용하여 격리된 세션으로 운영됨.

<Note>
  **중요 (번호 모델)**: 개인 계정을 봇으로 사용할 경우, 자신이 본인에게 보내는 메시지는 루프 방지 로직에 의해 무시될 수 있음. 원활한 소통을 위해 반드시 **별도의 봇 전용 번호** 사용을 권장함.
</Note>

## 설정 방법 상세

### 방법 A: 기존 계정 연결 (QR 코드)

1. `signal-cli` 설치 (네이티브 또는 JVM 빌드).
2. 봇 계정 연결 실행:
   * `signal-cli link -n "OpenClaw"` 명령을 실행하고 출력된 QR 코드를 모바일 Signal 앱에서 스캔함.
3. 설정 파일 구성 후 Gateway 시작.

### 방법 B: 전용 번호 신규 등록 (Linux 권장)

기존 앱 계정을 사용하지 않고 서버에서 독립적으로 구동할 때 사용함.

1. **바이너리 설치**:
   ```bash
   # 최신 버전 확인 및 다운로드
   VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
   curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
   sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
   sudo ln -sf /opt/signal-cli /usr/local/bin/
   ```
2. **등록 및 인증**:
   * `signal-cli -a +<전화번호> register` 실행.
   * 캡차 요청 시 `https://signalcaptchas.org/registration/generate.html` 접속 후 결과 링크를 복사하여 `--captcha '<LINK>'` 옵션과 함께 재실행.
   * 수신된 SMS 인증 코드로 검증: `signal-cli -a +<전화번호> verify <인증코드>`.
3. **Gateway 연동**: 설정을 완료하고 `openclaw doctor` 명령어로 정상 작동 여부를 확인함.

<Warning>
  **주의**: 기존에 사용 중인 번호를 `signal-cli`로 등록하면 모바일 앱의 세션이 만료될 수 있음. 기존 앱 환경 유지가 필요하다면 방법 A(QR 연결)를 선택함.
</Warning>

## 접근 제어 정책

* **DM 정책**: 기본값 `"pairing"`. 승인되지 않은 사용자는 페어링 코드를 받게 되며, 관리자가 `openclaw pairing approve signal <CODE>` 명령어로 승인하기 전까지 메시지는 처리되지 않음.
* **UUID 지원**: 전화번호 정보가 없는 발신자는 `uuid:<ID>` 형식으로 관리됨.
* **그룹 정책**: `open`, `allowlist` (기본값), `disabled` 중 선택 가능. 멘션 게이팅이 적용됨.

## 미디어 및 전송 관리

* **청킹 (Chunking)**: 발신 메시지는 `textChunkLimit` (기본 4000자) 단위로 자동 분할됨.
* **첨부 파일**: `signal-cli`를 통해 수발신 미디어를 Base64 형식으로 처리함. 최대 용량 제한은 `mediaMaxMb` (기본 8MB) 설정을 따름.
* **읽음 확인**: `sendReadReceipts: true` 설정 시 허용된 사용자에게 읽음 확인을 전송함.

## 리액션 (Message Tool)

에이전트가 메시지에 리액션을 추가하거나 제거할 수 있음.

* **사용 예시**: `message action=react channel=signal target=uuid:<ID> messageId=<Timestamp> emoji=🔥`
* **그룹 리액션**: 반드시 `targetAuthor` 또는 `targetAuthorUuid` 파라미터가 포함되어야 함.

## 문제 해결 (Troubleshooting)

1. `pgrep -af signal-cli` 명령어로 데몬 프로세스 가동 여부 확인.
2. `openclaw channels status --probe` 명령어로 인증 상태 정밀 진단.
3. `/tmp/openclaw/` 경로의 로그 파일에서 "signal" 키워드 검색.
4. **응답 없음**: 페어링 승인 대기 상태이거나 멘션 게이팅에 의해 메시지가 필터링되었을 수 있음.

상세 설정 옵션은 [Gateway 설정 가이드](/gateway/configuration)를 참조함.
