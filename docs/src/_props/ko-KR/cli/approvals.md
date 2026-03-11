---
summary: "Gateway 또는 노드 호스트의 명령어 실행 승인(Exec Approvals) 및 허용 목록을 관리하는 `openclaw approvals` 명령어 레퍼런스"
read_when:
  - CLI를 통해 명령어 실행 승인 정책을 수정하고자 할 때
  - Gateway 또는 특정 노드 호스트의 명령어 허용 목록(Allowlist)을 관리해야 할 때
title: "approvals"
x-i18n:
  source_path: "cli/approvals.md"
---

# `openclaw approvals`

**로컬 호스트**, **Gateway 호스트** 또는 특정 **노드 호스트**의 명령어 실행 승인(Exec Approvals) 정책을 관리함. 기본적으로 로컬 디스크의 승인 파일을 대상으로 하며, `--gateway` 또는 `--node` 플래그를 사용하여 대상을 변경할 수 있음.

**관련 문서:**

* 실행 승인 가이드: [Exec approvals](/tools/exec-approvals)
* 노드(Nodes) 개요: [Nodes](/nodes)

## 주요 명령어

```bash
# 로컬 호스트의 승인 정책 조회
openclaw approvals get

# 특정 노드의 승인 정책 조회
openclaw approvals get --node <ID|이름|IP>

# Gateway 호스트의 승인 정책 조회
openclaw approvals get --gateway
```

## 파일 기반 정책 업데이트 (교체)

```bash
# 로컬 호스트 정책을 파일 내용으로 교체
openclaw approvals set --file ./exec-approvals.json

# 특정 노드 호스트 정책 교체
openclaw approvals set --node <ID|이름|IP> --file ./exec-approvals.json

# Gateway 호스트 정책 교체
openclaw approvals set --gateway --file ./exec-approvals.json
```

## 허용 목록(Allowlist) 도우미

```bash
# 특정 명령어 경로를 허용 목록에 추가 (Globs 지원)
openclaw approvals allowlist add "~/Projects/**/bin/rg"

# 특정 에이전트 및 특정 노드에 대해 명령어 허용
openclaw approvals allowlist add --agent main --node <ID|이름|IP> "/usr/bin/uptime"

# 모든 에이전트에 대해 공통 명령어 허용
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

# 허용 목록에서 특정 경로 제거
openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 참고 사항

* `--node` 옵션은 `openclaw nodes`와 동일한 해석 규칙(ID, 이름, IP 또는 ID 접두사)을 사용함.
* `--agent` 옵션의 기본값은 `"*"`이며, 이는 모든 에이전트 인스턴스에 적용됨을 의미함.
* 대상 노드 호스트는 `system.execApprovals.get/set` 기능을 지원해야 함 (macOS 앱 또는 헤드리스 노드 호스트).
* 승인 정책 파일은 각 호스트의 `~/.openclaw/exec-approvals.json` 경로에 저장됨.
