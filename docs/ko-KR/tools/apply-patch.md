---
summary: "apply_patch 도구로 여러 파일 패치를 적용합니다"
read_when:
  - 여러 파일에 걸쳐 구조화된 파일 편집이 필요할 때
  - 패치 기반 편집을 문서화하거나 디버그하고 싶을 때
title: "apply_patch 도구"
---

# apply_patch 도구

구조화된 패치 형식을 사용해 파일 변경을 적용합니다. 이는 단일 `edit`
호출로는 취약할 수 있는 여러 파일 또는 여러 hunk 편집에 적합합니다.

이 도구는 하나 이상의 파일 작업을 감싸는 단일 `input` 문자열을 받습니다:

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

- `input` (필수): `*** Begin Patch`와 `*** End Patch`를 포함한 전체 패치 내용입니다.

## Notes

- 패치 경로는 상대 경로(워크스페이스 디렉터리 기준)와 절대 경로를 지원합니다.
- `tools.exec.applyPatch.workspaceOnly`의 기본값은 `true`(워크스페이스 내부로 제한)입니다. `apply_patch`가 워크스페이스 디렉터리 밖에 쓰기/삭제하도록 의도한 경우에만 `false`로 설정하세요.
- 파일 이름을 변경하려면 `*** Update File:` hunk 안에서 `*** Move to:`를 사용하세요.
- 필요할 때 `*** End of File`은 EOF 전용 삽입을 표시합니다.
- 실험적 기능이며 기본적으로 비활성화되어 있습니다. `tools.exec.applyPatch.enabled`로 활성화하세요.
- OpenAI 전용입니다(OpenAI Codex 포함). 선택적으로 `tools.exec.applyPatch.allowModels`를 통해 모델별로 게이트할 수 있습니다.
- 구성은 `tools.exec.applyPatch` 아래에만 있습니다.

## Example

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
