---
summary: "네트워크 허브: gateway 인터페이스, 페어링, 디스커버리, 보안"
read_when:
  - 네트워크 아키텍처와 보안 개요가 필요할 때
  - 로컬과 tailnet 접근 또는 페어링 문제를 디버깅할 때
  - 네트워킹 관련 문서의 정식 목록이 필요할 때
title: "네트워크"
x-i18n:
  source_path: "network.md"
---

# 네트워크 허브

이 허브는 OpenClaw가 localhost, LAN, tailnet 전반에서 기기를 어떻게 연결하고, 페어링하고, 보호하는지 설명하는 핵심 문서를 연결합니다.

## 핵심 모델

- [Gateway 아키텍처](/concepts/architecture)
- [Gateway 프로토콜](/gateway/protocol)
- [Gateway 런북](/gateway)
- [웹 인터페이스 + bind 모드](/web)

## 페어링 + 신원

- [페어링 개요(DM + 노드)](/channels/pairing)
- [Gateway 소유 노드 페어링](/gateway/pairing)
- [Devices CLI(페어링 + token rotation)](/cli/devices)
- [Pairing CLI(DM 승인)](/cli/pairing)

로컬 신뢰:

- 로컬 연결(loopback 또는 gateway host 자신의 tailnet 주소)은 동일 호스트 UX를 부드럽게 하기 위해 페어링이 자동 승인될 수 있습니다.
- 로컬이 아닌 tailnet/LAN 클라이언트는 여전히 명시적인 페어링 승인이 필요합니다.

## 디스커버리 + 전송 계층

- [디스커버리 & 전송 계층](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [원격 접근(SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## 노드 + 전송 계층

- [노드 개요](/nodes)
- [브리지 프로토콜(레거시 노드)](/gateway/bridge-protocol)
- [노드 런북: iOS](/platforms/ios)
- [노드 런북: Android](/platforms/android)

## 보안

- [보안 개요](/gateway/security)
- [Gateway 설정 레퍼런스](/gateway/configuration)
- [문제 해결](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
