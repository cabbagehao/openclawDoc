---
summary: "OpenClaw プラグイン/拡張機能: 検出、構成、安全性"
read_when:
  - プラグイン/拡張機能の追加または変更
  - プラグインのインストールまたはロードのルールを文書化する
title: "プラグイン"
x-i18n:
  source_hash: "f52c99de8304fb607b62e3c61f5dd6cd6ed2be4d54b4f8d67e3976875cb824fb"
---

# プラグイン (拡張機能)

## クイック スタート (プラグインは初めてですか?)

プラグインは、OpenClaw を拡張する単なる **小さなコード モジュール**です。
機能 (コマンド、ツール、ゲートウェイ RPC)。

ほとんどの場合、構築されていない機能が必要な場合はプラグインを使用します。
まだコア OpenClaw に取り入れていない (または、オプションの機能をメインの機能から外したい場合)
インストールします）。

高速パス:

1. すでにロードされているものを確認します。

```bash
openclaw plugins list
```

2. 公式プラグインをインストールします (例: 音声通話)。

```bash
openclaw plugins install @openclaw/voice-call
```

Npm 仕様は **レジストリのみ** (パッケージ名 + オプションの **正確なバージョン** または
**距離タグ**)。 Git/URL/ファイルの仕様とサーバー範囲は拒否されます。

最低限のスペックと `@latest` は安定した軌道を維持します。 npm が次のいずれかを解決する場合
これらをプレリリースにすると、OpenClaw が停止し、明示的にオプトインするように求められます。
`@beta`/`@rc` などのプレリリース タグ、または正確なプレリリース バージョン。

3. ゲートウェイを再起動し、`plugins.entries.<id>.config` で設定します。

具体的なプラグインの例については、[音声通話](/plugins/voice-call) を参照してください。
サードパーティのリストをお探しですか? [コミュニティ プラグイン](/plugins/community) を参照してください。

## 利用可能なプラグイン (公式)- Microsoft Teams は 2026.1.15 の時点でプラグインのみです。 Teams を使用している場合は、`@openclaw/msteams` をインストールします

- メモリ (コア) — バンドルされたメモリ検索プラグイン (`plugins.slots.memory` 経由でデフォルトで有効)
- メモリ (LanceDB) — バンドルされた長期記憶プラグイン (自動呼び出し/キャプチャ、`plugins.slots.memory = "memory-lancedb"` を設定)
- [音声通話](/plugins/voice-call) — `@openclaw/voice-call`
- [Zalo 個人](/plugins/zalouser) — `@openclaw/zalouser`
- [マトリックス](/channels/matrix) — `@openclaw/matrix`
- [Nostr](/channels/nostr) — `@openclaw/nostr`
- [ザロ](/channels/zalo) — `@openclaw/zalo`
- [Microsoft Teams](/channels/msteams) — `@openclaw/msteams`
- Google Antigravity OAuth (プロバイダー認証) — `google-antigravity-auth` としてバンドルされています (デフォルトでは無効)
- Gemini CLI OAuth (プロバイダー認証) — `google-gemini-cli-auth` としてバンドルされています (デフォルトでは無効)
- Qwen OAuth (プロバイダー認証) — `qwen-portal-auth` としてバンドルされています (デフォルトでは無効)
- Copilot プロキシ (プロバイダー認証) — ローカル VS Code Copilot プロキシ ブリッジ。組み込みの `github-copilot` デバイス ログインとは異なります (バンドルされており、デフォルトで無効になっています)

OpenClaw プラグインは、jiti を介して実行時にロードされる **TypeScript モジュール**です。 **構成
検証ではプラグイン コードは実行されません**。プラグインマニフェストとJSONを使用します
代わりにスキーマ。 [プラグイン マニフェスト](/plugins/manifest) を参照してください。

プラグインは以下を登録できます。- ゲートウェイ RPC メソッド

- ゲートウェイ HTTP ルート
- エージェントツール
- CLIコマンド
- バックグラウンドサービス
- コンテキストエンジン
- オプションの構成検証
- **スキル** (プラグイン マニフェストに `skills` ディレクトリをリストすることによる)
- **自動応答コマンド** (AI エージェントを呼び出さずに実行)

プラグインはゲートウェイとともに**インプロセス**で実行されるため、信頼できるコードとして扱われます。
ツール作成ガイド: [プラグイン エージェント ツール](/plugins/agent-tools)。

## ランタイムヘルパー

プラグインは、`api.runtime` を介して選択されたコア ヘルパーにアクセスできます。テレフォニー TTS の場合:

