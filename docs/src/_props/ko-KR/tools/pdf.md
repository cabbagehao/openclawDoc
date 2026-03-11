---
title: "PDF Tool"
summary: "native provider 지원과 extraction fallback으로 하나 이상의 PDF 문서를 분석"
read_when:
  - agent에서 PDF를 분석하고 싶을 때
  - pdf tool의 정확한 파라미터와 한도가 필요할 때
  - native PDF mode와 extraction fallback을 디버깅할 때
---

# PDF tool

`pdf`는 하나 이상의 PDF 문서를 분석하고 텍스트를 반환합니다.

빠른 동작 요약:

* Anthropic 및 Google model provider에서는 native provider mode 사용
* 그 외 provider는 extraction fallback mode 사용(먼저 텍스트 추출, 필요 시 page image 사용)
* 단일 입력(`pdf`) 또는 다중 입력(`pdfs`)을 지원하며, 호출당 최대 10개 PDF 가능

## Availability

이 tool은 OpenClaw가 해당 agent에 대해 PDF 처리 가능한 model config를 해석할 수 있을 때만 등록됩니다.

1. `agents.defaults.pdfModel`
2. fallback: `agents.defaults.imageModel`
3. fallback: 사용 가능한 auth를 바탕으로 한 best-effort provider 기본값

사용 가능한 model을 해석하지 못하면 `pdf` tool은 노출되지 않습니다.

## Input reference

* `pdf` (`string`): 하나의 PDF path 또는 URL
* `pdfs` (`string[]`): 여러 PDF path 또는 URL, 총 최대 10개
* `prompt` (`string`): 분석 프롬프트, 기본값 `Analyze this PDF document.`
* `pages` (`string`): `1-5`, `1,3,7-9` 같은 page filter
* `model` (`string`): 선택적 model override (`provider/model`)
* `maxBytesMb` (`number`): PDF당 크기 제한(MB)

입력 참고:

* `pdf`와 `pdfs`는 로드 전에 병합되고 deduplicate 됩니다.
* PDF 입력이 없으면 tool이 오류를 반환합니다.
* `pages`는 1-based page number로 파싱되며, deduplicate 후 정렬되고 설정된 max page에 맞춰 clamp 됩니다.
* `maxBytesMb` 기본값은 `agents.defaults.pdfMaxBytesMb` 또는 `10`입니다.

## Supported PDF references

* 로컬 file path(`~` 확장 포함)
* `file://` URL
* `http://`, `https://` URL

참고:

* 다른 URI scheme(예: `ftp://`)은 `unsupported_pdf_reference`와 함께 거부됩니다.
* sandbox mode에서는 원격 `http(s)` URL이 거부됩니다.
* workspace-only file policy가 활성화되어 있으면 허용된 root 밖의 로컬 file path는 거부됩니다.

## Execution modes

### Native provider mode

native mode는 provider `anthropic`, `google`에서 사용됩니다.
이 mode에서는 raw PDF bytes를 provider API로 직접 보냅니다.

native mode 제한:

* `pages`는 지원되지 않습니다. 설정하면 tool이 오류를 반환합니다.

### Extraction fallback mode

fallback mode는 native가 아닌 provider에서 사용됩니다.

흐름:

1. 선택된 페이지에서 텍스트를 추출합니다(최대 `agents.defaults.pdfMaxPages`, 기본값 `20`)
2. 추출된 텍스트가 `200`자 미만이면 선택된 페이지를 PNG image로 렌더링해 포함합니다.
3. 추출된 내용과 prompt를 선택한 model로 전송합니다.

fallback 세부사항:

* page image 추출은 `4,000,000` 픽셀 예산을 사용합니다.
* 대상 model이 image input을 지원하지 않고 추출 가능한 텍스트도 없으면 tool이 오류를 반환합니다.
* extraction fallback에는 `pdfjs-dist`가 필요하며, image 렌더링에는 `@napi-rs/canvas`도 필요합니다.

## Config

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

전체 필드 설명은 [Configuration Reference](/gateway/configuration-reference)를 참고하세요.

## Output details

tool은 `content[0].text`에 텍스트를, `details`에 구조화된 metadata를 반환합니다.

자주 쓰는 `details` 필드:

* `model`: 해석된 model ref (`provider/model`)
* `native`: native provider mode면 `true`, fallback이면 `false`
* `attempts`: 성공 전 실패했던 fallback 시도 목록

path 필드:

* 단일 PDF 입력: `details.pdf`
* 여러 PDF 입력: `details.pdfs[]` 안의 `pdf` 항목
* sandbox path rewrite metadata(해당 시): `rewrittenFrom`

## Error behavior

* PDF 입력 누락: `pdf required: provide a path or URL to a PDF document`
* PDF가 너무 많음: `details.error = "too_many_pdfs"` 구조화 오류 반환
* 지원하지 않는 reference scheme: `details.error = "unsupported_pdf_reference"`
* native mode에서 `pages` 사용: `pages is not supported with native PDF providers` 오류 발생

## Examples

단일 PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

여러 PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

페이지 필터를 쓰는 fallback model:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```
