---
summary: "ゲートウェイ、チャネル、自動化、ノード、ブラウザーの詳細なトラブルシューティング ランブック"
read_when:
  - トラブルシューティング ハブは、より詳細な診断のためにここを示しました
  - 正確なコマンドを含む、安定した症状ベースの Runbook セクションが必要です
title: "トラブルシューティング"
x-i18n:
  source_hash: "2016d75d24ea86d982fa11bbe05f8506d41dd1defbef8f3cf9864664fb01ecc4"
---

# ゲートウェイのトラブルシューティング

このページは詳細なランブックです。
最初に迅速な優先順位付けフローが必要な場合は、[/help/troubleshooting](/help/troubleshooting) から開始してください。

## コマンドラダー

最初にこれらを次の順序で実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

予想される健全なシグナル:

- `openclaw gateway status` は、`Runtime: running` および `RPC probe: ok` を示します。
- `openclaw doctor` は、ブロックする構成/サービスの問題を報告しません。
- `openclaw channels status --probe` は、接続済み/準備完了のチャネルを示します。

## 長いコンテキストには Anthropic 429 の追加使用が必要

ログ/エラーに次のものが含まれる場合にこれを使用します。
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

探してください:

- 選択された Anthropic Opus/Sonnet モデルには `params.context1m: true` が含まれています。
- 現在の Anthropic 資格情報は、ロングコンテキストでの使用には適していません。
- リクエストは、1M ベータ パスを必要とする長いセッション/モデルの実行でのみ失敗します。

修正オプション:

1. 通常のコンテキスト ウィンドウにフォールバックするには、そのモデルの `context1m` を無効にします。
2. 課金で Anthropic API キーを使用するか、サブスクリプション アカウントで Anthropic Extra Use を有効にします。
3. Anthropic のロングコンテキスト要求が拒否された場合でも実行が継続されるように、フォールバック モデルを構成します。

関連:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 返信はありません

チャネルは稼働しているが応答がない場合は、再接続する前にルーティングとポリシーを確認してください。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

探してください:- DM 送信者のペアリングが保留中です。

- グループメンションゲート (`requireMention`、`mentionPatterns`)。
- チャネル/グループの許可リストの不一致。

一般的な署名:

- `drop guild message (mention required` → 言及されるまでグループ メッセージは無視されます。
- `pairing request` → 送信者には承認が必要です。
- `blocked` / `allowlist` → 送信者/チャネルはポリシーによってフィルタリングされました。

関連:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

## ダッシュボード コントロール UI 接続

ダッシュボード/コントロール UI が接続できない場合は、URL、認証モード、および安全なコンテキストの前提条件を検証します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

探してください:

- プローブ URL とダッシュボード URL を修正します。
- クライアントとゲートウェイ間の認証モード/トークンの不一致。
- デバイス ID が必要な HTTP の使用。

一般的な署名:

- `device identity required` → 安全でないコンテキストまたはデバイス認証がありません。
- `device nonce required` / `device nonce mismatch` → クライアントが完了していません
  チャレンジベースのデバイス認証フロー (`connect.challenge` + `device.nonce`)。
- `device signature invalid` / `device signature expired` → クライアントは間違ったものに署名しました
  現在のハンドシェイクのペイロード (または古いタイムスタンプ)。
- `unauthorized` / ループ再接続 → トークン/パスワードの不一致。
- `gateway connect failed:` → ホスト/ポート/URL ターゲットが間違っています。

デバイス認証 v2 移行チェック:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

ログに nonce/署名エラーが表示される場合は、接続しているクライアントを更新して確認します。1. `connect.challenge` を待ちます 2. チャレンジバインドされたペイロードに署名する 3. 同じチャレンジノンスを含む `connect.params.device.nonce` を送信します

関連:

- [/web/control-ui](/web/control-ui)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/remote](/gateway/remote)

## ゲートウェイ サービスが実行されていません

