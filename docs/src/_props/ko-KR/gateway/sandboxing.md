---
summary: "OpenClaw 샌드박싱 동작 원리: 모드, 범위, 워크스페이스 접근 권한 및 Docker 이미지 관리 가이드"
title: "샌드박싱 (Sandboxing)"
read_when: "에이전트의 도구 실행 환경을 격리하거나 agents.defaults.sandbox 설정을 최적화하고자 할 때"
status: active
x-i18n:
  source_path: "gateway/sandboxing.md"
---

# 샌드박싱 (Sandboxing)

OpenClaw는 보안 피해 범위를 최소화하기 위해 **Docker 컨테이너 내에서 도구를 실행**하는 기능을 지원함. 이 기능은 **선택 사항**이며 설정(`agents.defaults.sandbox` 또는 `agents.list[].sandbox`)을 통해 제어함. 샌드박싱이 비활성화된 경우 도구는 호스트 시스템에서 직접 실행됨. 샌드박싱 활성화 시에도 Gateway 프로세스는 호스트에 유지되지만, 실제 도구 실행은 격리된 샌드박스 환경에서 수행됨.

샌드박싱이 완벽한 보안 경계를 보장하는 것은 아니나, 모델이 예기치 못한 동작을 할 때 파일 시스템 및 프로세스 접근을 실질적으로 제한하는 효과가 있음.

## 샌드박스 적용 대상

* **도구 실행**: `exec`, `read`, `write`, `edit`, `apply_patch`, `process` 등 모든 표준 도구.
* **격리된 브라우저** (선택 사항): `agents.defaults.sandbox.browser` 설정을 통해 활성화.
  * 브라우저 도구가 호출될 때 샌드박스 브라우저가 자동으로 시작되도록 구성 가능 (`autoStart`, `autoStartTimeoutMs`).
  * 기본적으로 전역 `bridge` 네트워크가 아닌 전용 Docker 네트워크(`openclaw-sandbox-browser`)를 사용함.
  * `cdpSourceRange` 설정을 통해 컨테이너 외부에서의 CDP 접속을 CIDR 기반 허용 목록(예: `172.21.0.1/32`)으로 제한할 수 있음.
  * noVNC 관찰자 접속은 비밀번호로 보호됨. OpenClaw는 쿼리 로그에 남지 않도록 URL 프래그먼트에 비밀번호를 포함한 단기 토큰 URL을 생성함.
  * `allowHostControl` 옵션을 통해 샌드박스 세션이 호스트 브라우저를 명시적으로 제어하도록 허용할 수 있음.

**샌드박스 제외 대상:**

* **Gateway 프로세스 자체**: 항상 호스트에서 실행됨.
* **호스트 실행 허용 도구**: `tools.elevated` 등 명시적으로 호스트 권한이 부여된 도구.
  * **권한 상승(Elevated) 실행은 샌드박싱을 우회하여 호스트에서 직접 실행됨.**
  * 샌드박싱이 꺼진 상태에서는 `tools.elevated` 설정 여부와 관계없이 호스트에서 실행됨 ([권한 상승 모드 가이드](/tools/elevated) 참조).

## 실행 모드 (Modes)

`agents.defaults.sandbox.mode` 필드를 통해 적용 시점을 제어함:

* **`"off"`**: 샌드박싱을 사용하지 않음.
* **`"non-main"` (기본값)**: 메인 세션이 아닌 경우에만 샌드박스를 적용함. 호스트에서의 일반적인 대화는 유지하면서 그룹/채널 등 외부 세션을 격리하고 싶을 때 적합함.
* **`"all"`**: 모든 세션을 샌드박스 내에서 실행함.

*참고: `"non-main"` 판정은 에이전트 ID가 아닌 `session.mainKey`(기본값 `"main"`)를 기준으로 수행됨.*

## 실행 범위 (Scope)

`agents.defaults.sandbox.scope` 필드를 통해 컨테이너 생성 단위를 제어함:

* **`"session"` (기본값)**: 대화 세션별로 독립된 컨테이너를 생성함.
* **`"agent"`**: 에이전트별로 하나의 컨테이너를 생성하여 공유함.
* **`"shared"`**: 모든 샌드박스 세션이 단일 컨테이너를 공유함.

## 워크스페이스 접근 권한

`agents.defaults.sandbox.workspaceAccess` 설정을 통해 샌드박스가 호스트 파일을 어느 정도 볼 수 있는지 결정함:

