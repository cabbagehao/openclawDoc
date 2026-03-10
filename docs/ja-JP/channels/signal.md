---
summary: "signal-cli (JSON-RPC + SSE)、セットアップ パス、および数値モデルによるシグナルのサポート"
read_when:
  - Signal サポートのセットアップ
  - デバッグ信号送受信
title: "信号"
x-i18n:
  source_hash: "524d9868f138d46495bb9518b0cbb9c6ef6174248552377a8a659d616501a394"
---

# シグナル (signal-cli)

ステータス: 外部 CLI 統合。ゲートウェイは HTTP JSON-RPC + SSE 経由で `signal-cli` と通信します。

## 前提条件

- OpenClaw がサーバーにインストールされている (以下の Linux フローは Ubuntu 24 でテストされています)。
- `signal-cli` は、ゲートウェイが実行されているホストで利用可能です。
- 認証SMSを1通受信できる電話番号（SMS登録パス用）。
- 登録中の Signal キャプチャ (`signalcaptchas.org`) のためのブラウザ アクセス。

## クイックセットアップ (初心者向け)

1. ボットには **別のシグナル番号** を使用します (推奨)。
2. `signal-cli` をインストールします (JVM ビルドを使用する場合は Java が必要です)。
3. セットアップ パスを 1 つ選択します。
   - **パス A (QR リンク):** `signal-cli link -n "OpenClaw"` を実行し、Signal でスキャンします。
   - **パス B (SMS 登録):** キャプチャ + SMS 認証を使用して専用の番号を登録します。
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

| フィールド参照: | フィールド                                            | 説明 |
| --------------- | ----------------------------------------------------- | ---- |
| `account`       | E.164 形式のボット電話番号 (`+15551234567`)           |
| `cliPath`       | `signal-cli` へのパス (`PATH` の場合は `signal-cli`)  |
| `dmPolicy`      | DM アクセス ポリシー (`pairing` 推奨)                 |
| `allowFrom`     | 電話番号または `uuid:<id>` 値は DM に許可されています |

## それは何ですか

- `signal-cli` 経由の信号チャネル (組み込み libsignal ではありません)。
- 決定的なルーティング: 応答は常に Signal に戻ります。
- DM はエージェントのメイン セッションを共有します。グループは孤立しています (`agent:<agentId>:signal:group:<groupId>`)。

## 構成の書き込み

デフォルトでは、Signal は `/config set|unset` によってトリガーされる構成更新を書き込むことができます (`commands.config: true` が必要)。

次のコマンドで無効にします。

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 数値モデル (重要)

- ゲートウェイは **Signal デバイス** (`signal-cli` アカウント) に接続します。
- **個人の Signal アカウント**でボットを実行すると、ボットは自分のメッセージを無視します (ループ防止)。
- 「ボットにテキストメッセージを送信すると、ボットが返信する」には、**別のボット番号**を使用します。

## セットアップパス A: 既存の Sign アカウント (QR) をリンクします

1. `signal-cli` (JVM またはネイティブ ビルド) をインストールします。
2. ボットアカウントをリンクします。
   - `signal-cli link -n "OpenClaw"` 次に、Signal で QR をスキャンします。
3. Signal を設定し、ゲートウェイを起動します。

例:

````json5
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
```マルチアカウントのサポート: アカウントごとの構成で `channels.signal.accounts` を使用し、オプションの `name` を使用します。共有パターンについては、[`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts) を参照してください。

## セットアップパスB: 専用ボット番号を登録(SMS、Linux)

既存の Signal アプリ アカウントをリンクする代わりに、専用のボット番号が必要な場合にこれを使用します。

1. SMS（固定電話の場合は音声認証）を受信できる番号を取得します。
   - アカウント/セッションの競合を避けるために、専用のボット番号を使用します。
2. `signal-cli` をゲートウェイ ホストにインストールします。

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
````

JVM ビルド (`signal-cli-${VERSION}.tar.gz`) を使用する場合は、最初に JRE 25+ をインストールします。
`signal-cli` を常に最新の状態に保ってください。アップストリームは、Signal サーバー API が変更されると古いリリースが壊れる可能性があると述べています。

3. 番号を登録して確認します。

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

キャプチャが必要な場合:

