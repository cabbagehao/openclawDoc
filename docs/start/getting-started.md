---
summary: "OpenClawをインストールして、数分で最初のチャットを実行しましょう。"
description: "ゼロから OpenClaw を導入し、認証とチャンネル設定を済ませて最初のチャットを始める最短ガイドです。"
read_when:
  - ゼロからの初回セットアップ
  - 動作するチャットへの最速パスが必要な場合
title: "OpenClawを最短で始める導入手順と初期設定ガイド"
x-i18n:
  source_path: "start/getting-started.md"
  source_hash: "4ec86bd0345cc7a70236e566da2ccb9ff17764cc5a7c3b23eab8d5d558251520"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T05:49:44.266Z"
---
目標: ゼロから最小限のセットアップで最初の動作するチャットまで到達します。

<Info>
最速のチャット: Control UIを開きます(チャンネルセットアップは不要)。`openclaw dashboard`を実行してブラウザでチャットするか、
<Tooltip headline="Gatewayホスト" tip="OpenClaw gatewayサービスを実行しているマシン。">gatewayホスト</Tooltip>で`http://127.0.0.1:18789/`を開きます。
ドキュメント: [Dashboard](/web/dashboard)と[Control UI](/web/control-ui)。
</Info>

## 前提条件

- Node 22以降

<Tip>
不明な場合は`node --version`でNodeのバージョンを確認してください。
</Tip>

## クイックセットアップ (CLI)

<Steps>
  <Step title="OpenClawをインストール (推奨)">
    <Tabs>
      <Tab title="macOS/Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    その他のインストール方法と要件: [Install](/install)。
    </Note>

  </Step>
  <Step title="オンボーディングウィザードを実行">
    ```bash
    openclaw onboard --install-daemon
    ```

    ウィザードは認証、Gateway設定、およびオプションのチャンネルを構成します。
    詳細は[オンボーディングウィザード](/start/wizard)を参照してください。

  </Step>
  <Step title="Gatewayを確認">
    サービスをインストールした場合、すでに実行されているはずです:

    ```bash
    openclaw gateway status
    ```

  </Step>
  <Step title="Control UIを開く">
    ```bash
    openclaw dashboard
    ```
  </Step>
</Steps>

<Check>
Control UIが読み込まれれば、Gatewayは使用可能です。
</Check>

## オプションの確認と追加機能

<AccordionGroup>
  <Accordion title="Gatewayをフォアグラウンドで実行">
    クイックテストやトラブルシューティングに便利です。

    ```bash
    openclaw gateway --port 18789
    ```

  </Accordion>
  <Accordion title="テストメッセージを送信">
    構成済みのチャンネルが必要です。

    ```bash
    openclaw message send --target +15555550123 --message "Hello from OpenClaw"
    ```

  </Accordion>
</AccordionGroup>

## 便利な環境変数

OpenClawをサービスアカウントとして実行する場合や、カスタムの設定/状態の場所を指定したい場合:

- `OPENCLAW_HOME`は内部パス解決に使用されるホームディレクトリを設定します。
- `OPENCLAW_STATE_DIR`は状態ディレクトリを上書きします。
- `OPENCLAW_CONFIG_PATH`は設定ファイルのパスを上書きします。

完全な環境変数リファレンス: [環境変数](/help/environment)。

## さらに深く

<Columns>
  <Card title="オンボーディングウィザード (詳細)" href="/start/wizard">
    完全なCLIウィザードリファレンスと高度なオプション。
  </Card>
  <Card title="macOSアプリのオンボーディング" href="/start/onboarding">
    macOSアプリの初回実行フロー。
  </Card>
</Columns>

## 完了後の状態

- 実行中のGateway
- 構成済みの認証
- Control UIアクセスまたは接続済みのチャンネル

## 次のステップ

- DMの安全性と承認: [ペアリング](/channels/pairing)
- さらにチャンネルを接続: [チャンネル](/channels)
- 高度なワークフローとソースからのセットアップ: [セットアップ](/start/setup)
