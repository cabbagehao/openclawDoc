---
summary: "`openclaw security` の CLI リファレンス (一般的なセキュリティ上の脆弱な設定の監査と修正)"
read_when:
  - 構成や状態に対して迅速なセキュリティ監査を実行したい場合
  - 安全な「修正」提案（権限の厳格化など）を適用したい場合
title: "security"
x-i18n:
  source_hash: "0f3a5c6f9847962056fd68c3fe4aa49d8613734e32ac6d7a82a61163b4748fee"
---

# `openclaw security`

セキュリティツール（監査およびオプションの自動修正）を提供します。

関連ドキュメント:
- セキュリティガイド: [セキュリティ](/gateway/security)

## セキュリティ監査 (`audit`)

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

監査プログラムは、複数の DM 送信者がメインセッションを共有している場合に警告を発し、共有インボックスを利用する場合は **セキュア DM モード** (`session.dmScope="per-channel-peer"` またはマルチアカウントチャネルの場合は `per-account-channel-peer`) の使用を推奨します。
これは、協調的・共有的なインボックスのセキュリティを強化するためのものです。互いに信頼できない、あるいは敵対的な関係にあるオペレーター間で単一のゲートウェイを共有することは推奨されません。信頼の境界を分けるには、個別のゲートウェイを起動するか、OS ユーザーやホスト自体を分けてください。

また、構成から「共有ユーザー」による利用が推測される場合（例: 公開 DM/グループポリシー、構成済みのグループターゲット、ワイルドカードによる送信者ルールなど）には、`security.trust_model.multi_user_heuristic` 警告を発し、OpenClaw がデフォルトでパーソナルアシスタントとしての信頼モデルに基づいていることを再確認させます。
意図的に共有ユーザー環境を構築する場合は、すべてのセッションをサンドボックス化し、ファイルシステムへのアクセスをワークスペース範囲に限定し、個人用・プライベートなアイデンティティや認証情報をそのランタイムから隔離することを推奨します。

その他の主な監査項目:
- サンドボックスなしで小規模モデル (`<=300B`) を使用し、Web/ブラウザツールが有効になっている場合の警告。
- Webhook 利用時、`hooks.defaultSessionKey` が未設定、または `sessionKey` の上書きが許可されている（かつプレフィックス制限がない）場合の警告。
- サンドボックスモードがオフなのに Docker 設定が構成されている場合の警告。
- `gateway.nodes.denyCommands` に効果のないパターン（シェルフィルタリングではなく正確なコマンド名一致のみ対応）が含まれている場合の警告。
- `gateway.nodes.allowCommands` で危険なノードコマンドが明示的に許可されている場合の警告。
- グローバルな `tools.profile="minimal"` がエージェント個別の設定で上書きされている場合の警告。
- 公開グループで、サンドボックスやワークスペースによる保護なしに実行環境やファイルシステムツールが公開されている場合の警告。
- 信頼性の低いツールポリシー下で、拡張機能プラグインのツールが利用可能になっている場合の警告。
- `gateway.allowRealIpFallback=true` (プロキシ誤設定によるヘッダー偽装のリスク) や `discovery.mdns.mode="full"` (mDNS によるメタデータ漏洩) へのフラグ立て。
- サンドボックスブラウザが `sandbox.browser.cdpSourceRange` なしで Docker `bridge` ネットワークを使用している場合の警告。
- 危険なサンドボックス Docker ネットワークモード（`host` や `container:*` 名前空間の共有）へのフラグ立て。
- 既存のサンドボックスブラウザコンテナにハッシュラベルがない、あるいは古い場合の警告（`openclaw sandbox recreate --browser --all` を推奨）。
- npm ベースのプラグインやフックのインストール記録がバージョン固定されていない、あるいは整合性メタデータが不足している場合の警告。
- チャネルの許可リストが、安定した ID ではなく変更可能な名前/メール/タグ（Discord, Slack, Google Chat, MS Teams, Mattermost, IRC など）に依存している場合の警告。
- `gateway.auth.mode="none"` により、共有シークレットなしでゲートウェイの HTTP API（`/tools/invoke` や有効な `/v1/*` エンドポイント）にアクセス可能な状態になっている場合の警告。

`dangerous` や `dangerously` という接頭辞が付いた設定項目は、管理者が意図的に制約を解除するためのものです。これらを有効にすること自体が直ちに脆弱性報告となるわけではありません。危険なパラメータの一覧については、[セキュリティ](/gateway/security) の「安全でない、または危険なフラグのサマリー」セクションを参照してください。

## JSON 出力

CI やポリシーチェックには `--json` フラグを使用してください:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix` と `--json` を併用した場合、修正アクションの内容と最終的な監査レポートの両方が出力されます:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` による変更内容

`--fix` フラグは、安全かつ決定的な以下の修正を適用します:

- 各チャネル（およびアカウント）の `groupPolicy="open"` を `groupPolicy="allowlist"` に変更します。
- `logging.redactSensitive` を `"off"` から `"tools"` に変更します。
- 状態ディレクトリ、構成ファイル、および機密ファイル（`credentials/*.json`, `auth-profiles.json`, `sessions.json`, `*.jsonl` など）の権限（chmod）を厳格化します。

`--fix` は以下の操作は**行いません**:

- トークン、パスワード、API キーの更新（ローテーション）。
- ツールの無効化（`gateway`, `cron`, `exec` など）。
- ゲートウェイのバインド設定、認証モード、ネットワーク公開設定の変更。
- プラグインやスキルの削除または書き換え。
