---
summary: "「openclaw チャネル」の CLI リファレンス (アカウント、ステータス、ログイン/ログアウト、ログ)"
read_when:
  - チャンネルアカウントを追加/削除したい（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（プラグイン）/Signal/iMessage）
  - チャンネルのステータスやテールチャンネルのログを確認したい
title: "チャンネル"
x-i18n:
  source_hash: "b2b34e5aa73559fb9f670438881608ce735a4dfcf7f5b3299b34ae99a6a4f8d3"
---

# `openclaw channels`

ゲートウェイ上でチャット チャネル アカウントとその実行時ステータスを管理します。

関連ドキュメント:

- チャンネルガイド: [チャンネル](/channels/index)
- ゲートウェイ構成: [構成](/gateway/configuration)

## 共通コマンド

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## アカウントの追加/削除

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels remove --channel telegram --delete
```

ヒント: `openclaw channels add --help` は、チャネルごとのフラグ (トークン、アプリ トークン、シグナル CLI パスなど) を示します。

フラグを指定せずに `openclaw channels add` を実行すると、対話型ウィザードで次のプロンプトが表示されます。

- 選択したチャンネルごとのアカウント ID
- それらのアカウントのオプションの表示名
- `Bind configured channel accounts to agents now?`

今すぐバインドすることを確認すると、ウィザードは、構成されている各チャネル アカウントをどのエージェントが所有するかを尋ね、アカウント スコープのルーティング バインディングを書き込みます。

後で、`openclaw agents bindings`、`openclaw agents bind`、`openclaw agents unbind` を使用して同じルーティング ルールを管理することもできます ([エージェント](/cli/agents) を参照)。

単一アカウントのトップレベル設定 (`channels.<channel>.accounts` エントリがまだない) をまだ使用しているチャネルにデフォルト以外のアカウントを追加すると、OpenClaw はアカウントスコープの単一アカウントのトップレベル値を `channels.<channel>.accounts.default` に移動し、新しいアカウントを書き込みます。これにより、マルチアカウント形態に移行する際に、元のアカウントの動作が維持されます。

ルーティング動作の一貫性は維持されます。- 既存のチャネルのみのバインディング (`accountId` なし) は引き続きデフォルトのアカウントと一致します。

- `channels add` は、非対話モードではバインディングを自動作成または再書き込みしません。
- 対話型セットアップでは、オプションでアカウント スコープのバインディングを追加できます。

構成がすでに混合状態になっている場合 (名前付きアカウントが存在し、`default` が欠落し、最上位の単一アカウント値がまだ設定されている)、`openclaw doctor --fix` を実行して、アカウント スコープの値を `accounts.default` に移動します。

## ログイン/ログアウト (対話型)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

## トラブルシューティング

- 広範囲のプローブに対して `openclaw status --deep` を実行します。
- ガイド付き修正には `openclaw doctor` を使用します。
- `openclaw channels list` は `Claude: HTTP 403 ... user:profile` を出力します。 → 使用状況スナップショットには `user:profile` スコープが必要です。 `--no-usage` を使用するか、claude.ai セッション キー (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) を指定するか、Claude Code CLI 経由で再認証します。
- `openclaw channels status` は、ゲートウェイに到達できない場合、構成のみのサマリーにフォールバックします。サポートされているチャネル認証情報が SecretRef 経由で設定されているが、現在のコマンド パスでは使用できない場合、そのアカウントは未設定として表示されるのではなく、劣化したメモを使用して設定済みとして報告されます。

## 機能プローブ

プロバイダー機能のヒント (使用可能な場合はインテント/スコープ) と静的機能のサポートを取得します。

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注:- `--channel` はオプションです。すべてのチャネル (拡張子を含む) をリストするには、これを省略します。

- `--target` は `channel:<id>` または生の数値チャネル ID を受け入れ、Discord にのみ適用されます。
- プローブはプロバイダー固有です: Discord インテント + オプションのチャネル許可。 Slack ボット + ユーザー スコープ。 Telegram ボット フラグ + Webhook。シグナルデーモンのバージョン。 MS Teams アプリ トークン + グラフ ロール/スコープ (既知の場合は注釈付き)。プローブのないチャネルは `Probe: unavailable` を報告します。

## 名前を ID に解決する

プロバイダー ディレクトリを使用して、チャネル/ユーザー名を ID に解決します。

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注:

- `--kind user|group|auto` を使用してターゲット タイプを強制します。
- 複数のエントリが同じ名前を共有する場合、解決ではアクティブな一致が優先されます。
- `channels resolve` は読み取り専用です。選択したアカウントが SecretRef 経由で構成されているが、その資格情報が現在のコマンド パスで使用できない場合、コマンドは実行全体を中止するのではなく、メモとともに劣化した未解決の結果を返します。
