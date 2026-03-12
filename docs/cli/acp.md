---
summary: "IDE 連携のために ACP ブリッジを実行する"
read_when:
  - ACP ベースの IDE 連携をセットアップする場合
  - ゲートウェイへの ACP セッションルーティングをデバッグする場合
title: "OpenClaw CLI: openclaw acp コマンドの使い方と主要オプション・実行例"
description: "OpenClaw ゲートウェイと通信する Agent Client Protocol (ACP) ブリッジを実行します。このコマンドは、IDE 等との標準入出力を介した ACP 通信を行い、プロンプトを WebSocket 経由でゲートウェイに転送します。"
x-i18n:
  source_hash: "dfc8230568ae37649a303d532dc332f73b5d69a3358ae7b68a872c7d1614ec7f"
---
OpenClaw ゲートウェイと通信する [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ブリッジを実行します。

このコマンドは、IDE 等との標準入出力を介した ACP 通信を行い、プロンプトを WebSocket 経由でゲートウェイに転送します。ACP セッションとゲートウェイのセッションキーのマッピングを維持します。

`openclaw acp` はゲートウェイをバックエンドとする ACP ブリッジであり、完全な ACP ネイティブのエディタランタイムではありません。セッションのルーティング、プロンプトの配信、および基本的なストリーミング更新に重点を置いています。

## 互換性マトリックス

| ACP 領域 | ステータス | 備考 |
| :--- | :--- | :--- |
| `initialize`, `newSession`, `prompt`, `cancel` | 実装済み | 標準入出力を介したブリッジフロー。ゲートウェイへの chat/send および実行中止に対応。 |
| `listSessions`, スラッシュコマンド | 実装済み | セッション一覧はゲートウェイのセッション状態に基づきます。コマンドは `available_commands_update` 経由で通知されます。 |
| `loadSession` | 部分的 | ACP セッションをゲートウェイのセッションキーに再バインドし、保存されているユーザー/アシスタントのテキスト履歴を再生します。ツールやシステムの履歴はまだ再構築されません。 |
| プロンプト内容 (`text`, 埋め込み `resource`, 画像) | 部分的 | テキストやリソースはチャット入力にフラット化されます。画像はゲートウェイの添付ファイルになります。 |
| セッションモード | 部分的 | `session/set_mode` がサポートされています。ブリッジは、思考レベル、ツールの詳細度、推論、使用状況の詳細、および権限昇格アクションに対するゲートウェイベースの初期制御を公開します。広範な ACP ネイティブのモードや構成は対象外です。 |
| セッション情報と使用状況の更新 | 部分的 | キャッシュされたゲートウェイのセッションスナップショットから `session_info_update` と、ベストエフォートで `usage_update` 通知を発行します。使用状況は概算であり、ゲートウェイのトークン合計が更新された場合にのみ送信されます。 |
| ツールストリーミング | 部分的 | `tool_call` / `tool_call_update` イベントには、生の I/O、テキスト内容、およびゲートウェイツールの引数/結果に含まれる場合はベストエフォートでファイル位置が含まれます。埋め込みターミナルやリッチな diff 出力にはまだ対応していません。 |
| セッションごとの MCP サーバー (`mcpServers`) | 未サポート | ブリッジモードではセッションごとの MCP サーバー要求を拒否します。代わりに OpenClaw のゲートウェイまたはエージェントで MCP を構成してください。 |
| クライアント側ファイルシステムメソッド (`fs/read_text_file`, `fs/write_text_file`) | 未サポート | ブリッジは ACP クライアントのファイルシステムメソッドを呼び出しません。 |
| クライアント側ターミナルメソッド (`terminal/*`) | 未サポート | ブリッジは ACP クライアントターミナルを作成したり、ツール呼び出しを通じてターミナル ID をストリーミングしたりしません。 |
| セッションプラン / 思考ストリーミング | 未サポート | 現在、ブリッジは出力テキストとツールのステータスのみを出力し、ACP のプランや思考プロセスの更新は出力しません。 |

## 既知の制限事項

- `loadSession` は保存されたユーザーとアシスタントのテキスト履歴を再生しますが、過去のツール呼び出し、システム通知、またはリッチな ACP ネイティブイベントタイプは再構築しません。
- 複数の ACP クライアントが同じゲートウェイセッションキーを共有する場合、イベントやキャンセル（中断）のルーティングはクライアントごとに厳密に分離されるのではなく、ベストエフォートになります。クリーンなエディタローカルのターンが必要な場合は、デフォルトの分離された `acp:<uuid>` セッションを使用してください。
- ゲートウェイの停止状態は ACP の停止理由に変換されますが、そのマッピングは完全な ACP ネイティブランタイムほど表現力が高くありません。
- 初期のセッション制御は、現在、思考レベル、ツールの詳細度、推論、使用状況の詳細、および権限昇格アクションといった、ゲートウェイの設定のサブセットのみを対象としています。モデル選択や実行ホストの制御は、まだ ACP 構成オプションとして公開されていません。
- `session_info_update` と `usage_update` は、ライブの ACP ネイティブランタイム計測ではなく、ゲートウェイのセッションスナップショットから派生しています。使用状況は概算であり、コストデータは含まれず、ゲートウェイがトークン合計データを「最新」とマークした場合にのみ発行されます。
- ツールの追跡データはベストエフォートです。ブリッジは既知のツールの引数や結果に現れるファイルパスを表示できますが、ACP ターミナルや構造化されたファイル diff はまだ発行しません。

## 使用法

```bash
openclaw acp

# リモートゲートウェイへの接続
openclaw acp --url wss://gateway-host:18789 --token <token>

# リモートゲートウェイへの接続 (トークンをファイルから読み込む)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 既存のセッションキーにアタッチ
openclaw acp --session agent:main:main

# ラベルで指定してアタッチ (既存のラベルである必要があります)
openclaw acp --session-label "support inbox"

# 初回プロンプトの前にセッションキーをリセット
openclaw acp --session agent:main:main --reset-session
```

## ACP クライアント (デバッグ用)

IDE を介さずにブリッジの動作確認を行うための組み込み ACP クライアントです。ACP ブリッジを起動し、対話的にプロンプトを入力できます。

```bash
openclaw acp client

# 起動したブリッジをリモートゲートウェイに向ける
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# サーバーコマンドを上書き (デフォルト: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

権限モデル (クライアントデバッグモード):

- 自動承認は許可リストに基づいており、信頼されたコアツール ID にのみ適用されます。
- `read` の自動承認は、現在の作業ディレクトリ（`--cwd` 設定時）に制限されます。
- 未知のツールや非コアツール、範囲外の読み取り、および危険なツールには、常に明示的な承認プロンプトが必要です。
- サーバーから提供される `toolCall.kind` は、信頼できないメタデータとして扱われます（権限付与の根拠にはなりません）。

## 利用手順

IDE（または他のクライアント）が Agent Client Protocol をサポートしており、OpenClaw ゲートウェイのセッションを操作したい場合に ACP を使用します。

1. ゲートウェイが起動していることを確認します（ローカルまたはリモート）。
2. ゲートウェイの接続先を構成します（構成ファイルまたはフラグ）。
3. IDE の設定で、stdio 経由で `openclaw acp` を実行するように指定します。

構成例（永続化する場合）:

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

直接実行する場合（構成を書き換えない）:

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# ローカルプロセスの安全性の観点から以下を推奨します
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## エージェントの選択

ACP はエージェントを直接選択するのではなく、ゲートウェイのセッションキーによってルーティングを行います。

特定のエージェントをターゲットにするには、エージェントスコープのセッションキーを使用します:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

各 ACP セッションは単一のゲートウェイセッションキーにマップされます。1 つのエージェントが複数のセッションを持つことができます。ACP は、キーやラベルを明示的に上書きしない限り、デフォルトで分離された `acp:<uuid>` セッションを使用します。

ブリッジモードでは、セッションごとの `mcpServers` はサポートされていません。ACP クライアントが `newSession` や `loadSession` 時にこれらを送信した場合、ブリッジは黙って無視するのではなく、明確なエラーを返します。

## `acpx` (Codex, Claude Code 等の ACP クライアント) からの利用

Codex や Claude Code などのコーディングエージェントから OpenClaw ボットと ACP 経由で通信したい場合は、`acpx` の組み込み `openclaw` ターゲットを使用します。

標準的な流れ:

1. ゲートウェイを実行し、ACP ブリッジから到達可能であることを確認します。
2. `acpx openclaw` の参照先として `openclaw acp` を指定します。
3. コーディングエージェントに使用させたい OpenClaw のセッションキーを指定します。

実行例:

```bash
# デフォルトの OpenClaw ACP セッションに対して一度限りの要求を行う
acpx openclaw exec "現在の OpenClaw セッションの状態を要約してください。"

# 継続的なターンのために永続的な名前付きセッションを使用する
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "仕事用の OpenClaw エージェントに、このリポジトリに関連する最近のコンテキストを尋ねてください。"
```

毎回特定のゲートウェイとセッションキーをターゲットにしたい場合は、`~/.acpx/config.json` で `openclaw` エージェントコマンドを上書きします:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

リポジトリローカルの OpenClaw チェックアウトを使用する場合は、ACP ストリームをクリーンに保つため、dev ランナーではなく直接的な CLI エントリポイントを使用してください。例:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

これは、Codex や Claude Code などの ACP 対応クライアントが、ターミナルの画面をスクレイピングすることなく、OpenClaw エージェントからコンテキスト情報を取得するための最も簡単な方法です。

## Zed エディタのセットアップ

`~/.config/zed/settings.json` にカスタム ACP エージェントを追加します（または Zed の設定 UI を使用します）:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

特定のゲートウェイやエージェントを指定する場合:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Zed でエージェントパネルを開き、"OpenClaw ACP" を選択してスレッドを開始します。

## セッションマッピング

デフォルトでは、ACP セッションには `acp:` プレフィックスが付いた分離されたゲートウェイセッションキーが割り当てられます。既存のセッションを再利用するには、セッションキーまたはラベルを渡します。

- `--session <key>`: 特定のゲートウェイセッションキーを使用します。
- `--session-label <label>`: 既存のセッションをラベルで解決します。
- `--reset-session`: そのキーに対して新しいセッション ID を発行します（同じキーですが、履歴は新しくなります）。

ACP クライアントがメタデータをサポートしている場合は、セッションごとに上書き可能です:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

セッションキーの詳細については、[/concepts/session](/concepts/session) を参照してください。

## オプション

- `--url <url>`: ゲートウェイの WebSocket URL (構成済みであれば gateway.remote.url がデフォルトとなります)。
- `--token <token>`: ゲートウェイ認証トークン。
- `--token-file <path>`: ゲートウェイ認証トークンをファイルから読み込みます。
- `--password <password>`: ゲートウェイ認証パスワード。
- `--password-file <path>`: ゲートウェイ認証パスワードをファイルから読み込みます。
- `--session <key>`: デフォルトのセッションキー。
- `--session-label <label>`: 解決するデフォルトのセッションラベル。
- `--require-existing`: セッションキーやラベルが存在しない場合にエラーにします。
- `--reset-session`: 初回使用前にセッションキーをリセットします。
- `--no-prefix-cwd`: プロンプトの前に作業ディレクトリを付加しません。
- `--verbose, -v`: stderr への詳細ログ出力を有効にします。

セキュリティに関する注意:

- 一部のシステムでは、`--token` や `--password` はローカルのプロセス一覧から可視状態になる場合があります。
- `--token-file` / `--password-file` または環境変数 (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) の使用を推奨します。
- ゲートウェイ認証の解決は、他のゲートウェイクライアントと共通のルールに従います:
  - ローカルモード: 環境変数 (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.auth.*` 未設定時は `gateway.remote.*` へフォールバック
  - リモートモード: `gateway.remote.*` (リモート優先順位ルールによる環境変数/構成フォールバックあり)
  - `--url` 指定時は上書きが優先され、暗黙的な構成や環境変数の認証情報は再利用されません。明示的に `--token` / `--password` (またはファイル版) を指定してください。
- ACP ランタイムバックエンドの子プロセスは `OPENCLAW_SHELL=acp` を受け取ります。これはコンテキスト固有のシェルやプロフィールルールに使用できます。
- `openclaw acp client` は、起動したブリッジプロセスに `OPENCLAW_SHELL=acp-client` を設定します。

### `acp client` オプション

- `--cwd <dir>`: ACP セッションの作業ディレクトリ。
- `--server <command>`: ACP サーバーコマンド (デフォルト: `openclaw`)。
- `--server-args <args...>`: ACP サーバーに渡す追加の引数。
- `--server-verbose`: ACP サーバーの詳細ログ出力を有効にします。
- `--verbose, -v`: クライアントの詳細ログ出力。
