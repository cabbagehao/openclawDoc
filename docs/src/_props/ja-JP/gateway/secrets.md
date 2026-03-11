---
summary: "シークレット管理: SecretRef の仕様、実行時スナップショットの挙動、および安全な平文消去（スクラブ）"
read_when:
  - プロバイダー認証情報や `auth-profiles.json` 向けに SecretRef を設定する場合
  - 本番環境でシークレットの再読み込み、監査、構成、適用を安全に行いたい場合
  - 起動時の Fail-fast（即時終了）、非アクティブな設定のフィルタリング、前回正常時の設定維持の仕組みを理解したい場合
title: "シークレット管理"
---

# シークレット管理

OpenClaw は、**SecretRef** と呼ばれる参照形式の認証設定をサポートしています。これにより、API キーなどの機密情報を設定ファイル内に平文で保存する必要がなくなります。

平文での保存も引き続き可能ですが、個別の認証情報ごとに SecretRef への移行をオプトイン（選択）できます。

## 目標と実行モデル

シークレット（機密情報）は、メモリ内の **実行時スナップショット** へと解決されます。

* 解決はエージェントのアクティベーション（有効化）時に一括して行われます。リクエストのたびに外部へ問い合わせることはありません。
* 起動時に、有効な SecretRef の解決に失敗した場合は、Fail-fast（即時終了）します。
* 再読み込み（Reload）はアトミックに入れ替わります。解決に失敗した場合は、前回正常時のスナップショットが維持されます。
* 実行時のリクエストは、アクティブなメモリ内スナップショットからのみ値を読み取ります。

これにより、シークレットの提供元（環境変数や外部 Vault 等）が一時的にダウンしていても、実行中のリクエストに影響を与えないようになっています。

## アクティブな設定項目のフィルタリング

SecretRef の検証は、**実質的に有効（アクティブ）** な項目に対してのみ行われます。

* **有効な設定**: 未解決の SecretRef があると、起動や再読み込みがブロックされます。
* **無効な設定**: 構成上使用されていない項目の SecretRef は、解決できなくても起動を妨げません。
* 非アクティブな SecretRef については、致命的でない診断情報として `SECRETS_REF_IGNORED_INACTIVE_SURFACE` が出力されます。

非アクティブとみなされる例:

* 無効化されているチャネルやアカウント。
* どのアカウントからも継承されていない、トップレベルのチャネル認証情報。
* 無効化されているツールや機能。
* `tools.web.search.provider` で選択されていない、特定の検索プロバイダーのキー。
  （ただし、プロバイダーが自動選択モードの場合は、候補となるプロバイダーのキーはすべてアクティブとみなされます）
* `gateway.remote.token` / `gateway.remote.password` は、以下のいずれかの場合にのみアクティブになります:
  * `gateway.mode=remote` である。
  * `gateway.remote.url` が構成されている。
  * `gateway.tailscale.mode` が `serve` または `funnel` である。
* `gateway.auth.token` は、環境変数 `OPENCLAW_GATEWAY_TOKEN` が設定されている場合は非アクティブとなります（環境変数が優先されるため）。

## ゲートウェイ認証の診断ログ

`gateway.auth.*` や `gateway.remote.*` に SecretRef が設定されている場合、起動時や再読み込み時にその状態がログに出力されます:

* `active`: その SecretRef は認証に必須であり、解決に成功する必要があります。
* `inactive`: 他の認証設定が優先されているか、リモート認証が無効なため、解決はスキップされました。

これらのログは `SECRETS_GATEWAY_AUTH_SURFACE` として記録され、なぜその項目がアクティブ（または非アクティブ）と判断されたかの理由も付記されます。

## オンボーディング時の検証 (Preflight)

`openclaw onboard` で SecretRef を選択した場合、保存前に事前検証が行われます:

* **環境変数 (`env`)**: 変数名が正しく、オンボーディングを実行している環境から空でない値が読み取れるかを確認します。
* **外部プロバイダー (`file`, `exec`)**: 指定したプロバイダーで対象 ID を解決できるか、および返された値の型が正しいかを確認します。
* **クイックスタートの再利用**: すでに `gateway.auth.token` に SecretRef が設定されている場合、ダッシュボード等のセットアップ前にその解決を試みます。

