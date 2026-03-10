---
summary: "チャットのセッション管理ルール、キー、永続化"
read_when:
  - セッション処理またはストレージを変更する場合
title: "セッション管理"
---

# セッション管理

OpenClawは**エージェントごとに1つのダイレクトチャットセッション**をプライマリとして扱います。ダイレクトチャットは`agent:<agentId>:<mainKey>`（デフォルトは`main`）に集約され、グループ/チャンネルチャットは独自のキーを取得します。`session.mainKey`は尊重されます。

`session.dmScope`を使用して**ダイレクトメッセージ**のグループ化方法を制御します：

- `main`（デフォルト）：すべてのDMが継続性のためにメインセッションを共有します。
- `per-peer`：チャンネル間で送信者IDごとに分離します。
- `per-channel-peer`：チャンネル + 送信者で分離します（マルチユーザー受信箱に推奨）。
- `per-account-channel-peer`：アカウント + チャンネル + 送信者で分離します（マルチアカウント受信箱に推奨）。
  `session.identityLinks`を使用して、プロバイダープレフィックス付きピアIDを正規のアイデンティティにマッピングし、`per-peer`、`per-channel-peer`、または`per-account-channel-peer`を使用する際に、同じ人がチャンネル間でDMセッションを共有できるようにします。

## セキュアDMモード（マルチユーザーセットアップに推奨）

> **セキュリティ警告：** エージェントが**複数の人**からDMを受信できる場合、セキュアDMモードを有効にすることを強く検討してください。これがないと、すべてのユーザーが同じ会話コンテキストを共有し、ユーザー間でプライベート情報が漏洩する可能性があります。

**デフォルト設定での問題の例：**

- Alice（`<SENDER_A>`）がプライベートなトピック（例：医療予約）についてエージェントにメッセージを送信
- Bob（`<SENDER_B>`）がエージェントに「何について話していましたか？」と尋ねる
- 両方のDMが同じセッションを共有しているため、モデルはAliceの以前のコンテキストを使用してBobに答える可能性があります。

