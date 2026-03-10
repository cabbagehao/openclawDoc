---
summary: "シークレット管理: SecretRef コントラクト、ランタイムスナップショットの動作、安全な一方向スクラブ"
read_when:
  - プロバイダー認証情報および `auth-profiles.json` 参照向けに SecretRefs を設定するとき
  - 本番環境でシークレットの reload、audit、configure、apply を安全に運用するとき
  - 起動時の fail-fast、非アクティブサーフェスのフィルタリング、last-known-good の動作を理解するとき
title: "シークレット管理"
---

# シークレット管理

OpenClaw は加算的な SecretRefs をサポートしているため、対応する認証情報を設定に平文で保存する必要がありません。

平文も引き続き使用できます。SecretRefs は認証情報ごとのオプトインです。

## 目標とランタイムモデル

シークレットはメモリ内のランタイムスナップショットに解決されます。

- 解決はリクエストパスでの遅延評価ではなく、アクティベーション中に eager に行われます。
- 実質的にアクティブな SecretRef を解決できない場合、起動は fail-fast します。
- reload は atomic swap を使用します。つまり、完全に成功するか、last-known-good スナップショットを維持します。
- ランタイムリクエストは、アクティブなメモリ内スナップショットのみを読み取ります。

これにより、シークレットプロバイダーの障害がホットなリクエストパスに入り込みません。

## アクティブサーフェスのフィルタリング

SecretRefs は、実質的にアクティブなサーフェスでのみ検証されます。

- 有効なサーフェス: 未解決の ref は startup/reload をブロックします。
- 非アクティブなサーフェス: 未解決の ref は startup/reload をブロックしません。
- 非アクティブな ref は、コード `SECRETS_REF_IGNORED_INACTIVE_SURFACE` を持つ非致命的な診断を出力します。

非アクティブなサーフェスの例:

- 無効化された channel/account エントリ。
- どの有効な account も継承しない、トップレベルの channel 認証情報。
- 無効化された tool/feature サーフェス。
- `tools.web.search.provider` で選択されていない、web search のプロバイダー固有キー。
  auto モードでは (provider 未設定)、プロバイダー固有キーもプロバイダー自動検出のためにアクティブです。
- `gateway.remote.token` / `gateway.remote.password` SecretRefs は、`gateway.remote.enabled` が `false` でない場合、次のいずれかが真ならアクティブです:
  - `gateway.mode=remote`
  - `gateway.remote.url` が設定されている
  - `gateway.tailscale.mode` が `serve` または `funnel`
    それらの remote サーフェスがない local モードでは:
  - `gateway.remote.token` は、token auth が優先され得て、かつ env/auth token が設定されていない場合にアクティブです。
  - `gateway.remote.password` は、password auth が優先され得て、かつ env/auth password が設定されていない場合にのみアクティブです。
- `gateway.auth.token` SecretRef は、`OPENCLAW_GATEWAY_TOKEN` (または `CLAWDBOT_GATEWAY_TOKEN`) が設定されている場合、起動時の auth 解決では非アクティブです。これはそのランタイムでは env token 入力が優先されるためです。

## Gateway 認証サーフェスの診断

`gateway.auth.token`、`gateway.auth.password`、
`gateway.remote.token`、または `gateway.remote.password` に SecretRef が設定されている場合、
Gateway の startup/reload ログはサーフェス状態を明示的に記録します:

- `active`: SecretRef は実効的な認証サーフェスの一部であり、解決されなければなりません。
- `inactive`: SecretRef は、このランタイムでは別の認証サーフェスが優先されるため、または
  remote auth が無効または非アクティブなため無視されます。

これらのエントリは `SECRETS_GATEWAY_AUTH_SURFACE` で記録され、アクティブサーフェス
ポリシーで使われた理由を含むため、認証情報がアクティブまたは非アクティブとして扱われた理由を確認できます。

## オンボーディング参照の preflight

オンボーディングがインタラクティブモードで実行され、SecretRef ストレージを選択すると、OpenClaw は保存前に preflight 検証を実行します:

- Env refs: env var 名を検証し、オンボーディング中に空でない値が見えていることを確認します。
- Provider refs (`file` または `exec`): プロバイダー選択を検証し、`id` を解決し、解決された値の型を確認します。
- Quickstart の再利用パス: `gateway.auth.token` がすでに SecretRef の場合、オンボーディングは probe/dashboard bootstrap の前にそれを解決します (`env`、`file`、`exec` refs 対応)。同じ fail-fast ゲートを使用します。

