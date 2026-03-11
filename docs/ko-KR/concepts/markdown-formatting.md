---
summary: "아웃바운드 채널용 Markdown 포맷팅 파이프라인"
read_when:
  - 아웃바운드 채널의 markdown formatting 또는 chunking 을 바꿀 때
  - 새 채널 formatter 나 style mapping 을 추가할 때
  - 채널 간 formatting regression 을 디버깅할 때
title: "Markdown Formatting"
---

# Markdown formatting

OpenClaw 는 outbound Markdown 을 채널별 출력으로 렌더링하기 전에 공통 intermediate representation (IR) 으로 변환합니다. 이 IR 은 source text 를 그대로 유지하면서 style/link span 을 함께 들고 다니므로, 채널 간 chunking 과 rendering 이 일관되게 유지됩니다.

## 목표

- **Consistency:** 한 번 파싱하고, 여러 renderer 사용
- **Safe chunking:** inline formatting 이 chunk 사이에서 깨지지 않도록 렌더링 전에 텍스트를 분할
- **Channel fit:** 같은 IR 을 Slack mrkdwn, Telegram HTML, Signal style range 로 다시 파싱 없이 매핑

## Pipeline

1. **Parse Markdown -> IR**
   - IR 은 plain text 와 style span (bold/italic/strike/code/spoiler), link span 으로 구성됩니다.
   - offset 은 UTF-16 code unit 기준이므로 Signal style range 와 API 가 맞춰집니다.
   - table 은 채널이 table conversion 을 opt in 한 경우에만 파싱됩니다.
2. **Chunk IR (format-first)**
   - chunking 은 렌더링 전에 IR text 에 대해 수행됩니다.
   - inline formatting 은 chunk 사이에서 나뉘지 않으며, span 은 chunk 별로 분할됩니다.
3. **Render per channel**
   - **Slack:** mrkdwn 토큰 (bold/italic/strike/code), 링크는 `<url|label>`
   - **Telegram:** HTML 태그 (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`)
   - **Signal:** plain text + `text-style` range; label 이 URL 과 다를 때 링크는 `label (url)` 로 렌더링

## IR example

입력 Markdown:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (개략):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## 사용 위치

- Slack, Telegram, Signal 아웃바운드 어댑터는 IR 에서 렌더링합니다.
- 다른 채널(WhatsApp, iMessage, MS Teams, Discord)은 여전히 plain text 또는 자체 formatting 규칙을 사용하며, Markdown table conversion 이 활성화된 경우 chunking 전에 적용됩니다.

## Table handling

Markdown table 은 채팅 클라이언트 간 지원이 일관되지 않습니다. 채널별(및 계정별) conversion 제어에는 `markdown.tables` 를 사용하세요.

- `code`: table 을 code block 으로 렌더링 (대부분 채널의 기본값)
- `bullets`: 각 행을 bullet point 로 변환 (Signal + WhatsApp 기본값)
- `off`: table 파싱과 conversion 을 비활성화하고 raw table text 를 그대로 전달

Config key:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Chunking rules

- chunk 한계는 channel adapter/config 에서 오며 IR text 에 적용됩니다.
- code fence 는 채널이 올바르게 렌더링하도록 trailing newline 과 함께 하나의 block 으로 보존됩니다.
- list prefix 와 blockquote prefix 는 IR text 의 일부이므로, chunking 이 prefix 중간을 자르지 않습니다.
- inline style (bold/italic/strike/inline-code/spoiler)은 chunk 사이에서 절대 나뉘지 않으며, renderer 가 각 chunk 안에서 style 을 다시 엽니다.

채널 간 chunking 동작에 대해 더 알고 싶으면 [Streaming + chunking](/concepts/streaming) 을 참고하세요.

## Link policy

- **Slack:** `[label](url)` -> `<url|label>`; bare URL 은 그대로 유지. parse 중 autolink 는 이중 링크를 피하기 위해 비활성화
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML parse mode)
- **Signal:** `[label](url)` -> `label (url)` 단, label 이 URL 과 같으면 예외

## Spoilers

spoiler marker (`||spoiler||`)는 Signal 에서만 파싱되며 SPOILER style range 로 매핑됩니다. 다른 채널은 이를 plain text 로 취급합니다.

## 채널 formatter 를 추가하거나 업데이트하는 방법

1. **한 번만 파싱:** 채널에 맞는 옵션(autolink, heading style, blockquote prefix)으로 공용 `markdownToIR(...)` helper 사용
2. **렌더링:** `renderMarkdownWithMarkers(...)` 와 style marker map (또는 Signal style range)을 사용해 renderer 구현
3. **Chunk:** 렌더링 전에 `chunkMarkdownIR(...)` 를 호출하고 각 chunk 를 렌더링
4. **Adapter 연결:** channel outbound adapter 가 새 chunker 와 renderer 를 사용하도록 업데이트
5. **Test:** format test 와, 채널이 chunking 을 사용한다면 outbound delivery test 도 추가/수정

## 흔한 함정

- Slack angle-bracket token (`<@U123>`, `<#C123>`, `<https://...>`)은 보존해야 하며 raw HTML 은 안전하게 escape 해야 함
- Telegram HTML 은 broken markup 을 피하기 위해 태그 밖 텍스트를 escape 해야 함
- Signal style range 는 UTF-16 offset 에 의존하므로 code point offset 을 쓰면 안 됨
- fenced code block 은 closing marker 가 자기 줄에 오도록 trailing newline 을 보존해야 함
