---
summary: "imsg 経由のレガシー iMessage サポート (stdio 上の JSON-RPC)。新規構成では BlueBubbles を推奨します。"
read_when:
  - iMessage サポートをセットアップする場合
  - iMessage の送受信をデバッグする場合
title: "iMessage"
x-i18n:
  source_path: "channels/imessage.md"
  source_hash: "9c8c5818b23fd3f2fad100fcd3cb4506f0ba7654d3d7c48835e0772e86f72cfd"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T06:38:11.999Z"
---

# iMessage (legacy: imsg)

<Warning>
  新規の iMessage 構成では <a href="/channels/bluebubbles">BlueBubbles</a> を使ってください。

  `imsg` 統合はレガシー扱いであり、将来のリリースで削除される可能性があります。
</Warning>

ステータス: レガシーな外部 CLI 連携です。ゲートウェイは `imsg rpc` を起動し、stdio 上の JSON-RPC で通信します。別個のデーモンや専用ポートは不要です。

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommended)" icon="message-circle" href="/channels/bluebubbles">
    新規構成ではこちらを推奨します。
  </Card>

  <Card title="Pairing" icon="link" href="/channels/pairing">
    iMessage の DM はデフォルトでペアリングモードです。
  </Card>

  <Card title="Configuration reference" icon="settings" href="/gateway/configuration-reference#imessage">
    iMessage の設定項目一覧です。
  </Card>
</CardGroup>

## Quick setup

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="imsg をインストールして確認する">
        ```bash
        brew install steipete/tap/imsg
        imsg rpc --help
        ```
      </Step>

      <Step title="OpenClaw を設定する">
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

      <Step title="ゲートウェイを起動する">
        ```bash
        openclaw gateway
        ```
      </Step>

      <Step title="最初の DM ペアリングを承認する (デフォルト dmPolicy)">
        ```bash
        openclaw pairing list imessage
        openclaw pairing approve imessage <CODE>
        ```

        ペアリング要求の有効期限は 1 時間です。
      </Step>
    </Steps>
  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw が必要とするのは stdio 互換の `cliPath` だけです。そのため、`cliPath` に、リモート Mac へ SSH 接続して `imsg` を実行するラッパースクリプトを指定できます。

    ```bash
    #!/usr/bin/env bash
    exec ssh -T gateway-host imsg "$@"
    ```

    添付ファイルを有効にする場合の推奨設定:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "user@gateway-host", // SCP で添付ファイルを取得するときに使用
          includeAttachments: true,
          // オプション: 許可する添付ファイルルートを上書き
          // デフォルトでは /Users/*/Library/Messages/Attachments を含みます
          attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
          remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
        },
      },
    }
    ```

    `remoteHost` を設定しない場合、OpenClaw は SSH ラッパースクリプトを解析して自動検出を試みます。
    `remoteHost` は `host` または `user@host` の形式である必要があり、空白や SSH オプションは含められません。
    OpenClaw は SCP に厳密なホストキー検証を使うため、リレーホストのホストキーはあらかじめ `~/.ssh/known_hosts` に登録されている必要があります。
    添付ファイルパスは許可されたルート (`attachmentRoots` / `remoteAttachmentRoots`) に対して検証されます。
  </Tab>
</Tabs>

## Requirements and permissions (macOS)

* `imsg` を実行する Mac で Messages にサインインしている必要があります。
* OpenClaw / `imsg` を実行するプロセスコンテキストには、Messages DB へアクセスするための Full Disk Access が必要です。
* Messages.app 経由でメッセージを送信するには Automation 権限が必要です。

<Tip>
  権限はプロセスコンテキスト単位で付与されます。ゲートウェイをヘッドレス (LaunchAgent / SSH) で動かす場合は、同じコンテキストで一度だけ対話型コマンドを実行して、権限プロンプトを表示させてください。

  ```bash
  imsg chats --limit 1
  # or
  imsg send <handle> "test"
  ```
</Tip>

## Access control and routing

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` でダイレクトメッセージを制御します。

    * `pairing` (デフォルト)
    * `allowlist`
    * `open` (`allowFrom` に `"*"` を含める必要があります)
    * `disabled`

    allowlist フィールドは `channels.imessage.allowFrom` です。

    allowlist のエントリには、handle またはチャットターゲット (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) を使えます。
  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` でグループ処理を制御します。

    * `allowlist` (設定されている場合のデフォルト)
    * `open`
    * `disabled`

    グループ送信者 allowlist は `channels.imessage.groupAllowFrom` です。

    ランタイムのフォールバック挙動として、`groupAllowFrom` が未設定であれば、利用可能な場合は `allowFrom` が iMessage グループ送信者チェックに使われます。
    また、`channels.imessage` 自体が存在しない場合、ランタイムは `groupPolicy="allowlist"` にフォールバックし、`channels.defaults.groupPolicy` が設定されていても警告をログへ出します。

    グループでのメンション制御:

    * iMessage にはネイティブなメンションメタデータがありません
    * メンション検出には正規表現パターンを使います (`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`)
    * パターンが設定されていなければ、メンション制御は強制できません

    認可済み送信者からの制御コマンドは、グループ内でメンション制御を迂回できます。
  </Tab>

  <Tab title="Sessions and deterministic replies">
    * DM はダイレクトルーティング、グループはグループルーティングを使います。
    * デフォルトの `session.dmScope=main` では、iMessage の DM はエージェントの main セッションへ集約されます。
    * グループセッションは分離されます (`agent:<agentId>:imessage:group:<chat_id>`)。
    * 返信は、元のチャンネル / ターゲットのメタデータを使って iMessage 側へ戻されます。

    グループ的なスレッド挙動:

    一部の複数参加者 iMessage スレッドは `is_group=false` で届くことがあります。
    その `chat_id` が `channels.imessage.groups` に明示的に設定されていれば、OpenClaw はそれをグループトラフィックとして扱います。つまり、グループ制御とグループセッション分離が適用されます。
  </Tab>
</Tabs>

## Deployment patterns

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    専用の Apple ID と macOS ユーザーを用意すると、ボット用トラフィックを個人の Messages プロファイルから分離できます。

    典型的な流れ:

    1. 専用の macOS ユーザーを作成し、そのユーザーでサインインします。
    2. そのユーザー上で、ボット用 Apple ID を使って Messages にサインインします。
    3. そのユーザーに `imsg` をインストールします。
    4. OpenClaw がそのユーザーコンテキストで `imsg` を実行できるよう、SSH ラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath` と `.dbPath` をそのユーザープロファイルに向けます。

    初回実行では、そのボットユーザーの GUI セッション内で Automation と Full Disk Access の承認が必要になる場合があります。
  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    よくある構成例:

    * ゲートウェイは Linux / VM 上で動作
    * iMessage と `imsg` は tailnet 内の Mac で動作
    * `cliPath` のラッパーが SSH で `imsg` を実行
    * `remoteHost` を使って SCP による添付ファイル取得を有効化

    例:

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

    SSH キーを使い、SSH と SCP の両方が非対話で動作するようにしてください。
    また、最初にホストキーを信頼して `known_hosts` を埋める必要があります。たとえば `ssh bot@mac-mini.tailnet-1234.ts.net` を一度実行してください。
  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage では `channels.imessage.accounts` の下でアカウントごとの設定を行えます。

    各アカウントでは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルート allowlist などを上書きできます。
  </Accordion>