検証に失敗した場合は、エラー理由が表示され、再試行することができます。

## SecretRef の仕様 (Contract)

すべての箇所で以下の共通オブジェクト形式を使用します:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"` (環境変数)

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

バリデーションルール:

* `provider`: `^[a-z][a-z0-9_-]{0,63}$`
* `id`: `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"` (ファイル)

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

バリデーションルール:

* `provider`: `^[a-z][a-z0-9_-]{0,63}$`
* `id`: 絶対 JSON ポインタ形式 (`/...`) であること。
* セグメント内の RFC6901 エスケープに対応 (`~` => `~0`, `/` => `~1`)。

### `source: "exec"` (外部コマンド)

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

バリデーションルール:

* `provider`: `^[a-z][a-z0-9_-]{0,63}$`
* `id`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`

## プロバイダーの構成

`secrets.providers` 配下でプロバイダーを定義します:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // または "singleValue"
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
      maxProviderConcurrency: 4, // プロバイダーごとの最大並列数
      maxRefsPerProvider: 512, // 1回のリクエストで解決可能な ID 数
      maxBatchBytes: 262144, // 許容される最大バッチサイズ（バイト）
    },
  },
}
```

### 環境変数プロバイダー (`env`)

* `allowlist` で取得可能な変数を制限できます。
* 環境変数が存在しない、または空の場合は解決に失敗します。

### ファイルプロバイダー (`file`)

* `path` で指定したローカルファイルを読み取ります。
* `mode: "json"`: ファイル全体を JSON とし、`id` をポインタとして値を抽出します。
* `mode: "singleValue"`: ファイル内容そのものを値として返します（ref の `id` には `"value"` を指定してください）。
* ファイルの所有権や権限（Permission）チェックが行われます。
* **Windows での注意**: ACL 検証が利用できない環境では解決に失敗します。信頼できるパスであれば、プロバイダー設定で `allowInsecurePath: true` を指定してセキュリティチェックをバイパスできます。

### 外部コマンドプロバイダー (`exec`)

* 指定した絶対パスのバイナリを実行します（シェルは介しません）。
* デフォルトでは `command` は通常のファイルを指している必要があります（シンボリックリンク不可）。
* Homebrew のシム（Shim）など、シンボリックリンク経由で実行したい場合は `allowSymlinkCommand: true` を設定してください。OpenClaw がリンク先の安全性を検証します。
* パッケージマネージャーのパスを使用する場合は、`allowSymlinkCommand` と `trustedDirs`（例: `["/opt/homebrew"]`）を併用してください。
* タイムアウト、出力サイズ制限、環境変数の引き継ぎ、信頼されたディレクトリの指定をサポートしています。

リクエスト形式 (標準入力):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

