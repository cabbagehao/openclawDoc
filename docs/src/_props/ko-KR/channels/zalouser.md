---
summary: "네이티브 zca-js(QR 로그인)를 활용한 Zalo 개인 계정 연동 가이드 및 설정 안내"
read_when:
  - Zalo 개인 계정을 OpenClaw와 연동하고자 할 때
  - Zalo Personal 로그인 또는 메시지 흐름 관련 문제를 디버깅할 때
title: "Zalo Personal"
x-i18n:
  source_path: "channels/zalouser.md"
---

# Zalo Personal (비공식)

**상태**: 실험적 기능 (Experimental). 이 통합 방식은 네이티브 `zca-js` 라이브러리를 사용하여 **Zalo 개인 계정** 자동화를 지원함.

<Warning>
  **주의**: 본 기능은 비공식 연동 방식이며, 사용 시 계정 정지 또는 차단 조치가 취해질 수 있음. 모든 사용에 대한 책임은 사용자 본인에게 있음.
</Warning>

## 플러그인 설치 안내

Zalo Personal 연동 기능은 플러그인 형태로 제공되며 코어 패키지에 포함되어 있지 않음.

**CLI를 통한 설치 (npm):**

```bash
openclaw plugins install @openclaw/zalouser
```

**로컬 소스 환경 설치:**

```bash
openclaw plugins install ./extensions/zalouser
```

별도의 외부 `zca` 또는 `openzca` CLI 바이너리 설치는 필요하지 않음. 상세 내용은 [플러그인 가이드](/tools/plugin) 참조.

## 빠른 설정 가이드 (초보자용)

1. **플러그인 설치**: 위 안내에 따라 플러그인을 설치함.
2. **QR 로그인**: Gateway가 실행 중인 기기에서 로그인을 수행함.
   * `openclaw channels login --channel zalouser` 실행.
   * 출력된 QR 코드를 모바일 Zalo 앱으로 스캔하여 로그인 승인.
3. **채널 활성화**: `openclaw.json` 파일에 다음 설정을 추가함.

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. **Gateway 시작**: 서버를 가동하거나 온보딩 과정을 완료함.
5. **페어링 승인**: DM 접근 정책은 기본적으로 **페어링(Pairing)** 모드임. 봇에게 첫 메시지를 보낸 후 발급된 코드를 승인함.

***

## 핵심 동작 방식

* **통신 모델**: `zca-js`를 통해 Gateway 프로세스 내부에서 직접 작동함.
* **메시지 수신**: 네이티브 이벤트 리스너를 사용하여 수신 메시지를 감지함.
* **응답 전송**: JS API를 통해 텍스트, 미디어, 링크 등을 직접 전송함.
* **용도**: 공식 Zalo 봇 API를 사용할 수 없는 환경에서 개인 계정을 활용하기 위해 설계됨.

## 명칭 및 식별자

채널 ID는 \*\*`zalouser`\*\*임. 이는 본 기능이 비공식적인 **Zalo 개인 사용자 계정** 자동화임을 명확히 구분하기 위함임. `zalo` ID는 향후 공식 API 연동을 위해 예약되어 있음.

## ID 확인 방법 (디렉터리 조회)

CLI 도구를 사용하여 대화 상대 및 그룹의 ID를 확인할 수 있음:

```bash
# 본인 계정 정보 확인
openclaw directory self --channel zalouser

# 이름으로 연락처 검색 및 ID 확인
openclaw directory peers list --channel zalouser --query "이름"

# 이름으로 그룹 목록 검색 및 ID 확인
openclaw directory groups list --channel zalouser --query "업무"
```

## 기능 제한 사항

* **메시지 길이**: 발신 텍스트는 Zalo 클라이언트 제한에 따라 약 2,000자 단위로 자동 분할(Chunking)됨.
* **스트리밍**: 기술적 제약으로 인해 실시간 스트리밍 답변 기능은 기본적으로 차단됨.

***

## 접근 제어 정책

### 개인 대화 (DM)

* **정책 (`dmPolicy`)**: `pairing` (기본값), `allowlist`, `open`, `disabled` 중 선택.
* **허용 목록**: `allowFrom`에 사용자 ID 또는 이름을 등록함. 이름 입력 시 온보딩 과정에서 플러그인이 자동으로 ID를 검색하여 매핑함.
* **페어링 승인**:
  ```bash
  openclaw pairing list zalouser
  openclaw pairing approve zalouser <CODE>
  ```

### 그룹 대화 (선택 사항)

* **그룹 정책 (`groupPolicy`)**: `open` (모두 허용), `allowlist` (기본값), `disabled` (차단).
* **ID 해석**: 서버 시작 시 허용 목록에 등록된 그룹/사용자 이름을 실제 ID로 해석하여 로그에 기록함. 해석되지 않은 항목은 입력된 원본 값을 그대로 유지함.
* **발신자 필터링**: `groupAllowFrom`에 등록된 사용자만 그룹 내에서 에이전트를 호출할 수 있음. 미설정 시 DM 허용 목록을 상속함.

**설정 예시:**

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"], // 특정 사용자 ID
      groups: {
        "123456789": { allow: true }, // 그룹 ID
        "업무용 채팅방": { allow: true }, // 그룹 이름
      },
    },
  },
}
```

### 그룹 멘션 게이팅 (Mention Gating)

* `requireMention` 설정을 통해 멘션 시에만 응답할지 결정함 (기본값: `true`).
* **이력 주입**: 멘션이 없어 응답하지 않은 이전 메시지들은 버퍼링되었다가, 다음 멘션 시 문맥 정보(`groupChat.historyLimit`, 기본 50개)로 포함되어 전달됨.

***

## 다중 계정 설정 (Multi-account)

`zalouser` 프로필 시스템을 통해 여러 계정을 동시에 관리할 수 있음:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## 입력 알림 및 읽음 확인

* **입력 중 표시**: 답변 전송 전 최선 노력(Best-effort) 방식으로 입력 중 이벤트를 전송함.
* **리액션 (`react`)**: 채널 액션 기능을 통해 메시지에 리액션을 추가하거나 제거할 수 있음. 상세 내용은 [리액션 가이드](/tools/reactions) 참조.
* **읽음 확인**: 이벤트 메타데이터가 포함된 메시지 수신 시, '전달됨' 및 '읽음' 확인을 자동으로 전송함.

## 문제 해결 (Troubleshooting)

* **로그인 유지 안 됨**: `openclaw channels status --probe` 명령어로 상태를 확인하고, 문제가 있다면 로그아웃 후 다시 로그인을 진행함.
  * `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`
* **허용 목록 매핑 실패**: 가급적 이름 대신 변하지 않는 숫자형 ID를 `allowFrom` 또는 `groups` 설정에 직접 입력할 것을 권장함.
* **업그레이드 안내**: 이전 버전의 외부 CLI 기반 설정을 사용 중이었다면, 해당 프로세스 설정을 모두 제거해야 함. 현재는 OpenClaw 내부에서 모든 작업이 완결됨.
