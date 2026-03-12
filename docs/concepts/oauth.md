---
summary: "OpenClaw における OAuth: トークン交換、保存、およびマルチアカウント運用のパターン"
read_when:
  - OpenClaw の OAuth 連携の仕組みをエンドツーエンドで理解したい場合
  - トークンの無効化やログアウトの問題が発生した場合
  - setup-token や OAuth 認証フローについて知りたい場合
  - 複数のアカウントやプロファイルによるルーティングを設定したい場合
title: "OpenClawのOAuth認証フローの仕組みと運用上の注意点ガイド"
description: "OpenClaw は、対応しているプロバイダー（特に OpenAI Codex (ChatGPT OAuth)）において、OAuth 経由のサブスクリプション認証をサポートしています。Anthropic のサブスクリプション利用には setup-token フローを使用します。"
x-i18n:
  source_hash: "976668c3e02ee50500fcaaa585a89af718398dc41988318ec3a583c2d5449df3"
---
OpenClaw は、対応しているプロバイダー（特に **OpenAI Codex (ChatGPT OAuth)**）において、OAuth 経由のサブスクリプション認証をサポートしています。Anthropic のサブスクリプション利用には **setup-token** フローを使用します。Anthropic のサブスクリプションを Claude Code 以外で利用することは、過去に一部のユーザーで制限された事例があるため、リスクを理解した上で自己責任で利用し、最新のポリシーを確認してください。OpenAI Codex OAuth は、OpenClaw のような外部ツールでの利用が明示的にサポートされています。

本番環境での Anthropic 利用においては、サブスクリプションベースの setup-token よりも、API キーによる認証の方が安全であり、推奨されるパスです。

このページでは以下の内容を説明します:
- OAuth の **トークン交換** の仕組み (PKCE)
- トークンの **保存場所** とその理由
- **複数アカウント** の扱い（プロファイル管理とセッションごとの上書き）

OpenClaw は、独自の OAuth や API キー入力フローを持つ **プロバイダープラグイン** もサポートしています。以下のコマンドで実行できます:

```bash
openclaw models auth login --provider <id>
```

## トークンシンク (情報の集約)

OAuth プロバイダーは通常、ログインや更新（リフレッシュ）のたびに **新しいリフレッシュトークン** を発行します。プロバイダー（またはクライアントの実装）によっては、同じユーザー・アプリに対して新しいトークンが発行されると、古いトークンが無効化される場合があります。

よくある症状:
- OpenClaw と Claude Code（または Codex CLI）の両方でログインしていると、後からどちらかがランダムにログアウト状態になる。

これを防ぐため、OpenClaw は `auth-profiles.json` を **トークンシンク（集約先）** として扱います:
- 実行環境は、**常に一箇所** から認証情報を読み取ります。
- 複数のプロファイルを保持し、それらを確定的にルーティングできます。

## 保存場所

シークレット（機密情報）は **エージェントごと** に保存されます:

- **認証プロファイル** (OAuth、API キー、オプションの参照設定): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **レガシー互換ファイル**: `~/.openclaw/agents/<agentId>/agent/auth.json`
  - 静的な `api_key` エントリが検出された場合、セキュリティのため自動的に削除（スクラブ）されます。

インポート専用の古いファイル（現在はメインの保存先ではありませんが、移行用にサポートされています）:
- `~/.openclaw/credentials/oauth.json` (初回使用時に `auth-profiles.json` へインポートされます)

