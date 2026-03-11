---
summary: "モデル認証の仕組み: OAuth、API キー、および setup-token"
read_when:
  - モデル認証や OAuth の有効期限の問題をデバッグする場合
  - 認証方式や認証情報の保存レイアウトを確認したい場合
title: "認証"
---

# 認証

OpenClaw は、モデルプロバイダー向けの OAuth 認証と API キー認証をサポートしています。常時稼働させるゲートウェイホストにおいては、通常、API キー認証が最も挙動が予測しやすく安定した選択肢となります。プロバイダーのアカウントモデルに応じて、サブスクリプションベースの OAuth フローも利用可能です。

OAuth の詳細なフローと保存レイアウトについては、[/concepts/oauth](/concepts/oauth) を参照してください。
SecretRef ベースの認証（`env`/`file`/`exec` プロバイダー）については、[シークレット管理](/gateway/secrets) を参照してください。
`models status --probe` で使用される、認証情報の適格性や理由コードの判定ルールについては、[認証情報のセマンティクス](/auth-credential-semantics) を参照してください。

## 推奨されるセットアップ (API キー、全プロバイダー共通)

長期間ゲートウェイを運用する場合は、選択したプロバイダーの API キーを使用することから始めてください。
特に Anthropic に関しては、API キーによる認証が安全な経路であり、サブスクリプションベースの setup-token 認証よりも推奨されます。

1. プロバイダーの管理コンソールで API キーを作成します。
2. そのキーを **ゲートウェイホスト**（`openclaw gateway` を実行しているマシン）に設定します。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. ゲートウェイを systemd や launchd 下で実行している場合は、デーモンが読み込めるように `~/.openclaw/.env` にキーを記述することを推奨します:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

その後、デーモン（またはゲートウェイプロセス）を再起動して確認します:

```bash
openclaw models status
openclaw doctor
```

環境変数を手動で管理したくない場合は、オンボーディングウィザードを使用して、デーモン用の API キーを保存できます: `openclaw onboard`。

環境変数の継承（`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd）に関する詳細は、[ヘルプ](/help) を参照してください。

## Anthropic: setup-token (サブスクリプション認証)

Claude のサブスクリプション（個人・プロ）を利用している場合は、setup-token フローを使用できます。**ゲートウェイホスト**上で以下を実行してください:

```bash
claude setup-token
```

表示された内容を OpenClaw に貼り付けます:

```bash
openclaw models auth setup-token --provider anthropic
```

トークンを別のマシンで生成済みの場合は、手動で貼り付けることも可能です:

```bash
openclaw models auth paste-token --provider anthropic
```

もし、以下のような Anthropic のエラーが表示された場合:

```
This credential is only authorized for use with Claude Code and cannot be used for other API requests.
```

…サブスクリプションではなく、Anthropic の API キーを使用してください。

<Warning>
Anthropic setup-token のサポートは、技術的な互換性維持のためのものです。過去に Anthropic が Claude Code 以外からのサブスクリプション利用を一部制限した事例があります。リスクを考慮した上で、自己責任で利用してください。また、最新の Anthropic の利用規約をご自身で確認してください。
</Warning>

手動でのトークン入力（全プロバイダー共通。`auth-profiles.json` への書き込みと構成の更新を行います）:

```bash
openclaw models auth paste-token --provider anthropic
openclaw models auth paste-token --provider openrouter
```

静的な認証情報に対しては、認証プロファイル参照（Auth profile refs）もサポートされています:
- `api_key` 認証情報では `keyRef: { source, provider, id }` を使用可能。
- `token` 認証情報では `tokenRef: { source, provider, id }` を使用可能。

自動化に適したチェック（期限切れ/欠落時は `1`、期限間近は `2` で終了します）:

```bash
openclaw models status --check
```

運用に便利なスクリプト（systemd/Termux 用）のドキュメントはこちらです:
[/automation/auth-monitoring](/automation/auth-monitoring)

> `claude setup-token` の実行には対話型の TTY 端末が必要です。

## モデル認証ステータスの確認

```bash
openclaw models status
openclaw doctor
```

## API キーのローテーション挙動 (ゲートウェイ)

一部のプロバイダーにおいて、API 呼び出しがレート制限に達した際、別のキーを使用してリクエストを再試行する機能をサポートしています。

- 優先順位:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (単一の上書き設定。最優先)
  - `<PROVIDER>_API_KEYS` (カンマ区切り等のリスト)
  - `<PROVIDER>_API_KEY` (メインのキー)
  - `<PROVIDER>_API_KEY_*` (連番付きのリスト)
- Google プロバイダーの場合は、`GOOGLE_API_KEY` も追加のフォールバックとして含まれます。
- キーリストは使用前に重複排除されます。
- レート制限エラー（例: `429`, `rate_limit`, `quota`, `resource exhausted`）が発生した場合にのみ、次のキーを使用して再試行します。
- レート制限以外のエラー（認証失敗、リクエスト不正など）では、別のキーによる再試行は行われません。
- すべてのキーを試しても失敗した場合は、最後の試行時に発生したエラーが返されます。

## 使用する認証情報の制御

### セッション単位 (チャットコマンド)

`/model <alias-or-id>@<profileId>` を使用して、現在のセッションで使用する特定の認証プロファイルを固定できます（例: `anthropic:default`, `anthropic:work`）。

コンパクトな選択メニューには `/model` (または `/model list`) を、詳細な情報の確認（候補リスト、次に使用されるプロファイル、プロバイダーのエンドポイント詳細など）には `/model status` を使用してください。

### エージェント単位 (CLI による上書き)

特定のエージェントに対して、明示的な認証プロファイルの優先順位を設定できます（該当エージェントの `auth-profiles.json` に保存されます）:

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

特定の対象を指定するには `--agent <id>` を使用してください。省略した場合は構成済みのデフォルトエージェントが対象となります。

## トラブルシューティング

### 「No credentials found」

Anthropic のトークンプロファイルが見つからない場合は、**ゲートウェイホスト**上で `claude setup-token` を再実行し、ステータスを確認してください:

```bash
openclaw models status
```

### トークンの期限切れ (Expiring/Expired)

`openclaw models status` を実行して、どのプロファイルが期限切れ（あるいは間近）かを確認してください。プロファイルが不足している場合は、再度 `claude setup-token` を実行してトークンを貼り付け直してください。

## 必要条件

- Anthropic のサブスクリプションアカウント (`claude setup-token` の利用に必要)
- Claude Code CLI がインストール済みであること (`claude` コマンドが利用可能なこと)
