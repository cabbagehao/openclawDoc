---
summary: "CLI バックエンド: ローカル AI CLI を介したテキストのみのフォールバック"
read_when:
  - API プロバイダーに障害が発生した場合に信頼性の高いフォールバックが必要な場合
  - Claude Code CLI または他のローカル AI CLI を実行していて、それらを再利用したい
  - セッションと画像をサポートする、テキストのみでツール不要のパスが必要です
title: "CLIバックエンド"
x-i18n:
  source_hash: "3c0477463a7eb051e535a249253662261043bc6fa7d0ce91eb28b6780c12a2b3"
---

# CLI バックエンド (フォールバック ランタイム)

OpenClaw は、API プロバイダーがダウンしたときに **ローカル AI CLI** を **テキストのみのフォールバック**として実行できます。
レートが制限されている、または一時的に不正な動作が発生している可能性があります。これは意図的に保守的です:

- **ツールは無効になっています** (ツール呼び出しはありません)。
- **テキスト入力→テキスト出力** (信頼性)。
- **セッションがサポートされています** (したがって、フォローアップ ターンの一貫性が保たれます)。
- **CLI がイメージ パスを受け入れる場合、**イメージをパススルーできます\*\*。

これは、プライマリ パスではなく **セーフティ ネット**として設計されています。こんなときに使ってください
外部 API に依存せずに「常に機能する」テキスト応答が必要です。

## 初心者向けのクイックスタート

Claude Code CLI **設定なし** を使用できます (OpenClaw にはデフォルトが組み込まれています)。

```bash
openclaw agent --message "hi" --model claude-cli/opus-4.6
```

Codex CLI もすぐに使用できます。

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

ゲートウェイが launchd/systemd で実行されており、PATH が最小限の場合は、
コマンドパス:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

それです。キーや CLI 自体以外に追加の認証設定は必要ありません。

## フォールバックとして使用する

CLI バックエンドをフォールバック リストに追加して、プライマリ モデルが失敗した場合にのみ実行されるようにします。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/opus-4.6", "claude-cli/opus-4.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/opus-4.6": {},
        "claude-cli/opus-4.5": {},
      },
    },
  },
}
```

注:

- `agents.defaults.models` (許可リスト) を使用する場合は、`claude-cli/...` を含める必要があります。
- プライマリプロバイダーが失敗した場合 (認証、レート制限、タイムアウト)、OpenClaw は
  次に CLI バックエンドを試してください。

## 構成の概要

すべての CLI バックエンドは以下の下に存在します。

````
agents.defaults.cliBackends
```各エントリは **プロバイダー ID** によってキー付けされます (例: `claude-cli`、`my-cli`)。
プロバイダー ID はモデル参照の左側になります。

````

\<\provider\>/\<model\>

````

### 構成例

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-opus-4-5": "opus",
            "claude-sonnet-4-5": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
````

## 仕組み

1. プロバイダーのプレフィックス (`claude-cli/...`) に基づいて **バックエンドを選択します**。
2. 同じ OpenClaw プロンプトとワークスペース コンテキストを使用して **システム プロンプト**を構築します。
3. **セッション ID (サポートされている場合) を使用して CLI を実行**し、履歴の一貫性を保ちます。
4. **出力を解析** (JSON またはプレーン テキスト) し、最終テキストを返します。
5. バックエンドごとに **セッション ID を保持**するため、フォローアップでは同じ CLI セッションが再利用されます。

## セッション

- CLI がセッションをサポートしている場合は、`sessionArg` (例: `--session-id`) を設定するか、
  ID を挿入する必要がある場合は、`sessionArgs` (プレースホルダー `{sessionId}`)
  複数のフラグに分割します。
- CLI が異なるフラグを持つ **resume サブコマンド**を使用する場合、
  `resumeArgs` (再開時に `args` を置き換えます)、およびオプションの `resumeOutput`
  (JSON 以外の履歴書の場合)。
- `sessionMode`:
  - `always`: 常にセッション ID (何も保存されていない場合は新しい UUID) を送信します。
  - `existing`: セッション ID が以前に保存されている場合にのみ送信します。
  - `none`: セッション ID を送信しないでください。

## 画像 (パススルー)

CLI がイメージ パスを受け入れる場合は、`imageArg` を設定します。

````json5
imageArg: "--image",
imageMode: "repeat"
```OpenClaw は、base64 イメージを一時ファイルに書き込みます。 `imageArg` が設定されている場合、それらは
パスは CLI 引数として渡されます。 `imageArg` が欠落している場合、OpenClaw は
プロンプトへのファイル パス (パス インジェクション)。これは、自動実行する CLI には十分です。
プレーン パスからローカル ファイルをロードします (Claude Code CLI の動作)。

## 入力/出力

- `output: "json"` (デフォルト) JSON を解析し、テキストとセッション ID を抽出しようとします。
- `output: "jsonl"` は、JSONL ストリーム (Codex CLI `--json`) を解析し、
  最後のエージェント メッセージと、存在する場合は `thread_id`。
- `output: "text"` は標準出力を最終応答として扱います。

入力モード:

- `input: "arg"` (デフォルト) は、最後の CLI 引数としてプロンプトを渡します。
- `input: "stdin"` は標準入力経由でプロンプトを送信します。
- プロンプトが非常に長く、`maxPromptArgChars` が設定されている場合は、stdin が使用されます。

## デフォルト (組み込み)

OpenClaw には、`claude-cli` のデフォルトが付属しています。

- `command: "claude"`
- `args: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

OpenClaw には、`codex-cli` のデフォルトも付属しています。

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

必要な場合にのみオーバーライドします (共通: 絶対 `command` パス)。

## 制限事項- **OpenClaw ツールなし** (CLI バックエンドはツール呼び出しを受信しません)。一部の CLI
  独自のエージェント ツールを引き続き実行する可能性があります。
- **ストリーミングなし** (CLI 出力が収集されて返されます)。
- **構造化された出力**は、CLI の JSON 形式に依存します。
- **Codex CLI セッション** はテキスト出力 (JSONL なし) 経由で再開されます。
  最初の `--json` 実行よりも構造化されています。 OpenClaw セッションは引き続き機能します
  普通に。

## トラブルシューティング

- **CLI が見つかりません**: `command` をフルパスに設定します。
- **モデル名が間違っています**: `modelAliases` を使用して `provider/model` → CLI モデルをマッピングします。
- **セッション継続性なし**: `sessionArg` が設定されており、`sessionMode` が設定されていないことを確認してください。
  `none` (Codex CLI は現在、JSON 出力で再開できません)。
- **イメージは無視されます**: `imageArg` を設定します (および CLI がファイル パスをサポートしていることを確認します)。
````