レスポンス形式 (標準出力):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<api-key>" } }
```

## 外部コマンドの統合例

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true,
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
        allowSymlinkCommand: true,
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
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

## 優先順位と挙動

* **参照なし**: 従来通り平文の値が使用されます。
* **参照あり**: アクティブな設定項目において、解決が必須となります。
* **平文と参照が混在**: 両方存在する場合、サポートされているパスにおいては **参照 (SecretRef) が優先** されます。

警告および監査シグナル:

* `SECRETS_REF_OVERRIDES_PLAINTEXT`: 平文よりも参照が優先された際の警告。
* `REF_SHADOWED`: `auth-profiles.json` 内の認証情報が、`openclaw.json` の SecretRef よりも優先された場合の監査指摘。

## アクティベーションのタイミング

シークレットの有効化（解決）は以下のタイミングで行われます:

* ゲートウェイの起動時
* 設定ファイルの変更に伴う自動リロード（ホット適用時、または再起動チェック時）
* `openclaw secrets reload` コマンドによる手動リロード

アクティベーションの仕様:

* 成功した場合は、スナップショットがアトミックに入れ替わります。
* 起動時に失敗した場合は、ゲートウェイの起動を中断します。
* 実行中のリロードに失敗した場合は、エラーを記録した上で「前回正常時」のスナップショットを維持して動作を継続します。

## ステータスの劣化 (Degraded) と回復

実行中のリロードにおいて、健全な状態から解決失敗に転じた場合、OpenClaw は **劣化（Degraded）** 状態に入ります。

発行されるシステムイベントおよびログコード:

* `SECRETS_RELOADER_DEGRADED`: 劣化状態への移行時。
* `SECRETS_RELOADER_RECOVERED`: 劣化状態からの回復時（解決に再び成功した際）。

挙動:

* 劣化中も「前回正常時」の設定を使用して動作を続けます。
* 劣化中に解決失敗が繰り返されても、警告ログは出力されますが、システムイベントが連打されることはありません。
* 起動時の即時終了（Fail-fast）では、そもそも「正常な状態」になっていないため、これらのイベントは発行されません。

## コマンドパスでの解決

CLI コマンドも、ゲートウェイのスナップショット RPC を介してシークレット解決機能を利用できます。

主な 2 つの挙動:

* **厳格なコマンド (Strict)**: `openclaw memory`（リモート記憶域利用時）や `openclaw qr --remote` など。アクティブなスナップショットを参照し、必要な SecretRef が解決できない場合は即座にエラーとなります。
* **読み取り専用コマンド (Read-only)**: `openclaw status`, `openclaw channels status`, `openclaw doctor` など。まずはアクティブなスナップショットを参照しますが、解決できない場合でも処理を中断せず、可能な範囲での情報を表示（Degrade）します。

読み取り専用コマンドの挙動詳細:

* ゲートウェイが稼働中であれば、まずそのスナップショットを読みます。
* ゲートウェイが未稼働、または解決が不完全な場合は、コマンドを実行しているローカル環境で解決を試みます。
* それでも解決できない場合は、「configured but unavailable in this command path」といったメッセージと共に、解決できなかった認証情報以外の情報を出力します。
* この挙動はそのコマンド実行時のみに限定されたものであり、ゲートウェイ本体の起動やリロードの厳格性を弱めるものではありません。

## 監査 (Audit) と構成 (Configure) のワークフロー

推奨される運用フロー:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

主な指摘項目:

* 保存されている平文の機密情報 (`openclaw.json`, `auth-profiles.json`, `.env`, エージェントごとの `models.json`)。
* 生成された `models.json` 内に残っている、認証ヘッダー由来の平文の残骸。
* 未解決の SecretRef。
* 優先順位の競合（Shadowing）。
* レガシーな残骸 (`auth.json`, OAuth 関連の不要な通知など)。

認証ヘッダーの残骸検知について:

* `authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` などの一般的なキーワードに基づいたヒューリスティックな判定を行います。

### `secrets configure`

対話型の設定ヘルパーです:

* `secrets.providers` の設定（追加・編集・削除）。
* `openclaw.json` および `auth-profiles.json` 内の対応項目の選択。
* SecretRef 情報（source, provider, id）の登録。
* 保存前の事前解決テスト。
* その場での即時適用（オプション）。

適用のデフォルト挙動:

* 対象プロバイダーについて、`auth-profiles.json` から一致する静的認証情報を消去（Scrub）します。
* `auth.json` からレガシーな静的 `api_key` エントリを消去します。
* `<config-dir>/.env` 内にある既知のシークレット行を消去します。

### `secrets apply`

保存したプランファイルを適用します:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
```

厳密な仕様と拒否ルールについては、[シークレット適用プランの仕様](/gateway/secrets-plan-contract) を参照してください。

## 一方向の安全性ポリシー

OpenClaw は、過去の平文シークレットを含むロールバック用のバックアップを **意図的に作成しません**。

安全モデル:

* 書き込みの前に事前解決（Preflight）が成功している必要があります。
* コミットの前に実行時のアクティベーションが検証されます。
* 更新はアトミックなファイル置換で行われ、失敗時にはベストエフォートで復元を試みます。

## ウェブ UI に関する補足

一部の複雑な SecretRef 設定（Union 型など）は、フォーム入力モードよりも、生の JSON エディタモードの方が設定しやすい場合があります。

## 関連ドキュメント

* CLI コマンド: [secrets](/cli/secrets)
* プラン仕様の詳細: [シークレット適用プランの仕様](/gateway/secrets-plan-contract)
* 認証情報サーフェス: [SecretRef 認証情報サーフェス](/reference/secretref-credential-surface)
* 認証のセットアップ: [認証](/gateway/authentication)
* セキュリティ態勢: [セキュリティ](/gateway/security)
* 環境変数の優先順位: [環境変数](/help/environment)