サービスはインストールされているがプロセスが起動しない場合にこれを使用します。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep
```

探してください:

- `Runtime: stopped` 終了ヒント付き。
- サービス構成の不一致 (`Config (cli)` と `Config (service)`)。
- ポート/リスナーの競合。

一般的な署名:

- `Gateway start blocked: set gateway.mode=local` → ローカル ゲートウェイ モードが有効になっていません。修正: 構成で `gateway.mode="local"` を設定します (または `openclaw configure` を実行します)。専用の `openclaw` ユーザーを使用して Podman 経由で OpenClaw を実行している場合、構成は `~openclaw/.openclaw/openclaw.json` にあります。
- `refusing to bind gateway ... without auth` → トークン/パスワードなしの非ループバック バインド。
- `another gateway instance is already listening` / `EADDRINUSE` → ポートの競合。

関連:

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## チャネルに接続されたメッセージが流れない

チャネル状態は接続されているが、メッセージ フローが停止している場合は、ポリシー、アクセス許可、およびチャネル固有の配信ルールに注目してください。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

探してください:- DM ポリシー (`pairing`、`allowlist`、`open`、`disabled`)。

- グループの許可リストとメンション要件。
- チャネル API 権限/スコープがありません。

一般的な署名:

- `mention required` → グループメンションポリシーによってメッセージが無視されました。
- `pairing` / 保留中の承認トレース → 送信者は承認されていません。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → チャネル認証/権限の問題。

関連:

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

## Cron とハートビートの配信

cron またはハートビートが実行されなかった場合、または配信されなかった場合は、まずスケジューラーの状態を確認し、次に配信ターゲットを確認します。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

探してください:

- Cron が有効で、次のウェイクが存在します。
- ジョブ実行履歴ステータス (`ok`、`skipped`、`error`)。
- ハートビート スキップの理由 (`quiet-hours`、`requests-in-flight`、`alerts-disabled`)。

一般的な署名:- `cron: scheduler disabled; jobs will not run automatically` → cron が無効になりました。

- `cron: timer tick failed` → スケジューラのティックが失敗しました。ファイル/ログ/ランタイムエラーをチェックしてください。
- `heartbeat skipped` と `reason=quiet-hours` → アクティブ時間枠外。
- `heartbeat: unknown accountId` → ハートビート配信ターゲットのアカウント ID が無効です。
- `heartbeat skipped` と `reason=dm-blocked` → ハートビート ターゲットは DM スタイルの宛先に解決されますが、`agents.defaults.heartbeat.directPolicy` (またはエージェントごとのオーバーライド) は `block` に設定されます。

関連:

- [/automation/troubleshooting](/automation/troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## ノードペアリングツールが失敗する

ノードがペアになっているにもかかわらずツールが失敗した場合は、フォアグラウンド、権限、および承認の状態を分離します。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

探してください:

- 期待される機能を備えたオンラインのノード。
- カメラ/マイク/位置/画面に対する OS 権限の付与。
- 実行の承認と許可リストの状態。

一般的な署名:

- `NODE_BACKGROUND_UNAVAILABLE` → ノード アプリはフォアグラウンドにある必要があります。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 権限がありません。
- `SYSTEM_RUN_DENIED: approval required` → 執行承認待ち。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドが許可リストによってブロックされました。

関連:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## ブラウザツールが失敗する

ゲートウェイ自体は正常であってもブラウザ ツールのアクションが失敗する場合にこれを使用します。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

探してください:- 有効なブラウザ実行可能パス。

- CDP プロファイルの到達可能性。
- `profile="chrome"`用の拡張リレータブアタッチメント。

一般的な署名:

- `Failed to start Chrome CDP on port` → ブラウザプロセスの起動に失敗しました。
- `browser.executablePath not found` → 設定されたパスが無効です。
- `Chrome extension relay is running, but no tab is connected` → 増設リレーは付属しておりません。
- `Browser attachOnly is enabled ... not reachable` → 添付専用プロファイルには到達可能なターゲットがありません。

関連:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/chrome-extension](/tools/chrome-extension)
- [/tools/browser](/tools/browser)

## アップグレードして何かが突然壊れた場合

アップグレード後の破損のほとんどは、構成のドリフト、または現在適用されているより厳格なデフォルトです。

### 1) 認証および URL オーバーライドの動作が変更されました

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

確認すべき内容:

- `gateway.mode=remote` の場合、ローカル サービスは正常であるにもかかわらず、CLI 呼び出しがリモートをターゲットにしている可能性があります。
- 明示的な `--url` 呼び出しは、保存された資格情報にフォールバックしません。

一般的な署名:

- `gateway connect failed:` → URL ターゲットが間違っています。
- `unauthorized` → エンドポイントは到達可能ですが、認証が間違っています。

### 2) バインドと認証のガードレールがより厳格になりました

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

確認すべき内容:

- 非ループバック バインド (`lan`、`tailnet`、`custom`) には認証の設定が必要です。
- `gateway.token` のような古いキーは `gateway.auth.token` を置き換えません。

一般的な署名:- `refusing to bind gateway ... without auth` → バインドと認証の不一致。

- `RPC probe: failed` ランタイム実行中 → ゲートウェイは動作していますが、現在の認証/URL ではアクセスできません。

### 3) ペアリングとデバイス ID の状態が変更されました

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

確認すべき内容:

- ダッシュボード/ノードのデバイス承認が保留中です。
- ポリシーまたはアイデンティティの変更後の DM ペアリングの承認が保留されています。

一般的な署名:

- `device identity required` → デバイス認証が満たされていません。
- `pairing required` → 送信者/デバイスは承認される必要があります。

チェック後もサービス構成とランタイムが一致しない場合は、同じプロファイル/状態ディレクトリからサービス メタデータを再インストールします。

```bash
openclaw gateway install --force
openclaw gateway restart
```

関連:

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
