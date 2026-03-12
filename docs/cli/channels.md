---
summary: "`openclaw channels` の CLI リファレンス (アカウント管理、ステータス確認、ログイン/ログアウト、ログ参照)"
read_when:
  - チャネルアカウント (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost/Signal/iMessage など) を追加・削除したい場合
  - チャネルの稼働状況を確認したり、ログを追跡したい場合
title: "channels"
x-i18n:
  source_hash: "b2b34e5aa73559fb9f670438881608ce735a4dfcf7f5b3299b34ae99a6a4f8d3"
---
ゲートウェイにおけるチャットチャネルアカウントとその実行ステータスを管理します。

関連ドキュメント:
- 各チャネルのガイド: [チャネル一覧](/channels/index)
- ゲートウェイ構成: [構成](/gateway/configuration)

## よく使われるコマンド

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## アカウントの追加と削除

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels remove --channel telegram --delete
```

ヒント: `openclaw channels add --help` を実行すると、チャネルごとのフラグ（トークン、アプリトークン、signal-cli のパスなど）を確認できます。

フラグを指定せずに `openclaw channels add` を実行すると、対話形式のウィザードが開始され、以下の入力を求められます:
- 選択したチャネルごとのアカウント ID
- 各アカウントの表示名（任意）
- `Bind configured channel accounts to agents now?` (構成したアカウントを今すぐエージェントに紐付けますか？)

ここで紐付けを承認すると、各チャネルアカウントをどのエージェントが所有するかを尋ねられ、アカウントスコープのルーティングバインディングが書き込まれます。

これらのルーティングルールは、後から `openclaw agents bindings`、`openclaw agents bind`、`openclaw agents unbind` コマンドで管理することも可能です（詳細は [agents](/cli/agents) を参照）。

単一アカウント用のトップレベル設定（`channels.<channel>.accounts` エントリがまだない状態）を使用しているチャネルにデフォルト以外のアカウントを追加すると、OpenClaw は既存のアカウント設定を `channels.<channel>.accounts.default` に移動した上で、新しいアカウント情報を書き込みます。これにより、元のアカウントの動作を維持したままマルチアカウント構成へ移行できます。

ルーティングの動作は一貫性が保たれます:
- アカウント ID を指定しない既存のチャネルのみのバインディングは、引き続きデフォルトアカウントに一致します。
- 非対話モードでは、`channels add` はバインディングの自動作成や書き換えを行いません。
- 対話形式のセットアップでは、オプションでアカウントスコープのバインディングを追加できます。

もし構成がすでに混在した状態（名前付きアカウントがあるのに `default` が欠落し、トップレベルの設定が残っている状態）になっている場合は、`openclaw doctor --fix` を実行して設定を `accounts.default` に整理してください。

## ログイン / ログアウト (対話形式)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

## トラブルシューティング

- 広範囲の診断を行うには `openclaw status --deep` を実行してください。
- ガイド付きの修正には `openclaw doctor` を使用してください。
- `openclaw channels list` で `Claude: HTTP 403 ... user:profile` と表示される場合、利用状況の取得に `user:profile` スコープが必要です。`--no-usage` を指定するか、claude.ai のセッションキー (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) を提供するか、Claude Code CLI で再認証を行ってください。
- ゲートウェイに到達できない場合、`openclaw channels status` は構成ファイルのみに基づくサマリーを表示します。SecretRef で設定された認証情報が現在のパスで利用できない場合、そのアカウントは「未設定」ではなく、注意書きと共に「設定済み（制限あり）」として報告されます。

## 機能プローブ (Capabilities probe)

プロバイダーの機能ヒント（利用可能なインテントやスコープ）および静的な機能サポート状況を取得します:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

補足:
- `--channel` は任意です。省略すると、拡張機能を含むすべてのチャネルを一覧表示します。
- `--target` は `channel:<id>` または数値のチャネル ID を受け入れ、Discord にのみ適用されます。
- 取得できる情報はプロバイダーごとに異なります。Discord のインテントやチャネル権限、Slack のボットおよびユーザースコープ、Telegram ボットのフラグや Webhook 設定、Signal デーモンのバージョン、MS Teams アプリのトークンや Graph のロール/スコープ（判明しているもの）などが含まれます。プローブに対応していないチャネルは `Probe: unavailable` と表示されます。

## 名前から ID への解決

プロバイダーのディレクトリを使用して、チャネル名やユーザー名を ID に解決します:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

補足:
- `--kind user|group|auto` を使用して、対象のタイプを強制できます。
- 同じ名前の候補が複数ある場合、アクティブな一致が優先されます。
- `channels resolve` は読み取り専用の操作です。SecretRef で設定されたアカウントの認証情報が利用できない場合、コマンド全体を中止するのではなく、解決できなかった結果を注意書きと共に返します。
