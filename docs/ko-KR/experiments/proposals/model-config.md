---
summary: "탐색: 모델 설정, 인증 프로필, 폴백 동작"
description: "여러 auth profile, `provider/model` 선택, image routing, fallback 목록을 둘러싼 향후 모델 설정 아이디어를 정리한 탐색 문서입니다."
read_when:
  - "향후 모델 선택 및 인증 프로필 아이디어를 검토할 때"
title: "모델 설정 탐색"
x-i18n:
  source_path: "experiments/proposals/model-config.md"
---

# 모델 설정 (탐색)

이 문서는 향후 모델 설정에 대한 **아이디어**를 정리한 것입니다. 배포 중인 사양은 아닙니다. 현재 동작은 다음 문서를 참고하세요.

- [Models](/concepts/models)
- [Model failover](/concepts/model-failover)
- [OAuth + profiles](/concepts/oauth)

## 동기

운영자는 다음을 원합니다.

- provider별 다중 auth profile(개인용 vs 업무용)
- 예측 가능한 fallback과 함께 단순한 `/model` 선택
- text model과 image-capable model 간의 명확한 분리

## 가능한 방향 (고수준)

- 모델 선택은 단순하게 유지합니다. 형식은 `provider/model`을 기본으로 하고, 필요하면 별칭을 추가합니다.
- provider는 명시적인 순서를 가진 여러 auth profile을 가질 수 있게 합니다.
- 모든 세션이 일관되게 fail over되도록 전역 fallback 목록을 사용합니다.
- image routing은 명시적으로 설정된 경우에만 override합니다.

## 열린 질문

- profile rotation은 provider 단위여야 할까요, model 단위여야 할까요?
- UI는 세션의 profile selection을 어떻게 노출해야 할까요?
- legacy config key에서 마이그레이션하는 가장 안전한 경로는 무엇일까요?
