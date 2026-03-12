---
title: "OpenClaw差分表示ツールの見方と活用ポイントガイド"
summary: "エージェント用の読み取り専用の差分ビューアとファイル レンダラー (オプションのプラグイン ツール)"
description: "差分の数 diffs は、短い組み込みシステム ガイダンスと、変更内容をエージェント向けの読み取り専用の差分アーティファクトに変換するコンパニオン スキルを備えたオプションのプラグイン ツールです。"
read_when:
  - エージェントにコードまたはマークダウンの編集内容を差分として表示したい
  - キャンバス対応のビューア URL またはレンダリングされた diff ファイルが必要な場合
  - 安全なデフォルトを備えた、制御された一時的な diff アーティファクトが必要です
x-i18n:
  source_hash: "ef3b7a0fb4c20da0eef5f8d7f44668d979486a5a3d648d4abccd09388c69eea0"
---
差分の数

`diffs` は、短い組み込みシステム ガイダンスと、変更内容をエージェント向けの読み取り専用の差分アーティファクトに変換するコンパニオン スキルを備えたオプションのプラグイン ツールです。

次のいずれかを受け入れます。

- `before` および `after` テキスト
- 統一された `patch`

以下を返すことができます:

- キャンバス プレゼンテーション用のゲートウェイ ビューア URL
- メッセージ配信用にレンダリングされたファイル パス (PNG または PDF)
- 1 回の呼び出しで両方の出力

プラグインを有効にすると、システム プロンプト領域に簡潔な使用方法のガイダンスが追加され、エージェントがより詳細な指示を必要とする場合に備えて詳細なスキルも公開されます。

## クイックスタート

1. プラグインを有効にします。
2. キャンバスファーストフローの場合は、`diffs` を `mode: "view"` とともに呼び出します。
3. チャット ファイル配信フローのために、`diffs` を `mode: "file"` とともに呼び出します。
4. 両方のアーティファクトが必要な場合は、`diffs` を `mode: "both"` とともに呼び出します。

## プラグインを有効にする

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
      },
    },
  },
}
```

## 組み込みのシステム ガイダンスを無効にする

`diffs` ツールを有効にしたまま、組み込みのシステム プロンプト ガイダンスを無効にする場合は、 `plugins.entries.diffs.hooks.allowPromptInjection` を `false` に設定します。

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

これにより、プラグイン、ツール、およびコンパニオン スキルを利用可能な状態に保ちながら、diffs プラグインの `before_prompt_build` フックがブロックされます。

ガイダンスとツールの両方を無効にしたい場合は、代わりにプラグインを無効にしてください。

## 一般的なエージェントのワークフロー1. エージェントが `diffs` に電話します

2. エージェントは `details` フィールドを読み取ります。
3. エージェントは次のいずれかを行います。
   - `details.viewerUrl` を `canvas present` で開きます
   - `path` または `filePath` を使用して、`details.filePath` を `message` とともに送信します
   - 両方を行います

## 入力例

前後:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

パッチ:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## ツール入力リファレンス

注記がない限り、すべてのフィールドはオプションです。- `before` (`string`): オリジナルのテキスト。 `patch` が省略された場合は、`after` で必須です。

- `after` (`string`): テキストを更新しました。 `patch` が省略された場合は、`before` で必須です。
- `patch` (`string`): 統合された差分テキスト。 `before` および `after` とは相互に排他的です。
- `path` (`string`): モード前後のファイル名を表示します。
- `lang` (`string`): モードの前後の言語オーバーライドのヒント。
- `title` (`string`): ビューアのタイトルの上書き。
- `mode` (`"view" | "file" | "both"`): 出力モード。デフォルトはプラグインのデフォルト `defaults.mode` です。
- `theme` (`"light" | "dark"`): ビューアのテーマ。デフォルトはプラグインのデフォルト `defaults.theme` です。
- `layout` (`"unified" | "split"`): 差分レイアウト。デフォルトはプラグインのデフォルト `defaults.layout` です。
- `expandUnchanged` (`boolean`): 完全なコンテキストが利用可能な場合、未変更のセクションを展開します。呼び出しごとのオプションのみ (プラグインのデフォルト キーではありません)。
- `fileFormat` (`"png" | "pdf"`): レンダリングされたファイル形式。デフォルトはプラグインのデフォルト `defaults.fileFormat` です。
- `fileQuality` (`"standard" | "hq" | "print"`): PNG または PDF レンダリング用の品質プリセット。
- `fileScale` (`number`): デバイス スケール オーバーライド (`1`-`4`)。- `fileMaxWidth` (`number`): CSS ピクセル単位の最大レンダリング幅 (`640`-`2400`)。
- `ttlSeconds` (`number`): 秒単位のビューア アーティファクト TTL。デフォルトは 1800、最大は 21600。
- `baseUrl` (`string`): ビューア URL オリジン オーバーライド。 `http` または `https` である必要があり、クエリ/ハッシュはありません。

検証と制限:

- `before` および `after` はそれぞれ最大 512 KiB。
- `patch` 最大 2 MiB。
- `path` 最大 2048 バイト。
- `lang` 最大 128 バイト。
- `title` 最大 1024 バイト。
- パッチの複雑さの上限: 最大 128 ファイル、合計 120,000 行。
- `patch` と `before` または `after` は一緒に拒否されます。
- レンダリングされたファイルの安全制限 (PNG および PDF に適用):
  - `fileQuality: "standard"`: 最大 8 MP (8,000,000 レンダリング ピクセル)。
  - `fileQuality: "hq"`: 最大 14 MP (レンダリング ピクセル 14,000,000)。
  - `fileQuality: "print"`: 最大 24 MP (24,000,000 レンダリング ピクセル)。
  - PDF も最大 50 ページです。

## 詳細コントラクトを出力します

このツールは、`details` の下に構造化メタデータを返します。

ビューアを作成するモードの共有フィールド:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`

