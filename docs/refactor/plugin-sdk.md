---
summary: "計画: すべてのメッセージング コネクタ用の 1 つのクリーンなプラグイン SDK + ランタイム"
read_when:
  - プラグイン アーキテクチャの定義またはリファクタリング
  - チャネル コネクタをプラグイン SDK/ランタイムに移行する
title: "プラグイン SDK リファクタリング"
x-i18n:
  source_hash: "b9247cf0c555170862b2ed97ffba0f787fe15d176893bfe8f4bd38f4e94a87c9"
---
目標: すべてのメッセージング コネクタは、1 つの安定した API を使用するプラグイン (バンドルまたは外部) です。
`src/**` から直接インポートするプラグインはありません。すべての依存関係は SDK またはランタイムを経由します。

## なぜ今なのか

- 現在のコネクタには、直接コア インポート、dist 専用ブリッジ、カスタム ヘルパーなどのパターンが混在しています。
- これにより、アップグレードが脆弱になり、きれいな外部プラグインの表面がブロックされます。

## ターゲット アーキテクチャ (2 層)

### 1) プラグイン SDK (コンパイル時、安定、公開可能)

範囲: タイプ、ヘルパー、構成ユーティリティ。実行時の状態や副作用はありません。

内容（例）：

- タイプ: `ChannelPlugin`、アダプター、`ChannelMeta`、`ChannelCapabilities`、`ChannelDirectoryEntry`。
- 構成ヘルパー: `buildChannelConfigSchema`、`setAccountEnabledInConfigSection`、`deleteAccountFromConfigSection`、
  `applyAccountNameToChannelSection`。
- ペアリング ヘルパー: `PAIRING_APPROVED_MESSAGE`、`formatPairingApproveHint`。
- オンボーディング ヘルパー: `promptChannelAccessConfig`、`addWildcardAllowFrom`、オンボーディング タイプ。
- ツールパラメータヘルパー: `createActionGate`、`readStringParam`、`readNumberParam`、`readReactionParams`、`jsonResult`。
- ドキュメント リンク ヘルパー: `formatDocsLink`。

配送:

- `openclaw/plugin-sdk` として公開します (または `openclaw/plugin-sdk` の下のコアからエクスポートします)。
- 明示的な安定性を保証する Semver。

### 2) プラグイン ランタイム (実行サーフェス、注入)

範囲: コアのランタイム動作に関わるすべて。
`OpenClawPluginApi.runtime` 経由でアクセスされるため、プラグインは `src/**` をインポートしません。提案されたサーフェス (最小限だが完全):

```ts
export type PluginRuntime = {
  channel: {
    text: {
      chunkMarkdownText(text: string, limit: number): string[];
      resolveTextChunkLimit(cfg: OpenClawConfig, channel: string, accountId?: string): number;
      hasControlCommand(text: string, cfg: OpenClawConfig): boolean;
    };
    reply: {
      dispatchReplyWithBufferedBlockDispatcher(params: {
        ctx: unknown;
        cfg: unknown;
        dispatcherOptions: {
          deliver: (payload: {
            text?: string;
            mediaUrls?: string[];
            mediaUrl?: string;
          }) => void | Promise<void>;
          onError?: (err: unknown, info: { kind: string }) => void;
        };
      }): Promise<void>;
      createReplyDispatcherWithTyping?: unknown; // adapter for Teams-style flows
    };
    routing: {
      resolveAgentRoute(params: {
        cfg: unknown;
        channel: string;
        accountId: string;
        peer: { kind: RoutePeerKind; id: string };
      }): { sessionKey: string; accountId: string };
    };
    pairing: {
      buildPairingReply(params: { channel: string; idLine: string; code: string }): string;
      readAllowFromStore(channel: string): Promise<string[]>;
      upsertPairingRequest(params: {
        channel: string;
        id: string;
        meta?: { name?: string };
      }): Promise<{ code: string; created: boolean }>;
    };
    media: {
      fetchRemoteMedia(params: { url: string }): Promise<{ buffer: Buffer; contentType?: string }>;
      saveMediaBuffer(
        buffer: Uint8Array,
        contentType: string | undefined,
        direction: "inbound" | "outbound",
        maxBytes: number,
      ): Promise<{ path: string; contentType?: string }>;
    };
    mentions: {
      buildMentionRegexes(cfg: OpenClawConfig, agentId?: string): RegExp[];
      matchesMentionPatterns(text: string, regexes: RegExp[]): boolean;
    };
    groups: {
      resolveGroupPolicy(
        cfg: OpenClawConfig,
        channel: string,
        accountId: string,
        groupId: string,
      ): {
        allowlistEnabled: boolean;
        allowed: boolean;
        groupConfig?: unknown;
        defaultConfig?: unknown;
      };
      resolveRequireMention(
        cfg: OpenClawConfig,
        channel: string,
        accountId: string,
        groupId: string,
        override?: boolean,
      ): boolean;
    };
    debounce: {
      createInboundDebouncer<T>(opts: {
        debounceMs: number;
        buildKey: (v: T) => string | null;
        shouldDebounce: (v: T) => boolean;
        onFlush: (entries: T[]) => Promise<void>;
        onError?: (err: unknown) => void;
      }): { push: (v: T) => void; flush: () => Promise<void> };
      resolveInboundDebounceMs(cfg: OpenClawConfig, channel: string): number;
    };
    commands: {
      resolveCommandAuthorizedFromAuthorizers(params: {
        useAccessGroups: boolean;
        authorizers: Array<{ configured: boolean; allowed: boolean }>;
      }): boolean;
    };
  };
  logging: {
    shouldLogVerbose(): boolean;
    getChildLogger(name: string): PluginLogger;
  };
  state: {
    resolveStateDir(cfg: OpenClawConfig): string;
  };
};
```

