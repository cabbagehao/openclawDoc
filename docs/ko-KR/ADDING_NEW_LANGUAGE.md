# 새 언어 추가하기

이 가이드는 OpenClaw 문서에 새 언어를 추가하는 방법을 설명합니다. 예시로는 한국어(`ko-KR`)를 사용합니다.

## 1. 번역 도구에 언어 등록하기

`scripts/docs-i18n/prompt.go`를 수정해 언어 매핑을 추가합니다.

- `prettyLanguageLabel(lang string) string`에 다음을 추가합니다.

  ```go
  	case strings.EqualFold(trimmed, "ko-KR"):
  		return "Korean"
  ```

## 2. i18n 설정 파일 만들기

`docs/.i18n/` 디렉터리에 다음 파일을 만듭니다.

- `glossary.ko-KR.json`: 특정 용어용 배열 객체 `[{"source": "...", "target": "..."}]`
- `navigation.ko-KR.json`: 사이드바 메뉴용 매핑 객체 `{"English Label": "Korean Label"}`

## 3. package.json 업데이트하기

새 언어용 일반 동기화 및 검사 명령을 추가합니다.

```json
"docs:i18n:ko": "go run ./scripts/docs-i18n -mode doc -lang ko-KR -parallel 2 docs",
"docs:sync-ko-nav": "node scripts/sync-navigation.mjs --lang ko-KR --code ko",
"docs:check-ko": "node scripts/check-coverage.mjs --lang ko-KR --docs docs"
```

## 4. 워크플로우 실행하기

1. **번역**: `pnpm docs:i18n:ko` (`.md` 파일을 `docs/ko-KR/`로 번역합니다.)
2. **내비게이션 동기화**: `pnpm docs:sync-ko-nav` (번역된 내비게이션으로 `docs/docs.json`을 갱신합니다.)
3. **검증**: `pnpm docs:check-ko` (누락된 파일이 없는지 확인합니다.)
4. **미리보기**: `pnpm docs:dev`

---

**참고**: `scripts/sync-navigation.mjs`와 `scripts/check-coverage.mjs`는 이제 범용 스크립트이므로, 알맞은 `--lang`과 `--code` 플래그만 넘기면 어떤 언어에도 사용할 수 있습니다.