</AccordionGroup>

## Media, chunking, and delivery targets

<AccordionGroup>
  <Accordion title="Attachments and media">
    * 受信添付ファイルの取り込みはオプションです: `channels.imessage.includeAttachments`
    * `remoteHost` が設定されていれば、リモート添付ファイルのパスを SCP 経由で取得できます
    * 添付ファイルパスは、許可されたルートに一致している必要があります
      * `channels.imessage.attachmentRoots` (ローカル)
      * `channels.imessage.remoteAttachmentRoots` (リモート SCP モード)
      * デフォルトのルートパターン: `/Users/*/Library/Messages/Attachments`
    * SCP では厳密なホストキー検証を使います (`StrictHostKeyChecking=yes`)
    * 送信メディアのサイズ上限は `channels.imessage.mediaMaxMb` で制御します (デフォルト 16 MB)
  </Accordion>

  <Accordion title="Outbound chunking">
    * テキストチャンクの上限: `channels.imessage.textChunkLimit` (デフォルト 4000)
    * チャンクモード: `channels.imessage.chunkMode`
      * `length` (デフォルト)
      * `newline` (段落優先で分割)
  </Accordion>

  <Accordion title="Addressing formats">
    推奨される明示的ターゲット:

    * `chat_id:123` (安定したルーティングに推奨)
    * `chat_guid:...`
    * `chat_identifier:...`

    handle ベースのターゲットも使えます:

    * `imessage:+1555...`
    * `sms:+1555...`
    * `user@example.com`

    ```bash
    imsg chats --limit 20
    ```
  </Accordion>
</AccordionGroup>

## Config writes

iMessage ではデフォルトで、チャンネル開始の設定書き込みを許可します (`commands.config: true` のときの `/config set|unset`)。

無効にするには:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Troubleshooting

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    バイナリと RPC サポートを確認します。

    ```bash
    imsg rpc --help
    openclaw channels status --probe
    ```

    probe が RPC 非対応を報告する場合は、`imsg` を更新してください。
  </Accordion>

  <Accordion title="DMs are ignored">
    確認事項:

    * `channels.imessage.dmPolicy`
    * `channels.imessage.allowFrom`
    * ペアリング承認 (`openclaw pairing list imessage`)
  </Accordion>

  <Accordion title="Group messages are ignored">
    確認事項:

    * `channels.imessage.groupPolicy`
    * `channels.imessage.groupAllowFrom`
    * `channels.imessage.groups` の allowlist 挙動
    * メンションパターン設定 (`agents.list[].groupChat.mentionPatterns`)
  </Accordion>

  <Accordion title="Remote attachments fail">
    確認事項:

    * `channels.imessage.remoteHost`
    * `channels.imessage.remoteAttachmentRoots`
    * ゲートウェイホストからの SSH / SCP キー認証
    * ゲートウェイホスト上の `~/.ssh/known_hosts` にホストキーがあること
    * Messages を実行している Mac 上で、リモートパスが読み取り可能であること
  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    同じユーザー / セッションコンテキストの対話型 GUI ターミナルで再実行し、プロンプトを承認してください。

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw / `imsg` を実行するプロセスコンテキストに Full Disk Access と Automation が付与されていることも確認してください。
  </Accordion>
</AccordionGroup>

## Configuration reference pointers

* [Configuration reference - iMessage](/gateway/configuration-reference#imessage)
* [Gateway configuration](/gateway/configuration)
* [Pairing](/channels/pairing)
* [BlueBubbles](/channels/bluebubbles)
