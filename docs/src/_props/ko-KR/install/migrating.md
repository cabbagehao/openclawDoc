---
summary: "OpenClaw 설치를 한 머신에서 다른 머신으로 옮기기(마이그레이션)"
read_when:
  - OpenClaw를 새 노트북/서버로 옮기고 있습니다
  - 세션, 인증, 채널 로그인(WhatsApp 등)을 유지하고 싶습니다
title: "마이그레이션 가이드"
---

# OpenClaw를 새 머신으로 마이그레이션하기

이 가이드는 **온보딩을 다시 하지 않고** OpenClaw Gateway를 한 머신에서 다른 머신으로 옮기는 방법을 설명합니다.

개념적으로는 간단합니다.

* **상태 디렉터리**(`$OPENCLAW_STATE_DIR`, 기본값: `~/.openclaw/`)를 복사합니다. 여기에는 설정, 인증, 세션, 채널 상태가 들어 있습니다.
* **워크스페이스**(기본값 `~/.openclaw/workspace/`)를 복사합니다. 여기에는 에이전트 파일(memory, prompts 등)이 들어 있습니다.

하지만 **프로필**, **권한**, **불완전한 복사**에서 자주 문제가 생깁니다.

## 시작하기 전에(무엇을 옮기는지)

### 1) 상태 디렉터리 확인

대부분의 설치는 기본값을 사용합니다.

* **상태 디렉터리:** `~/.openclaw/`

하지만 다음을 사용하면 달라질 수 있습니다.

* `--profile <name>` (보통 `~/.openclaw-<profile>/`가 됨)
* `OPENCLAW_STATE_DIR=/some/path`

확실하지 않다면 **기존** 머신에서 다음을 실행하세요:

```bash
openclaw status
```

출력에서 `OPENCLAW_STATE_DIR` / profile 관련 내용을 찾으세요. 여러 게이트웨이를 돌리고 있다면 각 프로필마다 반복하세요.

### 2) 워크스페이스 확인

흔한 기본값:

* `~/.openclaw/workspace/` (권장 워크스페이스)
* 직접 만든 사용자 지정 폴더

워크스페이스는 `MEMORY.md`, `USER.md`, `memory/*.md` 같은 파일이 있는 위치입니다.

### 3) 무엇이 보존되는지 이해하기

**상태 디렉터리와 워크스페이스를 둘 다** 복사하면 다음이 유지됩니다.

* 게이트웨이 설정 (`openclaw.json`)
* 인증 프로필 / API 키 / OAuth 토큰
* 세션 기록 + 에이전트 상태
* 채널 상태(예: WhatsApp 로그인/세션)
* 워크스페이스 파일(memory, skills notes 등)

**워크스페이스만** 복사하면(예: Git으로):

* 세션
* 자격 증명
* 채널 로그인

은 보존되지 않습니다.

이 정보들은 `$OPENCLAW_STATE_DIR` 아래에 있습니다.

## 마이그레이션 단계(권장)

### Step 0 — 백업 만들기(기존 머신)

**기존** 머신에서 먼저 게이트웨이를 중지해 복사 중 파일이 바뀌지 않도록 하세요:

```bash
openclaw gateway stop
```

(선택 사항이지만 권장) 상태 디렉터리와 워크스페이스를 아카이브합니다:

```bash
# Adjust paths if you use a profile or custom locations
cd ~
tar -czf openclaw-state.tgz .openclaw

tar -czf openclaw-workspace.tgz .openclaw/workspace
```

여러 프로필/상태 디렉터리(예: `~/.openclaw-main`, `~/.openclaw-work`)가 있으면 각각 아카이브하세요.

### Step 1 — 새 머신에 OpenClaw 설치

**새** 머신에서 CLI를 설치하세요(Node가 필요하면 함께 설치):

* 참고: [설치](/install)

