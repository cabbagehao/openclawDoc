---
summary: "テストをローカルで実行する方法 (vitest)、および強制/カバレッジ モードをいつ使用するか"
read_when:
  - テストの実行または修正
title: "テスト"
x-i18n:
  source_hash: "c98456042ff6ff4ba0773cb461fa85beae69864b65d41f546e0b488f60d98c26"
---

# テスト

* 完全なテスト キット (スイート、ライブ、Docker): [テスト](/help/testing)- `pnpm test:force`: デフォルトの制御ポートを保持している残留ゲートウェイ プロセスを強制終了し、分離されたゲートウェイ ポートを使用して完全な Vitest スイートを実行するため、サーバー テストは実行中のインスタンスと衝突しません。以前のゲートウェイ実行によりポート 18789 が占有されたままになっている場合にこれを使用します。
* `pnpm test:coverage`: V8 をカバーするユニット スイートを実行します (`vitest.unit.config.ts` 経由)。グローバルしきい値は 70% の行/分岐/関数/ステートメントです。ターゲットを単体テスト可能なロジックに集中させるため、統合の重要なエントリポイント (CLI 配線、ゲートウェイ/テレグラム ブリッジ、Web チャット静的サーバー) はカバーされません。
* ノード 24+ の `pnpm test`: OpenClaw は Vitest `vmForks` を自動無効にし、`forks` を使用して `ERR_VM_MODULE_LINK_FAILURE` / `module is already linked` を回避します。 `OPENCLAW_TEST_VM_FORKS=0|1` を使用して動作を強制できます。
* `pnpm test`: 迅速なローカル フィードバックのために、デフォルトで高速コア ユニット レーンを実行します。
* `pnpm test:channels`: チャネル負荷の高いスイートを実行します。
* `pnpm test:extensions`: 拡張機能/プラグイン スイートを実行します。
* ゲートウェイ統合: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` 経由でオプトインします。
* `pnpm test:e2e`: ゲートウェイのエンドツーエンドのスモーク テストを実行します (マルチインスタンス WS/HTTP/ノード ペアリング)。デフォルトは `vmForks` + `vitest.e2e.config.ts` のアダプティブ ワーカーです。 `OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログ用に `OPENCLAW_E2E_VERBOSE=1` を設定します。- `pnpm test:live`: プロバイダーのライブ テスト (minimax/zai) を実行します。スキップを解除するには、API キーと `LIVE=1` (またはプロバイダー固有の `*_LIVE_TEST=1`) が必要です。

## ローカル PR ゲート

ローカル PR ランド/ゲート チェックの場合は、次を実行します。

* `pnpm check`
* `pnpm build`
* `pnpm test`
* `pnpm check:docs`

ロードされたホストで `pnpm test` が不安定になった場合は、回帰として扱う前に 1 回再実行し、`pnpm vitest run <path/to/test>` で分離します。メモリに制約のあるホストの場合は、次を使用します。

* `OPENCLAW_TEST_PROFILE=low OPENCLAW_TEST_SERIAL_GATEWAY=1 pnpm test`

## モデル レイテンシ ベンチ (ローカル キー)

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使用法:

* `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
* オプションの環境: `MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
* デフォルトのプロンプト: 「一言で返信してください: ok。句読点や余分なテキストは不要です。」

最終実行 (2025 年 12 月 31 日、20 実行):

* ミニマックス中央値 1279 ミリ秒 (最小 1114、最大 2431)
* 作品の中央値 2454 ミリ秒 (最小 1224、最大 3170)

## CLI 起動ベンチ

スクリプト: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

使用法:

* `pnpm tsx scripts/bench-cli-startup.ts`
* `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
* `pnpm tsx scripts/bench-cli-startup.ts --entry dist/entry.js --timeout-ms 45000`

これは次のコマンドのベンチマークを行います。

* `--version`
* `--help`
* `health --json`
* `status --json`
* `status`

出力には、各コマンドの平均、p50、p95、最小/最大、終了コード/信号分布が含まれます。

## E2E のオンボーディング (Docker)

Docker はオプションです。これは、コンテナ化されたオンボーディングスモークテストの場合にのみ必要です。

クリーンな Linux コンテナーでの完全なコールド スタート フロー:

````bash
scripts/e2e/onboard-docker.sh
```このスクリプトは、擬似 tty 経由で対話型ウィザードを起動し、config/workspace/session ファイルを検証してから、ゲートウェイを起動して `openclaw health` を実行します。

## QRインポートスモーク(Docker)

`qrcode-terminal` が Docker のノード 22+ にロードされるようにします。

```bash
pnpm test:docker:qr
````
