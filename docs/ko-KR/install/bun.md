---
summary: "Bun 워크플로(실험적): 설치 방법과 pnpm 대비 주의점"
read_when:
  - 가장 빠른 로컬 개발 루프(bun + watch)를 원합니다
  - Bun 설치/패치/라이프사이클 스크립트 문제를 겪고 있습니다
title: "Bun (실험적)"
---

# Bun (실험적)

목표: **Bun**으로 이 저장소를 실행하되(선택 사항, WhatsApp/Telegram에는 비권장), pnpm 워크플로와 갈라지지 않게 유지합니다.

⚠️ **Gateway 런타임에는 권장하지 않습니다**(WhatsApp/Telegram 버그). 프로덕션에서는 Node를 사용하세요.

## 상태

- Bun은 TypeScript를 직접 실행하기 위한 선택적 로컬 런타임입니다(`bun run …`, `bun --watch …`).
- 빌드 기본값은 `pnpm`이며 여전히 완전히 지원되고 있습니다(일부 문서 도구도 사용).
- Bun은 `pnpm-lock.yaml`을 사용할 수 없으며 무시합니다.

## 설치

기본:

```sh
bun install
```

참고: `bun.lock`/`bun.lockb`는 gitignore에 들어 있으므로 어느 쪽이든 저장소 변경이 생기지 않습니다. _락파일을 아예 쓰지 않으려면_:

```sh
bun install --no-save
```

## 빌드 / 테스트 (Bun)

```sh
bun run build
bun run vitest run
```

## Bun 라이프사이클 스크립트(기본 차단)

Bun은 의존성 라이프사이클 스크립트를 명시적으로 신뢰하지 않으면 차단할 수 있습니다(`bun pm untrusted` / `bun pm trust`).
이 저장소에서 흔히 차단되는 스크립트는 필수는 아닙니다.

- `@whiskeysockets/baileys` `preinstall`: Node 메이저 버전이 20 이상인지 확인합니다(우리는 Node 22+ 사용).
- `protobufjs` `postinstall`: 호환되지 않는 버전 체계에 대한 경고를 출력합니다(빌드 산출물 없음).

이 스크립트들이 실제 런타임 문제 해결에 필요하다면 명시적으로 신뢰하세요:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 주의점

- 일부 스크립트는 여전히 pnpm을 하드코딩합니다(예: `docs:build`, `ui:*`, `protocol:check`). 지금은 이런 작업을 pnpm으로 실행하세요.
