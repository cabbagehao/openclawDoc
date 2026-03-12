---
summary: "設定の概要: 一般的なタスク、クイックセットアップ、および詳細なリファレンスへのリンク"
description: "openclaw.json の最小構成、編集方法、厳密検証、よくある設定タスク、ホットリロードと環境変数の扱いを順に説明します。"
read_when:
  - OpenClaw を初めてセットアップする場合
  - 一般的な設定パターンを確認したい場合
  - 特定の設定セクションを探している場合
title: "構成"
seoTitle: "OpenClaw設定ガイド: openclaw.json の基本構成と編集手順"
x-i18n:
  source_hash: "f152f06f31bc06b527d9c28ab1a914879312827aeef69b077b6816f499196e97"
---
OpenClaw は、オプションの <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> 構成を `~/.openclaw/openclaw.json` から読み取ります。

ファイルが見つからない場合、OpenClaw は安全なデフォルトを使用します。構成を追加する一般的な理由:

- チャネルを接続し、ボットにメッセージを送信できる人を制御します
- モデル、ツール、サンドボックス、または自動化 (cron、フック) を設定します。
- セッション、メディア、ネットワーキング、または UI を調整する

利用可能なすべてのフィールドについては、[完全なリファレンス](/gateway/configuration-reference) を参照してください。

<Tip>
**構成は初めてですか?** 対話型セットアップについては `openclaw onboard` から始めるか、完全な構成のコピー＆ペーストについては [構成例](/gateway/configuration-examples) ガイドを参照してください。
</Tip>

## 最小限の構成

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## 構成の編集

