---
summary: "CLI reference for `openclaw plugins` (list, install, uninstall, enable/disable, doctor)"
read_when:
  - in-process Gateway plugins 를 설치하거나 관리하고 싶을 때
  - plugin load 실패를 디버깅하고 싶을 때
title: "plugins"
---

# `openclaw plugins`

Gateway plugins/extensions (in-process 로 로드됨)을 관리합니다.

관련:

- Plugin system: [Plugins](/tools/plugin)
- Plugin manifest + schema: [Plugin manifest](/plugins/manifest)
- Security hardening: [Security](/gateway/security)

## Commands

```bash
openclaw plugins list
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id>
openclaw plugins update --all
```

번들 플러그인은 OpenClaw 와 함께 제공되지만 시작 시 비활성화되어 있습니다. 활성화하려면 `plugins enable` 을 사용하세요.

모든 플러그인은 inline JSON Schema 가 포함된 `openclaw.plugin.json` 파일(`configSchema`, 비어 있어도 필요)을 제공해야 합니다. manifest 나 schema 가 없거나 잘못되면 플러그인이 로드되지 않고 config validation 이 실패합니다.

### Install

```bash
openclaw plugins install <path-or-spec>
openclaw plugins install <npm-spec> --pin
```

보안 메모: plugin 설치는 코드를 실행하는 것과 같습니다. pinned version 을 권장합니다.

Npm spec 은 **registry-only** 입니다(패키지 이름 + 선택적 **정확한 버전** 또는 **dist-tag**). Git/URL/file spec 과 semver range 는 거부됩니다. dependency install 은 안전을 위해 `--ignore-scripts` 로 실행됩니다.

bare spec 과 `@latest` 는 stable track 에 남습니다. npm 이 둘 중 하나를 prerelease 로 해석하면, OpenClaw 는 중단하고 `@beta`/`@rc` 같은 prerelease tag 또는 `@1.2.3-beta.4` 같은 정확한 prerelease version 으로 명시적 opt-in 을 요구합니다.

bare install spec 이 번들 plugin id 와 일치하면(예: `diffs`), OpenClaw 는 번들 플러그인을 직접 설치합니다. 같은 이름의 npm 패키지를 설치하려면 `@scope/diffs` 같은 명시적 scoped spec 을 사용하세요.

지원 archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

로컬 디렉터리를 복사하지 않으려면 `--link` 를 사용하세요(`plugins.load.paths` 에 추가):

```bash
openclaw plugins install -l ./my-plugin
```

npm 설치에서 `--pin` 을 사용하면 기본 동작은 unpinned 로 유지하면서도 `plugins.installs` 에 해석된 정확한 spec (`name@version`)을 저장합니다.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 은 `plugins.entries`, `plugins.installs`, plugin allowlist, 그리고 필요한 경우 linked `plugins.load.paths` 항목에서 plugin 기록을 제거합니다.
활성 memory plugin 의 경우 memory slot 은 `memory-core` 로 리셋됩니다.

기본적으로 uninstall 은 활성 state dir 의 extensions root (`$OPENCLAW_STATE_DIR/extensions/<id>`) 아래 plugin install 디렉터리도 제거합니다. 디스크의 파일을 유지하려면 `--keep-files` 를 사용하세요.

`--keep-config` 는 `--keep-files` 의 deprecated alias 로 지원됩니다.

### Update

```bash
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update <id> --dry-run
```

update 는 npm 에서 설치된 plugin 에만 적용됩니다(`plugins.installs` 에 추적됨).

저장된 integrity hash 가 있고 가져온 artifact hash 가 바뀌면, OpenClaw 는 경고를 출력하고 진행 전에 확인을 요청합니다. CI/non-interactive 환경에서는 전역 `--yes` 로 프롬프트를 우회하세요.
