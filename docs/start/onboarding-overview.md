---
summary: "OpenClawのオンボーディングオプションとフローの概要"
read_when:
  - オンボーディングパスの選択
  - 新しい環境のセットアップ
title: "オンボーディング概要"
sidebarTitle: "オンボーディング概要"
x-i18n:
  source_path: "start/onboarding-overview.md"
  source_hash: "64540138b717f4a4c1201868220d755a21b16fa330c558c33beb426cfa4504d0"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T05:49:54.222Z"
---
OpenClawは、Gatewayの実行場所とプロバイダーの設定方法に応じて、複数のオンボーディングパスをサポートしています。

## オンボーディングパスの選択

- **CLIウィザード** macOS、Linux、Windows（WSL2経由）向け。
- **macOSアプリ** Apple siliconまたはIntel Mac上でのガイド付き初回実行向け。

## CLIオンボーディングウィザード

ターミナルでウィザードを実行します：

```bash
openclaw onboard
```

Gateway、ワークスペース、チャンネル、Skillsを完全に制御したい場合は、CLIウィザードを使用してください。ドキュメント：

- [オンボーディングウィザード（CLI）](/start/wizard)
- [`openclaw onboard`コマンド](/cli/onboard)

## macOSアプリオンボーディング

macOS上で完全にガイドされたセットアップが必要な場合は、OpenClawアプリを使用してください。ドキュメント：

- [オンボーディング（macOSアプリ）](/start/onboarding)

## カスタムプロバイダー

リストにないエンドポイントが必要な場合、標準のOpenAIまたはAnthropic APIを公開するホスト型プロバイダーを含め、CLIウィザードで**カスタムプロバイダー**を選択してください。次の情報を求められます：

- OpenAI互換、Anthropic互換、または**不明**（自動検出）を選択。
- ベースURLとAPIキー（プロバイダーが必要とする場合）を入力。
- モデルIDとオプションのエイリアスを提供。
- 複数のカスタムエンドポイントが共存できるようにエンドポイントIDを選択。

詳細な手順については、上記のCLIオンボーディングドキュメントに従ってください。
