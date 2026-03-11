---
summary: "signal-cli (JSON-RPC + SSE) を介した Signal のサポート、セットアップ、および番号モデル"
read_when:
  - Signal サポートをセットアップする場合
  - Signal の送受信をデバッグする場合
title: "Signal"
x-i18n:
  source_hash: "524d9868f138d46495bb9518b0cbb9c6ef6174248552377a8a659d616501a394"
---

# Signal (signal-cli)

ステータス: 外部 CLI 連携。ゲートウェイは HTTP JSON-RPC + SSE 経由で `signal-cli` と通信します。

## 前提条件

- OpenClaw がサーバーにインストールされていること (以下の Linux フローは Ubuntu 24 でテスト済み)。
- ゲートウェイが実行されているホストで `signal-cli` が利用可能であること。
- SMS 登録を行う場合は、認証 SMS を受信できる電話番号。
- 登録時の Signal キャプチャ (`signalcaptchas.org`) のためのブラウザアクセス。

## クイックセットアップ (初心者向け)

1. ボット用には **個別の Signal 番号** を用意することを推奨します。
2. `signal-cli` をインストールします (JVM ビルドを使用する場合は Java が必要です)。
3. 以下のいずれかのセットアップ方法を選択します:
   - **方法 A (QR コード連携):** `signal-cli link -n "OpenClaw"` を実行し、既存の Signal アプリで QR コードをスキャンします。
   - **方法 B (SMS 登録):** キャプチャと SMS 認証を使用して、専用の番号を登録します。
4. OpenClaw を設定し、ゲートウェイを再起動します。
5. 最初の DM を送信し、ペアリングを承認します (`openclaw pairing approve signal <CODE>`)。

最小限の構成:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

フィールドリファレンス:

| フィールド | 説明 |
| :--- | :--- |
| `account` | E.164 形式のボット電話番号 (`+15551234567`) |
| `cliPath` | `signal-cli` バイナリへのパス (`PATH` が通っている場合は `signal-cli`) |
| `dmPolicy` | DM アクセスポリシー (`pairing` を推奨) |
| `allowFrom` | DM を許可する電話番号または `uuid:<id>` |

## Signal チャネルの概要

- `signal-cli` を介した Signal チャネルの提供 (組み込みの libsignal ではありません)。
- 確定的なルーティング: 返信は常にメッセージが届いたチャネルに戻ります。
- DM はエージェントのメインセッションを共有し、グループは個別に分離されます (`agent:<agentId>:signal:group:<groupId>`)。

## 構成の書き込み

デフォルトでは、Signal チャネルにおいて `/config set|unset` コマンドによる構成の更新が許可されています (`commands.config: true` が必要)。

これを無効にするには以下のように設定します:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 番号モデルに関する重要な注意

- ゲートウェイは **Signal デバイス** (`signal-cli` アカウント) に接続します。
- **個人の Signal アカウント**でボットを実行した場合、ボットは自分自身のメッセージを無視します (ループ防止のため)。
- 「ユーザーがボットにメッセージを送り、ボットが返信する」という動作をさせるには、**別のボット用番号**を使用してください。

## セットアップ方法 A: 既存の Signal アカウントと連携する (QR コード)

1. `signal-cli` (JVM またはネイティブビルド) をインストールします。
2. ボットアカウントをリンクします:
   - `signal-cli link -n "OpenClaw"` を実行し、Signal アプリで表示された QR コードをスキャンします。
3. Signal チャネルを構成し、ゲートウェイを起動します。

構成例:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

マルチアカウントのサポート: `channels.signal.accounts` を使用して、アカウントごとの構成とオプションの `name` を指定できます。共通のパターンについては [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts) を参照してください。

## セットアップ方法 B: 専用のボット番号を登録する (SMS, Linux)

既存の Signal アカウントをリンクするのではなく、専用の番号を使用したい場合にこの方法を使用します。

1. SMS (または固定電話の場合は音声認証) を受信できる番号を取得します。
   - アカウントやセッションの競合を避けるため、専用の番号を使用してください。
2. ゲートウェイホストに `signal-cli` をインストールします:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM ビルド (`signal-cli-${VERSION}.tar.gz`) を使用する場合は、事前に JRE 25 以上をインストールしてください。
Signal サーバーの API 変更により古いリリースが動作しなくなる可能性があるため、`signal-cli` は常に最新の状態に保ってください。

