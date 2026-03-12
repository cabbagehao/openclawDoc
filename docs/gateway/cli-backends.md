---
summary: "CLI バックエンド: ローカル AI CLI を活用したテキスト専用フォールバック機能"
read_when:
  - API プロバイダーの障害時に備えて、信頼性の高いフォールバック経路を確保したい場合
  - Claude Code CLI や他のローカル AI CLI を既に利用しており、それを再利用したい場合
  - ツール実行を伴わないテキスト専用の処理において、セッションや画像を維持しつつ安定した経路が必要な場合
title: "CLI バックエンド"
x-i18n:
  source_hash: "3c0477463a7eb051e535a249253662261043bc6fa7d0ce91eb28b6780c12a2b3"
---
OpenClaw は、API プロバイダーがダウンしている場合やレート制限に達している場合、あるいは一時的に不安定な挙動を示す場合に、**ローカルの AI CLI** を **テキスト専用のフォールバック** として実行できます。この機能は意図的に制限されています:

- **ツール実行は無効**（ツール呼び出しは行われません）。
- **テキスト入力 → テキスト出力** の確実な動作。
- **セッションをサポート**（継続的なターンの文脈を維持）。
- **画像のパススルー**に対応（CLI が画像パスを受け入れ可能な場合）。

これはメインの経路ではなく、外部 API に依存せずに「常に動作する」テキスト応答を確保するための **セーフティネット** として設計されています。

## クイックスタート (初心者向け)

Claude Code CLI は **設定なし** ですぐに利用可能です（OpenClaw にデフォルト設定が組み込まれています）:

```bash
openclaw agent --message "こんにちは" --model claude-cli/opus-4.6
```

Codex CLI も同様に設定不要で動作します:

```bash
openclaw agent --message "こんにちは" --model codex-cli/gpt-5.4
```

ゲートウェイを launchd や systemd 下で実行しており、環境変数 `PATH` が最小限の場合は、コマンドの絶対パスのみを追加してください:

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

これだけで完了です。CLI 自体の認証が済んでいれば、追加のキーや認証設定は不要です。

## フォールバックとしての利用

プライマリモデルが失敗したときにのみ CLI バックエンドが動作するように、フォールバックリストに追加します:

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

補足事項:
- `agents.defaults.models` (許可リスト) を使用している場合は、そのリストに `claude-cli/...` を含める必要があります。
- プライマリプロバイダーでエラー（認証失敗、レート制限、タイムアウトなど）が発生すると、OpenClaw は次に CLI バックエンドを試行します。

## 構成の概要

すべての CLI バックエンドの設定は以下に記述します:

```
agents.defaults.cliBackends
```

各エントリは **プロバイダー ID**（例: `claude-cli`, `my-cli`）をキーとします。この ID がモデル参照の左側になります:

```
<provider>/<model>
```

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
```

## 仕組み

1. プロバイダーの接頭辞 (`claude-cli/...` 等) に基づいて **バックエンドを選択** します。
2. 他の経路と同じ OpenClaw のプロンプトとワークスペース文脈を使用して **システムプロンプトを構築** します。
3. 履歴の継続性を保つため、**セッション ID (対応している場合) と共に CLI を実行** します。
4. **出力を解析**（JSON またはプレーンテキスト）し、最終的なテキストを返します。
5. バックエンドごとに **セッション ID を永続化** し、以降のターンで同じ CLI セッションを再利用します。

## セッション管理

- CLI がセッションをサポートしている場合は、`sessionArg` (例: `--session-id`) を設定します。複数のフラグに ID を挿入する必要がある場合は `sessionArgs` (プレースホルダー `{sessionId}` を使用) を設定します。
- CLI が異なるフラグを持つ **再開（resume）用のサブコマンド** を使用する場合は、`resumeArgs` (再開時に `args` を置き換え) を設定し、必要に応じて JSON 以外の再開出力に対応するための `resumeOutput` も設定します。
- `sessionMode`:
  - `always`: 常にセッション ID を送信（保存された ID がなければ新規 UUID を生成）。
  - `existing`: 以前に保存された ID がある場合にのみ送信。
  - `none`: セッション ID を送信しない。

## 画像 (パススルー)

CLI が画像パスを受け入れ可能な場合は、`imageArg` を設定してください:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw は base64 画像を一時ファイルに書き出します。`imageArg` が設定されていればそのパスが CLI 引数として渡されます。`imageArg` が未設定の場合、OpenClaw はプロンプト末尾にファイルパスを付加します（パス注入）。これは、通常のファイルパスからローカルファイルを自動ロードする CLI（Claude Code CLI 等の挙動）において有効です。

## 入出力

- `output: "json"` (デフォルト): JSON をパースし、テキストとセッション ID を抽出します。
- `output: "jsonl"`: JSONL ストリーム (Codex CLI の `--json` 等) をパースし、最後のエージェントメッセージと、存在すれば `thread_id` を抽出します。
- `output: "text"`: 標準出力をそのまま最終回答として扱います。

入力モード:
- `input: "arg"` (デフォルト): プロンプトを最後の CLI 引数として渡します。
- `input: "stdin"`: プロンプトを標準入力 (stdin) 経由で送信します。
- プロンプトが非常に長く、かつ `maxPromptArgChars` が設定されている場合、自動的に標準入力が使用されます。

## 組み込みのデフォルト設定

OpenClaw は `claude-cli` 用のデフォルト設定を同梱しています:

- `command: "claude"`
- `args: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

また、`codex-cli` 用のデフォルト設定も同梱されています:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

これらは、絶対パスによる `command` 指定など、必要な場合にのみ上書きしてください。

## 制限事項

- **OpenClaw ツールの利用不可**: CLI バックエンド側で OpenClaw のツール呼び出しを受け取ることはありません（CLI 自体が独自のツール実行機能を備えている場合は、そちらが動作することがあります）。
- **非ストリーミング**: CLI の出力をすべて収集した後に返信が行われます。
- **構造化出力**: 抽出精度は CLI 側の JSON フォーマットに依存します。
- **Codex CLI セッション**: 再開時はテキスト出力 (JSONL ではない) となるため、初回の `--json` 実行時よりも構造化の度合いが低下します。OpenClaw のセッション管理自体は通常通り機能します。

## トラブルシューティング

- **CLI が見つからない**: `command` に絶対パスを設定してください。
- **モデル名が正しくない**: `modelAliases` を使用して `provider/model` → CLI 用のモデル名へとマッピングしてください。
- **セッションが継続しない**: `sessionArg` が正しく、かつ `sessionMode` が `none` 以外であることを確認してください（なお、Codex CLI は現在 JSON 出力での再開に対応していません）。
- **画像が無視される**: `imageArg` を設定し、かつ CLI 側がファイルパスからの画像ロードに対応しているか確認してください。
