---
summary: "OpenClawが環境変数を読み込む場所とその優先順位"
read_when:
  - どの環境変数がどのような順序で読み込まれるかを知る必要がある場合
  - ゲートウェイでAPIキーが認識されない問題をデバッグする場合
  - プロバイダー認証やデプロイ環境についてドキュメントを作成する場合
title: "環境変数"
---

# 環境変数

OpenClawは、複数のソースから環境変数を読み込みます。基本ルールは、**「既存の値は決して上書きしない」** という点です。

## 優先順位 (高 → 低)

1. **プロセス環境変数**: 親シェルやデーモンからゲートウェイプロセスが既に継承している値。
2. **カレントディレクトリの `.env`**: dotenvのデフォルト動作（上書きはしません）。
3. **グローバルの `.env`**: `~/.openclaw/.env`（または `$OPENCLAW_STATE_DIR/.env`）にあるファイル（上書きはしません）。
4. **設定ファイルの `env` ブロック**: `~/.openclaw/openclaw.json` 内の設定（値が存在しない場合にのみ適用）。
5. **オプションのログインシェルからのインポート**: `env.shellEnv.enabled` または `OPENCLAW_LOAD_SHELL_ENV=1` が有効な場合、不足しているキーのみインポート。

設定ファイル自体が存在しない場合はステップ4はスキップされますが、有効であればシェルからのインポート（ステップ5）は実行されます。

## 設定ファイルの `env` ブロック

インラインで環境変数を設定するには、以下の2つの同等な方法があります（どちらも上書きはしません）。

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## シェル環境のインポート

`env.shellEnv` を設定すると、ログインシェルを実行し、**不足している** 期待されるキーのみをインポートします。

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

対応する環境変数：

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## ランタイムによって注入される環境変数

OpenClawは、生成される子プロセスにコンテキストマーカーを注入します。

- `OPENCLAW_SHELL=exec`: `exec` ツールを介して実行されるコマンドに設定されます。
- `OPENCLAW_SHELL=acp`: ACPランタイムのバックエンドプロセス（`acpx` など）に設定されます。
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client` がACPブリッジプロセスを生成する際に設定されます。
- `OPENCLAW_SHELL=tui-local`: ローカルTUIの `!` シェルコマンドに設定されます。

これらは実行時のマーカーであり、ユーザーによる設定は不要です。シェルやプロファイルのロジックで、コンテキストに応じたルールを適用するために利用できます。

## UI関連の環境変数

- `OPENCLAW_THEME=light`: ターミナルの背景が明るい場合に、ライトテーマのTUIパレットを強制します。
- `OPENCLAW_THEME=dark`: ダークテーマのTUIパレットを強制します。
- `COLORFGBG`: ターミナルがこの変数をエクスポートしている場合、OpenClawは背景色のヒントとして利用し、TUIパレットを自動選択します。

## 設定ファイル内での環境変数の置換

設定ファイル内の文字列値で、`${VAR_NAME}` 構文を使用して環境変数を直接参照できます。

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

詳細は [設定: 設定ファイル内での環境変数置換](/gateway/configuration#env-var-substitution-in-config) を参照してください。

## シークレット参照 vs `${ENV}` 文字列

OpenClawは、環境変数を活用する2つのパターンをサポートしています。

- 設定値における `${VAR}` 文字列置換。
- シークレット参照をサポートするフィールドでの SecretRef オブジェクト（`{ source: "env", provider: "default", id: "VAR" }`）。

どちらも、有効化（activation）のタイミングでプロセス環境変数から解決されます。SecretRefの詳細については [シークレット管理](/gateway/secrets) を参照してください。

## パス関連の環境変数

| 変数名 | 用途 |
| :--- | :--- |
| `OPENCLAW_HOME` | すべての内部パス解決（`~/.openclaw/`、エージェントディレクトリ、セッション、認証情報など）に使用されるホームディレクトリを上書きします。OpenClawを専用のサービスユーザーとして実行する場合に便利です。 |
| `OPENCLAW_STATE_DIR` | 状態保存ディレクトリ（デフォルトは `~/.openclaw`）を上書きします。 |
| `OPENCLAW_CONFIG_PATH` | 設定ファイルのパス（デフォルトは `~/.openclaw/openclaw.json`）を上書きします。 |

## ロギング関連の環境変数

| 変数名 | 用途 |
| :--- | :--- |
| `OPENCLAW_LOG_LEVEL` | ファイルとコンソールの両方のログレベル（`debug`, `trace` など）を上書きします。設定ファイル内の `logging.level` や `logging.consoleLevel` よりも優先されます。不正な値は無視され、警告が表示されます。 |

### `OPENCLAW_HOME`

`OPENCLAW_HOME` が設定されると、すべての内部パス解決においてシステム上のホームディレクトリ（`$HOME` や `os.homedir()`）の代わりに使用されます。これにより、ヘッドレスなサービスアカウントにおいてファイルシステムの完全な分離が可能になります。

**優先順位:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**例** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/kira</string>
</dict>
```

`OPENCLAW_HOME` にはチルダを含むパス（例：`~/svc`）を指定することもでき、使用前に現在の `$HOME` を使用して展開されます。

## 関連情報

- [ゲートウェイの設定](/gateway/configuration)
- [FAQ: 環境変数と .env の読み込み](/help/faq#env-vars-and-env-loading)
- [モデルの概要](/concepts/models)