3. 番号を登録し、認証します:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

キャプチャが必要な場合:

1. `https://signalcaptchas.org/registration/generate.html` を開きます。
2. キャプチャを完了し、「Open Signal」リンクから `signalcaptcha://...` で始まるトークンをコピーします。
3. 可能な限り、ブラウザセッションと同じ外部 IP から実行してください。
4. トークンの期限が短いため、すぐに以下のコマンドで登録を再試行してください:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw を構成し、ゲートウェイを再起動してチャネルを確認します:

```bash
# ゲートウェイをユーザーの systemd サービスとして実行している場合:
systemctl --user restart openclaw-gateway

# その後、確認します:
openclaw doctor
openclaw channels status --probe
```

5. 送信者をペアリングします:
   - ボットの番号にメッセージを送信します。
   - サーバー側でコードを承認します: `openclaw pairing approve signal <PAIRING_CODE>`。
   - 「不明な連絡先」と表示されるのを避けるため、ボットの番号をスマートフォンの連絡先に保存してください。

重要: `signal-cli` で番号を登録すると、その番号を使用している他の Signal アプリのセッションが解除される場合があります。既存のアプリ設定を維持したい場合は、方法 A の QR コード連携を使用してください。

参考資料:
- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- キャプチャフロー: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 連携フロー: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部デーモンモード (httpUrl)

`signal-cli` を自身で管理したい場合（JVM の起動が遅い、コンテナ利用、CPU 共有など）、デーモンを個別に起動して OpenClaw から参照させることができます:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

これにより、OpenClaw 内部での自動起動と待機がスキップされます。自動起動時に起動が遅い場合は、`channels.signal.startupTimeoutMs` を設定してください。

## アクセス制御 (DM + グループ)

DM:
- デフォルト: `channels.signal.dmPolicy = "pairing"`。
- 未知の送信者にはペアリングコードが送信され、承認されるまでメッセージは無視されます（コードは 1 時間で期限切れになります）。
- 承認方法:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Signal の DM では、ペアリングが標準の認証フローとなります。詳細は [ペアリング](/channels/pairing) を参照してください。
- UUID のみの送信者 (`sourceUuid` 由来) は、`uuid:<id>` として `channels.signal.allowFrom` に保存されます。

グループ:
- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `allowlist` モードでは、`channels.signal.groupAllowFrom` でボットをトリガーできるユーザーを制御します。
- 注意: `channels.signal` 構成が完全に欠落している場合、ランタイムはグループチェックのために `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されている場合でも）。

## 仕組みと動作

- `signal-cli` はデーモンとして動作し、ゲートウェイは SSE を介してイベントを読み取ります。
- 受信メッセージは共通のチャネル形式に正規化されます。
- 返信は常に送信元の番号またはグループにルーティングされます。

## メディアと制限事項

- 送信テキストは `channels.signal.textChunkLimit` (デフォルト 4000) ごとに分割されます。
- 段落単位の分割: `channels.signal.chunkMode="newline"` を設定すると、長さを基準に分割する前に空行（段落の境界）で分割を試みます。
- 添付ファイルをサポート (`signal-cli` から base64 で取得)。
- デフォルトのメディア制限: `channels.signal.mediaMaxMb` (デフォルト 8)。
- メディアのダウンロードをスキップするには `channels.signal.ignoreAttachments` を使用してください。
- グループ履歴のコンテキスト数は `channels.signal.historyLimit` (またはアカウントごとの設定) を使用し、未設定時は `messages.groupChat.historyLimit` にフォールバックします。`0` を設定すると無効になります (デフォルトは 50)。

## タイピング中表示と既読確認

- **タイピングインジケーター**: OpenClaw は `signal-cli sendTyping` を介してタイピング信号を送信し、返信生成中に定期的に更新します。
- **既読確認**: `channels.signal.sendReadReceipts` が true の場合、許可された DM に対して既読確認を返します。
- Note: `signal-cli` はグループチャットの既読確認を公開していません。

## リアクション (メッセージツール)

- `channel=signal` を指定して `message action=react` を使用します。
- ターゲット: 送信者の E.164 番号または UUID（ペアリング出力の `uuid:<id>` または生の UUID）。
- `messageId`: リアクション対象メッセージの Signal タイムスタンプ。
- グループチャットでのリアクションには `targetAuthor` または `targetAuthorUuid` が必要です。

例:
```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