```ts
const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});
```

注:

- コア `messages.tts` 構成 (OpenAI または イレブンラボ) を使用します。
- PCM オーディオ バッファ + サンプル レートを返します。プラグインはプロバイダー用にリサンプリング/エンコードする必要があります。
- Edge TTS はテレフォニーではサポートされていません。

STT/文字起こしの場合、プラグインは以下を呼び出すことができます。

```ts
const { text } = await api.runtime.stt.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

注:

- コアメディア理解オーディオ構成 (`tools.media.audio`) とプロバイダーのフォールバック順序を使用します。
- 文字起こし出力が生成されない場合 (スキップされた/サポートされていない入力など)、`{ text: undefined }` を返します。

## ゲートウェイ HTTP ルート

プラグインは `api.registerHttpRoute(...)` を使用して HTTP エンドポイントを公開できます。

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

ルートフィールド:- `path`: ゲートウェイ HTTP サーバーの下のルート パス。

- `auth`: 必須。通常のゲートウェイ認証を要求するには `"gateway"` を使用し、プラグイン管理の認証/Webhook 検証には `"plugin"` を使用します。
- `match`: オプション。 `"exact"` (デフォルト) または `"prefix"`。
- `replaceExisting`: オプション。同じプラグインが自身の既存のルート登録を置き換えることを許可します。
- `handler`: ルートがリクエストを処理したときに `true` を返します。

注:

- `api.registerHttpHandler(...)` は廃止されました。 `api.registerHttpRoute(...)` を使用してください。
- プラグイン ルートは `auth` を明示的に宣言する必要があります。
- `replaceExisting: true` を除き、正確な `path + match` の競合は拒否され、あるプラグインが別のプラグインのルートを置き換えることはできません。
- `auth` レベルが異なる重複するルートは拒否されます。 `exact`/`prefix` フォールスルー チェーンは同じ認証レベルでのみ保持してください。

## プラグイン SDK インポート パス

次の場合は、モノリシック `openclaw/plugin-sdk` インポートの代わりに SDK サブパスを使用してください。
オーサリングプラグイン:- `openclaw/plugin-sdk/core` は、汎用プラグイン API、プロバイダー認証タイプ、および共有ヘルパー用です。

- `openclaw/plugin-sdk/compat` は、`core` よりも広範な共有ランタイム ヘルパーを必要とするバンドル/内部プラグイン コード用です。
- `openclaw/plugin-sdk/telegram` テレグラム チャネル プラグイン用。
- `openclaw/plugin-sdk/discord` Discord チャンネル プラグイン用。
- `openclaw/plugin-sdk/slack` Slack チャネル プラグイン用。
- `openclaw/plugin-sdk/signal` シグナルチャンネルプラグイン用。
- `openclaw/plugin-sdk/imessage` iMessage チャネル プラグイン用。
- `openclaw/plugin-sdk/whatsapp` WhatsApp チャネル プラグイン用。
- `openclaw/plugin-sdk/line` LINE チャネル プラグイン用。
- `openclaw/plugin-sdk/msteams` バンドルされた Microsoft Teams プラグイン サーフェス用。
- バンドルされた拡張機能固有のサブパスも利用できます。
  `openclaw/plugin-sdk/acpx`、`openclaw/plugin-sdk/bluebubbles`、
  `openclaw/plugin-sdk/copilot-proxy`、`openclaw/plugin-sdk/device-pair`、
  `openclaw/plugin-sdk/diagnostics-otel`、`openclaw/plugin-sdk/diffs`、
  `openclaw/plugin-sdk/feishu`、
  `openclaw/plugin-sdk/google-gemini-cli-auth`、`openclaw/plugin-sdk/googlechat`、
  `openclaw/plugin-sdk/irc`、`openclaw/plugin-sdk/llm-task`、
  `openclaw/plugin-sdk/lobster`、`openclaw/plugin-sdk/matrix`、
  `openclaw/plugin-sdk/mattermost`、`openclaw/plugin-sdk/memory-core`、
  `openclaw/plugin-sdk/memory-lancedb`、
  `openclaw/plugin-sdk/minimax-portal-auth`、
  `openclaw/plugin-sdk/nextcloud-talk`、`openclaw/plugin-sdk/nostr`、
  `openclaw/plugin-sdk/open-prose`、`openclaw/plugin-sdk/phone-control`、
  `openclaw/plugin-sdk/qwen-portal-auth`、`openclaw/plugin-sdk/synology-chat`、
  `openclaw/plugin-sdk/talk-voice`、`openclaw/plugin-sdk/test-utils`、
  `openclaw/plugin-sdk/thread-ownership`、`openclaw/plugin-sdk/tlon`、
  `openclaw/plugin-sdk/twitch`、`openclaw/plugin-sdk/voice-call`、
  `openclaw/plugin-sdk/zalo`、および `openclaw/plugin-sdk/zalouser`。

互換性に関するメモ:- `openclaw/plugin-sdk` は、既存の外部プラグインに対して引き続きサポートされます。

- 新しいバンドル プラグインと移行されたバンドル プラグインは、チャネルまたは拡張機能固有のプラグインを使用する必要があります
  サブパス;一般的なサーフェスには `core` を使用し、より広い場合にのみ `compat` を使用します
  共有ヘルパーが必要です。

## 読み取り専用チャネル検査

プラグインがチャンネルを登録する場合は、実装することを優先します。
`plugin.config.inspectAccount(cfg, accountId)` を `resolveAccount(...)` と並べます。

理由:

- `resolveAccount(...)` はランタイム パスです。資格情報を仮定することが許可されています
  は完全に実体化されており、必要なシークレットが欠落している場合はすぐに失敗する可能性があります。
- `openclaw status`、`openclaw status --all`、などの読み取り専用コマンド パス
  `openclaw channels status`、`openclaw channels resolve`、およびドクター/構成
  修復フローでは、実行時資格情報を具体化する必要はありません。
  構成を説明します。

推奨される `inspectAccount(...)` 動作:- 説明的なアカウント状態のみを返します。

- `enabled` と `configured` を保存します。
- 関連する場合、次のような認証情報ソース/ステータス フィールドを含めます。
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 読み取り専用をレポートするためだけに生のトークン値を返す必要はありません
  可用性。 `tokenStatus: "available"` (および一致するソース) を返します
  フィールド) は、ステータス形式のコマンドには十分です。
- 資格情報が SecretRef 経由で設定されている場合は、`configured_unavailable` を使用しますが、
  現在のコマンド パスでは使用できません。

これにより、読み取り専用コマンドが「設定されていますが、このコマンドでは使用できません」と報告できるようになります。
クラッシュしたり、アカウントが構成されていないと誤って報告されたりするのではなく、「パス」を使用します。

パフォーマンスに関するメモ:

- プラグインの検出とマニフェストのメタデータは、短いインプロセス キャッシュを使用して、
  急激な起動/リロード作業。
- `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` を設定するか、
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` を使用してこれらのキャッシュを無効にします。
- `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` を使用してキャッシュ ウィンドウを調整し、
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`。

## 発見と優先順位

OpenClaw は次の順序でスキャンします。

1. 構成パス

- `plugins.load.paths` (ファイルまたはディレクトリ)

2. ワークスペース拡張機能

- `<workspace>/.openclaw/extensions/*.ts`
- `<workspace>/.openclaw/extensions/*/index.ts`

3. グローバル拡張機能

- `~/.openclaw/extensions/*.ts`
- `~/.openclaw/extensions/*/index.ts`

4. バンドルされた拡張機能 (OpenClaw に同梱されていますが、デフォルトではほとんどが無効になっています)

- `<openclaw>/extensions/*`バンドルされているほとんどのプラグインは、次の方法で明示的に有効にする必要があります。
  `plugins.entries.<id>.enabled` または `openclaw plugins enable <id>`。

デフォルトでバンドルされているプラグインの例外:

- `device-pair`
- `phone-control`
- `talk-voice`
- アクティブ メモリ スロット プラグイン (デフォルト スロット: `memory-core`)

インストールされたプラグインはデフォルトで有効になっていますが、同じ方法で無効にすることもできます。

硬化メモ:

- `plugins.allow` が空で、バンドルされていないプラグインが検出可能な場合、OpenClaw はプラグイン ID とソースを含む起動警告をログに記録します。
- 候補パスは、検出許可の前に安全性がチェックされます。 OpenClaw は、次の場合に候補をブロックします。
  - 拡張エントリはプラグイン ルートの外側で解決されます (シンボリックリンク/パス トラバーサル エスケープを含む)。
  - プラグインのルート/ソース パスは誰でも書き込み可能です。
  - バンドルされていないプラグインのパスの所有権は疑わしい (POSIX 所有者は現在の uid でも root でもない)。
- インストール/ロードパスの出自を持たずにロードされたバンドルされていないプラグインは警告を発するため、信頼を固定するか (`plugins.allow`)、またはインストール追跡を行うことができます (`plugins.installs`)。

各プラグインには、ルートに `openclaw.plugin.json` ファイルが含まれている必要があります。パスの場合
ファイルを指す場合、プラグインのルートはファイルのディレクトリであり、
マニフェストします。

複数のプラグインが同じ ID に解決される場合、上記の順序で最初に一致するプラグイン
優先順位の低いコピーは無視されます。

### パッケージパック

プラグイン ディレクトリには、`package.json` と `openclaw.extensions` が含まれる場合があります。

````json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"]
  }
}
```各エントリはプラグインになります。パックに複数の拡張機能がリストされている場合、プラグイン ID
`name/<fileBase>` になります。

プラグインが npm deps をインポートする場合は、そのディレクトリにインストールします。
`node_modules` が利用可能です (`npm install` / `pnpm install`)。

セキュリティ ガードレール: すべての `openclaw.extensions` エントリはプラグイン内に保持する必要があります
シンボリックリンク解決後のディレクトリ。パッケージディレクトリをエスケープするエントリは次のとおりです。
拒否されました。

セキュリティ上の注意: `openclaw plugins install` はプラグインの依存関係をインストールします。
`npm install --ignore-scripts` (ライフサイクル スクリプトなし)。プラグインの依存関係を維持する
ツリーは「純粋な JS/TS」であり、`postinstall` ビルドを必要とするパッケージは避けてください。

### チャンネルカタログメタデータ

チャネル プラグインは、`openclaw.channel` を介してオンボーディング メタデータをアドバタイズできます。
`openclaw.install` 経由でヒントをインストールします。これにより、コア カタログにデータが含まれない状態が保たれます。

例:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "extensions/nextcloud-talk",
      "defaultChoice": "npm"
    }
  }
}
````

OpenClaw は、**外部チャネル カタログ** (MPM など) をマージすることもできます。
レジストリのエクスポート）。 JSON ファイルを次のいずれかにドロップします。

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

または、`OPENCLAW_PLUGIN_CATALOG_PATHS` (または `OPENCLAW_MPM_CATALOG_PATHS`) を指定してください
1 つ以上の JSON ファイル (カンマ/セミコロン/`PATH` 区切り)。各ファイルは、
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` が含まれています。

## プラグイン ID

デフォルトのプラグイン ID:

- パッケージ パック: `package.json` `name`
- スタンドアロン ファイル: ファイル ベース名 (`~/.../voice-call.ts` → `voice-call`)プラグインが `id` をエクスポートする場合、OpenClaw はそれを使用しますが、それが
  設定されたID。

## 構成

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

フィールド:

- `enabled`: マスター切り替え (デフォルト: true)
- `allow`: 許可リスト (オプション)
- `deny`: 拒否リスト (オプション、拒否が優先)
- `load.paths`: 追加のプラグイン ファイル/ディレクトリ
- `slots`: `memory` や `contextEngine` などの排他的スロット セレクター
- `entries.<id>`: プラグインごとの切り替え + 設定

構成を変更するには **ゲートウェイの再起動が必要です**。

検証ルール (厳密):

- `entries`、`allow`、`deny`、または `slots` の不明なプラグイン ID は **エラー**です。
- プラグイン マニフェストで宣言されていない限り、不明な `channels.<id>` キーは **エラー**
  チャンネルID。
- プラグイン設定は、に埋め込まれた JSON スキーマを使用して検証されます。
  `openclaw.plugin.json` (`configSchema`)。
- プラグインが無効になっている場合、その構成は保存され、**警告**が発行されます。

## プラグイン スロット (排他的なカテゴリ)

一部のプラグイン カテゴリは **排他的**です (一度に 1 つだけアクティブになります)。使用する
`plugins.slots` でスロットを所有するプラグインを選択します。

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable memory plugins
      contextEngine: "legacy", // or a plugin id such as "lossless-claw"
    },
  },
}
```

サポートされている専用スロット:

- `memory`: アクティブなメモリ プラグイン (`"none"` はメモリ プラグインを無効にします)
- `contextEngine`: アクティブなコンテキスト エンジン プラグイン (`"legacy"` は組み込みのデフォルトです)複数のプラグインが `kind: "memory"` または `kind: "context-engine"` を宣言している場合のみ、
  選択したプラグインがそのスロットにロードされます。その他は診断により無効になります。

### コンテキスト エンジン プラグイン

コンテキスト エンジン プラグインは、取り込み、アセンブリ、
そして圧縮。プラグインからそれらを登録します
`api.registerContextEngine(id, factory)`、次にアクティブなエンジンを選択します
`plugins.slots.contextEngine`。

プラグインがデフォルトのコンテキストを置換または拡張する必要がある場合にこれを使用します。
単にメモリ検索やフックを追加するのではなく、パイプラインを作成します。

## コントロール UI (スキーマ + ラベル)

コントロール UI は、`config.schema` (JSON スキーマ + `uiHints`) を使用して、より適切なフォームをレンダリングします。

OpenClaw は、検出されたプラグインに基づいて実行時に `uiHints` を拡張します。

- `plugins.entries.<id>` / `.enabled` / `.config` のプラグインごとのラベルを追加します。
- プラグインが提供するオプションの設定フィールドのヒントを以下にマージします。
  `plugins.entries.<id>.config.<field>`

プラグイン設定フィールドに適切なラベル/プレースホルダーを表示したい場合 (そしてシークレットを機密としてマークしたい場合)、
プラグイン マニフェストで JSON スキーマと一緒に `uiHints` を指定します。

例:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": { "type": "string" },
      "region": { "type": "string" }
    }
  },
  "uiHints": {
    "apiKey": { "label": "API Key", "sensitive": true },
    "region": { "label": "Region", "placeholder": "us-east-1" }
  }
}
```

## CLI

```bash
openclaw plugins list
openclaw plugins info <id>
openclaw plugins install <path>                 # copy a local file/dir into ~/.openclaw/extensions/<id>
openclaw plugins install ./extensions/voice-call # relative path ok
openclaw plugins install ./plugin.tgz           # install from a local tarball
openclaw plugins install ./plugin.zip           # install from a local zip
openclaw plugins install -l ./extensions/voice-call # link (no copy) for dev
openclaw plugins install @openclaw/voice-call # install from npm
openclaw plugins install @openclaw/voice-call --pin # store exact resolved name@version
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins doctor
```

`plugins update` は、`plugins.installs` で追跡される npm インストールに対してのみ機能します。
保存されている整合性メタデータが更新間で変更されると、OpenClaw は警告を発し、確認を求めます (プロンプトをバイパスするには、グローバル `--yes` を使用します)。プラグインは独自の最上位コマンドを登録することもできます (例: `openclaw voicecall`)。

## プラグイン API (概要)

プラグインは次のいずれかをエクスポートします。

- 関数: `(api) => { ... }`
- オブジェクト: `{ id, name, configSchema, register(api) { ... } }`

コンテキスト エンジン プラグインは、ランタイム所有のコンテキスト マネージャーを登録することもできます。

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

次に、設定でそれを有効にします。

```json5
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw",
    },
  },
}
```

## プラグインフック

プラグインは実行時にフックを登録できます。これにより、プラグインがイベント駆動型でバンドルできるようになります。
個別のフック パックをインストールすることなく自動化できます。

### 例

```ts
export default function register(api) {
  api.registerHook(
    "command:new",
    async () => {
      // Hook logic here.
    },
    {
      name: "my-plugin.command-new",
      description: "Runs when /new is invoked",
    },
  );
}
```

注:

- `api.registerHook(...)` を介してフックを明示的に登録します。
- フック適格性ルールは引き続き適用されます (OS/bins/env/config 要件)。
- プラグイン管理のフックは `openclaw hooks list` と `plugin:<id>` に表示されます。
- `openclaw hooks` を介してプラグイン管理のフックを有効/無効にすることはできません。代わりにプラグインを有効/無効にします。

### エージェントのライフサイクル フック (`api.on`)

型指定されたランタイム ライフサイクル フックの場合は、`api.on(...)` を使用します。

```ts
export default function register(api) {
  api.on(
    "before_prompt_build",
    (event, ctx) => {
      return {
        prependSystemContext: "Follow company style guide.",
      };
    },
    { priority: 10 },
  );
}
```

迅速な構築のための重要なフック:

- `before_model_resolve`: セッションのロード前に実行されます (`messages` は使用できません)。これを使用して、`modelOverride` または `providerOverride` を決定的にオーバーライドします。
- `before_prompt_build`: セッションのロード後に実行されます (`messages` が利用可能です)。これを使用してプロンプト入力を整形します。
- `before_agent_start`: 従来の互換性フック。上記の 2 つの明示的なフックを推奨します。

コア強制フックポリシー:- オペレーターは、`plugins.entries.<id>.hooks.allowPromptInjection: false` を介してプラグインごとにプロンプ​​ト変更フックを無効にすることができます。

- 無効にすると、OpenClaw は `before_prompt_build` をブロックし、従来の `modelOverride` および `providerOverride` を保持しながら、従来の `before_agent_start` から返されたプロンプト変更フィールドを無視します。

`before_prompt_build` 結果フィールド:

- `prependContext`: この実行のユーザー プロンプトの先頭にテキストを追加します。ターン固有のコンテンツや動的なコンテンツに最適です。
- `systemPrompt`: 完全なシステム プロンプト オーバーライド。
- `prependSystemContext`: 現在のシステム プロンプトの先頭にテキストを追加します。
- `appendSystemContext`: 現在のシステム プロンプトにテキストを追加します。

組み込みランタイムでのビルド順序のプロンプト:

1. `prependContext` をユーザー プロンプトに適用します。
2. `systemPrompt` オーバーライドが指定されている場合は、それを適用します。
3. `prependSystemContext + current system prompt + appendSystemContext` を適用します。

マージと優先順位の注意事項:

- フック ハンドラーは優先順位に従って実行されます (高い順)。
- マージされたコンテキスト フィールドの場合、値は実行順序で連結されます。
- `before_prompt_build` 値は、従来の `before_agent_start` フォールバック値の前に適用されます。

移行ガイダンス:

- プロバイダーが安定したシステム プレフィックス コンテンツをキャッシュできるように、静的ガイダンスを `prependContext` から `prependSystemContext` (または `appendSystemContext`) に移動します。
- ユーザー メッセージに関連付けられたままにするターンごとの動的コンテキスト用に `prependContext` を保持します。

## プロバイダープラグイン (モデル認証)プラグインは **モデル プロバイダー認証** フローを登録できるため、ユーザーは OAuth または

OpenClaw 内での API キーのセットアップ (外部スクリプトは必要ありません)。

`api.registerProvider(...)` を通じてプロバイダーを登録します。各プロバイダーは 1 つを公開します
または複数の認証方法 (OAuth、API キー、デバイス コードなど)。これらのメソッドにより次のことが可能になります。

- `openclaw models auth login --provider <id> [--method <id>]`

例:

```ts
api.registerProvider({
  id: "acme",
  label: "AcmeAI",
  auth: [
    {
      id: "oauth",
      label: "OAuth",
      kind: "oauth",
      run: async (ctx) => {
        // Run OAuth flow and return auth profiles.
        return {
          profiles: [
            {
              profileId: "acme:default",
              credential: {
                type: "oauth",
                provider: "acme",
                access: "...",
                refresh: "...",
                expires: Date.now() + 3600 * 1000,
              },
            },
          ],
          defaultModel: "acme/opus-1",
        };
      },
    },
  ],
});
```

注:

- `run` は、`prompter`、`runtime` を含む `ProviderAuthContext` を受け取ります。
  `openUrl` および `oauth.createVpsAwareHandlers` ヘルパー。
- デフォルトのモデルまたはプロバイダー構成を追加する必要がある場合は、`configPatch` を返します。
- `--set-default` がエージェントのデフォルトを更新できるように、`defaultModel` を返します。

### メッセージング チャネルを登録する

プラグインは、組み込みチャンネルのように動作する **チャンネル プラグイン** を登録できます
(WhatsApp、電報など)。チャネル構成は `channels.<id>` の下にあり、
チャンネルプラグインコードによって検証されます。

```ts
const myChannel = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "demo channel plugin.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? {
        accountId,
      },
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async () => ({ ok: true }),
  },
};

export default function (api) {
  api.registerChannel({ plugin: myChannel });
}
```

注:

- 構成を `channels.<id>` (`plugins.entries` ではありません) の下に置きます。
- `meta.label` は、CLI/UI リストのラベルに使用されます。
- `meta.aliases` は、正規化および CLI 入力用の代替 ID を追加します。
- `meta.preferOver` は、両方が設定されている場合に自動有効化をスキップするチャネル ID をリストします。
- `meta.detailLabel` および `meta.systemImage` により、UI に豊富なチャンネル ラベル/アイコンが表示されます。

### チャネルオンボーディングフック

チャネル プラグインは、`plugin.onboarding` でオプションのオンボーディング フックを定義できます。- `configure(ctx)` は、ベースラインのセットアップ フローです。

- `configureInteractive(ctx)` は、構成済み状態と未構成状態の両方の対話型セットアップを完全に所有できます。
- `configureWhenConfigured(ctx)` は、すでに構成されているチャネルの動作のみをオーバーライドできます。

ウィザードでのフックの優先順位:

1. `configureInteractive` (存在する場合)
2. `configureWhenConfigured` (チャネルステータスがすでに構成されている場合のみ)
3. `configure` へのフォールバック

コンテキストの詳細:

- `configureInteractive` および `configureWhenConfigured` は以下を受け取ります。
  - `configured` (`true` または `false`)
  - `label` (プロンプトで使用されるユーザー向けチャネル名)
  - 共有設定/ランタイム/プロンプター/オプション フィールドに加えて
- `"skip"` を返すと、選択とアカウント追跡は変更されません。
- `{ cfg, accountId? }` を返すと、構成の更新が適用され、アカウントの選択が記録されます。

### 新しいメッセージング チャネルを作成する (ステップバイステップ)

モデル プロバイダーではなく、**新しいチャット サーフェス** (「メッセージング チャネル」) が必要な場合にこれを使用します。
モデル プロバイダーのドキュメントは `/providers/*` の下にあります。

1. ID と構成の形状を選択します

- すべてのチャネル構成は `channels.<id>` の下に存在します。
- マルチアカウント設定には `channels.<id>.accounts.<accountId>` を推奨します。

2. チャネルメタデータを定義する- `meta.label`、`meta.selectionLabel`、`meta.docsPath`、`meta.blurb` は CLI/UI リストを制御します。

- `meta.docsPath` は、`/channels/<id>` のようなドキュメント ページを指す必要があります。
- `meta.preferOver` により、プラグインが別のチャンネルを置き換えることができます (自動有効化が優先されます)。
- `meta.detailLabel` および `meta.systemImage` は、詳細テキスト/アイコンの UI によって使用されます。

3. 必要なアダプターを実装する

- `config.listAccountIds` + `config.resolveAccount`
- `capabilities` (チャットの種類、メディア、スレッドなど)
- `outbound.deliveryMode` + `outbound.sendText` (基本送信用)

4. 必要に応じてオプションのアダプターを追加します

- `setup` (ウィザード)、`security` (DM ポリシー)、`status` (ヘルス/診断)
- `gateway` (開始/停止/ログイン)、`mentions`、`threading`、`streaming`
- `actions` (メッセージ アクション)、`commands` (ネイティブ コマンド動作)

5. プラグインにチャンネルを登録します

- `api.registerChannel({ plugin })`

最小限の構成例:

```json5
{
  channels: {
    acmechat: {
      accounts: {
        default: { token: "ACME_TOKEN", enabled: true },
      },
    },
  },
}
```

最小限のチャネル プラグイン (アウトバウンドのみ):

```ts
const plugin = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "AcmeChat messaging channel.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? {
        accountId,
      },
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async ({ text }) => {
      // deliver `text` to your channel here
      return { ok: true };
    },
  },
};

export default function (api) {
  api.registerChannel({ plugin });
}
```

プラグイン (拡張子ディレクトリまたは `plugins.load.paths`) をロードし、ゲートウェイを再起動します。
次に、構成で `channels.<id>` を構成します。

### エージェントツール

専用ガイドを参照してください: [プラグイン エージェント ツール](/plugins/agent-tools)。

### ゲートウェイ RPC メソッドを登録する

```ts
export default function (api) {
  api.registerGatewayMethod("myplugin.status", ({ respond }) => {
    respond(true, { ok: true });
  });
}
```

### CLI コマンドを登録する

```ts
export default function (api) {
  api.registerCli(
    ({ program }) => {
      program.command("mycmd").action(() => {
        console.log("Hello");
      });
    },
    { commands: ["mycmd"] },
  );
}
```

### 自動応答コマンドを登録するプラグインは、\*\* を呼び出さずに実行するカスタム スラッシュ コマンドを登録できます

AI エージェント\*\*。これは、コマンドの切り替え、ステータス チェック、またはクイック アクションに便利です。
LLM 処理は必要ありません。

```ts
export default function (api) {
  api.registerCommand({
    name: "mystatus",
    description: "Show plugin status",
    handler: (ctx) => ({
      text: `Plugin is running! Channel: ${ctx.channel}`,
    }),
  });
}
```

コマンドハンドラーコンテキスト:

- `senderId`: 送信者の ID (利用可能な場合)
- `channel`: コマンドが送信されたチャネル
- `isAuthorizedSender`: 送信者が承認されたユーザーかどうか
- `args`: コマンドの後に渡される引数 (`acceptsArgs: true` の場合)
- `commandBody`: コマンドの全文
- `config`: 現在の OpenClaw 構成

コマンドオプション:

- `name`: コマンド名 (先頭の `/` を除く)
- `nativeNames`: スラッシュ/メニュー サーフェイスのオプションのネイティブ コマンド エイリアス。すべてのネイティブ プロバイダーには `default` を使用するか、`discord` のようなプロバイダー固有のキーを使用します。
- `description`: コマンド リストに表示されるヘルプ テキスト
- `acceptsArgs`: コマンドが引数を受け入れるかどうか (デフォルト: false)。 false で引数が指定されている場合、コマンドは一致せず、メッセージは他のハンドラーに渡されます。
- `requireAuth`: 承認された送信者を要求するかどうか (デフォルト: true)
- `handler`: `{ text: string }` を返す関数 (非同期可能)

認可と引数を使用した例:

```ts
api.registerCommand({
  name: "setmode",
  description: "Set plugin mode",
  acceptsArgs: true,
  requireAuth: true,
  handler: async (ctx) => {
    const mode = ctx.args?.trim() || "default";
    await saveMode(mode);
    return { text: `Mode set to: ${mode}` };
  },
});
```

注:- プラグイン コマンドは、組み込みコマンドと AI エージェントより **前** に処理されます。

- コマンドはグローバルに登録され、すべてのチャネルで機能します
- コマンド名は大文字と小文字を区別しません (`/MyStatus` は `/mystatus` と一致します)
- コマンド名は文字で始まり、文字、数字、ハイフン、アンダースコアのみを含む必要があります
- 予約されたコマンド名 (`help`、`status`、`reset` など) はプラグインによってオーバーライドできません
- プラグイン間でコマンドを重複して登録すると、診断エラーが発生して失敗します。

### バックグラウンド サービスを登録する

```ts
export default function (api) {
  api.registerService({
    id: "my-service",
    start: () => api.logger.info("ready"),
    stop: () => api.logger.info("bye"),
  });
}
```

## 命名規則

- ゲートウェイメソッド: `pluginId.action` (例: `voicecall.status`)
- ツール: `snake_case` (例: `voice_call`)
- CLI コマンド: kebab または Camel、ただしコア コマンドとの衝突を避ける

## スキル

プラグインはリポジトリ (`skills/<name>/SKILL.md`) でスキルを出荷できます。
`plugins.entries.<id>.enabled` (または他の構成ゲート) でそれを有効にし、
ワークスペース/マネージド スキルの場所に存在します。

## 配布 (npm)

推奨梱包:

- メインパッケージ: `openclaw` (このリポジトリ)
- プラグイン: `@openclaw/*` の下の個別の npm パッケージ (例: `@openclaw/voice-call`)

出版契約：- プラグイン `package.json` には、1 つ以上のエントリ ファイルを含む `openclaw.extensions` が含まれている必要があります。

- エントリ ファイルは `.js` または `.ts` です (jiti は実行時に TS をロードします)。
- `openclaw plugins install <npm-spec>` は `npm pack` を使用し、`~/.openclaw/extensions/<id>/` に抽出し、構成で有効にします。
- 構成キーの安定性: スコープ付きパッケージは、`plugins.entries.*` の **スコープ外** ID に正規化されます。

## プラグインの例: 音声通話

このリポジトリには、音声通話プラグイン (Twilio またはログ フォールバック) が含まれています。

- 出典: `extensions/voice-call`
- スキル: `skills/voice-call`
- CLI: `openclaw voicecall start|status`
- ツール: `voice_call`
- RPC: `voicecall.start`、`voicecall.status`
- 構成 (twilio): `provider: "twilio"` + `twilio.accountSid/authToken/from` (オプションの `statusCallbackUrl`、`twimlUrl`)
- 構成 (開発): `provider: "log"` (ネットワークなし)

セットアップと使用方法については、[音声通話](/plugins/voice-call) および `extensions/voice-call/README.md` を参照してください。

## 安全上の注意事項

プラグインはゲートウェイとインプロセスで実行されます。それらを信頼できるコードとして扱います。

- 信頼できるプラグインのみをインストールしてください。
- `plugins.allow` 許可リストを優先します。
- 変更後にゲートウェイを再起動します。

## プラグインのテスト

プラグインはテストを配布できます (そしてそうすべきです):

- リポジトリ内プラグインは、Vitest テストを `src/**` の下に保持できます (例: `src/plugins/voice-call.plugin.test.ts`)。
- 別途公開されたプラグインは、独自の CI (lint/build/test) を実行し、ビルドされたエントリポイント (`dist/index.js`) で `openclaw.extensions` ポイントを検証する必要があります。
