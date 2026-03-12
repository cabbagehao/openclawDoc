---
summary: "WhatsApp チャネルのサポート、アクセス制御、配信動作、および操作"
read_when:
  - WhatsApp/Web チャネルの動作または受信トレイのルーティングに関する作業
title: "ワッツアップ"
x-i18n:
  source_hash: "94934ae5c4bd637170ed849e2e5fdcb840124347657b5646a573cc450ee5682f"
---
ステータス: WhatsApp Web (Baileys) 経由で実稼働準備完了。ゲートウェイはリンクされたセッションを所有します。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/channels/pairing">
    デフォルトの DM ポリシーは、不明な送信者に対するペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/channels/troubleshooting">
    クロスチャネル診断と修復プレイブック。
  </Card>
  <Card title="ゲートウェイ構成" icon="settings" href="/gateway/configuration">
    完全なチャネル構成パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="WhatsApp アクセス ポリシーを構成する">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="WhatsApp へのリンク (QR)">

```bash
openclaw channels login --channel whatsapp
```

    特定のアカウントの場合:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="ゲートウェイを起動する">

```bash
openclaw gateway
```

  </Step>

  <Step title="最初のペアリング要求を承認する (ペアリング モードを使用している場合)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    ペアリング要求は 1 時間後に期限切れになります。保留中のリクエストはチャネルごとに 3 に制限されます。

  </Step>
</Steps>

<Note>
OpenClaw では、可能な場合は別の番号で WhatsApp を実行することをお勧めします。 (チャネルのメタデータとオンボーディング フローはそのセットアップ用に最適化されていますが、個人番号のセットアップもサポートされています。)
</Note>

## 導入パターン

<AccordionGroup>
  <Accordion title="専用番号（推奨）">
    これは最もクリーンな動作モードです。

    - OpenClaw 用に別の WhatsApp ID
    - より明確な DM ホワイトリストとルーティング境界
    - セルフチャットの混乱の可能性が低くなります

    最小限のポリシー パターン:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

</Accordion><Accordion title="個人番号フォールバック">
オンボーディングは個人番号モードをサポートし、セルフチャットに適したベースラインを書き込みます。

    - `dmPolicy: "allowlist"`
    - `allowFrom` には個人番号が含まれます
    - `selfChatMode: true`

    実行時、セルフチャット保護により、リンクされた自己番号と `allowFrom` がキーオフされます。

  </Accordion>

  <Accordion title="WhatsApp Web のみのチャネル範囲">
    メッセージング プラットフォーム チャネルは、現在の OpenClaw チャネル アーキテクチャでは WhatsApp Web ベース (`Baileys`) です。

    組み込みのチャット チャネル レジストリには、個別の Twilio WhatsApp メッセージング チャネルはありません。

  </Accordion>
</AccordionGroup>

## ランタイムモデル