これらすべてのパスは、`$OPENCLAW_STATE_DIR` 環境変数によるディレクトリの上書き設定を尊重します。詳細は [構成リファレンス](/gateway/configuration#auth-storage-oauth--api-keys) を参照してください。

静的なシークレット参照（SecretRef）や実行時スナップショットの動作については、[シークレット管理](/gateway/secrets) を参照してください。

## Anthropic setup-token (サブスクリプション認証)

<Warning>
Anthropic setup-token のサポートは技術的な互換性を確保するものであり、将来にわたる利用を保証するものではありません。
Anthropic は過去に、Claude Code 以外でのサブスクリプション利用を制限したことがあります。
最新の規約を確認し、リスクを考慮した上で利用を判断してください。
</Warning>

任意のマシンで `claude setup-token` を実行し、表示された内容を OpenClaw に貼り付けます:

```bash
openclaw models auth setup-token --provider anthropic
```

トークンを別の場所で既に生成済みの場合は、手動で貼り付けることも可能です:

```bash
openclaw models auth paste-token --provider anthropic
```

現在の状態を確認する:

```bash
openclaw models status
```

## OAuth 交換の仕組み (ログインフロー)

OpenClaw の対話型ログインフローは、`@mariozechner/pi-ai` に実装されており、ウィザードや各種コマンドに組み込まれています。

### Anthropic setup-token のフロー

1. `claude setup-token` を実行します。
2. トークンを OpenClaw に貼り付けます。
3. リフレッシュ機能のない「トークン認証プロファイル」として保存されます。

オンボーディング時のパス: `openclaw onboard` → 認証方法の選択で `setup-token` (Anthropic) を選択。

### OpenAI Codex (ChatGPT OAuth) のフロー

OpenAI Codex OAuth は、Codex CLI 以外の環境（OpenClaw ワークフローなど）での利用が明示的に許可されています。

フローの流れ (PKCE):
1. PKCE 検証用コード（Verifier/Challenge）とランダムな `state` 文字列を生成します。
2. ブラウザで `https://auth.openai.com/oauth/authorize?...` を開きます。
3. `http://127.0.0.1:1455/auth/callback` でコールバックの受信を待機します。
4. コールバックを受信できない場合（リモート環境やヘッドレス環境の場合）、リダイレクト先の URL またはコードを手動で貼り付けます。
5. `https://auth.openai.com/oauth/token` でトークン交換を行います。
6. アクセストークンから `accountId` を抽出し、`{ access, refresh, expires, accountId }` を保存します。

オンボーディング時のパス: `openclaw onboard` → 認証方法の選択で `openai-codex` を選択。

## 更新 (Refresh) と有効期限

各プロファイルには `expires`（有効期限）のタイムスタンプが保存されています。

実行時の挙動:
- `expires` が未来（有効）な場合 → 保存されているアクセストークンをそのまま使用します。
- 期限切れの場合 → ファイルロックをかけた状態でリフレッシュ処理を行い、新しい認証情報で上書き保存します。

この更新処理は自動的に行われるため、通常は手動でトークンを管理する必要はありません。

## 複数アカウント (プロファイル) とルーティング

以下の 2 つの運用パターンがあります:

### 1) 推奨: エージェントを分ける

「個人用」と「仕事用」を完全に分離したい場合は、個別のエージェント（専用のセッション、認証情報、ワークスペースを持つ）を使用してください:

```bash
openclaw agents add work
openclaw agents add personal
```

その後、各エージェントに対して個別に認証設定（ウィザード）を行い、チャットを適切なエージェントにルーティングします。

### 2) 高度な設定: 1 つのエージェントで複数のプロファイルを使い分ける

`auth-profiles.json` は、同じプロバイダーに対して複数のプロファイル ID を保持できます。

使用するプロファイルの選択方法:
- グローバル設定: 構成ファイル内の順序指定 (`auth.order`)。
- セッションごとの上書き: `/model ...@<profileId>` コマンドを使用。

例 (セッションでの上書き):
- `/model Opus@anthropic:work`

利用可能なプロファイル ID を確認する方法:
- `openclaw channels list --json` を実行し、`auth[]` 配下を確認します。

関連ドキュメント:
- [モデルフェイルオーバー](/concepts/model-failover) (ローテーションとクールダウンのルール)
- [スラッシュコマンド](/tools/slash-commands) (コマンドのインターフェース)
