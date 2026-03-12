---
summary: "ゲートウェイ、チャネル、自動化、ノード、ブラウザに関する詳細なトラブルシューティング手順"
read_when:
  - トラブルシューティングハブから詳細な診断のために誘導された場合
  - 症状に基づいた具体的な解決手順とコマンドが必要な場合
title: "トラブルシューティング"
---

# ゲートウェイのトラブルシューティング

このページは詳細なトラブルシューティング手順をまとめたランブックです。
まず迅速な診断を行いたい場合は、[/help/troubleshooting](/help/troubleshooting) を参照してください。

## 基本的な確認手順

まず、以下のコマンドを順番に実行してください。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常な状態を示すシグナル：

- `openclaw gateway status` で `Runtime: running` および `RPC probe: ok` と表示される。
- `openclaw doctor` で、動作を妨げる設定やサービスの問題が報告されない。
- `openclaw channels status --probe` で、チャネルが接続済み（connected）または準備完了（ready）と表示される。

## Anthropic 429: 長いコンテキストには追加の利用枠が必要

ログやエラーに `HTTP 429: rate_limit_error: Extra usage is required for long context requests` と表示される場合に使用します。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

確認事項：

- 選択された Anthropic Opus/Sonnet モデルで `params.context1m: true` が設定されているか。
- 現在の Anthropic 認証情報が、長いコンテキスト（1Mコンテキスト）の利用資格を満たしているか。
- 1Mコンテキストのベータパスを必要とする長いセッションやモデル実行でのみ失敗していないか。

解決策：

1. そのモデルの `context1m` を無効化し、通常のコンテキストウィンドウにフォールバックさせる。
2. 支払い設定済みの Anthropic API キーを使用するか、サブスクリプションアカウントで Anthropic Extra Usage を有効にする。
3. Anthropic の長いコンテキスト要求が拒否された場合に備え、フォールバックモデルを設定して実行を継続できるようにする。

関連情報：

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 返信がない場合

チャネルは稼働しているが応答がない場合は、再接続を試みる前にルーティングとポリシーを確認してください。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

確認事項：

- DM送信者のペアリングが保留中になっていないか。
- グループチャットのメンション設定（`requireMention`, `mentionPatterns`）が正しく構成されているか。
- チャネルやグループの許可リストの設定に不備がないか。

特徴的なログメッセージ：

- `drop guild message (mention required` → メンションされるまでグループメッセージを無視しています。
- `pairing request` → 送信者に承認（ペアリング）が必要です。
- `blocked` / `allowlist` → 送信者またはチャネルがポリシーによってフィルタリングされています。

関連情報：

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

## ダッシュボード/Control UI の接続エラー

ダッシュボードやControl UIが接続できない場合は、URL、認証モード、およびセキュアコンテキストの前提条件を検証してください。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

確認事項：

- プローブURLとダッシュボードURLが正しいか。
- クライアントとゲートウェイ間で認証モードやトークンが一致しているか。
- デバイス認証が必要な場面でHTTPを使用していないか。

特徴的なログメッセージ：

- `device identity required` → 非セキュアなコンテキスト、またはデバイス認証が欠落しています。
- `device nonce required` / `device nonce mismatch` → クライアントがチャレンジベースのデバイス認証フロー（`connect.challenge` + `device.nonce`）を完了していません。
- `device signature invalid` / `device signature expired` → クライアントが現在のハンドシェイクに対して誤ったペイロード（または古いタイムスタンプ）で署名しました。
- `unauthorized` / 再接続のループ → トークンまたはパスワードが一致していません。
- `gateway connect failed:` → ホスト、ポート、またはURLターゲットが誤っています。

デバイス認証 v2 への移行チェック：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログに nonce や署名のエラーが表示される場合は、接続クライアントを更新し、以下の手順を確認してください。

1. `connect.challenge` を待機する。
2. チャレンジに紐付けられたペイロードに署名する。
3. 同じチャレンジ nonce を含む `connect.params.device.nonce` を送信する。

関連情報：

- [/web/control-ui](/web/control-ui)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/remote](/gateway/remote)

## ゲートウェイサービスが起動しない

