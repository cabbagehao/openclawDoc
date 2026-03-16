---
summary: "Bun 기반 로컬 개발 workflow와 pnpm 대비 제약을 설명합니다."
description: "OpenClaw 저장소를 Bun으로 설치하고 빌드할 때 필요한 명령, lifecycle script 제약, pnpm과의 차이를 간단히 안내합니다."
read_when:
  - 가장 빠른 local dev loop(Bun + watch)를 활용하고 싶을 때
  - Bun install, patch, lifecycle script 문제를 겪고 있을 때
title: "Bun 설치 (실험적)"
x-i18n:
  source_path: "install/bun.md"
---

# Bun (실험적 기능)

목표: **Bun** runtime으로 이 저장소를 실행하되(선택 사항), 기존 pnpm workflow와 크게 어긋나지 않게 유지하는 것입니다.

⚠️ **주의**: WhatsApp과 Telegram 관련 호환성 이슈가 있으므로 **Gateway runtime으로는 권장하지 않습니다.** production에서는 Node.js를 사용하세요.

## 현재 상태

- Bun은 TypeScript 코드를 직접 실행하기 위한 선택적 local runtime으로 사용할 수 있습니다(`bun run …`, `bun --watch …`).
- 프로젝트 build의 기본 도구는 `pnpm`이며, 일부 docs tooling도 pnpm에 의존하므로 pnpm은 계속 지원됩니다.
- Bun은 `pnpm-lock.yaml`을 사용할 수 없으며 이를 무시합니다.

## 설치 방법

기본 설치 명령어:

```sh
bun install
```

참고: `bun.lock` 또는 `bun.lockb`는 `.gitignore`에 포함되어 있으므로 저장소 상태에 영향을 주지 않습니다. **lockfile 생성을 완전히 막고 싶다면** 다음 명령을 사용하세요.

```sh
bun install --no-save
```

## 빌드 및 테스트 (Bun 활용)

```sh
bun run build
bun run vitest run
```

## Bun 라이프사이클 스크립트 (기본 차단됨)

Bun은 dependency package의 lifecycle script를 기본적으로 차단할 수 있습니다. 명시적으로 신뢰를 주려면 `bun pm trust`를 사용하세요. 현재 이 프로젝트에서 자주 차단되는 스크립트는 필수가 아닙니다.

- **`@whiskeysockets/baileys` (preinstall)**: Node major >= 20인지 확인합니다. OpenClaw는 Node 22+를 요구합니다.
- **`protobufjs` (postinstall)**: 버전 호환성 경고를 출력할 뿐, 실제 build artifact를 만들지 않습니다.

실행 중 실제 문제가 발생해 이 스크립트가 필요하다면 다음처럼 명시적으로 trust를 부여하세요.

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 제약 사항 및 주의점

- 일부 내부 script(예: `docs:build`, `ui:*`, `protocol:check`)에는 여전히 pnpm 명령이 하드코딩되어 있습니다. 이런 작업은 당분간 pnpm으로 실행하는 편이 안전합니다.
