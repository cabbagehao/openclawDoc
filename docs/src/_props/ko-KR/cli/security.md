---
summary: "보안 취약점 및 위험 요소를 점검하고 설정을 강화하는 `openclaw security` 명령어 레퍼런스"
read_when:
  - 현재 설정 및 상태 데이터에 대해 빠른 보안 점검(Audit)을 수행하고자 할 때
  - 파일 권한 조정 및 기본값 강화 등 안전한 자동 수정(Fix) 기능을 적용하고 싶을 때
title: "security"
x-i18n:
  source_path: "cli/security.md"
---

# `openclaw security`

Gateway 보안 진단 및 설정 강화 도구 (감사 및 자동 수정 지원).

**관련 문서:**

* 보안 가이드 전체: [Security](/gateway/security)

## 보안 감사 (Audit)

```bash
# 기본 보안 점검 실행
openclaw security audit

# 정밀 진단 및 실시간 프로브 실행
openclaw security audit --deep

# 발견된 문제 자동 수정 시도
openclaw security audit --fix

# 진단 결과를 JSON 형식으로 출력
openclaw security audit --json
```

### 주요 점검 항목 및 가이드라인

* **DM 세션 공유 방지**: 여러 명의 DM 발신자가 하나의 메인 세션을 공유하는 경우 경고를 발생시킴. 공유 인박스(Shared Inbox) 환경에서는 보안 강화를 위해 **보안 DM 모드**(`session.dmScope="per-channel-peer"`) 사용을 권장함.
* **신뢰 모델(Trust Model)**: 설정 파일이 다중 사용자 환경을 시사하는 경우(예: 오픈 DM 정책, 와일드카드 발신자 규칙 등), OpenClaw의 기본 모델이 **개인용 비서**임을 안내함. 의도적인 공유 환경이라면 모든 세션을 샌드박스화하고 워크스페이스 외부 파일 접근을 차단하며, 개인용 자격 증명을 해당 런타임에서 제거할 것을 권고함.
* **취약 모델 및 도구 조합**: 브라우저나 웹 도구가 활성화된 상태에서 상대적으로 추론 능력이 낮은 소형 모델(`<=300B`)을 사용할 경우 프롬프트 주입 공격 위험을 경고함.
* **웹훅 보안**: `hooks.defaultSessionKey`가 설정되지 않았거나, 세션 키 오버라이드가 허용 목록(`hooks.allowedSessionKeyPrefixes`) 없이 활성화된 경우를 감지함.
* **샌드박스 설정 오류**: 샌드박스 모드가 꺼져 있는데 Docker 설정이 포함된 경우, 혹은 `gateway.nodes.denyCommands` 설정이 명령어 이름 기반의 정확한 일치(Exact matching)가 아닌 유효하지 않은 패턴을 사용하는 경우 등을 점검함.
* **네트워크 및 탐색 보안**: `gateway.allowRealIpFallback=true` 설정으로 인한 헤더 스푸핑 위험, `discovery.mdns.mode="full"`로 인한 메타데이터 유출 가능성 등을 식별함.
* **Docker 및 인프라**: 샌드박스 브라우저의 위험한 네트워크 모드(Host 모드 등) 사용이나 컨테이너 해시 라벨이 누락되어 업데이트가 필요한 상태 등을 경고함.
* **의존성 및 채널 관리**: npm 기반 플러그인 버전이 고정(Pin)되지 않았거나, 채널 허용 목록이 불변 ID 대신 변경 가능한 이름/이메일에 의존하는 경우를 경고함.

<Note>
  `dangerous` 또는 `dangerously` 접두사가 붙은 설정은 운영자가 의도적으로 보안 제약을 해제한 것으로 간주함. 이러한 설정 자체가 취약점은 아니나, 신중한 사용이 필요함. 상세 목록은 [보안 가이드](/gateway/security)의 "Insecure or dangerous flags summary" 섹션을 참조함.
</Note>

## JSON 형식 출력 및 자동화

CI 파이프라인이나 정책 준수 확인을 위해 `--json` 플래그를 활용할 수 있음:

```bash
# 보안 점검 요약 정보만 추출
openclaw security audit --json | jq '.summary'

# 심각도 'Critical'인 문제의 체크 ID 목록 확인
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix`와 `--json`을 함께 사용하면 수정 작업 결과와 최종 리포트가 모두 포함됨:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 명령어의 자동 수정 범위

`--fix` 옵션은 안전하고 결정론적인 조치를 즉시 적용함:

* **정책 강화**: 일반적인 `groupPolicy="open"` 설정을 `"allowlist"`로 자동 변경함.
* **로깅 보안**: `logging.redactSensitive` 설정을 `"off"`에서 `"tools"`로 변경하여 민감 정보 마스킹 활성화.
* **권한 조정**: 상태 디렉터리, 설정 파일 및 민감한 데이터 파일(`credentials/*.json`, `auth-profiles.json`, 세션 기록 등)의 파일 시스템 권한을 엄격하게 제한함 (`chmod` 적용).

**주의 사항: `--fix` 명령어로 처리되지 않는 항목**

* 토큰, 비밀번호, API 키의 로테이션(갱신) 작업.
* 특정 도구(`gateway`, `cron`, `exec` 등)의 비활성화 처리.
* Gateway의 바인딩 주소나 네트워크 노출 설정 변경.
* 설치된 플러그인이나 스킬의 코드 수정 및 삭제.