検証に失敗した場合、オンボーディングはエラーを表示し、再試行できます。

## SecretRef コントラクト

どこでも同じオブジェクト形状を使用してください:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

検証:

- `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
- `id` は `^[A-Z][A-Z0-9_]{0,127}$` に一致する必要があります

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

検証:

- `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
- `id` は絶対 JSON pointer (`/...`) でなければなりません
- セグメント内の RFC6901 エスケープ: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

検証:

- `provider` は `^[a-z][a-z0-9_-]{0,63}$` に一致する必要があります
- `id` は `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$` に一致する必要があります

## プロバイダー設定

プロバイダーは `secrets.providers` の下で定義します:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Env プロバイダー

- `allowlist` による任意の allowlist をサポートします。
- env 値がない、または空の場合は解決に失敗します。

### File プロバイダー

- `path` からローカルファイルを読み取ります。
- `mode: "json"` は JSON オブジェクトのペイロードを想定し、`id` を pointer として解決します。
- `mode: "singleValue"` は ref id `"value"` を想定し、ファイル内容を返します。
- パスは所有権/権限チェックに合格する必要があります。
- Windows の fail-closed に関する注記: パスの ACL 検証が利用できない場合、解決は失敗します。信頼済みパスに限り、そのプロバイダーで `allowInsecurePath: true` を設定すると、パスセキュリティチェックをバイパスできます。

### Exec プロバイダー

- 設定された絶対バイナリパスを実行し、shell は使いません。
- デフォルトでは、`command` は通常ファイルを指している必要があります (symlink 不可)。
- symlink の command パスを許可するには `allowSymlinkCommand: true` を設定します (例: Homebrew の shim) 。OpenClaw は解決後のターゲットパスを検証します。
- パッケージマネージャーのパスには `allowSymlinkCommand` を `trustedDirs` と組み合わせて使用してください (例: `["/opt/homebrew"]`)。
- timeout、no-output timeout、出力バイト数制限、env allowlist、trusted dirs をサポートします。
- Windows の fail-closed に関する注記: command パスの ACL 検証が利用できない場合、解決は失敗します。信頼済みパスに限り、そのプロバイダーで `allowInsecurePath: true` を設定すると、パスセキュリティチェックをバイパスできます。

