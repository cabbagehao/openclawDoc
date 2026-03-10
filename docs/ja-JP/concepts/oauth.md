---
summary: "OpenClaw の OAuth: トークン交換、ストレージ、およびマルチアカウント パターン"
read_when:
  - OpenClaw OAuth をエンドツーエンドで理解したい
  - トークンの無効化/ログアウトの問題が発生した
  - setup-token または OAuth 認証フローが必要な場合
  - 複数のアカウントまたはプロファイルのルーティングが必要な場合
title: "OAuth"
x-i18n:
  source_hash: "976668c3e02ee50500fcaaa585a89af718398dc41988318ec3a583c2d5449df3"
---

# OAuth

OpenClaw は、それを提供するプロバイダー (特に **OpenAI Codex (ChatGPT OAuth)**) に対して、OAuth 経由の「サブスクリプション認証」をサポートします。 Anthropic サブスクリプションの場合は、**setup-token** フローを使用します。 Claude Code 以外での Anthropic サブスクリプションの使用は、過去に一部のユーザーに対して制限されていたため、ユーザー選択のリスクとして扱い、現在の Anthropic ポリシーをご自身で確認してください。 OpenAI Codex OAuth は、OpenClaw などの外部ツールでの使用が明示的にサポートされています。このページでは次のことについて説明します。

運用環境の Anthropic の場合、API キー認証は、サブスクリプション セットアップ トークン認証よりも安全な推奨パスです。

- OAuth **トークン交換**の仕組み (PKCE)
- トークンが**保存される場所** (およびその理由)
- **複数のアカウント**の処理方法 (プロファイル + セッションごとのオーバーライド)

OpenClaw は、独自の OAuth または API キーを提供する **プロバイダー プラグイン** もサポートしています
流れます。次の方法で実行します。

```bash
openclaw models auth login --provider <id>
```

## トークンシンク (トークンが存在する理由)

OAuth プロバイダーは通常、ログイン/更新フロー中に **新しい更新トークン** を作成します。一部のプロバイダー (または OAuth クライアント) は、同じユーザー/アプリに対して新しいリフレッシュ トークンが発行されると、古いリフレッシュ トークンを無効にすることがあります。

実際の症状:

- OpenClaw 経由、および Claude Code / Codex CLI 経由でログイン → そのうちの 1 つが後でランダムに「ログアウト」されます

これを軽減するために、OpenClaw は `auth-profiles.json` を **トークン シンク**として扱います。- ランタイムは **1 か所**から資格情報を読み取ります

- 複数のプロファイルを保持し、それらを決定的にルーティングできます

## ストレージ (トークンが存在する場所)

シークレットは **エージェントごと**に保存されます。

- 認証プロファイル (OAuth + API キー + オプションの値レベルの参照): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー互換性ファイル: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (静的 `api_key` エントリは検出時にスクラブされます)

従来のインポート専用ファイル (引き続きサポートされていますが、メイン ストアではサポートされていません):

- `~/.openclaw/credentials/oauth.json` (初回使用時に `auth-profiles.json` にインポート)

上記のすべては、`$OPENCLAW_STATE_DIR` (状態ディレクトリのオーバーライド) も考慮します。完全なリファレンス: [/gateway/configuration](/gateway/configuration#auth-storage-oauth--api-keys)

静的シークレット参照と実行時スナップショットのアクティブ化動作については、[シークレット管理](/gateway/secrets) を参照してください。

## Anthropic セットアップ トークン (サブスクリプション認証)

<Warning>
Anthropic セットアップ トークンのサポートは技術的な互換性であり、ポリシーの保証ではありません。
Anthropic は過去に、Claude Code 以外でのサブスクリプションの使用をブロックしました。
サブスクリプション認証を使用するかどうかを自分で決定し、Anthropic の現在の規約を確認してください。
</Warning>

任意のマシンで `claude setup-token` を実行し、それを OpenClaw に貼り付けます。

```bash
openclaw models auth setup-token --provider anthropic
```

トークンを別の場所で生成した場合は、手動で貼り付けます。

```bash
openclaw models auth paste-token --provider anthropic
```

確認:

```bash
openclaw models status
```

## OAuth 交換 (ログインの仕組み)OpenClaw の対話型ログイン フローは `@mariozechner/pi-ai` に実装されており、ウィザード/コマンドに組み込まれています

### 人間セットアップトークン

流れの形状:

1. `claude setup-token` を実行します
2. トークンを OpenClaw に貼り付けます
3. トークン認証プロファイルとして保存 (更新なし)

ウィザードのパスは `openclaw onboard` → 認証選択 `setup-token` (Anthropic) です。

### OpenAI コーデックス (ChatGPT OAuth)

OpenAI Codex OAuth は、OpenClaw ワークフローなど、Codex CLI の外部での使用が明示的にサポートされています。

流れの形状 (PKCE):

1. PKCE 検証者/チャレンジ + ランダム `state` を生成します。
2. `https://auth.openai.com/oauth/authorize?...` を開きます
3. `http://127.0.0.1:1455/auth/callback` でコールバックをキャプチャしてみます
4. コールバックがバインドできない場合 (またはリモート/ヘッドレスの場合)、リダイレクト URL/コードを貼り付けます
5. `https://auth.openai.com/oauth/token` で交換
6. アクセス トークンから `accountId` を抽出し、`{ access, refresh, expires, accountId }` を保存します

ウィザードのパスは `openclaw onboard` → 認証選択 `openai-codex` です。

## 更新 + 有効期限

プロファイルには `expires` タイムスタンプが保存されます。

実行時:

- `expires` が将来の場合 → 保存されているアクセス トークンを使用する
- 期限切れの場合 → (ファイルロック下で) 更新し、保存されている認証情報を上書きします

更新フローは自動です。通常、トークンを手動で管理する必要はありません。

## 複数のアカウント (プロファイル) + ルーティング

2 つのパターン:

### 1) 推奨: 別のエージェント「個人」と「仕事」が決してやり取りしないようにしたい場合は、分離されたエージェント (個別のセッション + 資格情報 + ワークスペース) を使用します

```bash
openclaw agents add work
openclaw agents add personal
```

次に、エージェントごとに認証を構成し (ウィザード)、チャットを適切なエージェントにルーティングします。

### 2) 詳細: 1 つのエージェント内の複数のプロファイル

`auth-profiles.json` は、同じプロバイダーの複数のプロファイル ID をサポートします。

使用するプロファイルを選択します。

- 構成の順序付けを介してグローバルに (`auth.order`)
- `/model ...@<profileId>` 経由のセッションごと

例 (セッションオーバーライド):

- `/model Opus@anthropic:work`

存在するプロファイル ID を確認する方法:

- `openclaw channels list --json` (`auth[]` を表示)

関連ドキュメント:

- [/concepts/model-failover](/concepts/model-failover) (ローテーション + クールダウン ルール)
- [/tools/slash-commands](/tools/slash-commands) (コマンド サーフェス)
