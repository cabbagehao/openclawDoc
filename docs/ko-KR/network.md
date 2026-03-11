---
summary: "네트워크 허브: Gateway 인터페이스, 페어링, 탐색(Discovery), 보안 개요"
read_when:
  - 네트워크 아키텍처 및 보안 체계에 대한 전반적인 이해가 필요할 때
  - 로컬, Tailnet 접근 또는 페어링 관련 문제를 디버깅할 때
  - 네트워크 관련 주요 문서 목록을 확인하고 싶을 때
title: "네트워크 허브"
x-i18n:
  source_path: "network.md"
---

# 네트워크 허브(Network Hub)

이 허브는 OpenClaw가 로컬 호스트(localhost), LAN, Tailnet 전반에서 기기들을 어떻게 연결하고 페어링하며 보호하는지를 설명하는 주요 문서들을 연결함.

## 핵심 모델 및 아키텍처

- [Gateway 아키텍처](/concepts/architecture)
- [Gateway 프로토콜](/gateway/protocol)
- [Gateway 실행 가이드(Runbook)](/gateway)
- [웹 인터페이스 및 바인딩(Bind) 모드](/web)

## 페어링 및 신원 인증

- [페어링 개요 (DM 및 노드)](/channels/pairing)
- [Gateway 노드 페어링 상세](/gateway/pairing)
- [Devices CLI (페어링 및 토큰 로테이션)](/cli/devices)
- [Pairing CLI (DM 승인)](/cli/pairing)

### 로컬 신뢰 모델(Local Trust)

- 로컬 연결(루프백 또는 Gateway 호스트 자체의 Tailnet 주소)은 원활한 사용자 경험을 위해 페어링이 자동으로 승인될 수 있음.
- 로컬이 아닌 Tailnet 또는 LAN 클라이언트는 보안을 위해 여전히 명시적인 페어링 승인 절차가 필요함.

## 탐색(Discovery) 및 전송 계층

- [탐색 및 전송 계층 상세](/gateway/discovery)
- [Bonjour / mDNS 설정](/gateway/bonjour)
- [원격 접속 가이드(SSH)](/gateway/remote)
- [Tailscale 통합](/gateway/tailscale)

## 노드 및 전송 인프라

- [노드(Nodes) 개요](/nodes)
- [브리지 프로토콜 (레거시 노드 지원)](/gateway/bridge-protocol)
- [노드 실행 가이드(Runbook): iOS](/platforms/ios)
- [노드 실행 가이드(Runbook): Android](/platforms/android)

## 보안 및 진단

- [보안 아키텍처 개요](/gateway/security)
- [Gateway 설정 레퍼런스](/gateway/configuration)
- [네트워크 문제 해결(Troubleshooting)](/gateway/troubleshooting)
- [Doctor 진단 도구](/gateway/doctor)
