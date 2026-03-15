---
summary: "Bun 워크플로(실험적): 설치 절차 및 pnpm 대비 주요 주의 사항 안내"
read_when:
  - 가장 빠른 로컬 개발 루프(Bun + Watch)를 활용하고자 할 때
  - Bun 설치, 패치 또는 라이프사이클 스크립트 실행 관련 문제를 겪고 있을 때
title: "Bun 설치 (실험적)"
x-i18n:
  source_path: "install/bun.md"
---

# Bun (실험적 기능)

목표: **Bun** 런타임을 사용하여 본 저장소의 코드를 실행함(선택 사항). 기존의 pnpm 워크플로를 해치지 않으면서 빠른 개발 환경을 구축하는 것을 지향함.

⚠️ **주의**: WhatsApp 및 Telegram 채널과의 호환성 이슈(버그)가 보고되었으므로, **Gateway 운영 런타임용으로는 권장하지 않음.** 프로덕션 환경에서는 반드시 Node.js를 사용하기 바람.

## 현재 상태

- Bun은 TypeScript 코드를 즉시 실행하기 위한 선택적 로컬 런타임으로 활용 가능함 (`bun run …`, `bun --watch …`).
- 프로젝트 빌드의 기본 도구는 `pnpm`이며, 일부 문서화 도구 역시 pnpm에 의존하므로 pnpm은 계속 지원됨.
- Bun은 `pnpm-lock.yaml` 파일을 인식하지 못하며 이를 무시함.

## 설치 방법

기본 설치 명령어:

```sh
bun install
```

참고: `bun.lock` 또는 `bun.lockb` 파일은 `.gitignore`에 등록되어 있으므로 저장소 상태에 영향을 주지 않음. 만약 **락파일 생성을 완전히 차단**하고 싶다면 다음 명령어를 사용함:

```sh
bun install --no-save
```

## 빌드 및 테스트 (Bun 활용)

```sh
bun run build
bun run vitest run
```

## Bun 라이프사이클 스크립트 (기본 차단됨)

Bun은 의존성 패키지의 라이프사이클 스크립트를 기본적으로 차단할 수 있음. 명시적으로 신뢰를 부여하려면 `bun pm trust` 명령어를 사용함. 현재 이 프로젝트에서 차단되는 주요 스크립트들은 필수가 아님:

- **`@whiskeysockets/baileys` (preinstall)**: Node.js 버전(20 이상)을 체크하는 용도임 (OpenClaw는 Node 22 이상을 요구함).
- **`protobufjs` (postinstall)**: 버전 호환성 관련 경고를 출력하는 용도이며 실제 빌드 산출물을 생성하지 않음.

만약 실행 중 관련 스크립트 부재로 인한 문제가 발생한다면 다음과 같이 신뢰 설정을 추가함:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 제약 사항 및 주의점

- 일부 내부 스크립트(예: `docs:build`, `ui:*`, `protocol:check`)에는 여전히 pnpm 명령어가 하드코딩되어 있음. 해당 작업들은 당분간 pnpm을 통해 실행할 것을 권장함.