<Tabs>
  <Tab title="インタラクティブウィザード">
    ```bash
    openclaw onboard       # full setup wizard
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (ワンライナー)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset tools.web.search.apiKey
    ```
  </Tab>
  <Tab title="コントロールUI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) を開き、**構成** タブを使用します。
    コントロール UI は、**Raw JSON** エディターをエスケープ ハッチとして使用して、構成スキーマからフォームをレンダリングします。
  </Tab>
  <Tab title="直接編集">
    `~/.openclaw/openclaw.json` を直接編集します。ゲートウェイはファイルを監視し、変更を自動的に適用します ([ホット リロード](#config-hot-reload) を参照)。
  </Tab>
</Tabs>

## 厳密な検証

<Warning>

OpenClaw は、スキーマに完全に一致する構成のみを受け入れます。不明なキー、不正な形式、または無効な値により、ゲートウェイは **起動を拒否**します。唯一のルートレベルの例外は `$schema` (文字列) であるため、編集者は JSON スキーマ メタデータを添付できます。
</Warning>

検証が失敗した場合:

- ゲートウェイが起動しない
- 診断コマンドのみが機能します (`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`)
- `openclaw doctor` を実行して、正確な問題を確認してください
- `openclaw doctor --fix` (または `--yes`) を実行して修復を適用します

## 一般的なタスク

<AccordionGroup>
  <Accordion title="チャネルをセットアップする (WhatsApp、Telegram、Discord など)">
    各チャネルには、`channels.<provider>` の下に独自の構成セクションがあります。セットアップ手順については、専用チャンネルのページを参照してください。

    - [WhatsApp](/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/channels/telegram) — `channels.telegram`
    - [Discord](/channels/discord) — `channels.discord`
    - [Slack](/channels/slack) — `channels.slack`
    - [Signal](/channels/signal) — `channels.signal`
    - [iMessage](/channels/imessage) — `channels.imessage`
    - [Google Chat](/channels/googlechat) — `channels.googlechat`
    - [Mattermost](/channels/mattermost) — `channels.mattermost`
    - [MS Teams](/channels/msteams) — `channels.msteams`

    すべてのチャネルは同じ DM ポリシー パターンを共有します。

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="モデルの選択と構成">
    プライマリ モデルとオプションのフォールバックを設定します。

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-5",
            fallbacks: ["openai/gpt-5.2"],
          },
          models: {
            "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
            "openai/gpt-5.2": { alias: "GPT" },
          },
        },
      },
    }
    ```- `agents.defaults.models` はモデル カタログを定義し、`/model` の許可リストとして機能します。
    - モデル参照は `provider/model` 形式 (例: `anthropic/claude-opus-4-6`) を使用します。
    - `agents.defaults.imageMaxDimensionPx` は、トランスクリプト/ツール イメージのダウンスケーリングを制御します (デフォルト `1200`)。通常、値を低くすると、スクリーンショットを大量に使用する実行時のビジョン トークンの使用量が減少します。
    - チャットでのモデルの切り替えについては [モデル CLI](/concepts/models) を、認証ローテーションとフォールバックの動作については [モデル フェールオーバー](/concepts/model-failover) を参照してください。
    - カスタム/セルフホストプロバイダーについては、リファレンスの [カスタムプロバイダー](/gateway/configuration-reference#custom-providers-and-base-urls) を参照してください。

  </Accordion>

  <Accordion title="ボットにメッセージを送信できる人を制御する">
    DM アクセスは、`dmPolicy` を介してチャネルごとに制御されます。

    - `"pairing"` (デフォルト): 不明な送信者は承認用の 1 回限りのペアリング コードを取得します。
    - `"allowlist"`: `allowFrom` (またはペアの許可ストア) の送信者のみ
    - `"open"`: すべての受信 DM を許可します (`allowFrom: ["*"]` が必要)
    - `"disabled"`: すべての DM を無視します

    グループの場合は、`groupPolicy` + `groupAllowFrom` またはチャネル固有の許可リストを使用します。

    チャネルごとの詳細については、[完全なリファレンス](/gateway/configuration-reference#dm-and-group-access) を参照してください。

  </Accordion>

  <Accordion title="グループチャットのメンションゲートを設定する">
    グループ メッセージはデフォルトで **メンションが必要** になっています。エージェントごとにパターンを構成します。

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```- **メタデータのメンション**: ネイティブの @-メンション (WhatsApp のタップツーメンション、Telegram @bot など)
    - **テキスト パターン**: `mentionPatterns` の正規表現パターン
    - チャネルごとのオーバーライドとセルフチャット モードについては、[完全なリファレンス](/gateway/configuration-reference#group-chat-mention-gating) を参照してください。

  </Accordion>

  <Accordion title="セッションとリセットを構成する">
    セッションは会話の継続性と分離を制御します。

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (共有) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: スレッドバインドされたセッションルーティングのグローバルデフォルト (Discord は、`/focus`、`/unfocus`、`/agents`、`/session idle`、および `/session max-age` をサポートします)。
    - スコープ、ID リンク、および送信ポリシーについては、[セッション管理](/concepts/session) を参照してください。
    - すべてのフィールドについては、[完全なリファレンス](/gateway/configuration-reference#session) を参照してください。

  </Accordion>

  <Accordion title="サンドボックスを有効にする">
    分離された Docker コンテナーでエージェント セッションを実行します。

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    最初にイメージをビルドします: `scripts/sandbox-setup.sh`

    完全なガイドについては [サンドボックス](/gateway/sandboxing) を、すべてのオプションについては [完全なリファレンス](/gateway/configuration-reference#sandbox) を参照してください。

  </Accordion>

  <Accordion title="ハートビートの設定 (定期的なチェックイン)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```- `every`: 期間文字列 (`30m`、`2h`)。 `0m` を無効に設定します。
    - `target`: `last` | `whatsapp` | `telegram` | `discord` | `none`
    - `directPolicy`: `allow` (デフォルト) または `block` (DM スタイルのハートビート ターゲットの場合)
    - 完全なガイドについては、[ハートビート](/gateway/heartbeat) を参照してください。

  </Accordion>

  <Accordion title="cron ジョブを構成する">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: `sessions.json` から完了した分離実行セッションをプルーニングします (デフォルトは `24h`、`false` を無効に設定します)。
    - `runLog`: サイズと保持された行によって `cron/runs/<jobId>.jsonl` を削除します。
    - 機能の概要と CLI の例については、[Cron ジョブ](/automation/cron-jobs) を参照してください。

  </Accordion>

  <Accordion title="Webhook (フック) を設定する">
    ゲートウェイで HTTP Webhook エンドポイントを有効にします。

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    セキュリティ上の注意:
    - すべてのフック/Webhook ペイロード コンテンツを信頼できない入力として扱います。
    - 厳密に範囲を絞ったデバッグを実行しない限り、安全でないコンテンツのバイパス フラグを無効にしておきます (`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`)。
    - フック駆動型エージェントの場合は、強力な最新のモデル層と厳密なツール ポリシー (たとえば、メッセージングのみと可能な場合はサンドボックス) を好みます。

    すべてのマッピング オプションと Gmail の統合については、[完全なリファレンス](/gateway/configuration-reference#hooks) を参照してください。

</Accordion><Accordion title="マルチエージェントルーティングを構成する">
別々のワークスペースとセッションを使用して、複数の分離されたエージェントを実行します。

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    バインド ルールとエージェントごとのアクセス プロファイルについては、[マルチエージェント](/concepts/multi-agent) および [完全なリファレンス](/gateway/configuration-reference#multi-agent-routing) を参照してください。

  </Accordion>

  <Accordion title="構成を複数のファイルに分割する ($include)">
    `$include` を使用して大規模な構成を整理します。

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **単一ファイル**: 含まれているオブジェクトを置き換えます
    - **ファイルの配列**: 順番にディープマージされます (後の方が優先)
    - **兄弟キー**: インクルード後にマージされます (インクルードされた値をオーバーライドします)
    - **ネストされたインクルード**: 最大 10 レベルの深さまでサポートされています
    - **相対パス**: 含まれるファイルを基準にして解決されます。
    - **エラー処理**: ファイルの欠落、解析エラー、循環インクルードのエラーをクリアします。

  </Accordion>
</AccordionGroup>

## ホットリロードを構成する

ゲートウェイは `~/.openclaw/openclaw.json` を監視し、変更を自動的に適用します。ほとんどの設定では手動で再起動する必要はありません。

### リロードモード|モード |行動 |

| ---------------------- | ----------------------------------------------------------------------------------------- |
| **`hybrid`** (デフォルト) |安全な変更を即座にホット適用します。重要なものについては自動的に再起動します。 |
| **`hot`** |安全な変更のみをホット適用します。再起動が必要な場合、警告をログに記録します。再起動はユーザーが処理します。 |
| **`restart`** |安全かどうかにかかわらず、設定変更時にゲートウェイを再起動します。 |
| **`off`** |ファイル監視を無効にします。変更は次回の手動再起動時に有効になります。 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ホットアプライするものと再起動が必要なもの

| ほとんどのフィールドはダウンタイムなしでホットアプライされます。 `hybrid` モードでは、再起動が必要な変更は自動的に処理されます。 | カテゴリー                                                          | フィールド | 再起動が必要ですか? |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------- | ------------------- |
| チャンネル               | `channels.*`、`web` (WhatsApp) — すべての組み込みおよび拡張チャネル | いいえ   |
| エージェントとモデル     | `agent`、`agents`、`models`、`routing`                              | いいえ   |
| 自動化                   | `hooks`、`cron`、`agent.heartbeat`                                  | いいえ   |
| セッションとメッセージ   | `session`、`messages`                                               | いいえ   |
| ツールとメディア         | `tools`、`browser`、`skills`、`audio`、`talk`                       | いいえ   |
| UI とその他              | `ui`、`logging`、`identity`、`bindings`                             | いいえ   |
| ゲートウェイサーバー     | `gateway.*` (ポート、バインド、認証、テールスケール、TLS、HTTP)     | **はい** |
| インフラ                 | `discovery`、`canvasHost`、`plugins`                                | **はい** |

<Note>

`gateway.reload` と `gateway.remote` は例外です。これらを変更しても再起動は**行われません**。
</Note>

## Config RPC (プログラムによる更新)

<Note>
コントロール プレーン書き込み RPC (`config.apply`、`config.patch`、`update.run`) は、`deviceId+clientIp` ごとに **60 秒あたり 3 リクエスト** にレート制限されています。制限されている場合、RPC は `retryAfterMs` とともに `UNAVAILABLE` を返します。
</Note>

<AccordionGroup>
  <Accordion title="config.apply (完全置換)">
    検証し、完全な構成を書き込み、ゲートウェイを 1 ステップで再起動します。

    <Warning>
    `config.apply` は **構成全体** を置き換えます。部分的な更新には `config.patch` を使用し、単一キーには `openclaw config set` を使用します。
    </Warning>

    パラメータ:

    - `raw` (文字列) — 構成全体の JSON5 ペイロード
    - `baseHash` (オプション) — `config.get` からの構成ハッシュ (構成が存在する場合に必要)
    - `sessionKey` (オプション) — 再起動後のウェイクアップ ping 用のセッション キー
    - `note` (オプション) — 再起動センチネルに関するメモ
    - `restartDelayMs` (オプション) — 再起動前の遅延 (デフォルトは 2000)

    再起動リクエストは、1 つがすでに保留中または実行中であるときに結合され、再起動サイクルの間に 30 秒のクールダウンが適用されます。

    ```bash
    openclaw gateway call config.get --params '{}'  # capture payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:dm:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (部分更新)">
    部分的な更新を既存の構成にマージします (JSON マージ パッチ セマンティクス)。- オブジェクトは再帰的にマージされます
    - `null` はキーを削除します
    - 配列の置換

    パラメータ:

    - `raw` (文字列) — 変更するキーのみを含む JSON5
    - `baseHash` (必須) — `config.get` からの構成ハッシュ
    - `sessionKey`、`note`、`restartDelayMs` — `config.apply` と同じ

    再起動の動作は `config.apply` と一致します。合体した保留中の再起動に加え、再起動サイクル間に 30 秒のクールダウンが発生します。

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## 環境変数

OpenClaw は、親プロセスから環境変数を読み取り、さらに次のことを行います。

- 現在の作業ディレクトリからの `.env` (存在する場合)
- `~/.openclaw/.env` (グローバル フォールバック)

どちらのファイルも既存の環境変数をオーバーライドしません。 config でインライン環境変数を設定することもできます。

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="シェル環境インポート (オプション)">
  有効で予期されるキーが設定されていない場合、OpenClaw はログイン シェルを実行し、不足しているキーのみをインポートします。

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

同等の環境変数: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="構成値の環境変数置換">
  `${VAR_NAME}` を使用して、構成文字列値内の環境変数を参照します。

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

ルール:

- 大文字の名前のみが一致します: `[A-Z_][A-Z0-9_]*`
- 欠落している/空の変数はロード時にエラーをスローします
- リテラル出力の場合は `${VAR}` でエスケープします
- `$include` ファイル内で動作します
- インライン置換: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion><Accordion title="シークレット参照 (env、file、exec)">
SecretRef オブジェクトをサポートするフィールドの場合、以下を使用できます。

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "nano-banana-pro": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/nano-banana-pro/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

SecretRef の詳細 (`env`/`file`/`exec` の `secrets.providers` を含む) は、[シークレット管理](/gateway/secrets) にあります。
サポートされている資格情報パスは、[SecretRef Credential Surface](/reference/secretref-credential-surface) にリストされています。
</Accordion>

完全な優先順位とソースについては、[環境](/help/environment) を参照してください。

## 完全なリファレンス

フィールドごとの完全なリファレンスについては、**[構成リファレンス](/gateway/configuration-reference)** を参照してください。

---

_関連: [構成例](/gateway/configuration-examples) · [構成リファレンス](/gateway/configuration-reference) · [ドクター](/gateway/doctor)_
