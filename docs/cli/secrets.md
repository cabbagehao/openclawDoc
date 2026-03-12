---
summary: "`openclaw secrets` の CLI リファレンス (リロード、監査、構成、適用)"
read_when:
  - 実行時にシークレット参照（SecretRef）を再解決したい場合
  - 平文で残っている機密情報や未解決の参照を監査したい場合
  - SecretRef を構成し、平文情報の削除を伴う変更を適用したい場合
title: "OpenClaw CLI: openclaw secrets コマンドの使い方と主要オプション・実行例"
description: "openclaw secrets コマンドを使用して SecretRef を管理し、稼働中のスナップショットを安全な状態に保ちます。各サブコマンドの役割、推奨される運用サイクル、CI/ゲート用の終了コードを確認できます。"
x-i18n:
  source_hash: "e73d70ca4d7aba0f4698384e8b9c79ce9b458456a30a73b8dc244529b676c8ed"
---
`openclaw secrets` コマンドを使用して SecretRef を管理し、稼働中のスナップショットを安全な状態に保ちます。

## 各サブコマンドの役割

- `reload`: ゲートウェイの RPC (`secrets.reload`) を呼び出し、参照を再解決して実行時のスナップショットを切り替えます。完全に成功した場合のみ切り替えが行われ、構成ファイルの書き換えは行いません。
- `audit`: 構成、認証情報、自動生成されたモデル設定、およびレガシーな残存ファイルを読み取り専用でスキャンし、平文の機密情報、未解決の参照、優先順位の乖離をチェックします。
- `configure`: プロバイダーのセットアップ、ターゲットのマッピング、および事前検証（preflight）を行うための対話型プランナーです（TTY 端末が必要です）。
- `apply`: 保存された実行計画を適用します（`--dry-run` で検証のみも可能）。適用後、対象となった平文の機密情報を自動的に削除（スクラブ）します。

## 推奨される運用サイクル

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

## CI/ゲート用の終了コード

- `audit --check` は問題が見つかった場合に `1` を返します。
- 未解決の参照がある場合は `2` を返します。

関連ドキュメント:
- シークレット管理ガイド: [シークレット管理](/gateway/secrets)
- 対応箇所一覧: [SecretRef 対応箇所一覧](/reference/secretref-credential-surface)
- セキュリティガイド: [セキュリティ](/gateway/security)

---

## ランタイムスナップショットのリロード (`reload`)

シークレットの参照を再解決し、実行時のスナップショットをアトミックに（不可分に）切り替えます。

```bash
openclaw secrets reload
openclaw secrets reload --json
```

補足事項:
- ゲートウェイの RPC メソッド `secrets.reload` を使用します。
- 解決に失敗した場合、ゲートウェイは直前の正常なスナップショットを維持し、エラーを返します（部分的な適用は行われません）。
- JSON 形式のレスポンスには `warningCount` が含まれます。

---

## 監査 (`audit`)

OpenClaw の状態を以下の観点でスキャンします:

- 平文（プレーンテキスト）で保存された機密情報
- 未解決の参照（SecretRef）
- 優先順位の乖離 (`auth-profiles.json` の認証情報が `openclaw.json` の参照を上書きしてしまっている状態)
- 自動生成された `agents/*/agent/models.json` 内の残存情報（プロバイダーの `apiKey` や機密性の高いヘッダー）
- レガシーな残存物（古い認証ストアのエントリ、OAuth のリマインダーなど）

機密ヘッダーの検出について:
- `authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` といった一般的な名称に基づいたヒューリスティックな検出を行います。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
```

終了時の振る舞い:
- `--check` 指定時、問題が見つかれば 0 以外のコードで終了します。
- 未解決の参照がある場合は、より優先度の高い 0 以外のコードで終了します。

レポートの主な項目:
- `status`: `clean | findings | unresolved`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- 検出コード:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

---

## 構成設定 (`configure`) - 対話型ヘルパー

プロバイダーや SecretRef の変更を対話的に作成し、事前検証を行い、オプションで適用まで行います。

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
1. プロバイダーのセットアップ（`secrets.providers` の追加・編集・削除）。
2. 認証情報のマッピング（対象フィールドを選択し、`{source, provider, id}` 参照を割り当て）。
3. 事前検証、および（任意で）適用。

フラグ:
- `--providers-only`: `secrets.providers` の構成のみを行い、認証情報のマッピングはスキップします。
- `--skip-provider-setup`: プロバイダーのセットアップをスキップし、既存のプロバイダーに対して認証情報をマッピングします。
- `--agent <id>`: `auth-profiles.json` のスキャンと書き込みを、指定したエージェントのストアに限定します。

補足事項:
- 対話型の TTY 端末が必要です。
- `--providers-only` と `--skip-provider-setup` は同時には指定できません。
- `configure` は、`openclaw.json` および選択されたエージェントスコープの `auth-profiles.json` 内の機密情報を含むフィールドを対象とします。
- 選択フローの中で、`auth-profiles.json` 用の新しいマッピングを直接作成できます。
- 対応箇所については、[SecretRef 対応箇所一覧](/reference/secretref-credential-surface) を参照してください。
- 適用前に事前検証（事前解決）が実行されます。
- 生成される実行計画では、削除（スクラブ）オプションがデフォルトで有効になります (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`)。
- 平文情報の削除を伴う適用は、一方向（元に戻せない）操作です。
- `--apply` を指定しない場合でも、事前検証後に `Apply this plan now?` と尋ねられます。
- `--apply` 指定時（かつ `--yes` なしの場合）、取り消し不能であることを確認する追加のプロンプトが表示されます。

Exec プロバイダーに関する安全上の注意:
- Homebrew でインストールされたバイナリは、`/opt/homebrew/bin/*` 下のシンボリックリンクである場合が多いです。
- 信頼できるパッケージマネージャーのパスが必要な場合にのみ `allowSymlinkCommand: true` を設定し、`trustedDirs`（例: `["/opt/homebrew"]`）と組み合わせて使用してください。
- Windows 環境において、プロバイダーのパスに対する ACL 検証が利用できない場合、OpenClaw は安全のため実行を拒否します。信頼できるパスであれば、そのプロバイダーに `allowInsecurePath: true` を設定することで、パスのセキュリティチェックをバイパスできます。

---

## 実行計画の適用 (`apply`)

事前に作成された実行計画を適用、または事前検証します。

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

詳細な仕様（許可されるパス、検証ルール、失敗時のセマンティクスなど）:
- [シークレット適用計画の仕様](/gateway/secrets-plan-contract)

`apply` によって更新される可能性のあるファイル:
- `openclaw.json` (SecretRef の適用、プロバイダーの追加・更新・削除)
- `auth-profiles.json` (プロバイダーターゲット情報の削除)
- レガシーな `auth.json` 内の情報
- `~/.openclaw/.env` (移行されたシークレットに対応するキー)

## ロールバック用のバックアップが作成されない理由

`secrets apply` は、古い平文の機密情報を含むロールバック用バックアップを意図的に作成しません。
安全性は、厳格な事前検証と、失敗時にメモリ上の情報を可能な限り復元するアトミック（不可分）な適用プロセスによって確保されます。

---

## 実行例

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

もし `audit --check` が依然として平文の情報を報告する場合は、報告された残りのパスを更新して、再度監査を実行してください。