* **`"none"` (기본값)**: 호스트의 실제 워크스페이스를 보지 못하며, `~/.openclaw/sandboxes` 하위의 독립된 공간만 사용함.
* **`"ro"`**: 에이전트 워크스페이스를 `/agent` 경로에 읽기 전용으로 마운트함. (`write`, `edit` 등 수정 도구 비활성화)
* **`"rw"`**: 에이전트 워크스페이스를 `/workspace` 경로에 읽기/쓰기 가능 상태로 마운트함.

*참고: 인바운드 미디어 파일은 항상 활성 샌드박스 워크스페이스(`media/inbound/*`)로 복제됨.*

## 커스텀 바인드 마운트 (Bind Mounts)

`agents.defaults.sandbox.docker.binds` 설정을 통해 호스트의 특정 디렉터리를 컨테이너에 추가로 연결할 수 있음.
형식: `호스트경로:컨테이너경로:모드` (예: `"/home/user/data:/data:ro"`).

* 전역 설정과 에이전트별 설정은 서로 **병합**되어 적용됨.
* `scope: "shared"` 모드에서는 에이전트별 바인드 설정이 무시됨.
* `agents.defaults.sandbox.browser.binds`를 통해 브라우저 컨테이너 전용 마운트 설정을 별도로 구성할 수 있음.

**보안 주의 사항:**

* 바인드 마운트는 샌드박스 보안을 우회하여 호스트 경로를 직접 노출함.
* OpenClaw는 `/etc`, `/proc`, `docker.sock` 등 위험한 경로에 대한 마운트 시도를 자동으로 차단함.
* 민감한 정보(SSH 키, 시크릿 등)를 마운트해야 한다면 반드시 `:ro` (읽기 전용) 모드를 사용해야 함.

## 이미지 빌드 및 설정

**기본 이미지**: `openclaw-sandbox:bookworm-slim`

최초 1회 빌드 필요:

```bash
scripts/sandbox-setup.sh
```

*참고: 기본 이미지에는 Node.js가 포함되어 있지 않음. 특정 언어 런타임이 필요하다면 커스텀 이미지를 제작하거나 `sandbox.docker.setupCommand`를 통해 설치해야 함.*

**도구가 포함된 이미지**: `curl`, `jq`, `nodejs`, `python3`, `git` 등이 포함된 이미지를 사용하려면 다음 스크립트로 빌드한 후 이미지 이름을 `openclaw-sandbox-common:bookworm-slim`으로 변경함:

```bash
scripts/sandbox-common-setup.sh
```

**네트워크 설정**: 기본적으로 샌드박스 컨테이너는 **네트워크 접근이 차단**된 상태로 실행됨. 필요 시 `docker.network` 설정을 통해 네트워크를 허용할 수 있음.

## 초기 설정 명령 (`setupCommand`)

`setupCommand`는 샌드박스 컨테이너가 생성된 직후 **단 한 번** 실행됨. 패키지 설치나 초기 환경 구성에 활용함.

**주의 사항:**

* 네트워크가 `"none"`인 경우 외부 패키지 설치가 실패함.
* `readOnlyRoot: true` 설정 시 쓰기 작업이 불가능함.
* 패키지 설치를 위해서는 `user: "0:0"` (루트 권한) 설정이 필요함.
* 샌드박스 환경은 호스트의 환경 변수를 상속받지 않으므로, API 키 등은 `docker.env` 설정을 통해 명시적으로 전달해야 함.

## 도구 정책 및 탈출구 (Escape Hatches)

샌드박스 규칙보다 도구 허용/차단 정책이 우선 적용됨. 전역적으로 차단된 도구는 샌드박스 내에서도 사용할 수 없음.

* **권한 상승 (`/exec`)**: 승인된 사용자가 발신한 명령에 대해 호스트에서 직접 `exec`를 실행할 수 있는 유일한 탈출구임.
* **진단 도구**: `openclaw sandbox explain` 명령을 사용하여 현재 적용된 샌드박스 모드와 도구 정책을 확인할 수 있음.

## 상세 설정 예시 (최소 구성)

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## 관련 문서 목록

* [샌드박스 상세 설정 레퍼런스](/gateway/configuration#agentsdefaults-sandbox)
* [멀티 에이전트 환경에서의 샌드박스 및 도구 정책](/tools/multi-agent-sandbox-tools)
* [시스템 보안 가이드](/gateway/security)
