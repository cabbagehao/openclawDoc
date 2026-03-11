---
title: "TOOLS.md 템플릿"
summary: "TOOLS.md 용 워크스페이스 템플릿"
read_when:
  - 워크스페이스를 수동으로 부트스트랩할 때
---

# TOOLS.md - 로컬 메모

Skills 는 도구가 *어떻게* 동작하는지 정의합니다. 이 파일은 *당신의* 구체적인 설정, 즉 당신 환경에만 있는 것들을 적는 곳입니다.

## 여기에 들어갈 것

예를 들면:

* 카메라 이름과 위치
* SSH 호스트와 별칭
* TTS 에서 선호하는 음성
* 스피커/방 이름
* 기기 별명
* 그 밖의 환경별 정보

## 예시

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## 왜 분리하나?

Skills 는 공유됩니다. 당신의 설정은 당신만의 것입니다. 둘을 분리해 두면 메모를 잃지 않고 skills 를 업데이트할 수 있고, 인프라를 노출하지 않고도 skills 를 공유할 수 있습니다.

***

당신이 일을 잘하는 데 도움이 되는 내용이라면 무엇이든 추가하세요. 이것은 당신의 치트시트입니다.
