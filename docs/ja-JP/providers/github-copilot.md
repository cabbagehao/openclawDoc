---
summary: "デバイス フローを使用して OpenClaw から GitHub Copilot にサインインする"
read_when:
  - GitHub Copilot をモデルプロバイダーとして使用したい
  - 「openclaw models auth login-github-copilot」フローが必要です
title: "GitHub コパイロット"
x-i18n:
  source_hash: "503e0496d92c921e2f7111b1b4ba16374f5b781643bfbc6cb69cea97d9395c25"
---

# GitHub コパイロット

## GitHub コパイロットとは何ですか?

GitHub Copilot は、GitHub の AI コーディング アシスタントです。 Copilot へのアクセスを提供します
GitHub アカウントとプランのモデル。 OpenClaw は Copilot をモデルとして使用できます
プロバイダーには 2 つの異なる方法があります。

## OpenClaw で Copilot を使用する 2 つの方法

### 1) 組み込みの GitHub Copilot プロバイダー (`github-copilot`)

ネイティブのデバイス ログイン フローを使用して GitHub トークンを取得し、それを交換します。
OpenClaw の実行時に API トークンをコパイロットします。これは**デフォルト**で最も単純なパスです
VS Code を必要としないためです。

### 2) Copilot プロキシ プラグイン (`copilot-proxy`)

**Copilot Proxy** VS Code 拡張機能をローカル ブリッジとして使用します。 OpenClaw が話しかける
プロキシの `/v1` エンドポイントに接続し、そこで構成したモデル リストを使用します。選択してください
これは、すでに VS Code で Copilot プロキシを実行している場合、またはそれを介してルーティングする必要がある場合に実行します。
プラグインを有効にして、VS Code 拡張機能を実行し続ける必要があります。

GitHub Copilot をモデル プロバイダーとして使用します (`github-copilot`)。ログインコマンドが実行される
GitHub デバイス フロー、認証プロファイルを保存し、それを使用するように構成を更新します。
プロフィール。

## CLI セットアップ

```bash
openclaw models auth login-github-copilot
```

URL にアクセスしてワンタイム コードを入力するよう求められます。端末を保管しておく
完了するまで開いてください。

### オプションのフラグ

```bash
openclaw models auth login-github-copilot --profile-id github-copilot:work
openclaw models auth login-github-copilot --yes
```

## デフォルトのモデルを設定する

```bash
openclaw models set github-copilot/gpt-4o
```

### 構成スニペット

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## 注意事項- インタラクティブな TTY が必要です。ターミナルで直接実行します

- Copilot モデルの利用可能性はプランによって異なります。モデルが拒否された場合は、試してください
  別の ID (例: `github-copilot/gpt-4.1`)。
- ログインでは、GitHub トークンが認証プロファイル ストアに保存され、それを
  OpenClaw 実行時の Copilot API トークン。
