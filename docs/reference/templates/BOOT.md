---
title: "OpenClawののBOOT テンプレートの用途・記述ルール・設定例の仕様と確認ポイントを整理するガイド"
summary: "BOOT.md 用のワークスペーステンプレート"
read_when:
description: "起動時に OpenClaw が実行すべき内容を、短く明確な指示として書いてください（hooks.internal.enabled を有効にします）。タスクがメッセージ送信を伴う場合は message tool を使い、その後 NO_REPLY を返してください。"
x-i18n:
  source_hash: "d65cfe833ef6826ef9cddafd6499b6dce55c5d0bb56088434a54f77054f5430e"
---
起動時に OpenClaw が実行すべき内容を、短く明確な指示として書いてください（`hooks.internal.enabled` を有効にします）。
タスクがメッセージ送信を伴う場合は message tool を使い、その後 `NO_REPLY` を返してください。
