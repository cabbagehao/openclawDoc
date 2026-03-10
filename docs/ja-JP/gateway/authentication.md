---
summary: "モデル認証: OAuth、API キー、セットアップ トークン"
read_when:
  - モデル認証または OAuth の有効期限のデバッグ
  - 認証または資格情報の保管を文書化する
title: "認証"
x-i18n:
  source_hash: "fdf91bdcd861d2d3ed2ef89c78f28ba018c8247ca46a5aea5c2221d92cfe2777"
---

# 認証

OpenClaw は、モデル プロバイダーの OAuth キーと API キーをサポートします。常時接続ゲートウェイの場合
ホストの場合、通常は API キーが最も予測可能なオプションです。サブスクリプション/OAuth
プロバイダー アカウント モデルと一致するフローもサポートされます。

完全な OAuth フローとストレージについては、[/concepts/oauth](/concepts/oauth) を参照してください。
レイアウト。
SecretRef ベースの認証 (`env`/`file`/`exec` プロバイダー) については、[シークレット管理](/gateway/secrets) を参照してください。
`models status --probe` で使用される資格情報の資格/理由コードのルールについては、を参照してください。
[認証資格情報セマンティクス](/auth-credential-semantics)。

## 推奨設定 (API キー、任意のプロバイダー)

有効期間の長いゲートウェイを実行している場合は、選択したゲートウェイの API キーから始めます。
プロバイダー。
特に Anthropic の場合、API キー認証が安全なパスであり、推奨されます。
サブスクリプションセットアップトークン認証を介して。

1. プロバイダー コンソールで API キーを作成します。
2. **ゲートウェイ ホスト** (`openclaw gateway` を実行しているマシン) に配置します。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. ゲートウェイが systemd/launchd で実行されている場合は、キーを
   `~/.openclaw/.env` なので、デーモンがそれを読み取ることができます。

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

次に、デーモンを再起動し (またはゲートウェイ プロセスを再起動し)、以下を再確認します。

```bash
openclaw models status
openclaw doctor
```

環境変数を自分で管理したくない場合は、オンボーディング ウィザードで環境変数を保存できます。
デーモン使用の API キー: `openclaw onboard`。環境継承の詳細については、[ヘルプ](/help) を参照してください (`env.shellEnv`、
`~/.openclaw/.env`、systemd/launchd)。

## Anthropic: セットアップ トークン (サブスクリプション認証)

Claude サブスクリプションを使用している場合、セットアップ トークン フローがサポートされます。走る
**ゲートウェイ ホスト**上にあります:

```bash
claude setup-token
```

次に、それを OpenClaw に貼り付けます。

```bash
openclaw models auth setup-token --provider anthropic
```

トークンが別のマシンで作成された場合は、手動で貼り付けます。

```bash
openclaw models auth paste-token --provider anthropic
```

次のような Anthropic エラーが表示された場合:

```
This credential is only authorized for use with Claude Code and cannot be used for other API requests.
```

…代わりに Anthropic API キーを使用してください。

<Warning>
Anthropic セットアップ トークンのサポートは技術的な互換性のみです。 Anthropic がブロックしました
過去にクロード コード以外でサブスクリプションを使用したことがある。自分が決めた場合のみ使用してください
ポリシーのリスクは許容できるので、Anthropic の現在の条件をご自身で確認してください。
</Warning>

手動トークン入力 (任意のプロバイダー、`auth-profiles.json` の書き込み + 構成の更新):

```bash
openclaw models auth paste-token --provider anthropic
openclaw models auth paste-token --provider openrouter
```

認証プロファイル参照は、静的認証情報でもサポートされています。

- `api_key` 認証情報では `keyRef: { source, provider, id }` を使用できます
- `token` 認証情報では `tokenRef: { source, provider, id }` を使用できます

自動化に適したチェック (期限切れまたは欠落している場合は `1` を終了し、期限切れの場合は `2` を終了します):

```bash
openclaw models status --check
```

オプションの ops スクリプト (systemd/Termux) はここに記載されています。
[/automation/auth-monitoring](/automation/auth-monitoring)

> `claude setup-token` には対話型 TTY が必要です。

## モデル認証ステータスの確認

````bash
openclaw models status
openclaw doctor
```## API キーのローテーション動作 (ゲートウェイ)

一部のプロバイダーは、API 呼び出し時の代替キーによるリクエストの再試行をサポートしています。
プロバイダーのレート制限に達します。

- 優先順位:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (単一オーバーライド)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google プロバイダーには、追加のフォールバックとして `GOOGLE_API_KEY` も含まれています。
- 同一キーリストは使用前に重複排除されます。
- OpenClaw は、レート制限エラーの場合にのみ、次のキーを使用して再試行します (たとえば、
  `429`、`rate_limit`、`quota`、`resource exhausted`)。
- レート制限以外のエラーは、代替キーを使用して再試行されません。
- すべてのキーが失敗した場合、最後の試行の最終エラーが返されます。

## 使用する資格情報の制御

### セッションごと (チャット コマンド)

`/model <alias-or-id>@<profileId>` を使用して、現在のセッションの特定のプロバイダー資格情報を固定します (プロファイル ID の例: `anthropic:default`、`anthropic:work`)。

コンパクトなピッカーには `/model` (または `/model list`) を使用します。完全なビュー (候補 + 次の認証プロファイル、および構成されている場合はプロバイダー エンドポイントの詳細) には `/model status` を使用してください。

### エージェントごと (CLI オーバーライド)

エージェントの明示的な認証プロファイル順序オーバーライドを設定します (そのエージェントの `auth-profiles.json` に保存されます)。

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
````

特定のエージェントをターゲットにするには、`--agent <id>` を使用します。構成されたデフォルトのエージェントを使用するには、これを省略します。

## トラブルシューティング

### 「資格情報が見つかりません」Anthropic トークン プロファイルが見つからない場合は、上で `claude setup-token` を実行します

**ゲートウェイ ホスト**、次に再確認します:

```bash
openclaw models status
```

### トークンの有効期限が切れています/期限切れです

`openclaw models status` を実行して、どのプロファイルの有効期限が切れているかを確認します。プロフィールの場合
が見つからない場合は、`claude setup-token` を再実行し、トークンを再度貼り付けます。

## 要件

- Anthropic サブスクリプション アカウント (`claude setup-token` 用)
- Claude Code CLI がインストールされています (`claude` コマンドが利用可能)
