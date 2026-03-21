---
summary: "커뮤니티 플러그인을 문서에 등재할 때 필요한 기준과 제출 방식을 설명합니다."
description: "OpenClaw community plugin을 docs 목록에 추가하려면 어떤 품질 기준과 제출 형식을 따라야 하는지 안내합니다."
read_when:
  - 서드파티 OpenClaw plugin을 공개하고 싶을 때
  - 문서 목록에 실을 plugin을 제안하고 싶을 때
title: "Community plugins"
x-i18n:
  source_path: "plugins/community.md"
---

# 커뮤니티 플러그인

이 페이지는 OpenClaw용 **community-maintained plugin** 중 품질이 높은 항목을 추적합니다.

아래 품질 기준을 만족하는 community plugin을 이 페이지에 추가하는 PR을 받습니다.

## 목록 등재 요건

- plugin package가 npmjs에 게시되어 있어야 함(`openclaw plugins install <npm-spec>`로 설치 가능)
- 소스 코드가 GitHub의 공개 저장소에 있어야 함
- 저장소에 설정/사용 문서와 이슈 트래커가 포함되어 있어야 함
- plugin에 명확한 유지보수 신호가 있어야 함(active maintainer, 최근 update, 또는 issue 대응)

## 제출 방법

다음 정보를 포함해 이 페이지에 plugin을 추가하는 PR을 열어 주세요.

- plugin 이름
- npm 패키지 이름
- GitHub 저장소 URL
- 한 줄 설명
- 설치 명령

## 검토 기준

유용하고, 문서가 잘 되어 있고, 안전하게 운영할 수 있는 plugin을 우선합니다.
수고를 거의 들이지 않은 wrapper, ownership이 불분명한 package, 유지보수되지 않는 package는 거절될 수 있습니다.

## 후보 형식

항목을 추가할 때는 다음 형식을 사용하세요.

- **Plugin Name** — 짧은 설명  
  npm: `@scope/package`  
  repo: `https://github.com/org/repo`  
  install: `openclaw plugins install @scope/package`

## 등록된 플러그인

- **WeChat** — WeChatPadPro(iPad 프로토콜)를 통해 OpenClaw를 WeChat 개인 계정에 연결합니다. 키워드 기반 대화와 함께 텍스트, 이미지, 파일 교환을 지원합니다.  
  npm: `@icesword760/openclaw-wechat`  
  repo: `https://github.com/icesword0760/openclaw-wechat`  
  install: `openclaw plugins install @icesword760/openclaw-wechat`
