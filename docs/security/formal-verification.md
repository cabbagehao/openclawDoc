---
title: "正式な検証 (セキュリティ モデル)"
seoTitle: "OpenClawの形式検証の考え方とセキュリティモデル確認ガイド"
summary: "OpenClaw の最もリスクの高いパスに対する機械チェックされたセキュリティ モデル。"
read_when:
description: "このページでは、OpenClaw の 正式なセキュリティ モデル (現在は TLA+/TLC、必要に応じて追加) を追跡します。目標 (北極星): OpenClaw が強制するという機械チェックされた引数を提供します。"
permalink: /security/formal-verification/
x-i18n:
  source_hash: "b576c7437f598eba41c3e8c644eac801113437c8292ddddf25df67bac504a576"
---
このページでは、OpenClaw の **正式なセキュリティ モデル** (現在は TLA+/TLC、必要に応じて追加) を追跡します。

> 注: 一部の古いリンクでは、以前のプロジェクト名が参照されている場合があります。

**目標 (北極星):** OpenClaw が強制するという機械チェックされた引数を提供します。
意図したセキュリティ ポリシー (認可、セッション分離、ツール ゲーティング、および
設定ミスの安全性）、明示的な仮定の下で。

**これは (今日の) 内容:** 実行可能な攻撃者主導の **セキュリティ回帰スイート**:

- 各クレームには、有限状態空間に対して実行可能なモデル チェックがあります。
- 多くの主張には、現実的なバグクラスの反例トレースを生成するペアの **否定モデル** が含まれています。

**これは (まだ) そうではない:** 「OpenClaw はあらゆる点で安全である」こと、または完全な TypeScript 実装が正しいことの証明。

## モデルが住んでいる場所

モデルは別のリポジトリ [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models) で維持されます。

## 重要な注意事項

- これらは **モデル** であり、完全な TypeScript 実装ではありません。モデルとコードの間でドリフトが発生する可能性があります。
- 結果は、TLC によって探索された状態空間によって制限されます。 「グリーン」は、モデル化された想定や限界を超えるセキュリティを意味するものではありません。
- 一部の主張は、明示的な環境仮定 (例: 正しい展開、正しい構成入力) に依存しています。

## 結果の再現現在、結果は、モデル リポジトリをローカルに複製し、TLC を実行することで再現されています (下記を参照)。将来の反復では、次のことが可能になる可能性があります

- 公開アーティファクトを含む CI 実行モデル (反例トレース、実行ログ)
- 小規模な限定されたチェックのためのホストされた「このモデルを実行」ワークフロー

はじめに:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### ゲートウェイの露出とオープンゲートウェイの構成ミス

**主張:** 認証なしでループバックを超えるバインディングは、リモートからの侵害を可能にし、危険性を増大させる可能性があります。トークン/パスワードは非認証攻撃者をブロックします (モデルの仮定に従って)。

- 緑のランニング:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- 赤 (予想):
  - `make gateway-exposure-v2-negative`

モデル リポジトリの `docs/gateway-exposure-matrix.md` も参照してください。

### Nodes.run パイプライン (最もリスクの高い機能)

**主張:** `nodes.run` には、(a) ノード コマンド許可リストと宣言されたコマンド、および (b) 構成時のライブ承認が必要です。承認は (モデル内で) 再実行を防ぐためにトークン化されます。

- 緑のランニング:
  - `make nodes-pipeline`
  - `make approvals-token`
- 赤 (予想):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### ペアリングストア (DM ゲーティング)

**主張:** ペアリング リクエストは TTL と保留中のリクエストの上限を尊重します。

- 緑のランニング:
  - `make pairing`
  - `make pairing-cap`
- 赤 (予想):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### イングレス ゲート (メンション + コントロール コマンド バイパス)**主張:** メンションが必要なグループコンテキストでは、未承認の「制御コマンド」はメンションゲートをバイパスできません

- 緑:
  - `make ingress-gating`
- 赤 (予想):
  - `make ingress-gating-negative`

### ルーティング/セッションキーの分離

**主張:** 明示的にリンク/設定されていない限り、異なるピアからの DM は同じセッションに組み込まれません。

- 緑:
  - `make routing-isolation`
- 赤 (予想):
  - `make routing-isolation-negative`

## v1++: 追加の制限付きモデル (同時実行性、再試行、トレースの正確性)

これらは、現実世界の障害モード (非アトミック更新、再試行、メッセージ ファンアウト) の忠実度を強化する後続モデルです。

### ペアリングストアの同時実行性/冪等性

**主張:** ペアリング ストアは、インターリーブ下でも `MaxPending` と冪等性を強制する必要があります (つまり、「チェックしてから書き込み」はアトミック / ロックされている必要があり、リフレッシュで重複を作成すべきではありません)。

意味:

- 同時リクエストでは、チャネルあたり `MaxPending` を超えることはできません。
- 同じ `(channel, sender)` に対する繰り返しのリクエスト/更新により、重複したライブ保留行が作成されるべきではありません。

- 緑のランニング:
  - `make pairing-race` (アトミック/ロックされたキャップのチェック)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- 赤 (予想):
  - `make pairing-race-negative` (非アトミック開始/コミットキャップレース)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Ingress トレースの相関関係 / 冪等性**主張:** 取り込みはファンアウト全体でトレース相関を保持し、プロバイダーの再試行時に冪等である必要があります

意味:

- 1 つの外部イベントが複数の内部メッセージになる場合、すべての部分が同じトレース/イベント ID を保持します。
- リトライによって二重処理が発生することはありません。
- プロバイダーのイベント ID が欠落している場合、重複排除は安全なキー (トレース ID など) にフォールバックして、個別のイベントのドロップを回避します。

- 緑:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- 赤 (予想):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### dmScope の優先順位 + アイデンティティリンクのルーティング

**主張:** ルーティングは、デフォルトで DM セッションを分離し、明示的に構成されている場合にのみセッションを折りたたむ必要があります (チャネルの優先順位 + ID リンク)。

意味:

- チャネル固有の dmScope オーバーライドは、グローバル デフォルトより優先される必要があります。
- アイデンティティリンクは、無関係なピア間ではなく、明示的にリンクされたグループ内でのみ折りたたむ必要があります。

- 緑:
  - `make routing-precedence`
  - `make routing-identitylinks`
- 赤 (予想):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
