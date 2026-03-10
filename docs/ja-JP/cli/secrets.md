---
summary: "「openclaw シークレット」の CLI リファレンス (リロード、監査、構成、適用)"
read_when:
  - 実行時にシークレット参照を再解決する
  - 平文の残基と未解決の参照の監査
  - SecretRef の構成と一方向のスクラブ変更の適用
title: "秘密"
x-i18n:
  source_hash: "e73d70ca4d7aba0f4698384e8b9c79ce9b458456a30a73b8dc244529b676c8ed"
---

# `openclaw secrets`

`openclaw secrets` を使用して SecretRef を管理し、アクティブなランタイム スナップショットを正常に保ちます。

コマンドの役割:

- `reload`: ゲートウェイ RPC (`secrets.reload`) は、完全に成功した場合 (構成書き込みなし) にのみ、参照を再解決し、実行時スナップショットを交換します。
- `audit`: 構成/認証/生成モデル ストアと、平文、未解決の参照、優先順位ドリフトのレガシー残余の読み取り専用スキャン。
- `configure`: プロバイダーのセットアップ、ターゲット マッピング、およびプリフライト (TTY が必要) のための対話型プランナー。
- `apply`: 保存された計画 (検証のみの `--dry-run`) を実行し、対象の平文残余をスクラブします。

推奨される演算子ループ:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

CI/ゲートの終了コードノート:

- `audit --check` は、結果に対して `1` を返します。
- 未解決の参照は `2` を返します。

関連:

- シークレットガイド: [シークレット管理](/gateway/secrets)
- 資格情報面: [SecretRef 資格情報面](/reference/secretref-credential-surface)
- セキュリティガイド: [セキュリティ](/gateway/security)

## ランタイムスナップショットをリロードする

シークレット参照を再解決し、ランタイム スナップショットをアトミックにスワップします。

```bash
openclaw secrets reload
openclaw secrets reload --json
```

注:

- ゲートウェイ RPC メソッド `secrets.reload` を使用します。
- 解決に失敗した場合、ゲートウェイは最新の正常なスナップショットを保持し、エラーを返します (部分的なアクティブ化はありません)。
- JSON 応答には `warningCount` が含まれます。

## 監査

OpenClaw の状態をスキャンして次のことを確認します。- 平文の秘密ストレージ

- 未解決の参照
- 優先順位のドリフト (`openclaw.json` 参照をシャドウする `auth-profiles.json` 認証情報)
- 生成された `agents/*/agent/models.json` 残基 (プロバイダー `apiKey` 値と機密プロバイダー ヘッダー)
- レガシー残余 (レガシー認証ストア エントリ、OAuth リマインダー)

ヘッダー残留メモ:

- 機密プロバイダー ヘッダーの検出は、名前ヒューリスティックに基づいています (共通の認証/資格情報ヘッダー名とフラグメント (`authorization`、`x-api-key`、`token`、`secret`、`password`、 `credential`)。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
```

終了動作:

- `--check` は、結果がゼロ以外で終了します。
- 未解決の参照は、優先度の高いゼロ以外のコードで終了します。

レポートの形状のハイライト:

- `status`: `clean | findings | unresolved`
- `summary`: `plaintextCount`、`unresolvedRefCount`、`shadowedRefCount`、`legacyResidueCount`
- コードの検索:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## 設定 (対話型ヘルパー)

プロバイダーと SecretRef を対話的に変更し、プリフライトを実行し、必要に応じて以下を適用します。

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

フロー:

- 最初にプロバイダーをセットアップします (`secrets.providers` エイリアスの場合は `add/edit/remove`)。
- 2 番目の資格証明マッピング (フィールドを選択し、`{source, provider, id}` 参照を割り当てます)。
- プリフライトとオプションは最後に適用されます。

フラグ:- `--providers-only`: `secrets.providers` のみを構成し、資格情報マッピングをスキップします。

- `--skip-provider-setup`: プロバイダーのセットアップをスキップし、資格情報を既存のプロバイダーにマップします。
- `--agent <id>`: スコープ `auth-profiles.json` ターゲットの検出と 1 つのエージェント ストアへの書き込み。

注:

- インタラクティブな TTY が必要です。
- `--providers-only` と `--skip-provider-setup` を組み合わせることはできません。
- `configure` は、選択したエージェント スコープの `openclaw.json` と `auth-profiles.json` の秘密を含むフィールドをターゲットとします。
- `configure` は、ピッカー フローでの新しい `auth-profiles.json` マッピングの直接作成をサポートします。
- 正規サポート対象サーフェス: [SecretRef Credential Surface](/reference/secretref-credential-surface)。
- 適用前にプリフライト解決を実行します。
- 生成されたプランはデフォルトでスクラブ オプションになります (`scrubEnv`、`scrubAuthProfilesForProviderTargets`、`scrubLegacyAuthJson` はすべて有効です)。
- スクラブされたプレーンテキスト値の適用パスは一方向です。
- `--apply` がない場合、CLI はプリフライト後に `Apply this plan now?` を要求します。
- `--apply` を使用すると (`--yes` は使用しない)、CLI は追加の取り消し不能な確認を求めます。

実行プロバイダーの安全上の注意:- Homebrew のインストールでは、シンボリックリンクされたバイナリが `/opt/homebrew/bin/*` で公開されることがよくあります。

- 信頼できるパッケージ マネージャー パスに必要な場合にのみ `allowSymlinkCommand: true` を設定し、`trustedDirs` (たとえば、`["/opt/homebrew"]`) と組み合わせます。
- Windows では、プロバイダー パスの ACL 検証が利用できない場合、OpenClaw は失敗して閉じられます。信頼できるパスの場合のみ、そのプロバイダーで `allowInsecurePath: true` を設定して、パスのセキュリティ チェックをバイパスします。

## 保存したプランを適用する

以前に生成した計画を適用またはプリフライトします。

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

契約の詳細を計画します (許可されたターゲット パス、検証ルール、および失敗のセマンティクス)。

- [シークレット適用プラン契約](/gateway/secrets-plan-contract)

`apply` が更新する可能性のあるもの:

- `openclaw.json` (SecretRef ターゲット + プロバイダーの更新/削除)
- `auth-profiles.json` (プロバイダーとターゲットのスクラビング)
- レガシー `auth.json` 残基
- `~/.openclaw/.env` 値が移行された既知の秘密鍵

## ロールバック バックアップがない理由

`secrets apply` は、古いプレーンテキスト値を含むロールバック バックアップを意図的に書き込みません。

安全性は、厳密なプリフライトと失敗時のベストエフォート型メモリ内復元によるアトミックな適用によって実現されます。

## 例

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

`audit --check` が依然として平文の検出結果を報告する場合は、報告されている残りのターゲット パスを更新し、監査を再実行します。
