---
summary: "「openclaw モデル」の CLI リファレンス (ステータス/リスト/セット/スキャン、エイリアス、フォールバック、認証)"
read_when:
  - デフォルトのモデルを変更したい、またはプロバイダーの認証ステータスを表示したい
  - 利用可能なモデル/プロバイダーをスキャンし、認証プロファイルをデバッグしたい
title: "モデル"
x-i18n:
  source_hash: "ada94faade0a50a0e450cfab9675d6d1a8f1c3015f7a6f29f540f30367b301df"
---

# `openclaw models`

モデルの検出、スキャン、および構成 (デフォルト モデル、フォールバック、認証プロファイル)。

関連:

- プロバイダー + モデル: [モデル](/providers/models)
- プロバイダー認証の設定: [はじめに](/start/getting-started)

## 共通コマンド

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` は、解決されたデフォルト/フォールバックと認証の概要を示します。
プロバイダーの使用状況のスナップショットが利用可能な場合、OAuth/トークンのステータス セクションには以下が含まれます。
プロバイダーの使用ヘッダー。
`--probe` を追加して、構成された各プロバイダー プロファイルに対してライブ認証プローブを実行します。
プローブは実際のリクエストです (トークンを消費し、レート制限をトリガーする可能性があります)。
`--agent <id>` を使用して、構成されたエージェントのモデル/認証状態を検査します。省略した場合は、
コマンドは、設定されている場合は `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` を使用し、それ以外の場合は
設定されたデフォルトのエージェント。

注:- `models set <model-or-alias>` は `provider/model` またはエイリアスを受け入れます。

- モデル参照は、**最初** `/` で分割することによって解析されます。モデル ID に `/` (OpenRouter スタイル) が含まれる場合は、プロバイダーのプレフィックス (例: `openrouter/moonshotai/kimi-k2`) を含めます。
- プロバイダーを省略した場合、OpenClaw は入力をエイリアスまたは **デフォルト プロバイダー** のモデルとして扱います (モデル ID に `/` がない場合にのみ機能します)。
- `models status` は、非シークレット プレースホルダーの認証出力に `marker(<value>)` を表示する場合があります (例: `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`qwen-oauth`、 `ollama-local`) を秘密としてマスクする代わりに。

### `models status`

オプション:

- `--json`
- `--plain`
- `--check` (出口 1=期限切れ/欠落、2=期限切れ)
- `--probe` (構成された認証プロファイルのライブ プローブ)
- `--probe-provider <name>` (プロバイダー 1 つを調査)
- `--probe-profile <id>` (繰り返しまたはカンマ区切りのプロファイル ID)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (構成されたエージェント ID。`OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` をオーバーライドします)

## エイリアス + フォールバック

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 認証プロファイル

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token
openclaw models auth paste-token
```

`models auth login` は、プロバイダー プラグインの認証フロー (OAuth/API キー) を実行します。使用する
`openclaw plugins list` を参照して、インストールされているプロバイダーを確認します。

注:- `setup-token` はセットアップ トークン値の入力を求めます (任意のマシンで `claude setup-token` を使用して生成します)。

- `paste-token` は、他の場所または自動化によって生成されたトークン文字列を受け入れます。
- Anthropic ポリシーに関する注記: セットアップ トークンのサポートは技術的な互換性です。 Anthropic は過去に、Claude Code 以外でのサブスクリプションの使用を一部ブロックしているため、広く使用する前に現在の規約を確認してください。