1. `https://signalcaptchas.org/registration/generate.html` を開きます。
2. キャプチャを完了し、「Open Signal」から `signalcaptcha://...` リンク ターゲットをコピーします。
3. 可能な場合は、ブラウザ セッションと同じ外部 IP から実行します。
4. すぐに登録を再度実行します (キャプチャ トークンはすぐに期限切れになります)。

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw を設定し、ゲートウェイを再起動し、チャネルを確認します。

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. DM 送信者をペアリングします。
   - ボット番号にメッセージを送信します。
   - サーバー上のコードを承認します: `openclaw pairing approve signal <PAIRING_CODE>`。
   - 「不明な連絡先」を避けるために、ボット番号を携帯電話の連絡先として保存します。重要: `signal-cli` で電話番号アカウントを登録すると、その番号のメイン Signal アプリ セッションの認証が解除される可能性があります。専用のボット番号を使用するか、既存の電話アプリの設定を維持する必要がある場合は QR リンク モードを使用してください。

上流の参照:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- キャプチャ フロー: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- リンクフロー: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部デーモンモード (httpUrl)

`signal-cli` を自分で管理したい場合 (遅い JVM コールド スタート、コンテナーの初期化、または共有 CPU)、デーモンを個別に実行し、OpenClaw をそれに向けます。

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

これにより、OpenClaw 内での自動生成と起動待機がスキップされます。自動生成時の起動を遅くするには、`channels.signal.startupTimeoutMs` を設定します。

## アクセス制御 (DM + グループ)

DM:

- デフォルト: `channels.signal.dmPolicy = "pairing"`。
- 不明な送信者がペアリング コードを受信します。メッセージは承認されるまで無視されます (コードは 1 時間後に期限切れになります)。
- 承認方法:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- ペアリングは、Signal DM のデフォルトのトークン交換です。詳細：[ペアリング](/channels/pairing)
- UUID のみの送信者 (`sourceUuid` から) は、`channels.signal.allowFrom` に `uuid:<id>` として保存されます。

グループ:

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `channels.signal.groupAllowFrom` は、`allowlist` が設定されている場合にグループ内でトリガーできる人を制御します。
- ランタイムに関する注意: `channels.signal` が完全に欠落している場合、ランタイムはグループ チェックのために `groupPolicy="allowlist"` にフォールバックします (`channels.defaults.groupPolicy` が設定されている場合でも)。## 仕組み (動作)

- `signal-cli` はデーモンとして実行されます。ゲートウェイは SSE 経由でイベントを読み取ります。
- 受信メッセージは共有チャネル エンベロープに正規化されます。
- 応答は常に同じ番号またはグループにルーティングされます。

## メディア + 制限

- 送信テキストは `channels.signal.textChunkLimit` (デフォルトは 4000) に分割されます。
- オプションの改行チャンク: 長さのチャンクの前に空白行 (段落境界) で分割するように `channels.signal.chunkMode="newline"` を設定します。
- 添付ファイルのサポート (`signal-cli` から取得した Base64)。
- デフォルトのメディア キャップ: `channels.signal.mediaMaxMb` (デフォルト 8)。
- `channels.signal.ignoreAttachments` を使用して、メディアのダウンロードをスキップします。
- グループ履歴コンテキストは `channels.signal.historyLimit` (または `channels.signal.accounts.*.historyLimit`) を使用し、`messages.groupChat.historyLimit` にフォールバックします。 `0` を無効に設定します (デフォルトは 50)。

## 入力 + 開封確認

- **タイピング インジケータ**: OpenClaw は `signal-cli sendTyping` 経由でタイピング信号を送信し、応答の実行中にそれを更新します。
- **開封確認**: `channels.signal.sendReadReceipts` が true の場合、OpenClaw は許可された DM の開封確認を転送します。
- Signal-cli はグループの開封確認を公開しません。

## リアクション（メッセージツール）

- `message action=react` を `channel=signal` と一緒に使用します。
- ターゲット: 送信者 E.164 または UUID (ペアリング出力から `uuid:<id>` を使用します。裸の UUID も機能します)。
- `messageId` は、反応しているメッセージの Signal タイムスタンプです。
- グループ反応には `targetAuthor` または `targetAuthorUuid` が必要です。

例:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