**修正方法：** `dmScope`を設定してユーザーごとにセッションを分離します：

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    // セキュアDMモード：チャンネル + 送信者ごとにDMコンテキストを分離。
    dmScope: "per-channel-peer",
  },
}
```

**これを有効にする場合：**

- 複数の送信者に対してペアリング承認がある
- 複数のエントリを持つDM許可リストを使用している
- `dmPolicy: "open"`を設定している
- 複数の電話番号またはアカウントがエージェントにメッセージを送信できる

注意：

- デフォルトは`dmScope: "main"`で継続性のためです（すべてのDMがメインセッションを共有）。これはシングルユーザーセットアップには問題ありません。
- ローカルCLIオンボーディングは、未設定の場合デフォルトで`session.dmScope: "per-channel-peer"`を書き込みます（既存の明示的な値は保持されます）。
- 同じチャンネル上のマルチアカウント受信箱の場合は、`per-account-channel-peer`を優先します。
- 同じ人が複数のチャンネルで連絡してくる場合は、`session.identityLinks`を使用してDMセッションを1つの正規のアイデンティティに集約します。
- `openclaw security audit`でDM設定を確認できます（[セキュリティ](/cli/security)を参照）。

## Gatewayが信頼できる情報源

すべてのセッション状態は**ゲートウェイが所有**します（「マスター」OpenClaw）。UIクライアント（macOSアプリ、WebChatなど）は、ローカルファイルを読み取る代わりに、セッションリストとトークン数をゲートウェイに問い合わせる必要があります。

- **リモートモード**では、気にするセッションストアはMacではなくリモートゲートウェイホストに存在します。
- UIに表示されるトークン数は、ゲートウェイのストアフィールド（`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`）から取得されます。クライアントは合計を「修正」するためにJSONLトランスクリプトを解析しません。

## 状態の保存場所

- **ゲートウェイホスト**上：
  - ストアファイル：`~/.openclaw/agents/<agentId>/sessions/sessions.json`（エージェントごと）。
- トランスクリプト：`~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`（Telegramトピックセッションは`.../<SessionId>-topic-<threadId>.jsonl`を使用）。
- ストアは`sessionKey -> { sessionId, updatedAt, ... }`のマップです。エントリの削除は安全です。オンデマンドで再作成されます。
- グループエントリには、UIでセッションにラベルを付けるための`displayName`、`channel`、`subject`、`room`、`space`が含まれる場合があります。
- セッションエントリには`origin`メタデータ（ラベル + ルーティングヒント）が含まれるため、UIはセッションがどこから来たかを説明できます。
- OpenClawはレガシーPi/Tauセッションフォルダーを**読み取りません**。

## メンテナンス

OpenClawはセッションストアメンテナンスを適用して、`sessions.json`とトランスクリプトアーティファクトを時間の経過とともに制限します。

### デフォルト

- `session.maintenance.mode`: `warn`
- `session.maintenance.pruneAfter`: `30d`
- `session.maintenance.maxEntries`: `500`
- `session.maintenance.rotateBytes`: `10mb`
- `session.maintenance.resetArchiveRetention`: デフォルトは`pruneAfter`（`30d`）
- `session.maintenance.maxDiskBytes`: 未設定（無効）
- `session.maintenance.highWaterBytes`: 予算が有効な場合、デフォルトは`maxDiskBytes`の`80%`

### 動作方法

メンテナンスはセッションストア書き込み中に実行され、`openclaw sessions cleanup`でオンデマンドでトリガーできます。

- `mode: "warn"`：削除されるものを報告しますが、エントリ/トランスクリプトを変更しません。
- `mode: "enforce"`：この順序でクリーンアップを適用します：
  1. `pruneAfter`より古い古いエントリを削除
  2. エントリ数を`maxEntries`に制限（最も古いものから）
  3. 参照されなくなった削除されたエントリのトランスクリプトファイルをアーカイブ
  4. 保持ポリシーにより古い`*.deleted.<timestamp>`および`*.reset.<timestamp>`アーカイブを削除
  5. `rotateBytes`を超えた場合に`sessions.json`をローテーション
  6. `maxDiskBytes`が設定されている場合、`highWaterBytes`に向けてディスク予算を適用（最も古いアーティファクトから、次に最も古いセッション）

### 大規模ストアのパフォーマンス注意事項

大規模なセッションストアは、高ボリュームセットアップでは一般的です。メンテナンス作業は書き込みパス作業であるため、非常に大規模なストアは書き込みレイテンシを増加させる可能性があります。

コストを最も増加させるもの：

- 非常に高い`session.maintenance.maxEntries`値
- 古いエントリを保持する長い`pruneAfter`ウィンドウ
- `~/.openclaw/agents/<agentId>/sessions/`内の多数のトランスクリプト/アーカイブアーティファクト
- 合理的な削除/キャップ制限なしでディスク予算（`maxDiskBytes`）を有効にする

対処方法：

- 本番環境では`mode: "enforce"`を使用して、成長が自動的に制限されるようにします
- 時間と数の両方の制限（`pruneAfter` + `maxEntries`）を設定し、1つだけではありません
- 大規模デプロイメントでハード上限を設定するために`maxDiskBytes` + `highWaterBytes`を設定します
- `highWaterBytes`を`maxDiskBytes`より有意に低く保ちます（デフォルトは80%）
- 設定変更後に`openclaw sessions cleanup --dry-run --json`を実行して、適用前に予測される影響を確認します
- 頻繁にアクティブなセッションの場合、手動クリーンアップを実行する際に`--active-key`を渡します

### カスタマイズ例

保守的な適用ポリシーを使用：

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "45d",
      maxEntries: 800,
      rotateBytes: "20mb",
      resetArchiveRetention: "14d",
    },
  },
}
```

セッションディレクトリのハードディスク予算を有効化：

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      maxDiskBytes: "1gb",
      highWaterBytes: "800mb",
    },
  },
}
```

大規模インストール用に調整（例）：

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "14d",
      maxEntries: 2000,
      rotateBytes: "25mb",
      maxDiskBytes: "2gb",
      highWaterBytes: "1.6gb",
    },
  },
}
```

CLIからメンテナンスをプレビューまたは強制：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

## セッションプルーニング

