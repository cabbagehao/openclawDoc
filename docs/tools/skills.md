---
summary: "スキル: マネージドとワークスペース、ゲーティング ルール、構成/環境のワイヤリング"
read_when:
  - スキルの追加または変更
  - スキルゲーティングまたはロードルールの変更
title: "スキル"
x-i18n:
  source_hash: "b1088c2daabb12bffc1511aa3d3c06d389fb054092ed5aff8f8bf30cbf11236c"
---

# スキル (OpenClaw)

OpenClaw は、**[AgentSkills](https://agentskills.io) 互換** スキル フォルダーを使用して、エージェントにツールの使用方法を教えます。各スキルは、YAML フロントマターと命令を含む `SKILL.md` を含むディレクトリです。 OpenClaw は、**バンドルされたスキル** とオプションのローカル オーバーライドをロードし、環境、構成、バイナリの存在に基づいてロード時にそれらをフィルタリングします。

## 場所と優先順位

スキルは**3**の場所からロードされます:

1. **バンドルされたスキル**: インストールに同梱されています (npm パッケージまたは OpenClaw.app)
2. **マネージド/ローカル スキル**: `~/.openclaw/skills`
3. **ワークスペーススキル**: `<workspace>/skills`

スキル名が競合する場合、優先順位は次のとおりです。

`<workspace>/skills` (最高) → `~/.openclaw/skills` → バンドルスキル (最低)

さらに、追加のスキル フォルダー (優先順位が最も低い) を次のように設定できます。
`skills.load.extraDirs` の `~/.openclaw/openclaw.json`。

## エージェントごとのスキルと共有スキル

**マルチエージェント** セットアップでは、各エージェントに独自のワークスペースがあります。つまり:

- **エージェントごとのスキル**は、そのエージェントに対してのみ `<workspace>/skills` に存在します。
- **共有スキル** は `~/.openclaw/skills` (管理/ローカル) に存在し、表示されます
  同じマシン上の**すべてのエージェント**に。
- **共有フォルダー**は、`skills.load.extraDirs` (最低) 経由で追加することもできます。
  優先) 複数のエージェントが使用する共通のスキル パックが必要な場合。同じスキル名が複数箇所に存在する場合は、通常のスキルが優先されます。
  適用: ワークスペースが優先され、次に管理/ローカル、次にバンドルされます。

## プラグイン + スキル

プラグインは、`skills` ディレクトリをリストすることで独自のスキルを出荷できます。
`openclaw.plugin.json` (プラグインのルートに対する相対パス)。プラグインスキルのロード
プラグインが有効化され、通常のスキル優先ルールに参加する場合。
プラグインの設定の `metadata.openclaw.requires.config` を介してそれらをゲートできます。
エントリー。検出/設定については [プラグイン](/tools/plugin) を、また、
ツールの表面にこれらのスキルが教えられます。

## ClawHub (インストール + 同期)

