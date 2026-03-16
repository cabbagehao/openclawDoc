---
summary: "Markdown formatting pipeline for outbound channels"
description: "공통 IR을 사용해 Markdown을 channel별 출력으로 변환하고 chunking과 style span을 안전하게 유지하는 OpenClaw formatting pipeline을 설명합니다."
read_when:
  - outbound channel의 markdown formatting 또는 chunking을 바꿀 때
  - 새 channel formatter나 style mapping을 추가할 때
  - channel별 formatting regression을 디버깅할 때
title: "Markdown Formatting"
x-i18n:
  source_path: "concepts/markdown-formatting.md"
---

# Markdown formatting

OpenClaw는 outbound Markdown을 channel별 output으로 렌더링하기 전에
공유 intermediate representation (IR)으로 변환합니다.
IR은 source text를 그대로 유지하면서 style/link span을 따로 들고 있으므로,
chunking과 rendering이 channel마다 일관되게 동작할 수 있습니다.

## Goals

- **Consistency:** 한 번 parse하고 여러 renderer가 사용
- **Safe chunking:** inline formatting이 chunk 사이에서 깨지지 않도록 rendering 전에 split
- **Channel fit:** 같은 IR을 다시 parse하지 않고 Slack mrkdwn, Telegram HTML, Signal style range로 매핑

## Pipeline

1. **Parse Markdown -> IR**
   - IR은 plain text와 style span(bold/italic/strike/code/spoiler), link span으로 구성됩니다.
   - offset은 UTF-16 code unit 기준이므로 Signal style range와 맞습니다.
   - table은 해당 channel이 table conversion을 opt-in한 경우에만 parse합니다.
2. **Chunk IR (format-first)**
   - chunking은 rendering 전에 IR text 기준으로 일어납니다.
   - inline formatting은 chunk 사이에서 split되지 않으며, span은 chunk별로 slice됩니다.
3. **Render per channel**
   - **Slack:** mrkdwn token (bold/italic/strike/code), link는 `<url|label>`
   - **Telegram:** HTML tag (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`)
   - **Signal:** plain text + `text-style` range, label이 URL과 다르면 `label (url)`

## IR example

Input Markdown:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (schematic):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Where it is used

- Slack, Telegram, Signal outbound adapter는 IR에서 렌더링합니다.
- 다른 channel(WhatsApp, iMessage, MS Teams, Discord)은 아직 plain text 또는 자체 formatting rule을 사용하고, table conversion이 켜져 있으면 chunking 전에 table conversion을 적용합니다.

## Table handling

Markdown table은 chat client마다 지원이 제각각입니다. `markdown.tables`로 channel별(그리고 account별) conversion을 제어하세요.

- `code`: table을 code block으로 렌더링 (대부분의 channel 기본값)
- `bullets`: row마다 bullet point로 변환 (Signal + WhatsApp 기본값)
- `off`: table parse와 conversion 비활성화, raw table text 그대로 전달

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

- chunk limit은 channel adapter/config에서 오며 IR text에 적용됩니다.
- code fence는 trailing newline을 포함한 단일 block으로 유지되어 channel이 올바르게 렌더링할 수 있습니다.
- list prefix와 blockquote prefix는 IR text 일부이므로 prefix 중간에서 split되지 않습니다.
- inline style(bold/italic/strike/inline-code/spoiler)는 chunk 사이에서 절대 split되지 않으며, renderer가 chunk 안에서 style을 다시 엽니다.

channel별 chunking 동작이 더 필요하면 [Streaming + chunking](/concepts/streaming)을 참고하세요.

## Link policy

- **Slack:** `[label](url)` -> `<url|label>`; bare URL은 그대로 유지. parse 시 autolink를 꺼서 double-linking을 막습니다.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML parse mode)
- **Signal:** `[label](url)` -> label이 URL과 다를 때만 `label (url)`

## Spoilers

spoiler marker(`||spoiler||`)는 Signal에서만 parse되어 SPOILER style range로 매핑됩니다.
다른 channel은 plain text로 취급합니다.

## How to add or update a channel formatter

1. **Parse once:** shared `markdownToIR(...)` helper를 channel별 option(autolink, heading style, blockquote prefix)에 맞춰 사용
2. **Render:** `renderMarkdownWithMarkers(...)`와 style marker map(또는 Signal style range)으로 renderer 구현
3. **Chunk:** rendering 전에 `chunkMarkdownIR(...)` 호출, 각 chunk를 개별 렌더링
4. **Wire adapter:** channel outbound adapter가 새 chunker와 renderer를 사용하도록 연결
5. **Test:** format test와, chunking을 쓰는 channel이면 outbound delivery test도 갱신

## Common gotchas

- Slack angle-bracket token(`<@U123>`, `<#C123>`, `<https://...>`)은 보존되어야 하며, raw HTML은 안전하게 escape해야 합니다.
- Telegram HTML은 tag 바깥 text를 escape하지 않으면 markup이 깨집니다.
- Signal style range는 UTF-16 offset 기준입니다. code point offset을 쓰면 안 됩니다.
- fenced code block은 closing marker가 자기 줄에 오도록 trailing newline을 유지하세요.