OpenClawは、デフォルトでLLM呼び出しの直前にメモリ内コンテキストから**古いツール結果**をトリミングします。
これはJSONL履歴を書き換え**ません**。[/concepts/session-pruning](/concepts/session-pruning)を参照してください。

## 圧縮前のメモリフラッシュ

セッションが自動圧縮に近づくと、OpenClawは**サイレントメモリフラッシュ**ターンを実行して、モデルに永続的なノートをディスクに書き込むよう促すことができます。これはワークスペースが書き込み可能な場合にのみ実行されます。[メモリ](/concepts/memory)および[圧縮](/concepts/compaction)を参照してください。

## トランスポート → セッションキーのマッピング

- ダイレクトチャットは`session.dmScope`に従います（デフォルトは`main`）。
  - `main`: `agent:<agentId>:<mainKey>`（デバイス/チャンネル間の継続性）。
    - 複数の電話番号とチャンネルが同じエージェントメインキーにマップできます。1つの会話へのトランスポートとして機能します。
  - `per-peer`: `agent:<agentId>:dm:<peerId>`。
  - `per-channel-peer`: `agent:<agentId>:<channel>:dm:<peerId>`。
  - `per-account-channel-peer`: `agent:<agentId>:<channel>:<accountId>:dm:<peerId>`（accountIdのデフォルトは`default`）。
  - `session.identityLinks`がプロバイダープレフィックス付きピアID（例：`telegram:123`）に一致する場合、正規のキーが`<peerId>`を置き換え、同じ人がチャンネル間でセッションを共有します。
- グループチャットは状態を分離：`agent:<agentId>:<channel>:group:<id>`（ルーム/チャンネルは`agent:<agentId>:<channel>:channel:<id>`を使用）。
  - Telegramフォーラムトピックは、分離のためにグループIDに`:topic:<threadId>`を追加します。
  - レガシー`group:<id>`キーは移行のために引き続き認識されます。
- インバウンドコンテキストは依然として`group:<id>`を使用する場合があります。チャンネルは`Provider`から推測され、正規の`agent:<agentId>:<channel>:group:<id>`形式に正規化されます。
- その他のソース：
  - Cronジョブ：`cron:<job.id>`
  - Webhook：`hook:<uuid>`（フックによって明示的に設定されていない限り）
  - ノード実行：`node-<nodeId>`

## ライフサイクル

- リセットポリシー：セッションは期限切れになるまで再利用され、有効期限は次の受信メッセージで評価されます。
- 日次リセット：デフォルトは**ゲートウェイホストのローカル時間で午前4:00**です。セッションは、最後の更新が最新の日次リセット時刻より前の場合、古くなります。
- アイドルリセット（オプション）：`idleMinutes`はスライディングアイドルウィンドウを追加します。日次リセットとアイドルリセットの両方が設定されている場合、**どちらか先に期限切れになった方**が新しいセッションを強制します。
- レガシーアイドルのみ：`session.reset`/`resetByType`設定なしで`session.idleMinutes`を設定すると、OpenClawは下位互換性のためにアイドルのみモードのままになります。
- タイプごとのオーバーライド（オプション）：`resetByType`を使用すると、`direct`、`group`、`thread`セッション（thread = Slack/Discordスレッド、Telegramトピック、コネクタによって提供される場合のMatrixスレッド）のポリシーをオーバーライドできます。
- チャンネルごとのオーバーライド（オプション）：`resetByChannel`はチャンネルのリセットポリシーをオーバーライドします（そのチャンネルのすべてのセッションタイプに適用され、`reset`/`resetByType`より優先されます）。
- リセットトリガー：正確な`/new`または`/reset`（および`resetTriggers`内の追加のもの）は、新しいセッションIDを開始し、メッセージの残りを通過させます。`/new <model>`は、モデルエイリアス、`provider/model`、またはプロバイダー名（ファジーマッチ）を受け入れて、新しいセッションモデルを設定します。`/new`または`/reset`が単独で送信された場合、OpenClawはリセットを確認するために短い「こんにちは」挨拶ターンを実行します。
- 手動リセット：ストアから特定のキーを削除するか、JSONLトランスクリプトを削除します。次のメッセージでそれらが再作成されます。
- 分離されたcronジョブは、実行ごとに常に新しい`sessionId`を作成します（アイドル再利用なし）。

