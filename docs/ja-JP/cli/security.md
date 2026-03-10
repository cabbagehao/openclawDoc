---
summary: "「openclaw セキュリティ」の CLI リファレンス (一般的なセキュリティ フットガンの監査と修正)"
read_when:
  - config/state に対して簡単なセキュリティ監査を実行したいと考えています。
  - 安全な「修正」提案 (chmod、デフォルトの厳格化) を適用したい場合
title: "安全"
x-i18n:
  source_hash: "0f3a5c6f9847962056fd68c3fe4aa49d8613734e32ac6d7a82a61163b4748fee"
---

# `openclaw security`

セキュリティ ツール (監査 + オプションの修正)。

関連:

- セキュリティガイド: [セキュリティ](/gateway/security)

## 監査

````bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```監査では、複数の DM 送信者がメイン セッションを共有すると警告し、共有受信トレイに対して **セキュア DM モード**: `session.dmScope="per-channel-peer"` (またはマルチアカウント チャネルの場合は `per-account-channel-peer`) を推奨します。
これは、共同/共有受信トレイの強化用です。相互に信頼できない/敵対的なオペレータによって共有される単一のゲートウェイは、推奨される設定ではありません。別のゲートウェイ (または別の OS ユーザー/ホスト) で信頼境界を分割します。
また、構成が共有ユーザーの侵入の可能性を示唆する場合 (たとえば、オープン DM/グループ ポリシー、構成されたグループ ターゲット、またはワイルドカード送信者ルール) に `security.trust_model.multi_user_heuristic` を生成し、OpenClaw がデフォルトでパーソナル アシスタントの信頼モデルであることを思い出させます。
意図的な共有ユーザー設定の場合、監査ガイダンスは、すべてのセッションをサンドボックス化し、ファイルシステムへのアクセスをワークスペース範囲に保ち、個人/プライベート ID または資格情報をそのランタイムから遮断することです。
また、小規模モデル (`<=300B`) がサンドボックスなしで、Web/ブラウザー ツールが有効になっている状態で使用されている場合にも警告します。
Webhook Ingress の場合、`hooks.defaultSessionKey` が設定されていない場合、リクエスト `sessionKey` オーバーライドが有効になっている場合、および `hooks.allowedSessionKeyPrefixes` なしでオーバーライドが有効になっている場合に警告します。また、サンドボックス モードがオフのときにサンドボックス Docker 設定が構成されている場合、`gateway.nodes.denyCommands` が無効なパターンのような/不明なエントリを使用している場合 (シェル テキスト フィルタリングではなく、正確なノード コマンド名一致のみ)、`gateway.nodes.allowCommands` が危険なノード コマンドを明示的に有効にしている場合、グローバル `tools.profile="minimal"` がエージェント ツール プロファイルによってオーバーライドされている場合、オープン グループが公開されている場合にも警告します。サンドボックス/ワークスペース ガードのないランタイム/ファイル システム ツール、および拡張プラグイン ツールがインストールされている場合は、寛容なツール ポリシーの下でアクセスできる可能性があります。
また、`gateway.allowRealIpFallback=true` (プロキシが正しく設定されていない場合のヘッダー スプーフィングのリスク) および `discovery.mdns.mode="full"` (mDNS TXT レコードを介したメタデータ漏洩) にもフラグを立てます。
また、サンドボックス ブラウザーが `sandbox.browser.cdpSourceRange` を使用せずに Docker `bridge` ネットワークを使用する場合にも警告します。
また、危険なサンドボックス Docker ネットワーク モード (`host` および `container:*` 名前空間結合を含む) にフラグを立てます。
また、既存のサンドボックス ブラウザー Docker コンテナーにハッシュ ラベルが欠落しているか古い場合 (たとえば、移行前のコンテナーに `openclaw.browserConfigEpoch` が欠落している場合) に警告し、`openclaw sandbox recreate --browser --all` を推奨します。
また、npm ベースのプラグイン/フックのインストール レコードが固定されていない場合、整合性メタデータが欠落している場合、または現在インストールされているパッケージ バージョンからずれている場合にも警告します。
チャネル許可リストが安定した ID (Discord、Slack、Google Chat、MS Teams、Mattermost、IRC スコープ (該当する場合)) ではなく変更可能な名前/メール/タグに依存している場合に警告します。`gateway.auth.mode="none"` により、共有シークレット (`/tools/invoke` と有効な `/v1/*` エンドポイント) なしでゲートウェイ HTTP API にアクセスできる状態になった場合に警告します。
`dangerous`/`dangerously` という接頭辞が付いた設定は、明示的なブレークグラス演算子オーバーライドです。有効にすること自体は、セキュリティ脆弱性レポートではありません。
危険なパラメーターの詳細については、[セキュリティ](/gateway/security) の「安全でないまたは危険なフラグの概要」セクションを参照してください。

## JSON 出力

CI/ポリシーチェックには `--json` を使用します。

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
````

`--fix` と `--json` を組み合わせると、出力には修正アクションと最終レポートの両方が含まれます。

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` の変更内容

`--fix` は、安全で決定的な修復を適用します。

- 共通の `groupPolicy="open"` を `groupPolicy="allowlist"` に反転します (サポートされているチャネルのアカウント バリアントを含む)
- `logging.redactSensitive` を `"off"` から `"tools"` に設定します
- 状態/構成および一般的な機密ファイルのアクセス許可を強化します (`credentials/*.json`、`auth-profiles.json`、`sessions.json`、セッション `*.jsonl`)

`--fix` は**しません**:

- トークン/パスワード/API キーのローテーション
- ツールを無効にする (`gateway`、`cron`、`exec` など)
- ゲートウェイのバインド/認証/ネットワーク公開の選択を変更する
- プラグイン/スキルを削除または書き換える
