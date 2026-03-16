---
summary: "네트워크 허브: Gateway 표면, 페어링, 탐색, 보안 개요"
read_when:
  - 네트워크 아키텍처와 보안 개요를 확인해야 할 때
  - 로컬 접근, tailnet 접근, 또는 페어링 문제를 디버깅할 때
  - 네트워킹 관련 핵심 문서 목록이 필요할 때
title: "네트워크"
description: "OpenClaw가 localhost, LAN, tailnet 환경에서 연결, 페어링, 보안을 처리하는 방식과 관련 문서를 안내합니다."
x-i18n:
  source_path: "network.md"
---

# 네트워크 허브

이 허브는 OpenClaw가 localhost, LAN, tailnet 전반에서 기기를 연결하고, 페어링하고, 보호하는 방식을 설명하는 핵심 문서로 연결됩니다.

## 핵심 모델

- [Gateway architecture](/concepts/architecture)
- [Gateway protocol](/gateway/protocol)
- [Gateway runbook](/gateway)
- [Web surfaces + bind modes](/web)

## 페어링 + 신원

- [Pairing overview (DM + nodes)](/channels/pairing)
- [Gateway-owned node pairing](/gateway/pairing)
- [Devices CLI (pairing + token rotation)](/cli/devices)
- [Pairing CLI (DM approvals)](/cli/pairing)

로컬 신뢰:

- 로컬 연결(루프백 또는 gateway 호스트 자신의 tailnet 주소)은 동일 호스트 UX를 매끄럽게 유지하기 위해 페어링이 자동 승인될 수 있습니다.
- 로컬이 아닌 tailnet/LAN 클라이언트는 여전히 명시적인 페어링 승인이 필요합니다.

## 탐색 + 전송

- [Discovery & transports](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [Remote access (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## 노드 + 전송

- [Nodes overview](/nodes)
- [Bridge protocol (legacy nodes)](/gateway/bridge-protocol)
- [Node runbook: iOS](/platforms/ios)
- [Node runbook: Android](/platforms/android)

## 보안

- [Security overview](/gateway/security)
- [Gateway config reference](/gateway/configuration)
- [Troubleshooting](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