- ゲートウェイは WhatsApp ソケットと再接続ループを所有します。
- アウトバウンド送信には、ターゲット アカウントのアクティブな WhatsApp リスナーが必要です。
- ステータス チャットとブロードキャスト チャットは無視されます (`@status`、`@broadcast`)。
- ダイレクト チャットは DM セッション ルールを使用します (`session.dmScope`、デフォルトの `main` はエージェントのメイン セッションへの DM を折りたたみます)。
- グループ セッションは分離されています (`agent:<agentId>:whatsapp:group:<jid>`)。

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DMポリシー">
    `channels.whatsapp.dmPolicy` は、直接チャット アクセスを制御します。

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`"*"` を含めるには `allowFrom` が必要です)
    - `disabled`

    `allowFrom` は、E.164 形式の数値 (内部で正規化されたもの) を受け入れます。マルチアカウントオーバーライド: `channels.whatsapp.accounts.<id>.dmPolicy` (および `allowFrom`) は、そのアカウントのチャネルレベルのデフォルトよりも優先されます。

    実行時の動作の詳細:

    - ペアリングはチャネルの許可ストアに保持され、構成された `allowFrom` とマージされます。
    - ホワイトリストが設定されていない場合、リンクされた自己番号はデフォルトで許可されます
    - 送信 `fromMe` DM は自動ペアリングされません

  </Tab>

  <Tab title="グループポリシー + ホワイトリスト">
    グループ アクセスには 2 つの層があります。

    1. **グループ メンバーシップ許可リスト** (`channels.whatsapp.groups`)
       - `groups` を省略した場合、すべてのグループが対象となります。
       - `groups` が存在する場合、グループ許可リストとして機能します (`"*"` は許可されます)

    2. **グループ送信者ポリシー** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: 送信者の許可リストがバイパスされました
       - `allowlist`: 送信者は `groupAllowFrom` (または `*`) と一致する必要があります
       - `disabled`: すべてのグループ受信をブロックします

    送信者許可リストのフォールバック:

    - `groupAllowFrom` が設定されていない場合、ランタイムは利用可能な場合は `allowFrom` に戻ります。
    - 送信者の許可リストは、メンション/返信のアクティブ化の前に評価されます。

    注: `channels.whatsapp` ブロックがまったく存在しない場合、`channels.defaults.groupPolicy` が設定されている場合でも、ランタイム グループ ポリシー フォールバックは `allowlist` (警告ログ付き) になります。

  </Tab>

  <Tab title="Mentions + /activation">
    グループ返信にはデフォルトでメンションが必要です。メンション検出には次のものが含まれます。

    - WhatsApp でボットの ID について明示的に言及する
    - 構成されたメンション正規表現パターン (`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`)
    - ボットへの暗黙的な返信検出 (返信送信者がボットの ID と一致する)

    セキュリティ上の注意:

    - 引用/返信は言及ゲートのみを満たします。送信者の承認は**されません**
    - `groupPolicy: "allowlist"` では、許可リストに登録されていない送信者は、許可リストに登録されているユーザーのメッセージに返信した場合でもブロックされます。

    セッションレベルのアクティブ化コマンド:

    - `/activation mention`
    - `/activation always`

    `activation` はセッション状態を更新します (グローバル構成ではありません)。オーナーゲート型です。

  </Tab>
</Tabs>

## 個人番号とセルフチャットの動作

リンクされた自己番号が `allowFrom` にも存在する場合、WhatsApp セルフチャットの保護機能が有効になります。

- セルフチャットターンの開封確認をスキップします
- 自分自身に ping を実行するメンション JID 自動トリガー動作を無視します
- `messages.responsePrefix` が設定されていない場合、セルフチャットの返信はデフォルトで `[{identity.name}]` または `[openclaw]` になります。

## メッセージの正規化とコンテキスト

<AccordionGroup>
  <Accordion title="受信エンベロープ + 返信コンテキスト">
    受信 WhatsApp メッセージは、共有受信エンベロープでラップされます。

    引用された返信が存在する場合、コンテキストが次の形式で追加されます。

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```利用可能な場合は、返信メタデータ フィールドも入力されます (`ReplyToId`、`ReplyToBody`、`ReplyToSender`、送信者 JID/E.164)。

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    メディアのみの受信メッセージは、次のようなプレースホルダーを使用して正規化されます。

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    場所と連絡先のペイロードは、ルーティング前にテキスト コンテキストに正規化されます。

  </Accordion>

  <Accordion title="保留中のグループ履歴の挿入">
    グループの場合、未処理のメッセージをバッファリングし、ボットが最終的にトリガーされたときにコンテキストとして挿入できます。

    - デフォルトの制限: `50`
    - 構成: `channels.whatsapp.historyLimit`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` を無効にします

    注射マーカー:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="開封確認">
    開封確認は、受信された WhatsApp メッセージに対してデフォルトで有効になっています。

    グローバルに無効にする:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    アカウントごとの上書き:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    セルフチャットは、グローバルに有効になっている場合でも開封確認をスキップします。

  </Accordion>
</AccordionGroup>

## 配信、チャンキング、およびメディア

<AccordionGroup>
  <Accordion title="テキストのチャンク化">
    - デフォルトのチャンク制限: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` モードは段落境界 (空白行) を優先し、その後長さ安全なチャンクに戻ります。
  </Accordion><Accordion title="アウトバウンドメディアの動作">
    - 画像、ビデオ、オーディオ (PTT 音声メモ)、およびドキュメントのペイロードをサポート
    - ボイスノートの互換性のために、`audio/ogg` は `audio/ogg; codecs=opus` に書き換えられます
    - アニメーション GIF の再生は、ビデオ送信の `gifPlayback: true` 経由でサポートされます。
    - マルチメディア応答ペイロードを送信するときに、キャプションが最初のメディア アイテムに適用されます。
    - メディア ソースは HTTP(S)、`file://`、またはローカル パスにすることができます。
  </Accordion>

  <Accordion title="メディア サイズの制限とフォールバック動作">
    - インバウンドメディア保存キャップ: `channels.whatsapp.mediaMaxMb` (デフォルト `50`)
    - 送信メディア送信上限: `channels.whatsapp.mediaMaxMb` (デフォルト `50`)
    - アカウントごとの上書きには `channels.whatsapp.accounts.<accountId>.mediaMaxMb` を使用します
    - 画像は制限に合わせて自動的に最適化されます (サイズ変更/品質スイープ)。
    - メディア送信失敗時、最初のアイテムのフォールバックは応答をサイレントにドロップする代わりにテキスト警告を送信します。
  </Accordion>