PNG または PDF がレンダリングされるときのファイル フィールド:- `filePath`

- `path` (メッセージ ツールの互換性のため、`filePath` と同じ値)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

モード動作の概要:

- `mode: "view"`: ビューア フィールドのみ。
- `mode: "file"`: ファイル フィールドのみ。ビューア アーティファクトなし。
- `mode: "both"`: ビューア フィールドとファイル フィールド。ファイルのレンダリングが失敗した場合でも、ビューアは `fileError` を返します。

## 未変更のセクションを折りたたんだ

- ビューアは `N unmodified lines` のような行を表示できます。
- これらの行の展開コントロールは条件付きであり、すべての入力種類に対して保証されているわけではありません。
- レンダリングされた差分に展開可能なコンテキスト データがある場合、展開コントロールが表示されます。これは入力の前後で一般的です。
- 多くの統合パッチ入力では、解析されたパッチ ハンクでは省略されたコンテキスト本体を使用できないため、展開コントロールなしで行が表示されることがあります。これは予期された動作です。
- `expandUnchanged` は、拡張可能なコンテキストが存在する場合にのみ適用されます。

## プラグインのデフォルト

`~/.openclaw/openclaw.json` でプラグイン全体のデフォルトを設定します。

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

サポートされているデフォルト:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

明示的なツール パラメータはこれらのデフォルトをオーバーライドします。## セキュリティ構成

- `security.allowRemoteViewer` (`boolean`、デフォルト `false`)
  - `false`: ビューア ルートへの非ループバック リクエストは拒否されます。
  - `true`: トークン化されたパスが有効な場合、リモート ビューアが許可されます。

例:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## アーティファクトのライフサイクルとストレージ

- アーティファクトは、temp サブフォルダー `$TMPDIR/openclaw-diffs` に保存されます。
- ビューア アーティファクト メタデータには次のものが含まれます。
  - ランダムなアーティファクト ID (20 の 16 進数文字)
  - ランダムなトークン (48 個の 16 進数文字)
  - `createdAt` および `expiresAt`
  - 保存された `viewer.html` パス
- デフォルトのビューア TTL は、指定されていない場合は 30 分です。
- 受け入れられる最大視聴者 TTL は 6 時間です。
- クリーンアップはアーティファクトの作成後に都合よく実行されます。
- 期限切れのアーティファクトは削除されます。
- フォールバック クリーンアップは、メタデータが欠落している場合に 24 時間以上経過した古いフォルダーを削除します。