ClawHub は、OpenClaw の公開スキル レジストリです。で閲覧
[https://clawhub.com](https://clawhub.com)。これを使用して、スキルの検出、インストール、更新、バックアップを行います。
完全なガイド: [ClawHub](/tools/clawhub)。

一般的なフロー:

- ワークスペースにスキルをインストールします。
  - `clawhub install <skill-slug>`
- インストールされているすべてのスキルを更新します。
  - `clawhub update --all`
- 同期 (スキャン + 更新の公開):
  - `clawhub sync --all`

デフォルトでは、`clawhub` は現在の作業環境の `./skills` にインストールされます。
ディレクトリに移動します (または、設定された OpenClaw ワークスペースにフォールバックします)。オープンクローピック
それは次のセッションで `<workspace>/skills` になります。

## セキュリティに関する注意事項- サードパーティのスキルを **信頼できないコード** として扱います。有効にする前に読んでください

- 信頼できない入力や危険なツールに対しては、サンドボックスでの実行を優先します。 [サンドボックス](/gateway/sandboxing) を参照してください。
- ワークスペースおよび追加ディレクトリのスキル検出は、解決されたリアルパスが構成されたルート内に留まるスキル ルートおよび `SKILL.md` ファイルのみを受け入れます。
- `skills.entries.*.env` および `skills.entries.*.apiKey` は **ホスト** プロセスにシークレットを挿入します
  そのエージェントのターン (サンドボックスではありません)。プロンプトやログに秘密を記載しないでください。
- より広範な脅威モデルとチェックリストについては、[セキュリティ](/gateway/security) を参照してください。

## 形式 (AgentSkills + Pi 互換)

`SKILL.md` には少なくとも以下を含める必要があります:

```markdown
---
name: nano-banana-pro
description: Generate or edit images via Gemini 3 Pro Image
---
```

注:- レイアウト/意図については AgentSkills 仕様に従います。

- 組み込みエージェントによって使用されるパーサーは、**単一行** フロントマター キーのみをサポートします。
- `metadata` は **単一行の JSON オブジェクト**である必要があります。
- スキルフォルダーのパスを参照するには、手順内で `{baseDir}` を使用します。
- オプションの前付キー:
  - `homepage` — URL は macOS スキル UI に「ウェブサイト」として表示されます (`metadata.openclaw.homepage` 経由でもサポートされています)。
  - `user-invocable` — `true|false` (デフォルト: `true`)。 `true` の場合、スキルはユーザーのスラッシュ コマンドとして公開されます。
  - `disable-model-invocation` — `true|false` (デフォルト: `false`)。 `true` の場合、スキルはモデル プロンプトから除外されます (ユーザー呼び出しを通じて引き続き使用できます)。
  - `command-dispatch` — `tool` (オプション)。 `tool` に設定すると、スラッシュ コマンドはモデルをバイパスし、ツールに直接ディスパッチされます。
  - `command-tool` — `command-dispatch: tool` が設定されている場合に呼び出すツール名。
  - `command-arg-mode` — `raw` (デフォルト)。ツールのディスパッチでは、生の引数文字列をツールに転送します (コア解析なし)。

    このツールは params を使用して呼び出されます。
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。

## ゲーティング (ロード時間フィルター)

OpenClaw は、`metadata` (単一行 JSON) を使用して **ロード時にスキルをフィルタリング**します。

```markdown
---
name: nano-banana-pro
description: Generate or edit images via Gemini 3 Pro Image
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

`metadata.openclaw` の下のフィールド:- `always: true` — 常にスキルを含めます (他のゲートをスキップします)。

- `emoji` — macOS スキル UI で使用されるオプションの絵文字。
- `homepage` — macOS スキル UI で「Web サイト」として表示されるオプションの URL。
- `os` — プラットフォームのオプションのリスト (`darwin`、`linux`、`win32`)。設定されている場合、スキルはそれらの OS でのみ有効です。
- `requires.bins` — リスト;それぞれが `PATH` に存在する必要があります。
- `requires.anyBins` — リスト;少なくとも 1 つは `PATH` に存在する必要があります。
- `requires.env` — リスト; env var は存在する必要があります\*\*、または構成で指定する必要があります。
- `requires.config` — 真実でなければならない `openclaw.json` パスのリスト。
- `primaryEnv` — `skills.entries.<name>.apiKey` に関連付けられた環境変数名。
- `install` — macOS スキル UI で使用されるインストーラー仕様のオプションの配列 (brew/node/go/uv/download)。

サンドボックスに関する注意:

- `requires.bins` はスキルのロード時に **ホスト**上でチェックされます。
- エージェントがサンドボックス化されている場合、バイナリは **コンテナ内**にも存在する必要があります。
  `agents.defaults.sandbox.docker.setupCommand` (またはカスタム イメージ) を介してインストールします。
  `setupCommand` は、コンテナーの作成後に 1 回実行されます。
  パッケージのインストールには、ネットワーク出力、書き込み可能なルート FS、およびサンドボックス内のルート ユーザーも必要です。
  例: `summarize` スキル (`skills/summarize/SKILL.md`) には `summarize` CLI が必要です
  サンドボックスコンテナ内で実行します。

インストーラーの例:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

注:- 複数のインストーラーがリストされている場合、ゲートウェイは **単一** の優先オプション (利用可能な場合は brew、それ以外の場合はノード) を選択します。

- すべてのインストーラーが `download` の場合、OpenClaw は各エントリをリストするので、利用可能なアーティファクトを確認できます。
- インストーラーの仕様には、プラットフォームごとにオプションをフィルターするための `os: ["darwin"|"linux"|"win32"]` を含めることができます。
- ノードは `openclaw.json` に `skills.install.nodeManager` をインストールします (デフォルト: npm; オプション: npm/pnpm/yarn/bun)。
  これは **スキルのインストール**にのみ影響します。ゲートウェイ ランタイムは依然として Node である必要があります
  (Bun は WhatsApp/Telegram には推奨されません)。
- Go のインストール: `go` が見つからず、`brew` が利用可能な場合、ゲートウェイは最初に Homebrew 経由で Go をインストールし、可能な場合は `GOBIN` を Homebrew の `bin` に設定します。
- ダウンロード インストール: `url` (必須)、`archive` (`tar.gz` | `tar.bz2` | `zip`)、`extract` (デフォルト: アーカイブ検出時に自動)、 `stripComponents`、`targetDir` (デフォルト: `~/.openclaw/tools/<skillKey>`)。

`metadata.openclaw` が存在しない場合、スキルは常に適格です (ただし、
構成で無効になっているか、バンドルされたスキルの `skills.allowBundled` によってブロックされています)。

## 構成の上書き (`~/.openclaw/openclaw.json`)

バンドル/管理スキルを切り替えて、env 値を指定することができます。

```json5
{
  skills: {
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

注: スキル名にハイフンが含まれている場合は、キーを引用符で囲みます (JSON5 ではキーを引用符で囲むことができます)。デフォルトでは、設定キーは **スキル名** と一致します。スキルが定義する場合
`metadata.openclaw.skillKey`、`skills.entries` でそのキーを使用します。

ルール:

- `enabled: false` は、バンドル/インストールされている場合でもスキルを無効にします。
- `env`: **変数がプロセスにまだ設定されていない場合にのみ**挿入されます。
- `apiKey`: `metadata.openclaw.primaryEnv` を宣言するスキルの利便性。
  プレーンテキスト文字列または SecretRef オブジェクト (`{ source, provider, id }`) をサポートします。
- `config`: スキルごとのカスタムフィールド用のオプションのバッグ。カスタムキーはここに存在する必要があります。
- `allowBundled`: **バンドル** スキルのみのオプションの許可リスト。設定されている場合のみ、
  リスト内のバンドルされたスキルが対象となります (管理/ワークスペース スキルは影響を受けません)。

## 環境インジェクション (エージェント実行ごと)

エージェントの実行が開始されると、OpenClaw は次のことを行います。

1. スキルのメタデータを読み取ります。
2. `skills.entries.<key>.env` または `skills.entries.<key>.apiKey` を
   `process.env`。
3. **資格のある**スキルを使用してシステム プロンプトを構築します。
4. 実行終了後に元の環境を復元します。

これは、グローバル シェル環境ではなく、**エージェントの実行に限定されています**。

## セッションのスナップショット (パフォーマンス)

OpenClaw は **セッションの開始時に**対象となるスキルのスナップショットを作成し、そのリストを同じセッション内の後続のターンで再利用します。スキルまたは構成への変更は、次の新しいセッションで有効になります。スキル ウォッチャーが有効になっている場合、または新しい対象となるリモート ノードが表示された場合、セッション中にスキルを更新することもできます (下記を参照)。これを **ホット リロード** と考えてください。更新されたリストは次のエージェント ターンで取得されます。

## リモート macOS ノード (Linux ゲートウェイ)

ゲートウェイが Linux 上で実行されているが、**macOS ノード**が **`system.run` を許可**して接続されている場合 (実行承認セキュリティが `deny` に設定されていない場合)、必要なバイナリがそのノード上に存在する場合、OpenClaw は macOS のみのスキルを適格なものとして扱うことができます。エージェントは、`nodes` ツール (通常は `nodes.run`) を介してこれらのスキルを実行する必要があります。

これは、コマンド サポートを報告するノードと、`system.run` を介した bin プローブに依存します。後で macOS ノードがオフラインになっても、スキルは表示されたままになります。ノードが再接続されるまで呼び出しは失敗する可能性があります。

## スキルウォッチャー (自動更新)

デフォルトでは、OpenClaw はスキル フォルダーを監視し、`SKILL.md` ファイルが変更されるとスキル スナップショットを作成します。これを `skills.load` で構成します。

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## トークンの影響 (スキルリスト)

スキルが適格である場合、OpenClaw は利用可能なスキルのコンパクトな XML リストをシステム プロンプトに挿入します (`pi-coding-agent` の `formatSkillsForPrompt` 経由)。コストは決定的です。- **基本オーバーヘッド (スキルが 1 つ以上の場合のみ):** 195 文字。

- **スキルごと:** 97 文字 + XML エスケープされた `<name>`、`<description>`、および `<location>` 値の長さ。

計算式（文字）：

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

注:

- XML エスケープにより、`& < > " '` がエンティティ (`&amp;`、`&lt;` など) に展開され、長さが増加します。
- トークン数はトークナイザーのモデルによって異なります。 OpenAI スタイルの大まかな見積もりは、トークンあたり最大 4 文字であるため、スキルあたり **97 文字 ≈ 24 トークン** + 実際のフィールドの長さになります。

## マネージド スキルのライフサイクル

OpenClaw は、スキルのベースライン セットを **バンドル スキル**として、
インストールします (npm パッケージまたは OpenClaw.app)。 `~/.openclaw/skills` はローカルに存在します
オーバーライド（たとえば、バンドルされたスキルを変更せずにスキルを固定/パッチ適用する）
コピー）。ワークスペース スキルはユーザーが所有し、名前の競合の両方をオーバーライドします。

## 構成リファレンス

完全な構成スキーマについては、[スキル構成](/tools/skills-config) を参照してください。

## さらにスキルをお探しですか?

[https://clawhub.com](https://clawhub.com) を参照してください。

---