構成:
- `channels.signal.actions.reactions`: リアクション操作を有効/無効にします (デフォルト true)。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`。
  - `off`/`ack`: エージェントによるリアクションを無効にします (メッセージツールの `react` はエラーになります)。
  - `minimal`/`extensive`: エージェントによるリアクションを有効にし、そのガイダンスレベルを設定します。
- アカウントごとのオーバーライド: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`。

## 配信ターゲット (CLI/Cron)

- DM: `signal:+15551234567` (または生の E.164 番号)。
- UUID による DM: `uuid:<id>` (または生の UUID)。
- グループ: `signal:group:<groupId>`。
- ユーザー名: `username:<name>` (お使いの Signal アカウントが対応している場合)。

## トラブルシューティング

まず以下のコマンドを順に確認してください:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

必要に応じて、DM のペアリング状態を確認します:

```bash
openclaw pairing list signal
```

よくある問題:
- デーモンに到達できるが返信がない: アカウント/デーモンの設定 (`httpUrl`, `account`) と受信モードを確認してください。
- DM が無視される: 送信者が承認待ちの状態です。
- グループメッセージが無視される: 送信者制限またはメンション制限によって配信がブロックされています。
- 編集後の構成検証エラー: `openclaw doctor --fix` を実行してください。
- 診断結果に Signal が表示されない: `channels.signal.enabled: true` であることを確認してください。

追加のチェック:
```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

詳細な診断フローについては、[/channels/troubleshooting](/channels/troubleshooting) を参照してください。

## セキュリティに関する注意

- `signal-cli` はアカウントキーをローカルに保存します (通常は `~/.local/share/signal-cli/data/`)。
- サーバーの移行や再構築の前には、Signal アカウントの状態をバックアップしてください。
- 明示的に広いアクセスを望む場合を除き、`channels.signal.dmPolicy: "pairing"` を維持してください。
- SMS 認証は登録や復旧の際にのみ必要ですが、番号やアカウントの制御を失うと再登録が困難になる場合があります。

## 構成リファレンス (Signal)

完全な構成: [構成](/gateway/configuration)

プロバイダーオプション:
- `channels.signal.enabled`: チャネルの起動を有効/無効にします。
- `channels.signal.account`: ボットアカウントの E.164 番号。
- `channels.signal.cliPath`: `signal-cli` バイナリへのパス。
- `channels.signal.httpUrl`: デーモンの完全な URL (ホスト/ポートを上書き)。
- `channels.signal.httpHost`, `channels.signal.httpPort`: デーモンのバインドアドレス (デフォルト 127.0.0.1:8080)。
- `channels.signal.autoStart`: デーモンを自動起動する (`httpUrl` 未設定時のデフォルトは true)。
- `channels.signal.startupTimeoutMs`: 起動待機タイムアウト (ms, 最大 120000)。
- `channels.signal.receiveMode`: `on-start | manual`。
- `channels.signal.ignoreAttachments`: 添付ファイルのダウンロードをスキップ。
- `channels.signal.ignoreStories`: デーモンからのストーリー（ストーリーズ）を無視。
- `channels.signal.sendReadReceipts`: 既読確認を送信。
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (デフォルト: pairing)。
- `channels.signal.allowFrom`: DM 許可リスト (E.164 または `uuid:<id>`)。`open` の場合は `"*"` が必要です。Signal にはユーザー名がないため、電話番号または UUID を使用します。
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (デフォルト: allowlist)。
- `channels.signal.groupAllowFrom`: グループ送信者の許可リスト。
- `channels.signal.historyLimit`: コンテキストに含めるグループメッセージの最大数 (0 で無効)。
- `channels.signal.dmHistoryLimit`: ユーザーのターン数による DM 履歴の制限。ユーザーごとのオーバーライド: `channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`: 送信テキストのチャンクサイズ (文字数)。
- `channels.signal.chunkMode`: `length` (デフォルト) または `newline` (段落境界で分割)。
- `channels.signal.mediaMaxMb`: 送受信メディアのサイズ上限 (MB)。

関連するグローバルオプション:
- `agents.list[].groupChat.mentionPatterns` (Signal はネイティブのメンションをサポートしていません)。
- `messages.groupChat.mentionPatterns` (グローバルなフォールバック)。
- `messages.responsePrefix`。