注:

- ランタイムは、コア動作にアクセスする唯一の方法です。
- SDK は意図的に小さく安定しています。
- 各ランタイム メソッドは既存のコア実装にマップされます (重複なし)。

## 移行計画 (段階的、安全)

### フェーズ 0: 足場

- `openclaw/plugin-sdk` を導入します。
- 上のサーフェスを使用して `api.runtime` を `OpenClawPluginApi` に追加します。
- 移行期間中に既存のインポートを維持します (非推奨の警告)。

### フェーズ 1: 橋の清掃 (低リスク)

- 拡張子ごとの `core-bridge.ts` を `api.runtime` に置き換えます。
- BlueBubbles、Zalo、Zalo Personal を最初に移行します (すでに終了しています)。
- 重複したブリッジコードを削除します。

### フェーズ 2: ライトの直接インポート プラグイン

- Matrix を SDK + ランタイムに移行します。
- オンボーディング、ディレクトリ、グループメンションロジックを検証します。

### フェーズ 3: 大量の直接インポート プラグイン

- MS Teams (ランタイム ヘルパーの最大のセット) を移行します。
- 返信/入力セマンティクスが現在の動作と一致していることを確認します。

### フェーズ 4: iMessage プラグイン化

- iMessage を `extensions/imessage` に移動します。
- 直接のコア呼び出しを `api.runtime` に置き換えます。
- 設定キー、CLI 動作、およびドキュメントをそのままの状態に保ちます。

### フェーズ 5: 施行

- lint ルール/CI チェックを追加: `extensions/**` は `src/**` からインポートされません。
- プラグイン SDK/バージョン互換性チェックを追加 (ランタイム + SDK サーバー)。

## 互換性とバージョン管理- SDK: semver、公開され、文書化された変更

- ランタイム: コア リリースごとにバージョン管理されます。 `api.runtime.version` を追加します。
- プラグインは必要なランタイム範囲を宣言します (例: `openclawRuntime: ">=2026.2.0"`)。

## テスト戦略

- アダプターレベルの単体テスト (実際のコア実装で実行されるランタイム機能)。
- プラグインごとのゴールデン テスト: 動作のドリフトがないことを確認します (ルーティング、ペアリング、ホワイトリスト、メンション ゲート)。
- CI で使用される単一のエンドツーエンドのプラグイン サンプル (インストール + 実行 + スモーク)。

## 未解決の質問

- SDK タイプをどこでホストするか: 個別のパッケージまたはコアのエクスポート?
- ランタイム型の配布: SDK (型のみ) またはコアで?
- バンドルされたプラグインと外部プラグインのドキュメント リンクを公開するにはどうすればよいですか?
- 移行中にリポジトリ内プラグインの限定的な直接コア インポートを許可しますか?

## 成功基準

- すべてのチャネル コネクタは SDK + ランタイムを使用したプラグインです。
- `extensions/**` は `src/**` からインポートされません。
- 新しいコネクタ テンプレートは、SDK + ランタイムにのみ依存します。
- 外部プラグインは、コア ソースにアクセスせずに開発および更新できます。

関連ドキュメント: [プラグイン](/tools/plugin)、[チャネル](/channels/index)、[構成](/gateway/configuration)。
