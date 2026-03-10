---
summary: "OpenClaw が環境変数をロードする場所と優先順位"
read_when:
  - どの環境変数がどのような順序でロードされるかを知る必要があります
  - ゲートウェイで不足している API キーをデバッグしています
  - プロバイダー認証またはデプロイメント環境を文書化している場合
title: "環境変数"
x-i18n:
  source_hash: "a3caee4ae6a3fe28451684b238f2a0c0023756521c203d8665c2dd0608048d63"
---

# 環境変数

OpenClaw は、複数のソースから環境変数を取得します。ルールは**既存の値を決して上書きしない**です。

## 優先順位 (最高→最低)

1. **プロセス環境** (ゲートウェイ プロセスが親シェル/デーモンからすでに持っているもの)。
2. 現在の作業ディレクトリ内の **`.env`** (dotenv のデフォルト。オーバーライドされません)。
3. **グローバル `.env`** `~/.openclaw/.env` (別名 `$OPENCLAW_STATE_DIR/.env`; オーバーライドされません)。
4. `~/.openclaw/openclaw.json` の **`env` ブロック**を構成します (欠落している場合にのみ適用されます)。
5. **オプションのログインシェルインポート** (`env.shellEnv.enabled` または `OPENCLAW_LOAD_SHELL_ENV=1`)。予期されるキーが欠落している場合にのみ適用されます。

構成ファイルが完全に欠落している場合は、ステップ 4 はスキップされます。シェルのインポートが有効になっている場合でも実行されます。

## `env` ブロックの構成

インライン環境変数を設定する 2 つの同等の方法 (どちらもオーバーライドされません)。

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

## シェル環境インポート

`env.shellEnv` はログイン シェルを実行し、**不足している** 予期されるキーのみをインポートします。

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

環境変数に相当するもの:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## ランタイムによって挿入される環境変数

OpenClaw は、生成された子プロセスにコンテキスト マーカーも挿入します。- `OPENCLAW_SHELL=exec`: `exec` ツールを通じて実行されるコマンド用に設定されます。

- `OPENCLAW_SHELL=acp`: ACP ランタイム バックエンド プロセス生成用に設定します (`acpx` など)。
- `OPENCLAW_SHELL=acp-client`: ACP ブリッジ プロセスを生成するときに `openclaw acp client` に設定されます。
- `OPENCLAW_SHELL=tui-local`: ローカル TUI `!` シェル コマンド用に設定します。

これらは実行時マーカーです (ユーザー構成は必要ありません)。シェル/プロファイル ロジックで使用できます。
コンテキスト固有のルールを適用します。

## UI 環境変数

- `OPENCLAW_THEME=light`: 端末の背景が明るい場合は、明るい TUI パレットを強制します。
- `OPENCLAW_THEME=dark`: ダーク TUI パレットを強制します。
- `COLORFGBG`: 端末がエクスポートする場合、OpenClaw は背景色のヒントを使用して TUI パレットを自動選択します。

## 構成内の環境変数の置換

`${VAR_NAME}` 構文を使用して、構成文字列値で環境変数を直接参照できます。

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

詳細については、[構成: 環境変数の置換](/gateway/configuration#env-var-substitution-in-config) を参照してください。

## シークレット参照と `${ENV}` 文字列

OpenClaw は、次の 2 つの環境主導のパターンをサポートしています。

- `${VAR}` 構成値の文字列置換。
- シークレット参照をサポートするフィールドの SecretRef オブジェクト (`{ source: "env", provider: "default", id: "VAR" }`)。

どちらもアクティブ化時にプロセス環境から解決されます。 SecretRef の詳細は、[シークレット管理](/gateway/secrets) に記載されています。

## パス関連の環境変数|変数 |目的 |

| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME` |すべての内部パス解決に使用されるホーム ディレクトリ (`~/.openclaw/`、エージェント ディレクトリ、セッション、資格情報) をオーバーライドします。 OpenClaw を専用サービス ユーザーとして実行する場合に便利です。 |
| `OPENCLAW_STATE_DIR` |状態ディレクトリ (デフォルト `~/.openclaw`) をオーバーライドします。 |
| `OPENCLAW_CONFIG_PATH` |構成ファイルのパス (デフォルトは `~/.openclaw/openclaw.json`) をオーバーライドします。 |

## ロギング|変数 |目的 |

| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` |ファイルとコンソールの両方のログ レベルを上書きします (例: `debug`、`trace`)。構成では `logging.level` および `logging.consoleLevel` よりも優先されます。無効な値は無視され、警告が表示されます。 |

### `OPENCLAW_HOME`

設定すると、`OPENCLAW_HOME` は、すべての内部パス解決のシステム ホーム ディレクトリ (`$HOME` / `os.homedir()`) を置き換えます。これにより、ヘッドレス サービス アカウントの完全なファイルシステム分離が可能になります。

**優先順位:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**例** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/kira</string>
</dict>
```

`OPENCLAW_HOME` はチルダ パス (例: `~/svc`) に設定することもできます。これは、使用前に `$HOME` を使用して展開されます。

## 関連

- [ゲートウェイ構成](/gateway/configuration)
- [FAQ: 環境変数と .env の読み込み](/help/faq#env-vars-and-env-loading)
- [モデル概要](/concepts/models)
