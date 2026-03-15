# 신규 언어 추가 가이드

이 가이드는 OpenClaw 문서에 새로운 언어를 추가하는 절차를 설명함. 예시로는 한국어(`ko-KR`)를 사용함.

## 1. 번역 도구에 언어 등록

`scripts/docs-i18n/prompt.go` 파일을 수정하여 언어 매핑을 추가함.

- `prettyLanguageLabel(lang string) string` 함수에 다음 케이스를 추가함.

  ```go
  	case strings.EqualFold(trimmed, "ko-KR"):
  		return "Korean"
  ```

## 2. i18n 설정 파일 생성

`docs/.i18n/` 디렉터리에 다음 파일들을 생성함.

- `glossary.ko-KR.json`: 특정 용어 번역을 위한 배열 객체 임. `[{"source": "...", "target": "..."}]` 형식 사용.
- `navigation.ko-KR.json`: 사이드바 메뉴 레이블 매핑 객체 임. `{"English Label": "Korean Label"}` 형식 사용.

## 3. package.json 업데이트

신규 언어용 동기화 및 검사 명령어를 추가함.

```json
"docs:i18n:ko": "go run ./scripts/docs-i18n -mode doc -lang ko-KR -parallel 2 docs",
"docs:sync-ko-nav": "node scripts/sync-navigation.mjs --lang ko-KR --code ko",
"docs:check-ko": "node scripts/check-coverage.mjs --lang ko-KR --docs docs"
```

## 4. 워크플로우 실행

1. **번역 실행**: `pnpm docs:i18n:ko` 실행 시 `.md` 파일들이 `docs/ko-KR/` 경로로 번역됨.
2. **내비게이션 동기화**: `pnpm docs:sync-ko-nav` 실행 시 번역된 내비게이션 정보가 `docs/docs.json`에 반영됨.
3. **검증**: `pnpm docs:check-ko` 실행 시 누락된 번역 파일이 없는지 확인함.
4. **미리보기**: `pnpm docs:dev` 실행 후 결과 확인.

---

**참고**: `scripts/sync-navigation.mjs` 및 `scripts/check-coverage.mjs`는 범용 스크립트임. 적절한 `--lang` 및 `--code` 플래그를 전달하면 모든 언어에 적용 가능함.
