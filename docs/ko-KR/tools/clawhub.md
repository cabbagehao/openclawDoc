---
title: "ClawHub"
description: "ClawHub에서 OpenClaw skill을 검색, 설치, publish, sync하는 CLI와 공개 registry 동작을 설명합니다."
summary: "ClawHub 가이드: public skill registry + CLI workflow"
read_when:
  - 새 사용자에게 ClawHub를 소개할 때
  - skill을 설치, 검색, publish할 때
  - ClawHub CLI flag와 sync 동작을 설명할 때
x-i18n:
  source_path: "tools/clawhub.md"
---

# ClawHub

ClawHub는 **OpenClaw용 public skill registry**입니다. 무료 서비스이며, 모든 skill은 공개되어 있고 누구나 볼 수 있으며, 공유와 재사용을 위해 열려 있습니다. skill은 본질적으로 `SKILL.md` 파일(필요하면 보조 텍스트 파일 포함)이 들어 있는 폴더일 뿐입니다. 웹 앱에서 skill을 둘러보거나 CLI로 search, install, update, publish를 할 수 있습니다.

사이트: [clawhub.ai](https://clawhub.ai)

## What ClawHub is

- OpenClaw skill용 public registry
- versioned skill bundle 및 metadata 저장소
- search, tag, usage signal을 위한 discovery surface

## How it works

1. 사용자가 skill bundle(file + metadata)을 publish
2. ClawHub가 bundle을 저장하고 metadata를 파싱한 뒤 version 부여
3. registry가 skill을 search/discovery용으로 색인
4. 사용자가 skill을 탐색, 다운로드, 설치

## What you can do

- 새 skill과 기존 skill의 새 version publish
- 이름, tag, search로 skill 발견
- skill bundle을 다운로드하고 파일 내용 점검
- 남용되거나 위험한 skill 신고
- moderator라면 hide, unhide, delete, ban 가능

## Who this is for (beginner-friendly)

OpenClaw agent에 새 능력을 추가하고 싶다면, ClawHub가 skill을 찾고 설치하는 가장 쉬운 방법입니다. backend가 어떻게 동작하는지 알 필요는 없습니다. 할 수 있는 일:

- 자연어로 skill 검색
- workspace에 skill 설치
- 나중에 한 명령으로 skill 업데이트
- 자신의 skill을 publish해서 백업

## Quick start (non-technical)

1. CLI 설치(다음 섹션 참고)
2. 필요한 것을 검색:
   - `clawhub search "calendar"`
3. skill 설치:
   - `clawhub install <skill-slug>`
4. 새 OpenClaw session을 시작해 새 skill을 반영

## Install the CLI

하나를 선택:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## How it fits into OpenClaw

기본적으로 CLI는 현재 working directory 아래의 `./skills`에 skill을 설치합니다. OpenClaw workspace가 설정되어 있으면 `clawhub`는 `--workdir`(또는 `CLAWHUB_WORKDIR`)로 override 하지 않는 한 그 workspace를 fallback으로 사용합니다. OpenClaw는 `<workspace>/skills`에서 workspace skill을 로드하며 **다음 session**에서 이를 반영합니다. 이미 `~/.openclaw/skills` 또는 bundled skill을 사용 중이라면 workspace skill이 우선합니다.

skill이 로드, 공유, gate 되는 방식의 상세 내용은 [Skills](/tools/skills)를 참고하세요.

## Skill system overview

skill은 OpenClaw에 특정 작업을 수행하는 방법을 가르치는 versioned file bundle입니다. publish할 때마다 새 version이 만들어지고, registry는 version history를 유지해 사용자가 변경 이력을 감사할 수 있습니다.

일반적인 skill 구성:

- 핵심 설명과 사용법이 담긴 `SKILL.md`
- skill에서 사용하는 선택적 config, script, 보조 파일
- tag, summary, install requirement 같은 metadata

ClawHub는 metadata를 사용해 discovery를 강화하고 skill capability를 안전하게 노출합니다. 또한 ranking과 visibility를 개선하기 위해 star, download 같은 usage signal도 추적합니다.

## What the service provides (features)

- skill과 `SKILL.md` 내용의 **public browsing**
- keyword만이 아니라 embedding(vector search) 기반 **search**
- semver, changelog, tag(`latest` 포함)를 가진 **versioning**
- version별 zip **download**
- community feedback용 **star와 comment**
- approval 및 audit을 위한 **moderation hook**
- 자동화와 scripting을 위한 **CLI-friendly API**

## Security and moderation

ClawHub는 기본적으로 열려 있습니다. 누구나 skill을 업로드할 수 있지만, publish하려면 GitHub account가 최소 1주일 이상 되어야 합니다. 이는 정상 기여자를 막지 않으면서 남용을 늦추기 위한 장치입니다.

신고 및 moderation:

- 로그인한 사용자는 누구나 skill을 신고 가능
- 신고 사유는 필수이며 기록됨
- 사용자당 동시에 활성화할 수 있는 신고는 최대 20개
- 고유 신고가 3건을 넘으면 skill은 기본적으로 자동 hide
- moderator는 hidden skill을 보고, unhide, delete, user ban 가능
- 신고 기능 남용은 account ban으로 이어질 수 있음

moderator가 되고 싶다면 OpenClaw Discord에서 moderator나 maintainer에게 문의하세요.

## CLI commands and parameters

전역 옵션(모든 명령에 적용):

- `--workdir <dir>`: working directory (기본값: current dir, OpenClaw workspace로 fallback)
- `--dir <dir>`: skills 디렉터리(workdir 기준, 기본값: `skills`)
- `--site <url>`: site base URL(browser login)
- `--registry <url>`: registry API base URL
- `--no-input`: prompt 비활성(non-interactive)
- `-V, --cli-version`: CLI version 출력

인증:

- `clawhub login` (browser flow) 또는 `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

옵션:

- `--token <token>`: API token 직접 입력
- `--label <label>`: browser login token에 저장할 label(기본값: `CLI token`)
- `--no-browser`: browser를 열지 않음(`--token` 필요)

Search:

- `clawhub search "query"`
- `--limit <n>`: 최대 결과 수

Install:

- `clawhub install <slug>`
- `--version <version>`: 특정 version 설치
- `--force`: 폴더가 이미 있으면 덮어쓰기

Update:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: 특정 version으로 업데이트(단일 slug만 가능)
- `--force`: 로컬 파일이 publish된 어떤 version과도 일치하지 않을 때 덮어쓰기

List:

- `clawhub list` (`.clawhub/lock.json` 읽음)

Publish:

- `clawhub publish <path>`
- `--slug <slug>`: skill slug
- `--name <name>`: display name
- `--version <version>`: semver version
- `--changelog <text>`: changelog 텍스트(비워도 됨)
- `--tags <tags>`: 쉼표 구분 tag(기본값: `latest`)

Delete/undelete (owner/admin only):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sync (로컬 skill scan + 신규/업데이트 publish):

- `clawhub sync`
- `--root <dir...>`: 추가 scan root
- `--all`: prompt 없이 전부 업로드
- `--dry-run`: 업로드될 내용을 보여주기만 함
- `--bump <type>`: 업데이트 시 `patch|minor|major` (기본값 `patch`)
- `--changelog <text>`: non-interactive update용 changelog
- `--tags <tags>`: 쉼표 구분 tag(기본값 `latest`)
- `--concurrency <n>`: registry check concurrency(기본값 4)

## Common workflows for agents

### Search for skills

```bash
clawhub search "postgres backups"
```

### Download new skills

```bash
clawhub install my-skill-pack
```

### Update installed skills

```bash
clawhub update --all
```

### Back up your skills (publish or sync)

단일 skill folder:

```bash
clawhub publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

여러 skill을 한 번에 scan하고 백업:

```bash
clawhub sync --all
```

## Advanced details (technical)

### Versioning and tags

- 각 publish는 새 **semver** `SkillVersion`을 만듭니다.
- `latest` 같은 tag는 특정 version을 가리키며, tag를 이동시켜 rollback 할 수 있습니다.
- changelog는 version별로 붙으며, sync나 update publish에서는 비워 둘 수도 있습니다.

### Local changes vs registry versions

update는 content hash를 사용해 로컬 skill 내용과 registry version을 비교합니다. 로컬 파일이 publish된 어떤 version과도 일치하지 않으면, CLI는 덮어쓰기 전에 묻거나(non-interactive에서는 `--force` 요구) 중단합니다.

### Sync scanning and fallback roots

`clawhub sync`는 먼저 현재 workdir를 scan합니다. skill을 찾지 못하면 `~/openclaw/skills`, `~/.openclaw/skills` 같은 알려진 legacy 위치를 fallback으로 scan합니다. 추가 flag 없이도 오래된 skill 설치를 찾기 위한 동작입니다.

### Storage and lockfile

- 설치된 skill은 workdir 아래 `.clawhub/lock.json`에 기록됩니다.
- auth token은 ClawHub CLI config file에 저장됩니다(`CLAWHUB_CONFIG_PATH`로 override 가능).

### Telemetry (install counts)

로그인한 상태에서 `clawhub sync`를 실행하면, CLI는 install count 계산을 위한 최소한의 snapshot을 전송합니다. 완전히 끄고 싶다면:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Environment variables

- `CLAWHUB_SITE`: site URL override
- `CLAWHUB_REGISTRY`: registry API URL override
- `CLAWHUB_CONFIG_PATH`: CLI token/config 저장 위치 override
- `CLAWHUB_WORKDIR`: 기본 workdir override
- `CLAWHUB_DISABLE_TELEMETRY=1`: `sync` telemetry 비활성화