構成:- `channels.signal.actions.reactions`: リアクションアクションを有効/無効にします (デフォルトは true)。

- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`。
  - `off`/`ack` はエージェントの反応を無効にします (メッセージ ツール `react` はエラーになります)。
  - `minimal`/`extensive` は、エージェントの反応を有効にし、ガイダンス レベルを設定します。
- アカウントごとの上書き: `channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 配信ターゲット (CLI/cron)

- DM: `signal:+15551234567` (またはプレーン E.164)。
- UUID DM: `uuid:<id>` (または裸の UUID)。
- グループ: `signal:group:<groupId>`。
- ユーザー名: `username:<name>` (Signal アカウントでサポートされている場合)。

## トラブルシューティング

まずこのはしごを実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

次に、必要に応じて DM ペアリングの状態を確認します。

```bash
openclaw pairing list signal
```

よくある失敗:

- デーモンに到達可能ですが応答なし: アカウント/デーモン設定 (`httpUrl`、`account`) と受信モードを確認します。
- DM は無視されました: 送信者はペアリングの承認を保留しています。
- グループ メッセージは無視されます。グループ送信者/メンション ゲートにより配信がブロックされます。
- 編集後の構成検証エラー: `openclaw doctor --fix` を実行します。
- 診断に信号がありません: `channels.signal.enabled: true` を確認してください。

追加のチェック:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

トリアージ フローの場合: [/channels/troubleshooting](/channels/troubleshooting)。

## セキュリティに関する注意事項- `signal-cli` は、アカウント キーをローカルに保存します (通常は `~/.local/share/signal-cli/data/`)

- サーバーの移行または再構築の前に、Signal アカウントの状態をバックアップします。
- より広範な DM アクセスを明示的に必要としない限り、`channels.signal.dmPolicy: "pairing"` を保持します。
- SMS 認証は登録または回復フローにのみ必要ですが、番号/アカウントの制御を失うと再登録が複雑になる可能性があります。

## 構成リファレンス (信号)

完全な構成: [構成](/gateway/configuration)

プロバイダーのオプション:- `channels.signal.enabled`: チャネルの起動を有効/無効にします。

- `channels.signal.account`: ボット アカウントの E.164。
- `channels.signal.cliPath`: `signal-cli` へのパス。
- `channels.signal.httpUrl`: 完全なデーモン URL (ホスト/ポートをオーバーライドします)。
- `channels.signal.httpHost`、`channels.signal.httpPort`: デーモン バインド (デフォルトは 127.0.0.1:8080)。
- `channels.signal.autoStart`: 自動生成デーモン (`httpUrl` が設定されていない場合はデフォルトで true)。
- `channels.signal.startupTimeoutMs`: 起動待機タイムアウト (ミリ秒単位) (上限 120000)。
- `channels.signal.receiveMode`: `on-start | manual`。
- `channels.signal.ignoreAttachments`: 添付ファイルのダウンロードをスキップします。
- `channels.signal.ignoreStories`: デーモンからのストーリーを無視します。
- `channels.signal.sendReadReceipts`: 開封確認を転送します。
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (デフォルト: ペアリング)。
- `channels.signal.allowFrom`: DM 許可リスト (E.164 または `uuid:<id>`)。 `open` には `"*"` が必要です。 Signal にはユーザー名がありません。電話/UUID ID を使用します。
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (デフォルト: ホワイトリスト)。
- `channels.signal.groupAllowFrom`: グループ送信者の許可リスト。
- `channels.signal.historyLimit`: コンテキストとして含めるグループ メッセージの最大数 (0 は無効)。
- `channels.signal.dmHistoryLimit`: ユーザーターンにおける DM 履歴の制限。ユーザーごとのオーバーライド: `channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`: 送信チャンク サイズ (文字数)。
- `channels.signal.chunkMode`: `length` (デフォルト) または `newline` は、長さをチャンクする前に空白行 (段落境界) で分割します。
- `channels.signal.mediaMaxMb`: 受信/送信メディアの上限 (MB)。

関連するグローバル オプション:- `agents.list[].groupChat.mentionPatterns` (Signal はネイティブ メンションをサポートしていません)。

- `messages.groupChat.mentionPatterns` (グローバル フォールバック)。
- `messages.responsePrefix`。
