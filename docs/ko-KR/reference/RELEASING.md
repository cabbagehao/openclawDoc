---
title: "Release Checklist"
summary: "npm + macOS 앱을 위한 단계별 릴리스 체크리스트"
read_when:
  - 새 npm 릴리스를 배포할 때
  - 새 macOS 앱 릴리스를 배포할 때
  - 게시 전에 메타데이터를 검증할 때
---

# 릴리스 체크리스트 (npm + macOS)

리포지토리 루트에서 `pnpm` (Node 22+)을 사용하세요. 태그를 만들거나 게시하기 전에 작업 트리를 깨끗하게 유지하세요.

## 운영자 트리거

운영자가 “release”라고 말하면, 즉시 다음 사전 점검을 수행하세요(막히지 않는 한 추가 질문은 하지 마세요):

- 이 문서와 `docs/platforms/mac/release.md`를 읽습니다.
- `~/.profile`에서 env를 로드하고 `SPARKLE_PRIVATE_KEY_FILE`과 App Store Connect 변수가 설정되어 있는지 확인합니다 (`SPARKLE_PRIVATE_KEY_FILE`은 `~/.profile`에 있어야 합니다).
- 필요하면 `~/Library/CloudStorage/Dropbox/Backup/Sparkle`의 Sparkle 키를 사용합니다.

1. **버전 및 메타데이터**

