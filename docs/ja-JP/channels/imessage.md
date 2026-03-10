---
summary: "レガシーiMessageサポート（imsg経由、JSON-RPC over stdio）。新規セットアップではBlueBubblesを使用してください。"
read_when:
  - iMessageサポートのセットアップ
  - iMessage送受信のデバッグ
title: "iMessage"
x-i18n:
  source_path: "channels/imessage.md"
  source_hash: "9c8c5818b23fd3f2fad100fcd3cb4506f0ba7654d3d7c48835e0772e86f72cfd"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T06:38:11.999Z"
---

# iMessage（レガシー：imsg）

<Warning>
新規iMessageデプロイメントには<a href="/channels/bluebubbles">BlueBubbles</a>を使用してください。

`imsg`統合はレガシーであり、将来のリリースで削除される可能性があります。
</Warning>

ステータス：レガシー外部CLI統合。Gatewayは`imsg rpc`を起動し、stdio上のJSON-RPCで通信します（別個のデーモン/ポートは不要）。

<CardGroup cols={3}>
  <Card title="BlueBubbles（推奨）" icon="message-circle" href="/channels/bluebubbles">
    新規セットアップに推奨されるiMessageパス。
  </Card>
  <Card title="ペアリング" icon="link" href="/channels/pairing">
    iMessage DMはデフォルトでペアリングモードになります。
  </Card>
  <Card title="設定リファレンス" icon="settings" href="/gateway/configuration-reference#imessage">
    完全なiMessageフィールドリファレンス。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="ローカルMac（高速パス）">
    <Steps>
      <Step title="imsgのインストールと検証">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="OpenClawの設定">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/<you>/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Gatewayの起動">

```bash
openclaw gateway
```

      </Step>

      <Step title="最初のDMペアリングの承認（デフォルトdmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        ペアリングリクエストは1時間後に期限切れになります。
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH経由のリモートMac">
    OpenClawはstdio互換の`cliPath`のみを必要とするため、`cliPath`をリモートMacにSSH接続して`imsg`を実行するラッパースクリプトに指定できます。

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    添付ファイルが有効な場合の推奨設定：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // SCP添付ファイル取得に使用
      includeAttachments: true,
      // オプション：許可された添付ファイルルートを上書き
      // デフォルトには /Users/*/Library/Messages/Attachments が含まれます
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost`が設定されていない場合、OpenClawはSSHラッパースクリプトを解析して自動検出を試みます。
    `remoteHost`は`host`または`user@host`形式である必要があります（スペースやSSHオプションは不可）。
    OpenClawはSCPに厳密なホストキーチェックを使用するため、リレーホストキーは既に`~/.ssh/known_hosts`に存在している必要があります。
    添付ファイルパスは許可されたルート（`attachmentRoots` / `remoteAttachmentRoots`）に対して検証されます。

  </Tab>
</Tabs>

## 要件と権限（macOS）

- `imsg`を実行するMac上でMessagesにサインインしている必要があります。
- OpenClaw/`imsg`を実行するプロセスコンテキストにはフルディスクアクセスが必要です（Messages DBアクセス）。
- Messages.app経由でメッセージを送信するには自動化権限が必要です。

<Tip>
権限はプロセスコンテキストごとに付与されます。Gatewayがヘッドレス（LaunchAgent/SSH）で実行される場合、同じコンテキストで1回限りの対話型コマンドを実行してプロンプトをトリガーします：

```bash
imsg chats --limit 1
# または
imsg send <handle> "test"
```

</Tip>

## アクセス制御とルーティング

<Tabs>
  <Tab title="DMポリシー">
    `channels.imessage.dmPolicy`はダイレクトメッセージを制御します：

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom`に`"*"`を含める必要があります）
    - `disabled`

    許可リストフィールド：`channels.imessage.allowFrom`。

    許可リストエントリはハンドルまたはチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を指定できます。

  </Tab>

  <Tab title="グループポリシー + メンション">
    `channels.imessage.groupPolicy`はグループ処理を制御します：

    - `allowlist`（設定時のデフォルト）
    - `open`
    - `disabled`

    グループ送信者許可リスト：`channels.imessage.groupAllowFrom`。

    ランタイムフォールバック：`groupAllowFrom`が未設定の場合、iMessageグループ送信者チェックは利用可能な場合`allowFrom`にフォールバックします。
    ランタイム注意：`channels.imessage`が完全に欠落している場合、ランタイムは`groupPolicy="allowlist"`にフォールバックし、警告をログに記録します（`channels.defaults.groupPolicy`が設定されている場合でも）。

    グループのメンションゲーティング：

    - iMessageにはネイティブなメンションメタデータがありません
    - メンション検出は正規表現パターンを使用します（`agents.list[].groupChat.mentionPatterns`、フォールバック`messages.groupChat.mentionPatterns`）
    - 設定されたパターンがない場合、メンションゲーティングは強制できません

    承認された送信者からの制御コマンドは、グループ内のメンションゲーティングをバイパスできます。

  </Tab>

  <Tab title="セッションと決定論的返信">
    - DMは直接ルーティングを使用し、グループはグループルーティングを使用します。
    - デフォルトの`session.dmScope=main`では、iMessage DMはエージェントメインセッションに統合されます。
    - グループセッションは分離されています（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 返信は元のチャンネル/ターゲットメタデータを使用してiMessageにルーティングされます。

    グループ的なスレッド動作：

    一部の複数参加者iMessageスレッドは`is_group=false`で到着する場合があります。
    その`chat_id`が`channels.imessage.groups`で明示的に設定されている場合、OpenClawはそれをグループトラフィックとして扱います（グループゲーティング + グループセッション分離）。

  </Tab>
