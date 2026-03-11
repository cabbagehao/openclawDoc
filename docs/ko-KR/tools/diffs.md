---
title: "차이점"
summary: "에이전트를 위한 읽기 전용 diff 뷰어 및 파일 렌더러(선택적 플러그인 도구)"
description: "선택적 Diffs 플러그인을 사용해 변경 전후 텍스트 또는 unified patch를 게이트웨이 호스팅 diff 뷰, 파일(PNG 또는 PDF), 또는 둘 다로 렌더링합니다."
read_when:
  - 에이전트가 코드나 마크다운 편집 내용을 diff로 보여주길 원할 때
  - 캔버스에 바로 표시할 수 있는 뷰어 URL 또는 렌더링된 diff 파일이 필요할 때
  - 안전한 기본값과 함께 제어된 임시 diff 아티팩트가 필요할 때
---

# Diffs

`diffs`는 짧은 내장 시스템 안내와 함께, 에이전트용 변경 내용을 읽기 전용 diff 아티팩트로 바꿔 주는 보조 skill을 제공하는 선택적 플러그인 도구입니다.

다음 중 하나를 입력으로 받을 수 있습니다:

- `before` 및 `after` 텍스트
- unified `patch`

다음 중 하나를 반환할 수 있습니다:

- 캔버스 표시를 위한 게이트웨이 뷰어 URL
- 메시지 전달용 렌더링 파일 경로(PNG 또는 PDF)
- 한 번의 호출로 두 출력 모두

활성화되면, 이 플러그인은 간결한 사용 안내를 system-prompt 공간 앞부분에 주입하고, 에이전트가 더 자세한 지침이 필요할 때 사용할 수 있도록 상세 skill도 함께 제공합니다.

## 빠른 시작

1. 플러그인을 활성화합니다.
2. 캔버스 우선 흐름에는 `mode: "view"`로 `diffs`를 호출합니다.
3. 채팅 파일 전달 흐름에는 `mode: "file"`로 `diffs`를 호출합니다.
4. 두 아티팩트가 모두 필요하면 `mode: "both"`로 `diffs`를 호출합니다.

## 플러그인 활성화

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
      },
    },
  },
}
```

## 내장 시스템 안내 비활성화

`diffs` 도구는 활성화한 상태로 유지하되, 내장 system-prompt 안내만 비활성화하려면 `plugins.entries.diffs.hooks.allowPromptInjection`을 `false`로 설정합니다:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

이렇게 하면 diffs 플러그인의 `before_prompt_build` hook은 차단되지만, 플러그인, 도구, 보조 skill은 계속 사용할 수 있습니다.

안내와 도구를 모두 비활성화하려면, 대신 플러그인 자체를 비활성화하면 됩니다.

## 일반적인 에이전트 워크플로

1. 에이전트가 `diffs`를 호출합니다.
2. 에이전트가 `details` 필드를 읽습니다.
3. 에이전트는 다음 중 하나를 수행합니다:
   - `canvas present`로 `details.viewerUrl`을 엽니다
   - `path` 또는 `filePath`를 사용해 `message`로 `details.filePath`를 전송합니다
   - 둘 다 수행합니다

## 입력 예시

Before and after:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## 도구 입력 참조

별도 표기가 없는 한 모든 필드는 선택 사항입니다:

- `before` (`string`): 원본 텍스트. `patch`가 생략된 경우 `after`와 함께 필수입니다.
- `after` (`string`): 수정된 텍스트. `patch`가 생략된 경우 `before`와 함께 필수입니다.
- `patch` (`string`): unified diff 텍스트. `before`, `after`와 상호 배타적입니다.
- `path` (`string`): before/after 모드에서 표시할 파일명입니다.
- `lang` (`string`): before/after 모드용 언어 override 힌트입니다.
- `title` (`string`): 뷰어 제목 override입니다.
- `mode` (`"view" | "file" | "both"`): 출력 모드입니다. 기본값은 플러그인 기본값 `defaults.mode`입니다.
- `theme` (`"light" | "dark"`): 뷰어 테마입니다. 기본값은 플러그인 기본값 `defaults.theme`입니다.
- `layout` (`"unified" | "split"`): diff 레이아웃입니다. 기본값은 플러그인 기본값 `defaults.layout`입니다.
- `expandUnchanged` (`boolean`): 전체 컨텍스트를 사용할 수 있을 때 변경되지 않은 구간을 펼칩니다. 호출 단위 옵션만 지원합니다(플러그인 기본값 키는 아님).
- `fileFormat` (`"png" | "pdf"`): 렌더링 파일 형식입니다. 기본값은 플러그인 기본값 `defaults.fileFormat`입니다.
- `fileQuality` (`"standard" | "hq" | "print"`): PNG 또는 PDF 렌더링용 품질 프리셋입니다.
- `fileScale` (`number`): device scale override입니다(`1`-`4`).
- `fileMaxWidth` (`number`): CSS 픽셀 기준 최대 렌더링 너비입니다(`640`-`2400`).
- `ttlSeconds` (`number`): 뷰어 아티팩트 TTL(초)입니다. 기본값은 1800, 최대는 21600입니다.
- `baseUrl` (`string`): 뷰어 URL origin override입니다. `http` 또는 `https`여야 하며 query/hash는 허용되지 않습니다.

유효성 검사 및 제한:

- `before`, `after`는 각각 최대 512 KiB입니다.
- `patch`는 최대 2 MiB입니다.
- `path`는 최대 2048바이트입니다.
- `lang`는 최대 128바이트입니다.
- `title`은 최대 1024바이트입니다.
- Patch complexity 상한: 최대 128개 파일, 총 120000줄입니다.
- `patch`와 `before` 또는 `after`를 함께 보내면 거부됩니다.
- 렌더링 파일 안전 제한(PNG와 PDF 모두 적용):
  - `fileQuality: "standard"`: 최대 8 MP(8,000,000 렌더링 픽셀)
  - `fileQuality: "hq"`: 최대 14 MP(14,000,000 렌더링 픽셀)
  - `fileQuality: "print"`: 최대 24 MP(24,000,000 렌더링 픽셀)
  - PDF는 추가로 최대 50페이지 제한이 있습니다.

## 출력 details 계약

도구는 구조화된 메타데이터를 `details` 아래에 반환합니다.

뷰어를 생성하는 모드에서 공통으로 제공되는 필드:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`

