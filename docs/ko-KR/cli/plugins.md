---
summary: "CLI reference for `openclaw plugins` (list, install, uninstall, enable/disable, doctor)"
description: "Gateway process 안에서 동작하는 plugin의 설치, 활성화, 제거, 업데이트, 진단 흐름을 `openclaw plugins` 기준으로 설명합니다."
read_when:
  - in-process Gateway plugin을 설치하거나 관리할 때
  - plugin load failure를 디버깅할 때
title: "plugins"
x-i18n:
  source_path: "cli/plugins.md"
---

# `openclaw plugins`

Gateway plugin과 extension을 관리합니다. (in-process 로드)

Related:

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

bundled plugin은 OpenClaw와 함께 제공되지만 기본적으로 비활성화되어 있습니다.
활성화하려면 `plugins enable`을 사용하세요.

모든 plugin은 inline JSON Schema(`configSchema`, 비어 있어도 포함)를 가진 `openclaw.plugin.json` 파일을 제공해야 합니다.
manifest 또는 schema가 누락되거나 유효하지 않으면 plugin load가 차단되고 config validation이 실패합니다.

### Install

```bash
openclaw plugins install <path-or-spec>
openclaw plugins install <npm-spec> --pin
```

보안 참고: plugin install은 code를 실행하는 것처럼 취급하세요. 가능하면 pinned version을 사용하세요.

npm spec은 **registry-only**입니다. (package name + 선택적 **exact version** 또는 **dist-tag**)
Git/URL/file spec과 semver range는 거부됩니다. dependency install은 안전을 위해 `--ignore-scripts`로 실행됩니다.

bare spec과 `@latest`는 stable track을 유지합니다. npm이 둘 중 하나를 prerelease로 resolve하면,
OpenClaw는 설치를 멈추고 `@beta`/`@rc` 같은 prerelease tag 또는 `@1.2.3-beta.4` 같은 exact prerelease version으로 명시적 opt-in을 요구합니다.

bare install spec이 bundled plugin id와 일치하면(예: `diffs`), OpenClaw는 bundled plugin을 직접 설치합니다.
동일한 이름의 npm package를 설치하려면 scoped spec을 사용하세요. (예: `@scope/diffs`)

지원 archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`

local directory를 복사하지 않고 참조하려면 `--link`를 사용합니다. (`plugins.load.paths`에 추가)

```bash
openclaw plugins install -l ./my-plugin
```

npm install에 `--pin`을 쓰면 기본 동작은 unpinned로 유지하면서, resolved exact spec(`name@version`)을
`plugins.installs`에 저장합니다.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`은 `plugins.entries`, `plugins.installs`, plugin allowlist, 그리고 해당하는 linked `plugins.load.paths` entry를 제거합니다.
활성 memory plugin을 제거하면 memory slot은 `memory-core`로 되돌아갑니다.

기본적으로 uninstall은 active state dir의 extension root(`$OPENCLAW_STATE_DIR/extensions/<id>`) 아래 install directory도 삭제합니다.
파일을 디스크에 남기려면 `--keep-files`를 사용하세요.

`--keep-config`는 deprecated alias로 계속 지원됩니다.

### Update

```bash
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update <id> --dry-run
```

update는 npm에서 설치된 plugin(`plugins.installs`에 추적되는 항목)에만 적용됩니다.

저장된 integrity hash가 있고 새 artifact hash가 달라지면, OpenClaw는 경고를 출력하고 계속 진행할지 확인을 요청합니다.
CI나 non-interactive 환경에서는 전역 `--yes`로 prompt를 건너뛸 수 있습니다.