- [ ] `package.json` 버전을 올립니다(예: `2026.1.29`).
- [ ] 확장 패키지 버전과 changelog를 맞추기 위해 `pnpm plugins:sync`를 실행합니다.
- [ ] [`src/version.ts`](https://github.com/openclaw/openclaw/blob/main/src/version.ts)의 CLI/버전 문자열과 [`src/web/session.ts`](https://github.com/openclaw/openclaw/blob/main/src/web/session.ts)의 Baileys user agent를 업데이트합니다.
- [ ] 패키지 메타데이터(name, description, repository, keywords, license)를 확인하고, `bin` 맵이 `openclaw`에 대해 [`openclaw.mjs`](https://github.com/openclaw/openclaw/blob/main/openclaw.mjs)를 가리키는지 확인합니다.
- [ ] 의존성이 변경되었다면 `pnpm install`을 실행해 `pnpm-lock.yaml`을 최신 상태로 유지합니다.

2. **빌드 및 아티팩트**

- [ ] A2UI 입력이 변경되었다면 `pnpm canvas:a2ui:bundle`을 실행하고, 업데이트된 [`src/canvas-host/a2ui/a2ui.bundle.js`](https://github.com/openclaw/openclaw/blob/main/src/canvas-host/a2ui/a2ui.bundle.js)가 있으면 커밋합니다.
- [ ] `pnpm run build` (`dist/`를 다시 생성합니다).
- [ ] npm 패키지의 `files`에 필요한 모든 `dist/*` 폴더가 포함되어 있는지 확인합니다(특히 헤드리스 node + ACP CLI용 `dist/node-host/**`와 `dist/acp/**`).
- [ ] `dist/build-info.json`이 존재하고 예상한 `commit` 해시를 포함하는지 확인합니다(CLI 배너는 npm 설치 시 이를 사용합니다).
- [ ] 선택 사항: 빌드 후 `npm pack --pack-destination /tmp`를 실행하고 tarball 내용을 검사한 다음 GitHub 릴리스에 첨부할 수 있도록 보관합니다(커밋하지는 마세요).

3. **Changelog 및 문서**

- [ ] 사용자 대상 하이라이트를 담아 `CHANGELOG.md`를 업데이트합니다(없다면 파일을 만듭니다). 항목은 버전 기준 엄격한 내림차순으로 유지합니다.
- [ ] README 예제/플래그가 현재 CLI 동작과 일치하는지 확인합니다(특히 새 명령이나 옵션).

4. **검증**

- [ ] `pnpm build`
- [ ] `pnpm check`
- [ ] `pnpm test` (`coverage` 출력이 필요하면 `pnpm test:coverage`)
- [ ] `pnpm release:check` (npm pack 내용을 검증합니다)
- [ ] `OPENCLAW_INSTALL_SMOKE_SKIP_NONROOT=1 pnpm test:install:smoke` (Docker 설치 스모크 테스트, 빠른 경로, 릴리스 전에 필수)
  - 직전 npm 릴리스가 깨진 것으로 알려져 있다면 preinstall 단계에 `OPENCLAW_INSTALL_SMOKE_PREVIOUS=<last-good-version>` 또는 `OPENCLAW_INSTALL_SMOKE_SKIP_PREVIOUS=1`을 설정합니다.
- [ ] (선택 사항) 전체 설치기 스모크(비루트 + CLI 커버리지 추가): `pnpm test:install:smoke`
- [ ] (선택 사항) 설치기 E2E(Docker에서 `curl -fsSL https://openclaw.ai/install.sh | bash`를 실행하고, 온보딩 후 실제 도구 호출까지 수행):
  - `pnpm test:install:e2e:openai` (`OPENAI_API_KEY` 필요)
  - `pnpm test:install:e2e:anthropic` (`ANTHROPIC_API_KEY` 필요)
  - `pnpm test:install:e2e` (두 키 모두 필요, 두 provider를 모두 실행)
- [ ] (선택 사항) 변경 사항이 send/receive 경로에 영향을 주는 경우 web gateway를 스팟 체크합니다.

5. **macOS 앱 (Sparkle)**

- [ ] macOS 앱을 빌드하고 서명한 다음 배포용으로 zip으로 묶습니다.
- [ ] Sparkle appcast를 생성하고(HTML 노트는 [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh) 사용) `appcast.xml`을 업데이트합니다.
- [ ] GitHub 릴리스에 첨부할 앱 zip(및 선택 사항인 dSYM zip)을 준비해 둡니다.
- [ ] 정확한 명령과 필요한 env 변수는 [macOS release](/platforms/mac/release)를 따릅니다.
  - Sparkle이 버전을 올바르게 비교할 수 있도록 `APP_BUILD`는 숫자이며 단조 증가해야 합니다(`-beta` 금지).
  - 공증하는 경우 App Store Connect API env 변수로 생성한 `openclaw-notary` 키체인 프로필을 사용합니다([macOS release](/platforms/mac/release) 참고).

6. **게시 (npm)**

- [ ] git status가 깨끗한지 확인하고, 필요하면 커밋하고 푸시합니다.
- [ ] 필요하면 `npm login`을 실행합니다(2FA 확인).
- [ ] `npm publish --access public` (`프리릴리스`에는 `--tag beta` 사용).
- [ ] 레지스트리를 확인합니다: `npm view openclaw version`, `npm view openclaw dist-tags`, `npx -y openclaw@X.Y.Z --version` (또는 `--help`).

### 문제 해결 (2.0.0-beta2 릴리스 메모)

- **npm pack/publish가 멈추거나 tarball이 지나치게 커짐**: `dist/OpenClaw.app`의 macOS 앱 번들(및 릴리스 zip)이 패키지에 함께 들어갑니다. `package.json`의 `files`로 게시 내용을 화이트리스트 처리해 수정하세요(`dist` 하위 디렉터리, docs, skills는 포함하고 앱 번들은 제외). `npm pack --dry-run`으로 `dist/OpenClaw.app`이 목록에 없는지 확인합니다.
- **dist-tags에서 npm auth 웹 루프 발생**: OTP 프롬프트를 띄우기 위해 레거시 인증을 사용합니다.
  - `NPM_CONFIG_AUTH_TYPE=legacy npm dist-tag add openclaw@X.Y.Z latest`
- **`npx` 검증이 `ECOMPROMISED: Lock compromised`로 실패**: 새 캐시로 다시 시도합니다.
  - `NPM_CONFIG_CACHE=/tmp/npm-cache-$(date +%s) npx -y openclaw@X.Y.Z --version`
- **늦은 수정 이후 태그를 다시 가리켜야 함**: 태그를 강제로 업데이트하고 푸시한 뒤 GitHub 릴리스 아티팩트가 여전히 일치하는지 확인합니다.
  - `git tag -f vX.Y.Z && git push -f origin vX.Y.Z`

7. **GitHub 릴리스 + appcast**

- [ ] 태그를 만들고 푸시합니다: `git tag vX.Y.Z && git push origin vX.Y.Z` (또는 `git push --tags`).
- [ ] `vX.Y.Z`용 GitHub 릴리스를 만들거나 갱신하며, **제목은 `openclaw X.Y.Z`**로 합니다(태그만 쓰지 않음). 본문에는 해당 버전의 **전체** changelog 섹션(Highlights + Changes + Fixes)을 인라인으로 포함해야 하며(링크만 단독으로 두지 않음), **본문 안에서 제목을 다시 반복해서는 안 됩니다**.
- [ ] 아티팩트를 첨부합니다: `npm pack` tarball(선택 사항), `OpenClaw-X.Y.Z.zip`, `OpenClaw-X.Y.Z.dSYM.zip`(생성된 경우).
- [ ] 업데이트된 `appcast.xml`을 커밋하고 푸시합니다(Sparkle 피드는 main에서 가져옵니다).
- [ ] 깨끗한 임시 디렉터리(`package.json` 없음)에서 `npx -y openclaw@X.Y.Z send --help`를 실행해 설치/CLI 진입점이 동작하는지 확인합니다.
- [ ] 릴리스 노트를 공지/공유합니다.

## 플러그인 게시 범위 (npm)

우리는 `@openclaw/*` 스코프 아래의 **기존 npm 플러그인만** 게시합니다. npm에
없는 번들 플러그인은 **디스크 트리 전용**으로 유지합니다(그래도
`extensions/**`에는 계속 포함됩니다).

목록을 도출하는 절차:

1. `npm search @openclaw --json`을 실행하고 패키지 이름을 수집합니다.
2. 이를 `extensions/*/package.json`의 이름과 비교합니다.
3. **교집합만** 게시합니다(이미 npm에 있는 것).

현재 npm 플러그인 목록(필요시 업데이트):

- @openclaw/bluebubbles
- @openclaw/diagnostics-otel
- @openclaw/discord
- @openclaw/feishu
- @openclaw/lobster
- @openclaw/matrix
- @openclaw/msteams
- @openclaw/nextcloud-talk
- @openclaw/nostr
- @openclaw/voice-call
- @openclaw/zalo
- @openclaw/zalouser

릴리스 노트에는 기본값으로 켜져 있지 않은 **새 선택형 번들 플러그인**도 반드시
명시해야 합니다(예: `tlon`).
