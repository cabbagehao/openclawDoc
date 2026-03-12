---
summary: "`openclaw models` の CLI リファレンス (ステータス確認、一覧表示、モデル設定、スキャン、エイリアス、フォールバック、認証設定)"
read_when:
  - デフォルトのモデルを変更したい、あるいはプロバイダーの認証ステータスを確認したい場合
  - 利用可能なモデルやプロバイダーをスキャンしたり、認証プロファイルをデバッグしたりしたい場合
title: "models"
x-i18n:
  source_hash: "ada94faade0a50a0e450cfab9675d6d1a8f1c3015f7a6f29f540f30367b301df"
---
モデルの検出、スキャン、および構成（デフォルトモデル、フォールバック、認証プロファイル）を管理します。

関連ドキュメント:
- プロバイダーとモデル: [モデル](/providers/models)
- 認証設定の開始ガイド: [はじめに](/start/getting-started)

## よく使われるコマンド

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` を実行すると、解決済みのデフォルトモデルおよびフォールバックモデルと、認証情報の概要が表示されます。
プロバイダーの利用状況スナップショットが利用可能な場合、OAuth/トークンのステータスセクションに利用状況のヘッダーが含まれます。
`--probe` フラグを追加すると、構成されている各プロバイダープロファイルに対してライブ認証プローブを実行します。プローブは実際のリクエストを送信するため、トークンの消費やレート制限の対象となる可能性があることに注意してください。
特定のエージェントのモデル/認証状態を確認するには `--agent <id>` を使用します。省略した場合は、環境変数 `OPENCLAW_AGENT_DIR` / `PI_CODING_AGENT_DIR` が設定されていればそのディレクトリを、そうでなければ構成済みのデフォルトエージェントを使用します。

補足事項:
- `models set <model-or-alias>` は、`provider/model` 形式またはエイリアスを受け付けます。
- モデルの参照は、最初に出現する `/` で分割して解析されます。モデル ID 自体に `/` が含まれる場合（OpenRouter 形式など）は、必ずプロバイダーのプレフィックスを含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw は入力をエイリアス、または**デフォルトプロバイダー**のモデル名として扱います（これはモデル ID に `/` が含まれない場合にのみ機能します）。
- `models status` の認証出力において、シークレットではないプレースホルダー（`OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `qwen-oauth`, `ollama-local` など）は、伏せ字（マスク）されずに `marker(<値>)` として表示されることがあります。

### `models status` のオプション

- `--json`: JSON 形式で出力。
- `--plain`: 装飾なしのテキスト形式で出力。
- `--check`: 終了コードで状態を返します（1: 期限切れ/欠落、2: まもなく期限切れ）。
- `--probe`: 構成済みの認証プロファイルに対してライブプローブを実行。
- `--probe-provider <name>`: 特定のプロバイダーのみをプローブ。
- `--probe-profile <id>`: 特定のプロバイダープロファイル ID をプローブ（複数指定、またはカンマ区切り）。
- `--probe-timeout <ms>`: プローブのタイムアウト時間。
- `--probe-concurrency <n>`: プローブの並列実行数。
- `--probe-max-tokens <n>`: プローブで使用する最大トークン数。
- `--agent <id>`: 構成済みのエージェント ID。環境変数のディレクトリ指定を上書きします。

## エイリアスとフォールバック

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 認証プロファイル (Auth profiles)

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token
openclaw models auth paste-token
```

`models auth login` は、各プロバイダープラグインの認証フロー（OAuth や API キー入力）を開始します。インストールされているプロバイダーを確認するには `openclaw plugins list` を使用してください。

補足事項:
- `setup-token`: 任意のマシンで `claude setup-token` を実行して生成したセットアップトークンの入力を求めます。
- `paste-token`: 他の場所や自動化処理で生成されたトークン文字列を直接貼り付けます。
- Anthropic のポリシーに関する注意: セットアップトークンのサポートは技術的な互換性のためのものです。過去に Anthropic が Claude Code 以外からのサブスクリプション利用を制限した事例があるため、本番環境で利用する前に最新の利用規約を確認してください。
