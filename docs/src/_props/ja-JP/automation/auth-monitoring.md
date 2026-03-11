---
summary: "モデルプロバイダーの OAuth 有効期限を監視する"
read_when:
  - 認証の有効期限監視やアラートを設定する場合
  - Claude Code / Codex の OAuth 更新チェックを自動化する場合
title: "認証監視"
x-i18n:
  source_path: "automation/auth-monitoring.md"
  source_hash: "eef179af9545ed7ab881f3ccbef998869437fb50cdb4088de8da7223b614fa2b"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T05:51:48.318Z"
---

# 認証監視

OpenClaw は `openclaw models status` を通じて、OAuth の有効期限の状態を公開します。自動化やアラートにはこれを利用してください。スクリプトは、スマートフォン向けワークフローのための追加オプションにすぎません。

## 推奨: CLI チェック（ポータブル）

```bash
openclaw models status --check
```

終了コード:

* `0`: 正常
* `1`: 認証情報が期限切れ、または存在しない
* `2`: まもなく期限切れ（24 時間以内）

これは cron や systemd で動作し、追加のスクリプトは不要です。

## オプションのスクリプト（運用 / スマートフォン向けワークフロー）

これらは `scripts/` 配下にあり、**オプション**です。ゲートウェイホストへの SSH アクセスを前提としており、systemd + Termux 向けに調整されています。

* `scripts/claude-auth-status.sh` は現在、`openclaw models status --json` を正本の情報源として使います（CLI が利用できない場合は、直接ファイルを読み取る方式にフォールバックします）。そのため、タイマー環境でも `openclaw` が `PATH` 上にあるようにしてください。
* `scripts/auth-monitor.sh`: cron/systemd タイマーの実行対象。アラートを送信します（ntfy またはスマートフォン）。
* `scripts/systemd/openclaw-auth-monitor.{service,timer}`: systemd ユーザータイマー。
* `scripts/claude-auth-status.sh`: Claude Code + OpenClaw の認証チェッカー（full/json/simple）。
* `scripts/mobile-reauth.sh`: SSH 経由で実行するガイド付き再認証フロー。
* `scripts/termux-quick-auth.sh`: ワンタップでウィジェットの状態を確認し、認証 URL を開きます。
* `scripts/termux-auth-widget.sh`: 完全なガイド付きウィジェットフロー。
* `scripts/termux-sync-widget.sh`: Claude Code の認証情報を OpenClaw に同期します。

スマートフォン向けの自動化や systemd タイマーが不要であれば、これらのスクリプトは使わなくて構いません。
