---
summary: "WKWebView + 사용자 정의 URL 스킴으로 임베드된 에이전트 제어 Canvas 패널"
read_when:
  - macOS Canvas 패널을 구현할 때
  - 시각적 워크스페이스용 에이전트 컨트롤을 추가할 때
  - WKWebView Canvas 로드를 디버깅할 때
title: "Canvas"
---

# Canvas (macOS 앱)

macOS 앱은 `WKWebView`를 사용해 에이전트가 제어하는 **Canvas 패널**을
임베드합니다. 이것은 HTML/CSS/JS, A2UI, 그리고 작은 대화형 UI 표면을 위한
가벼운 시각적 워크스페이스입니다.

## Canvas가 위치하는 곳

Canvas 상태는 Application Support 아래에 저장됩니다.

* `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas 패널은 **사용자 정의 URL 스킴**을 통해 해당 파일을 제공합니다.

* `openclaw-canvas://<session>/<path>`

예시:

* `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
* `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
* `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

루트에 `index.html`이 없으면 앱은 **내장 스캐폴드 페이지**를 표시합니다.

## 패널 동작

* 메뉴 막대 근처(또는 마우스 커서 근처)에 고정되는 테두리 없는 크기 조절 가능 패널입니다.
* 세션별로 크기와 위치를 기억합니다.
* 로컬 Canvas 파일이 변경되면 자동으로 다시 로드합니다.
* 한 번에 하나의 Canvas 패널만 표시됩니다(필요에 따라 세션이 전환됨).

Canvas는 Settings → **Allow Canvas**에서 비활성화할 수 있습니다. 비활성화되면
canvas 노드 명령은 `CANVAS_DISABLED`를 반환합니다.

## 에이전트 API 표면

Canvas는 **Gateway WebSocket**을 통해 노출되므로 에이전트는 다음을 수행할 수
있습니다.

* 패널 표시/숨기기
* 경로 또는 URL로 이동
* JavaScript 평가
* 스냅샷 이미지 캡처

CLI 예시:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

참고:

* `canvas.navigate`는 **로컬 Canvas 경로**, `http(s)` URL, `file://` URL을 받습니다.
* `"/"`를 전달하면 Canvas는 로컬 스캐폴드 또는 `index.html`을 표시합니다.

## Canvas의 A2UI

A2UI는 Gateway Canvas 호스트에서 호스팅되며 Canvas 패널 안에서 렌더링됩니다.
Gateway가 Canvas 호스트를 광고하면 macOS 앱은 처음 열 때 자동으로 A2UI 호스트
페이지로 이동합니다.

기본 A2UI 호스트 URL:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI 명령 (v0.8)

Canvas는 현재 **A2UI v0.8** 서버→클라이언트 메시지를 받습니다.

* `beginRendering`
* `surfaceUpdate`
* `dataModelUpdate`
* `deleteSurface`

`createSurface` (v0.9)는 지원되지 않습니다.

CLI 예시:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

빠른 스모크 테스트:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Canvas에서 에이전트 실행 트리거하기

Canvas는 딥 링크를 통해 새로운 에이전트 실행을 트리거할 수 있습니다.

* `openclaw://agent?...`

예시 (JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

유효한 키가 제공되지 않으면 앱은 확인을 요청합니다.

## 보안 참고 사항

* Canvas 스킴은 디렉터리 트래버설을 차단하며 파일은 세션 루트 아래에 있어야 합니다.
* 로컬 Canvas 콘텐츠는 사용자 정의 스킴을 사용합니다(루프백 서버 불필요).
* 외부 `http(s)` URL은 명시적으로 이동한 경우에만 허용됩니다.
