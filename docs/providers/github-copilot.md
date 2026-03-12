---
summary: "OpenClaw から device flow を使って GitHub Copilot にサインインする"
read_when:
  - GitHub Copilot を model provider として使いたいとき
  - "`openclaw models auth login-github-copilot` フローが必要なとき"
title: "OpenClawでGitHub Copilotをモデル利用する認証・設定ガイド"
description: "GitHub Copilot を OpenClaw のモデルプロバイダーとして使う手順です。device flow による認証方法、利用形態の違い、接続後のモデル利用を確認できます。"
x-i18n:
  source_hash: "503e0496d92c921e2f7111b1b4ba16374f5b781643bfbc6cb69cea97d9395c25"
---
## GitHub Copilot とは

GitHub Copilot は GitHub の AI コーディング アシスタントです。GitHub アカウントと契約プランに応じて Copilot モデルへアクセスできます。OpenClaw では、Copilot を 2 通りの方法で model provider として利用できます。

## OpenClaw で Copilot を使う 2 つの方法

### 1) 組み込みの GitHub Copilot provider（`github-copilot`）

ネイティブの device login flow で GitHub token を取得し、OpenClaw 実行時に Copilot API token へ交換します。これが **既定の**、最もシンプルな方法で、VS Code は不要です。

### 2) Copilot Proxy plugin（`copilot-proxy`）

VS Code の **Copilot Proxy** 拡張をローカル bridge として利用します。OpenClaw は proxy の `/v1` endpoint と通信し、そこに設定された model list を使います。すでに VS Code で Copilot Proxy を使っている場合や、そこを経由する必要がある場合はこちらを選びます。この方法では plugin を有効にし、VS Code 拡張を起動し続ける必要があります。

`github-copilot` provider を使う場合、login command は GitHub device flow を実行し、auth profile を保存し、その profile を使うよう設定を更新します。

## CLI セットアップ

```bash
openclaw models auth login-github-copilot
```

URL を開いてワンタイム コードを入力するよう求められます。完了するまで terminal を閉じないでください。

### 任意のフラグ

```bash
openclaw models auth login-github-copilot --profile-id github-copilot:work
openclaw models auth login-github-copilot --yes
```

## 既定モデルを設定する

```bash
openclaw models set github-copilot/gpt-4o
```

### 設定例

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## 注意事項

- 対話的な TTY が必要です。必ず terminal から直接実行してください。
- Copilot で利用できるモデルは契約プランに依存します。ある model id が拒否された場合は、`github-copilot/gpt-4.1` など別の ID を試してください。
- login により GitHub token が auth profile store に保存され、OpenClaw 実行時に Copilot API token へ交換されます。