PNG 또는 PDF가 렌더링될 때 제공되는 파일 필드:

- `filePath`
- `path` (`filePath`와 같은 값이며, message 도구와의 호환성을 위해 제공)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

모드 동작 요약:

- `mode: "view"`: 뷰어 필드만 반환합니다.
- `mode: "file"`: 파일 필드만 반환하며, 뷰어 아티팩트는 없습니다.
- `mode: "both"`: 뷰어 필드와 파일 필드를 함께 반환합니다. 파일 렌더링이 실패하면 뷰어는 여전히 반환되고 `fileError`가 포함됩니다.

## 접힌 변경 없음 구간

- 뷰어는 `N unmodified lines` 같은 행을 표시할 수 있습니다.
- 그 행의 펼치기 컨트롤은 조건부이며, 모든 입력 종류에서 항상 보장되지는 않습니다.
- 렌더링된 diff에 펼칠 수 있는 컨텍스트 데이터가 있을 때 펼치기 컨트롤이 나타나며, 이는 보통 before/after 입력에서 흔합니다.
- 많은 unified patch 입력에서는 생략된 컨텍스트 본문이 파싱된 patch hunk에 포함되어 있지 않기 때문에, 펼치기 버튼 없이 해당 행만 표시될 수 있습니다. 이는 예상된 동작입니다.
- `expandUnchanged`는 펼칠 수 있는 컨텍스트가 존재할 때만 적용됩니다.

## 플러그인 기본값

플러그인 전역 기본값은 `~/.openclaw/openclaw.json`에서 설정합니다:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

지원되는 기본값:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

명시적으로 지정한 도구 매개변수는 이러한 기본값을 덮어씁니다.

## 보안 설정

- `security.allowRemoteViewer` (`boolean`, 기본값 `false`)
  - `false`: 뷰어 라우트에 대한 loopback 이외 요청은 거부됩니다.
  - `true`: 토큰화된 경로가 유효하면 원격 뷰어 접근이 허용됩니다.

예시:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## 아티팩트 수명 주기와 저장소

- 아티팩트는 임시 하위 폴더 `$TMPDIR/openclaw-diffs` 아래에 저장됩니다.
- 뷰어 아티팩트 메타데이터에는 다음이 포함됩니다:
  - 무작위 아티팩트 ID(20자리 16진수)
  - 무작위 토큰(48자리 16진수)
  - `createdAt` 및 `expiresAt`
  - 저장된 `viewer.html` 경로
- 지정하지 않으면 기본 뷰어 TTL은 30분입니다.
- 허용되는 최대 뷰어 TTL은 6시간입니다.
- 아티팩트 생성 후 정리는 기회가 있을 때마다 실행됩니다.
- 만료된 아티팩트는 삭제됩니다.
- 메타데이터가 없을 때는 24시간보다 오래된 폴더를 제거하는 fallback 정리가 수행됩니다.

## 뷰어 URL 및 네트워크 동작

뷰어 라우트:

- `/plugins/diffs/view/{artifactId}/{token}`

뷰어 에셋:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

URL 구성 동작:

- `baseUrl`이 제공되면 엄격한 유효성 검사를 거친 뒤 사용됩니다.
- `baseUrl`이 없으면 뷰어 URL은 기본적으로 loopback `127.0.0.1`을 사용합니다.
- 게이트웨이 바인드 모드가 `custom`이고 `gateway.customBindHost`가 설정되어 있으면 해당 호스트가 사용됩니다.

`baseUrl` 규칙:

- `http://` 또는 `https://`여야 합니다.
- Query와 hash는 거부됩니다.
- origin과 선택적 base path만 허용됩니다.

## 보안 모델

뷰어 하드닝:

- 기본적으로 loopback 전용입니다.
- 엄격한 ID 및 토큰 검증이 적용된 토큰화 뷰어 경로를 사용합니다.
- 뷰어 응답 CSP:
  - `default-src 'none'`
  - 스크립트와 에셋은 self에서만 허용
  - 외부로 나가는 `connect-src` 없음
- 원격 접근이 활성화되어 있을 때 원격 miss throttling 적용:
  - 60초당 실패 40회
  - 60초 잠금 (`429 Too Many Requests`)

파일 렌더링 하드닝:

- 스크린샷 브라우저 요청 라우팅은 기본 거부(deny-by-default)입니다.
- `http://127.0.0.1/plugins/diffs/assets/*`의 로컬 뷰어 에셋만 허용됩니다.
- 외부 네트워크 요청은 차단됩니다.

## 파일 모드용 브라우저 요구 사항

`mode: "file"`과 `mode: "both"`에는 Chromium 호환 브라우저가 필요합니다.

해결 순서:

1. OpenClaw config의 `browser.executablePath`
2. 환경 변수:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. 플랫폼 명령/경로 탐색 fallback

일반적인 실패 메시지:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome, Chromium, Edge, Brave를 설치하거나 위 실행 파일 경로 옵션 중 하나를 설정해 해결할 수 있습니다.

## 문제 해결

입력 유효성 검사 오류:

- `Provide patch or both before and after text.`
  - `before`와 `after`를 모두 포함하거나 `patch`를 제공합니다.
- `Provide either patch or before/after input, not both.`
  - 입력 모드를 섞지 마십시오.
- `Invalid baseUrl: ...`
  - query/hash 없이 선택적 path를 포함한 `http(s)` origin을 사용합니다.
- `{field} exceeds maximum size (...)`
  - payload 크기를 줄이십시오.
- Large patch rejection
  - patch 파일 수 또는 총 줄 수를 줄이십시오.

뷰어 접근성 문제:

- 뷰어 URL은 기본적으로 `127.0.0.1`로 해석됩니다.
- 원격 접근 시나리오에서는 다음 중 하나를 사용합니다:
  - 각 도구 호출마다 `baseUrl`을 전달하거나
  - `gateway.bind=custom`과 `gateway.customBindHost`를 사용합니다
- 외부 뷰어 접근이 실제로 필요할 때만 `security.allowRemoteViewer`를 활성화하십시오.

변경 없음 행에 펼치기 버튼이 없음:

- patch 입력에서, patch가 펼칠 수 있는 컨텍스트를 담고 있지 않으면 이런 일이 발생할 수 있습니다.
- 이는 예상된 동작이며 뷰어 실패를 의미하지 않습니다.

아티팩트를 찾을 수 없음:

- TTL 만료로 인해 아티팩트가 만료되었습니다.
- 토큰 또는 경로가 변경되었습니다.
- 정리 작업이 오래된 데이터를 제거했습니다.

## 운영 가이드

- 로컬에서 캔버스로 상호작용형 검토를 할 때는 `mode: "view"`를 우선 사용하십시오.
- 첨부 파일이 필요한 외부 채팅 채널에는 `mode: "file"`을 우선 사용하십시오.
- 배포 환경에서 원격 뷰어 URL이 필요한 경우가 아니면 `allowRemoteViewer`는 비활성화 상태로 유지하십시오.
- 민감한 diff에는 명시적으로 짧은 `ttlSeconds`를 설정하십시오.
- 꼭 필요하지 않다면 diff 입력에 비밀 정보를 넣지 마십시오.
- 채널이 이미지를 과하게 압축하는 경우(예: Telegram, WhatsApp)에는 PDF 출력(`fileFormat: "pdf"`)을 우선 사용하십시오.

Diff 렌더링 엔진:

- [Diffs](https://diffs.com) 기반입니다.

## 관련 문서

- [도구 개요](/tools)
- [플러그인](/tools/plugin)
- [브라우저](/tools/browser)