이 단계에서는 온보딩으로 새 `~/.openclaw/`가 생겨도 괜찮습니다. 다음 단계에서 덮어쓸 예정입니다.

### Step 2 — 상태 디렉터리 + 워크스페이스를 새 머신으로 복사

다음 **둘 다** 복사하세요.

* `$OPENCLAW_STATE_DIR` (기본값 `~/.openclaw/`)
* 워크스페이스 (기본값 `~/.openclaw/workspace/`)

일반적인 방법:

* tarball을 `scp`로 옮겨 풀기
* SSH 위에서 `rsync -a`
* 외장 드라이브

복사 후 다음을 확인하세요.

* 숨김 디렉터리(예: `.openclaw/`)가 포함되었는가
* 파일 소유권이 게이트웨이를 실행하는 사용자에게 맞는가

### Step 3 — Doctor 실행(마이그레이션 + 서비스 복구)

**새** 머신에서:

```bash
openclaw doctor
```

Doctor는 "안전하고 지루한" 명령입니다. 서비스를 복구하고, 설정 마이그레이션을 적용하며, 불일치를 경고합니다.

그다음:

```bash
openclaw gateway restart
openclaw status
```

## 자주 걸리는 함정(피하는 방법)

### 함정: profile / state-dir 불일치

기존 게이트웨이를 profile(또는 `OPENCLAW_STATE_DIR`)로 실행했는데 새 게이트웨이는 다른 값을 사용하면 다음 증상이 나타납니다.

* 설정 변경이 적용되지 않음
* 채널이 사라졌거나 로그아웃됨
* 세션 기록이 비어 있음

해결: 마이그레이션한 **동일한** profile/state dir로 게이트웨이/서비스를 실행한 뒤 다시 실행하세요:

```bash
openclaw doctor
```

### 함정: `openclaw.json`만 복사함

`openclaw.json`만으로는 충분하지 않습니다. 많은 프로바이더는 상태를 다음 경로들에 저장합니다.

* `$OPENCLAW_STATE_DIR/credentials/`
* `$OPENCLAW_STATE_DIR/agents/<agentId>/...`

항상 `$OPENCLAW_STATE_DIR` 전체 폴더를 옮기세요.

### 함정: 권한 / 소유권

root로 복사했거나 사용자가 바뀌었다면, 게이트웨이가 자격 증명/세션을 읽지 못할 수 있습니다.

해결: 상태 디렉터리와 워크스페이스가 게이트웨이를 실행하는 사용자 소유인지 확인하세요.

### 함정: remote/local 모드 사이 이동

* UI(WebUI/TUI)가 **원격** 게이트웨이를 가리키고 있다면 세션 저장소와 워크스페이스는 원격 호스트 쪽에 있습니다.
* 노트북만 옮긴다고 원격 게이트웨이 상태가 이동하지는 않습니다.

원격 모드라면 **게이트웨이 호스트**를 마이그레이션해야 합니다.

### 함정: 백업에 포함된 비밀 정보

`$OPENCLAW_STATE_DIR`에는 비밀 정보(API 키, OAuth 토큰, WhatsApp 자격 증명)가 들어 있습니다. 백업을 프로덕션 시크릿처럼 다루세요:

* 암호화해서 저장
* 안전하지 않은 채널 공유 금지
* 노출이 의심되면 키 회전

## 검증 체크리스트

새 머신에서 다음을 확인하세요.

* `openclaw status`가 게이트웨이 실행 중으로 표시함
* 채널이 여전히 연결되어 있음(예: WhatsApp 재페어링이 필요 없음)
* 대시보드가 열리고 기존 세션이 보임
* 워크스페이스 파일(memory, configs)이 존재함

## 관련 문서

* [Doctor](/gateway/doctor)
* [Gateway troubleshooting](/gateway/troubleshooting)
* [OpenClaw는 데이터를 어디에 저장하나요?](/help/faq#where-does-openclaw-store-its-data)
