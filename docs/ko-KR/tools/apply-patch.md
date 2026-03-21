---
summary: "apply_patch tool로 여러 파일 패치를 적용하는 방법을 설명합니다."
description: "OpenClaw에서 `apply_patch` tool을 사용해 여러 파일 추가, 수정, 삭제, rename 작업을 구조화된 patch 형식으로 수행하는 방법을 설명합니다."
read_when:
  - 여러 파일에 걸쳐 구조화된 파일 편집이 필요할 때
  - patch 기반 편집을 문서화하거나 디버깅할 때
title: "apply_patch Tool"
x-i18n:
  source_path: "tools/apply-patch.md"
---

# apply_patch 도구

구조화된 patch 형식으로 파일 변경을 적용합니다. 단일 `edit` 호출로는 취약해질 수 있는 multi-file 또는 multi-hunk 편집에 특히 적합합니다.

이 tool은 하나 이상의 파일 작업을 감싸는 단일 `input` 문자열을 받습니다.

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Parameters

- `input` (필수): `*** Begin Patch`와 `*** End Patch`를 포함한 전체 patch 내용

## Notes

- patch path는 상대 경로(workspace 기준)와 절대 경로를 모두 지원합니다.
- `tools.exec.applyPatch.workspaceOnly` 기본값은 `true`입니다. `apply_patch`가 workspace 밖을 write/delete하도록 의도한 경우에만 `false`로 바꾸세요.
- file rename은 `*** Update File:` hunk 안에서 `*** Move to:`를 사용합니다.
- 필요할 때 `*** End of File`은 EOF 전용 insert를 표시합니다.
- 실험적 기능이며 기본 비활성화 상태입니다. `tools.exec.applyPatch.enabled`로 활성화하세요.
- OpenAI 전용(OpenAI Codex 포함)이며, 선택적으로 `tools.exec.applyPatch.allowModels`로 model gate를 둘 수 있습니다.
- config는 `tools.exec.applyPatch` 아래에만 있습니다.

## Example

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