</Tabs>

## デプロイメントパターン

<AccordionGroup>
  <Accordion title="専用ボットmacOSユーザー（別個のiMessageアイデンティティ）">
    専用のApple IDとmacOSユーザーを使用して、ボットトラフィックを個人のMessagesプロファイルから分離します。

    典型的なフロー：

    1. 専用のmacOSユーザーを作成/サインインします。
    2. そのユーザーでボットApple IDを使用してMessagesにサインインします。
    3. そのユーザーに`imsg`をインストールします。
    4. OpenClawがそのユーザーコンテキストで`imsg`を実行できるようにSSHラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath`と`.dbPath`をそのユーザープロファイルに指定します。

    初回実行時には、そのボットユーザーセッションでGUI承認（自動化 + フルディスクアクセス）が必要になる場合があります。

  </Accordion>

  <Accordion title="Tailscale経由のリモートMac（例）">
    一般的なトポロジー：

    - GatewayはLinux/VM上で実行
    - iMessage + `imsg`はtailnet内のMac上で実行
    - `cliPath`ラッパーはSSHを使用して`imsg`を実行
    - `remoteHost`はSCP添付ファイル取得を有効にします

    例：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    SSHキーを使用して、SSHとSCPの両方が非対話的になるようにします。
    最初にホストキーが信頼されていることを確認します（例：`ssh bot@mac-mini.tailnet-1234.ts.net`）、これにより`known_hosts`が設定されます。

  </Accordion>

  <Accordion title="マルチアカウントパターン">
    iMessageは`channels.imessage.accounts`でアカウントごとの設定をサポートしています。

    各アカウントは`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルート許可リストなどのフィールドを上書きできます。

  </Accordion>
</AccordionGroup>

## メディア、チャンキング、配信ターゲット

<AccordionGroup>
  <Accordion title="添付ファイルとメディア">
    - インバウンド添付ファイル取り込みはオプションです：`channels.imessage.includeAttachments`
    - `remoteHost`が設定されている場合、リモート添付ファイルパスはSCP経由で取得できます
    - 添付ファイルパスは許可されたルートと一致する必要があります：
      - `channels.imessage.attachmentRoots`（ローカル）
      - `channels.imessage.remoteAttachmentRoots`（リモートSCPモード）
      - デフォルトルートパターン：`/Users/*/Library/Messages/Attachments`
    - SCPは厳密なホストキーチェックを使用します（`StrictHostKeyChecking=yes`）
    - アウトバウンドメディアサイズは`channels.imessage.mediaMaxMb`を使用します（デフォルト16 MB）
  </Accordion>

  <Accordion title="アウトバウンドチャンキング">
    - テキストチャンク制限：`channels.imessage.textChunkLimit`（デフォルト4000）
    - チャンクモード：`channels.imessage.chunkMode`
      - `length`（デフォルト）
      - `newline`（段落優先分割）
  </Accordion>

  <Accordion title="アドレス形式">
    推奨される明示的ターゲット：

    - `chat_id:123`（安定したルーティングに推奨）
    - `chat_guid:...`
    - `chat_identifier:...`

    ハンドルターゲットもサポートされています：

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## 設定書き込み

iMessageはデフォルトでチャンネル開始の設定書き込みを許可します（`commands.config: true`の場合の`/config set|unset`用）。

無効化：

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="imsgが見つからない、またはRPCがサポートされていない">
    バイナリとRPCサポートを検証します：

```bash
imsg rpc --help
openclaw channels status --probe
```

    プローブがRPCサポートなしと報告する場合、`imsg`を更新してください。

  </Accordion>

  <Accordion title="DMが無視される">
    確認事項：

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - ペアリング承認（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="グループメッセージが無視される">
    確認事項：

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups`許可リスト動作
    - メンションパターン設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="リモート添付ファイルが失敗する">
    確認事項：

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - GatewayホストからのSSH/SCPキー認証
    - Gatewayホスト上の`~/.ssh/known_hosts`にホストキーが存在すること
    - Messagesを実行しているMac上のリモートパス読み取り可能性

  </Accordion>

  <Accordion title="macOS権限プロンプトを見逃した">
    同じユーザー/セッションコンテキストで対話型GUIターミナルで再実行し、プロンプトを承認します：

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    OpenClaw/`imsg`を実行するプロセスコンテキストにフルディスクアクセス + 自動化が付与されていることを確認してください。

  </Accordion>
</AccordionGroup>

## 設定リファレンスポインター

- [設定リファレンス - iMessage](/gateway/configuration-reference#imessage)
- [Gateway設定](/gateway/configuration)
- [ペアリング](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)