サービスはインストールされているが、プロセスが維持されない場合に使用します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep
```

確認事項：

- `Runtime: stopped` と表示され、終了時のヒントが出力されていないか。
- サービスの構成設定に不一致がないか（`Config (cli)` vs `Config (service)`）。
- ポートやリスナーの競合が発生していないか。

特徴的なログメッセージ：

- `Gateway start blocked: set gateway.mode=local` → ローカルゲートウェイモードが有効になっていません。解決策：設定で `gateway.mode="local"` を指定してください（または `openclaw configure` を実行）。Podman等で専用の `openclaw` ユーザーを使用している場合、設定ファイルは `~openclaw/.openclaw/openclaw.json` にあります。
- `refusing to bind gateway ... without auth` → トークンやパスワードの設定なしで、ループバック以外のインターフェースにバインドしようとしています。
- `another gateway instance is already listening` / `EADDRINUSE` → ポートが競合しています。

関連情報：

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## チャネルは接続されているがメッセージが流れない

チャネルの状態は「connected」だがメッセージの送受信ができない場合は、ポリシー、権限、およびチャネル固有の配信ルールを確認してください。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

確認事項：

- DMポリシー（`pairing`, `allowlist`, `open`, `disabled`）の設定。
- グループの許可リストとメンションの要件。
- チャネルAPIの権限（スコープ）が不足していないか。

特徴的なログメッセージ：

- `mention required` → グループメンションポリシーによりメッセージが無視されました。
- `pairing` / 承認待ちのトレース → 送信者が承認されていません。
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → チャネルの認証または権限の問題です。

関連情報：

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

## Cron および ハートビートの配信エラー

Cronやハートビートが実行されない、または配信されない場合は、まずスケジューラーの状態を確認し、次に配信ターゲットを確認してください。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

確認事項：

- Cronが有効化されており、次の実行予定（next wake）が存在するか。
- ジョブの実行履歴ステータス（`ok`, `skipped`, `error`）。
- ハートビートがスキップされた理由（`quiet-hours`, `requests-in-flight`, `alerts-disabled`）。

特徴的なログメッセージ：

- `cron: scheduler disabled; jobs will not run automatically` → Cronが無効になっています。
- `cron: timer tick failed` → スケジューラーの動作に失敗しました。ファイル、ログ、実行環境のエラーを確認してください。
- `heartbeat skipped` with `reason=quiet-hours` → アクティブな時間枠の外です。
- `heartbeat: unknown accountId` → ハートビート配信ターゲットのアカウントIDが不正です。
- `heartbeat skipped` with `reason=dm-blocked` → ハートビートのターゲットがDM形式の宛先になっていますが、`agents.defaults.heartbeat.directPolicy`（またはエージェントごとの上書き設定）が `block` になっています。

関連情報：

- [/automation/troubleshooting](/automation/troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## ノードのペアリング済みツールの失敗

ノードはペアリングされているがツールが失敗する場合は、フォアグラウンドの状態、権限、および承認状態を切り分けて確認してください。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

確認事項：

- ノードがオンラインであり、期待される機能を備えているか。
- カメラ、マイク、位置情報、画面収録に対するOSレベルの権限が許可されているか。
- 実行承認（Exec approvals）および許可リストの状態。

特徴的なログメッセージ：

- `NODE_BACKGROUND_UNAVAILABLE` → ノードアプリがフォアグラウンドにある必要があります。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OSレベルの権限が不足しています。
- `SYSTEM_RUN_DENIED: approval required` → 実行の承認待ちです。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが許可リストによってブロックされました。

関連情報：

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## ブラウザツールの失敗

ゲートウェイ自体は正常だが、ブラウザツールの操作が失敗する場合に使用します。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

確認事項：

- ブラウザの実行ファイルパスが正しいか。
- CDPプロファイルにアクセス可能か。
- `profile="chrome"` の場合、拡張機能リレーのタブがアタッチされているか。

特徴的なログメッセージ：

- `Failed to start Chrome CDP on port` → ブラウザプロセスの起動に失敗しました。
- `browser.executablePath not found` → 設定されたパスが無効です。
- `Chrome extension relay is running, but no tab is connected` → 拡張機能リレーがアタッチされていません。
- `Browser attachOnly is enabled ... not reachable` → アタッチ専用プロファイルでターゲットが見つかりません。

関連情報：

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/chrome-extension](/tools/chrome-extension)
- [/tools/browser](/tools/browser)

## アップグレード後に問題が発生した場合

アップグレード後のトラブルの多くは、設定の不整合や、より厳格になったデフォルト設定の適用によるものです。

### 1) 認証およびURLの上書き挙動の変更

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

確認内容：

- `gateway.mode=remote` になっている場合、ローカルサービスが正常でも、CLIがリモートをターゲットにしている可能性があります。
- 明示的な `--url` 指定での呼び出しは、保存された認証情報にフォールバックしません。

特徴的なログメッセージ：

- `gateway connect failed:` → URLターゲットが誤っています。
- `unauthorized` → エンドポイントには到達していますが、認証情報が誤っています。

### 2) バインドおよび認証の制限強化

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

確認内容：

- ループバック以外（`lan`, `tailnet`, `custom`）にバインドする場合、認証の設定が必須です。
- `gateway.token` のような古いキーは `gateway.auth.token` を置き換えません。

特徴的なログメッセージ：

- `refusing to bind gateway ... without auth` → バインド設定と認証設定が一致していません。
- `RPC probe: failed` （ランタイムは稼働中） → ゲートウェイは起動していますが、現在の認証設定またはURLではアクセスできません。

### 3) ペアリングおよびデバイス認証の状態変更

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

確認内容：

- ダッシュボードやノードに対するデバイス承認が保留されていないか。
- ポリシーやIDの変更後、DMのペアリング承認が再度必要になっていないか。

特徴的なログメッセージ：

- `device identity required` → デバイス認証の条件を満たしていません。
- `pairing required` → 送信者またはデバイスの承認が必要です。

確認を行っても設定と実行状態が一致しない場合は、同じプロファイル/状態ディレクトリからサービスのメタデータを再インストールしてください。

```bash
openclaw gateway install --force
openclaw gateway restart
```

関連情報：

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