</AccordionGroup>

## 肯定応答

WhatsApp は、`channels.whatsapp.ackReaction` 経由の受信受信に対する即時確認応答をサポートしています。

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

行動メモ:

- 受信が受け入れられた後すぐに送信されます (事前応答)
- 失敗はログに記録されますが、通常の応答配信はブロックされません
- グループモード `mentions` は言及によって引き起こされたターンに反応します。グループのアクティブ化 `always` は、このチェックのバイパスとして機能します
- WhatsApp は `channels.whatsapp.ackReaction` を使用します (従来の `messages.ackReaction` はここでは使用されません)

## マルチアカウントと認証情報

<AccordionGroup>

  <Accordion title="アカウントの選択とデフォルト">
    - アカウント ID は `channels.whatsapp.accounts` から取得されます
    - デフォルトのアカウント選択: `default` (存在する場合)、それ以外の場合は最初に設定されたアカウント ID (ソート済み)
    - アカウント ID は検索用に内部的に正規化されます
  </Accordion>

  <Accordion title="認証情報のパスと従来の互換性">
    - 現在の認証パス: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - バックアップ ファイル: `creds.json.bak`
    - `~/.openclaw/credentials/` の従来のデフォルト認証は引き続きデフォルト アカウント フローで認識/移行されます
  </Accordion>

  <Accordion title="ログアウト動作">
    `openclaw channels logout --channel whatsapp [--account <id>]` は、そのアカウントの WhatsApp 認証状態をクリアします。

    従来の認証ディレクトリでは、`oauth.json` は保持されますが、Baileys 認証ファイルは削除されます。

  </Accordion>
</AccordionGroup>

## ツール、アクション、構成の書き込み

- エージェント ツールのサポートには、WhatsApp 反応アクション (`react`) が含まれます。
- アクションゲート:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- チャネル開始の設定書き込みはデフォルトで有効になっています (`channels.whatsapp.configWrites=false` で無効にします)。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="リンクされていません（QRが必要です）">
    症状: チャネルステータスレポートがリンクされていません。

    修正:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    症状: リンクされたアカウントで、切断または再接続が繰り返し試行されます。

    修正:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    必要に応じて、`channels login` と再リンクします。

</Accordion><Accordion title="送信時にアクティブなリスナーが存在しない">
ターゲット アカウントにアクティブなゲートウェイ リスナーが存在しない場合、アウトバウンド送信は失敗します。

    ゲートウェイが実行中であり、アカウントがリンクされていることを確認してください。

  </Accordion>

  <Accordion title="グループメッセージが予期せず無視されました">
    次の順序で確認してください。

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` ホワイトリスト エントリ
    - メンションゲート (`requireMention` + メンションパターン)
    - `openclaw.json` (JSON5) の重複キー: 後のエントリは前のエントリをオーバーライドするため、スコープごとに 1 つの `groupPolicy` を保持します。

  </Accordion>

  <Accordion title="Bun ランタイム警告">
    WhatsApp ゲートウェイ ランタイムは Node を使用する必要があります。 Bun は、WhatsApp/Telegram ゲートウェイの安定した動作には互換性がないとしてフラグが立てられています。
  </Accordion>
</AccordionGroup>

## 構成参照ポインタ

主な参考文献:

- [設定リファレンス - WhatsApp](/gateway/configuration-reference#whatsapp)

シグナルの高い WhatsApp フィールド:

- アクセス: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 配送: `textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`
- マルチアカウント: `accounts.<id>.enabled`、`accounts.<id>.authDir`、アカウントレベルの上書き
- 操作: `configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`
- セッションの動作: `session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`

## 関連- [ペアリング](/channels/pairing)

- [チャンネルルーティング](/channels/channel-routing)
- [マルチエージェントルーティング](/concepts/multi-agent)
- [トラブルシューティング](/channels/troubleshooting)