リクエストペイロード (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

レスポンスペイロード (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

任意の id ごとのエラー:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Exec 統合の例

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## 対応する認証情報サーフェス

正式にサポートされる認証情報と非サポートの認証情報は、以下に一覧があります:

- [SecretRef 認証情報サーフェス](/reference/secretref-credential-surface)

ランタイムで発行される、またはローテーションされる認証情報、および OAuth の refresh material は、読み取り専用の SecretRef 解決から意図的に除外されています。

## 必須動作と優先順位

- ref のないフィールド: 変更なし。
- ref のあるフィールド: アクティブサーフェスでは、アクティベーション中に必須です。
- 平文と ref の両方がある場合、対応する precedence path では ref が優先されます。

警告および audit シグナル:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (ランタイム警告)
- `REF_SHADOWED` (`auth-profiles.json` の認証情報が `openclaw.json` refs より優先される場合の audit finding)

Google Chat 互換動作:

- `serviceAccountRef` は平文の `serviceAccount` より優先されます。
- 兄弟 ref が設定されている場合、平文値は無視されます。

## アクティベーショントリガー

シークレットのアクティベーションは次のタイミングで実行されます:

- 起動時 (preflight と最終アクティベーション)
- Config reload の hot-apply パス
- Config reload の restart-check パス
- `secrets.reload` による手動 reload

アクティベーション契約:

- 成功するとスナップショットが atomic に入れ替わります。
- 起動時の失敗は Gateway の起動を中止します。
- ランタイム reload の失敗時は last-known-good スナップショットを維持します。

## 劣化および回復シグナル

正常な状態の後に reload 時のアクティベーションが失敗すると、OpenClaw は degraded secrets state に入ります。

一度だけ発行される system event と log code:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

動作:

- Degraded: ランタイムは last-known-good スナップショットを維持します。
- Recovered: 次のアクティベーション成功後に一度だけ発行されます。
- すでに degraded の間に失敗が繰り返されても、警告は記録されますがイベントは過剰に発行されません。
- 起動時の fail-fast は、ランタイムが一度もアクティブになっていないため、degraded event を発行しません。

## コマンドパスの解決

コマンドパスは、Gateway snapshot RPC を通じてサポートされた SecretRef 解決にオプトインできます。

大きく分けて 2 つの動作があります:

- Strict なコマンドパス (例: `openclaw memory` の remote-memory パスや `openclaw qr --remote`) はアクティブなスナップショットから読み取り、必要な SecretRef が利用できない場合は fail-fast します。
- 読み取り専用コマンドパス (例: `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、および読み取り専用の doctor/config repair フロー) もアクティブなスナップショットを優先しますが、そのコマンドパスで対象の SecretRef が利用できない場合は中止せず degraded します。

読み取り専用の動作:

- Gateway が実行中の場合、これらのコマンドはまずアクティブなスナップショットから読み取ります。
- Gateway による解決が不完全、または Gateway が利用できない場合、特定のコマンドサーフェスに対する対象限定のローカル fallback を試みます。
- 対象の SecretRef がまだ利用できない場合、コマンドは「configured but unavailable in this command path」のような明示的な診断付きで、degraded な読み取り専用出力を継続します。
- この degraded 動作はコマンドローカルに限られます。ランタイムの startup、reload、send/auth パスは弱められません。

その他の注記:

- バックエンドでシークレットがローテーションされた後のスナップショット更新は、`openclaw secrets reload` で処理されます。
- これらのコマンドパスで使用される Gateway RPC メソッド: `secrets.resolve`。

## Audit と configure のワークフロー

デフォルトのオペレーターフロー:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

findings には次が含まれます:

- 保存時の平文値 (`openclaw.json`、`auth-profiles.json`、`.env`、生成された `agents/*/agent/models.json`)
- 生成された `models.json` エントリ内に残る、機密性の高いプロバイダーヘッダーの平文残留
- 未解決の refs
- precedence shadowing (`auth-profiles.json` が `openclaw.json` refs より優先される)
- レガシー残留物 (`auth.json`、OAuth の reminders)

ヘッダー残留に関する注記:

- 機密性の高いプロバイダーヘッダーの検出は、名前ヒューリスティックに基づきます (一般的な auth/credential ヘッダー名や、`authorization`、`x-api-key`、`token`、`secret`、`password`、`credential` といった断片)。

### `secrets configure`

次を行うインタラクティブヘルパー:

- まず `secrets.providers` を設定します (`env`/`file`/`exec`、追加/編集/削除)
- `openclaw.json` 内の対応するシークレット保持フィールドと、1 つの agent スコープに対する `auth-profiles.json` を選択できます
- 対象ピッカー内で新しい `auth-profiles.json` マッピングを直接作成できます
- SecretRef の詳細 (`source`、`provider`、`id`) を取得します
- preflight 解決を実行します
- すぐに apply できます

便利なモード:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

`configure` apply のデフォルト動作:

- 対象プロバイダーについて、`auth-profiles.json` から一致する静的認証情報をスクラブします
- `auth.json` からレガシーな静的 `api_key` エントリをスクラブします
- `<config-dir>/.env` から一致する既知のシークレット行をスクラブします

### `secrets apply`

保存済みプランを適用します:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
```

厳密なターゲット/パス契約の詳細と正確な拒否ルールについては、以下を参照してください:

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

## 一方向安全ポリシー

OpenClaw は、過去の平文シークレット値を含む rollback backup を意図的に書き込みません。

安全性モデル:

- 書き込みモードの前に preflight が成功している必要があります
- commit 前にランタイムアクティベーションが検証されます
- apply は atomic なファイル置換でファイルを更新し、失敗時は best-effort で復元します

## レガシー auth 互換性に関する注記

静的認証情報については、ランタイムはもはや平文のレガシー auth ストレージに依存しません。

- ランタイム認証情報のソースは、解決済みのメモリ内スナップショットです。
- レガシーな静的 `api_key` エントリは、見つかり次第スクラブされます。
- OAuth 関連の互換動作は引き続き別扱いです。

## Web UI に関する注記

一部の SecretInput union は、form モードより raw editor モードの方が設定しやすい場合があります。

## 関連ドキュメント

- CLI コマンド: [secrets](/cli/secrets)
- プラン契約の詳細: [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)
- 認証情報サーフェス: [SecretRef 認証情報サーフェス](/reference/secretref-credential-surface)
- Auth セットアップ: [Authentication](/gateway/authentication)
- セキュリティ態勢: [Security](/gateway/security)
- 環境変数の優先順位: [Environment Variables](/help/environment)