## ビューアの URL とネットワークの動作

視聴ルート:

- `/plugins/diffs/view/{artifactId}/{token}`

ビューアアセット:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

URL 構築動作:

- `baseUrl` が指定された場合は、厳密な検証後に使用されます。
- `baseUrl` を使用しない場合、ビューア URL はデフォルトでループバック `127.0.0.1` になります。
- ゲートウェイ バインド モードが `custom` で、`gateway.customBindHost` が設定されている場合、そのホストが使用されます。

`baseUrl` ルール:

- `http://` または `https://` である必要があります。
- クエリとハッシュは拒否されます。
- 原点とオプションのベース パスが許可されます。

## セキュリティモデルビューアの強化

- デフォルトではループバックのみ。
- 厳密な ID とトークンの検証によるトークン化されたビューア パス。
- 視聴者の応答 CSP:
  - `default-src 'none'`
  - 自分自身からのみのスクリプトとアセット
  - アウトバウンドなし `connect-src`
- リモート アクセスが有効な場合のリモート ミス スロットル:
  - 60 秒あたり 40 回の失敗
  - 60 秒のロックアウト (`429 Too Many Requests`)

ファイルレンダリングの強化:

- スクリーンショット ブラウザのリクエスト ルーティングはデフォルトで拒否されます。
- `http://127.0.0.1/plugins/diffs/assets/*` のローカル ビューア アセットのみが許可されます。
- 外部ネットワーク要求はブロックされます。

## ファイルモードのブラウザ要件

`mode: "file"` および `mode: "both"` には、Chromium 互換のブラウザが必要です。

解決順序:

1. OpenClaw 構成の `browser.executablePath`。
2. 環境変数:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. プラットフォーム コマンド/パス検出フォールバック。

よくある失敗テキスト:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome、Chromium、Edge、または Brave をインストールするか、上記の実行可能パス オプションのいずれかを設定することで修正します。

## トラブルシューティング

入力検証エラー:

- `Provide patch or both before and after text.`
  - `before` と `after` の両方を含めるか、`patch` を指定します。
- `Provide either patch or before/after input, not both.`
  - 入力モードを混在させないでください。
- `Invalid baseUrl: ...`
  - `http(s)` オリジンをオプションのパスとともに使用し、クエリ/ハッシュは使用しません。
- `{field} exceeds maximum size (...)`
  - ペイロードサイズを削減します。
- 大きなパッチ拒否
  - パッチファイルの数または総行数を減らします。ビューアのアクセシビリティの問題:

- ビューア URL はデフォルトで `127.0.0.1` に解決されます。
- リモート アクセス シナリオの場合は、次のいずれかを実行します。
  - ツール呼び出しごとに `baseUrl` を渡す、または
  - `gateway.bind=custom` および `gateway.customBindHost` を使用します
- 外部ビューア アクセスを目的とする場合にのみ、`security.allowRemoteViewer` を有効にします。

未変更行の行には展開ボタンがありません。

- これは、パッチが展開可能なコンテキストを持たないパッチ入力で発生する可能性があります。
- これは予期されたものであり、ビューアの障害を示すものではありません。

アーティファクトが見つかりません:

- TTL によりアーティファクトの有効期限が切れました。
- トークンまたはパスが変更されました。
- クリーンアップにより古いデータが削除されました。

## 操作ガイド

- キャンバスでのローカルのインタラクティブなレビューには `mode: "view"` を優先します。
- 添付ファイルが必要なアウトバウンド チャット チャネルには `mode: "file"` を優先します。
- 展開でリモート ビューア URL が必要な場合を除き、`allowRemoteViewer` を無効にしておきます。
- 機密差分には明示的な短い `ttlSeconds` を設定します。
- 必要がない場合は、差分入力でシークレットを送信しないようにします。
- チャネルが画像を積極的に圧縮する場合 (Telegram や WhatsApp など)、PDF 出力 (`fileFormat: "pdf"`) を優先します。

差分レンダリング エンジン:

- [差分](https://diffs.com) を利用しています。

## 関連ドキュメント

- [ツールの概要](/tools)
- [プラグイン](/tools/plugin)
- [ブラウザ](/tools/browser)