## 送信ポリシー（オプション）

個々のIDをリストせずに、特定のセッションタイプの配信をブロックします。

```json5
{
  session: {
    sendPolicy: {
      rules: [
        { action: "deny", match: { channel: "discord", chatType: "group" } },
        { action: "deny", match: { keyPrefix: "cron:" } },
        // 生のセッションキー（`agent:<id>:`プレフィックスを含む）に一致。
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ],
      default: "allow",
    },
  },
}
```

ランタイムオーバーライド（所有者のみ）：

- `/send on` → このセッションで許可
- `/send off` → このセッションで拒否
- `/send inherit` → オーバーライドをクリアして設定ルールを使用
  これらをスタンドアロンメッセージとして送信して登録します。

## 設定（オプションのリネーム例）

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    scope: "per-sender", // グループキーを分離
    dmScope: "main", // DM継続性（共有受信箱の場合はper-channel-peer/per-account-channel-peerを設定）
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      // デフォルト：mode=daily、atHour=4（ゲートウェイホストのローカル時間）。
      // idleMinutesも設定すると、どちらか先に期限切れになった方が優先されます。
      mode: "daily",
      atHour: 4,
      idleMinutes: 120,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    mainKey: "main",
  },
}
```

## 検査

- `openclaw status` — ストアパスと最近のセッションを表示します。
- `openclaw sessions --json` — すべてのエントリをダンプします（`--active <minutes>`でフィルタリング）。
- `openclaw gateway call sessions.list --params '{}'` — 実行中のゲートウェイからセッションを取得します（リモートゲートウェイアクセスには`--url`/`--token`を使用）。
- チャットでスタンドアロンメッセージとして`/status`を送信して、エージェントが到達可能かどうか、セッションコンテキストがどれだけ使用されているか、現在の思考/詳細トグル、WhatsApp Web認証情報が最後に更新された時期（再リンクの必要性を見つけるのに役立ちます）を確認します。
- `/context list`または`/context detail`を送信して、システムプロンプトと注入されたワークスペースファイルに何があるか（および最大のコンテキスト貢献者）を確認します。
- `/stop`（またはスタンドアロンの中止フレーズ、例：`stop`、`stop action`、`stop run`、`stop openclaw`）を送信して、現在の実行を中止し、そのセッションのキューに入れられたフォローアップをクリアし、そこから生成されたサブエージェント実行を停止します（返信には停止カウントが含まれます）。
- `/compact`（オプションの指示）をスタンドアロンメッセージとして送信して、古いコンテキストを要約し、ウィンドウスペースを解放します。[/concepts/compaction](/concepts/compaction)を参照してください。
- JSONLトランスクリプトを直接開いて、完全なターンを確認できます。

## ヒント

- プライマリキーを1:1トラフィック専用に保ち、グループに独自のキーを持たせます。
- クリーンアップを自動化する場合、ストア全体ではなく個々のキーを削除して、他の場所のコンテキストを保持します。

## セッションオリジンメタデータ

各セッションエントリは、`origin`にどこから来たか（ベストエフォート）を記録します：

- `label`：人間のラベル（会話ラベル + グループサブジェクト/チャンネルから解決）
- `provider`：正規化されたチャンネルID（拡張機能を含む）
- `from`/`to`：インバウンドエンベロープからの生のルーティングID
- `accountId`：プロバイダーアカウントID（マルチアカウントの場合）
- `threadId`：チャンネルがサポートする場合のスレッド/トピックID
  オリジンフィールドは、ダイレクトメッセージ、チャンネル、グループに対して入力されます。コネクタが配信ルーティングのみを更新する場合（例：DMメインセッションを最新に保つため）、セッションが説明メタデータを保持できるように、インバウンドコンテキストを提供する必要があります。拡張機能は、インバウンドコンテキストで`ConversationLabel`、`GroupSubject`、`GroupChannel`、`GroupSpace`、`SenderName`を送信し、`recordSessionMetaFromInbound`を呼び出す（または同じコンテキストを`updateLastRoute`に渡す）ことでこれを行うことができます。
