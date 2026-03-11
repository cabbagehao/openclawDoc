---
title: "샌드박스 vs 도구 정책 vs 권한 상승 비교"
summary: "도구 실행 차단 사유 분석: 샌드박스 런타임, 도구 허용/차단 정책 및 권한 상승(Elevated) 실행 게이트 안내"
read_when: "샌드박스 격리 환경으로 인해 도구 실행이 거부되거나, 권한 상승 관련 설정 키를 정확히 확인하고자 할 때"
status: active
x-i18n:
  source_path: "gateway/sandbox-vs-tool-policy-vs-elevated.md"
---

# 샌드박스 vs 도구 정책 vs 권한 상승

OpenClaw에는 서로 밀접하게 연관되어 있으면서도 기능적으로 구분되는 세 가지 제어 메커니즘이 존재함:

1. **샌드박스 (Sandbox)** (`agents.defaults.sandbox.*`): **도구가 실행될 환경** (Docker 컨테이너 vs 호스트 시스템)을 결정함.
2. **도구 정책 (Tool policy)** (`tools.*`, `tools.sandbox.tools.*`): \*\*어떤 도구가 사용 가능한지(허용되는지)\*\*를 결정함.
3. **권한 상승 (Elevated)** (`tools.elevated.*`): 샌드박스가 활성화된 상태에서 호스트 시스템의 기능을 직접 사용하게 해주는 **`exec` 전용 탈출구**임.

## 빠른 진단 방법 (Inspector)

인스펙터 도구를 사용하여 현재 에이전트나 세션에 적용된 실제 규칙을 확인할 수 있음:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

**출력 내용:**

* 현재 적용된 샌드박스 모드, 범위 및 워크스페이스 접근 권한.
* 해당 세션의 샌드박스 적용 여부 (메인 vs 비메인 세션 판정).
* 샌드박스 내 도구 허용/차단 목록 (설정의 출처 포함).
* 권한 상승 게이트(Gates) 상태 및 수정이 필요한 설정 키 경로.

## 샌드박스: 도구 실행 환경 결정

샌드박싱은 `agents.defaults.sandbox.mode` 설정을 통해 제어됨:

* **`"off"`**: 모든 작업이 호스트 시스템에서 직접 실행됨.
* **`"non-main"`**: 메인 세션이 아닌 경우에만 샌드박스가 적용됨 (그룹/채널 대화 시 예상치 않게 샌드박스가 적용되는 주된 원인임).
* **`"all"`**: 예외 없이 모든 세션이 샌드박스 내에서 실행됨.

실행 범위, 워크스페이스 마운트 및 이미지 관련 상세 내용은 [샌드박싱 가이드](/gateway/sandboxing)를 참조함.

### 바인드 마운트 보안 체크 (Bind mounts)

* `docker.binds` 설정은 샌드박스 격리벽을 뚫고 호스트의 경로를 컨테이너 내부에 노출함.
* 마운트 모드(`:ro` 또는 `:rw`)를 명시하지 않으면 기본적으로 읽기/쓰기가 허용되므로, 소스 코드나 비밀 키 마운트 시에는 반드시 `:ro` (읽기 전용)를 권장함.
* `scope: "shared"` 모드에서는 에이전트별 바인드 설정은 무시되고 전역 설정만 적용됨.
* 워크스페이스 접근 권한(`workspaceAccess`)은 바인드 마운트 모드와 독립적으로 작동함.

## 도구 정책: 가용 도구 및 호출 권한 관리

다음과 같은 여러 계층의 정책이 순차적으로 적용됨:

* **도구 프로필 (Tool profile)**: 기본적인 도구 허용 목록 (Base allowlist).
* **전역/에이전트별 정책**: `tools.allow` (허용) 및 `tools.deny` (차단) 규칙.
* **공급자별 정책**: 특정 모델 공급자에게만 적용되는 허용/차단 규칙.
* **샌드박스 전용 정책**: 샌드박스 내에서만 적용되는 `tools.sandbox.tools.*` 규칙.

**정책 적용 원칙:**

* **차단(`deny`)이 항상 최우선임**: 정책에 의해 차단된 도구는 다른 어떤 수단으로도 강제 실행할 수 없음.
* **명시적 허용(`allow`) 적용**: 허용 목록이 비어 있지 않다면, 목록에 없는 모든 도구는 자동으로 차단됨.
* **슬래시 명령(`/exec`)의 한계**: `/exec` 명령은 세션의 실행 기본값만 변경할 뿐, 차단된 도구에 대한 접근 권한을 부여하지는 않음.

### 도구 그룹 (축약 표기법)

여러 도구를 묶어서 관리할 수 있도록 `group:*` 형식을 지원함:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

**사용 가능한 주요 그룹:**

* `group:runtime`: `exec`, `bash`, `process`
* `group:fs`: `read`, `write`, `edit`, `apply_patch`
* `group:sessions`: 세션 목록, 이력 조회, 발송 및 생성 등.
* `group:memory`: 메모리 검색 및 정보 획득.
* `group:ui`: `browser`, `canvas`
* `group:openclaw`: 모든 OpenClaw 내장 도구 (외부 플러그인 제외).

## 권한 상승 (Elevated): 호스트 직접 실행

권한 상승은 새로운 도구를 추가하는 것이 아니라, **기존 `exec` 도구의 실행 위치를 샌드박스에서 호스트로 변경**하는 것임.

* 샌드박스 환경에서 `/elevated on` 명령을 사용하면 이후의 `exec` 작업이 호스트에서 수행됨 (관리자 승인 절차는 여전히 적용될 수 있음).
* `/elevated full` 명령은 해당 세션에 대해 승인 절차까지 생략함.
* 권한 상승은 에이전트의 도구 허용/차단 정책을 무시하거나 우회할 수 없음.
* `/exec`는 단순히 세션별 실행 기본값을 조정하는 기능으로, 권한 상승과는 별개의 메커니즘임.

**접근 제어 게이트 (Gates):**

* 활성화 여부: `tools.elevated.enabled`
* 발신자 허용 목록: `tools.elevated.allowFrom.<공급자>`

상세 내용은 [권한 상승 모드 가이드](/tools/elevated)를 참조함.

## 일반적인 문제 해결 (Sandbox Jail)

### "도구가 샌드박스 정책에 의해 차단됨" 메시지 발생 시

**해결 방법 (택일):**

1. **샌드박스 비활성화**: `agents.defaults.sandbox.mode`를 `"off"`로 변경.
2. **샌드박스 내 도구 허용**:
   * `tools.sandbox.tools.deny` 목록에서 해당 도구 제거.
   * 또는 `tools.sandbox.tools.allow` 목록에 해당 도구 추가.

### "메인 세션인데 왜 샌드박스가 적용되는가?"

`"non-main"` 모드 사용 시, 그룹 대화나 특정 채널 세션은 시스템적으로 메인 세션으로 간주되지 않음. `openclaw sandbox explain` 명령으로 실제 사용 중인 세션 키를 확인하거나, 모드를 `"off"`로 변경하여 대응함.
