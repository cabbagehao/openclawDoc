---
title: "リリースチェックリスト"
summary: "npm + macOS アプリの段階的なリリース チェックリスト"
read_when:
  - 新しい npm リリースのカット
  - 新しい macOS アプリのリリースを中止する
  - 公開前のメタデータの検証
x-i18n:
  source_hash: "48f3db2c96d02622efcf3b947856e3e02e230ad0cd15830d7928a3a93bd8aa35"
---

# リリースチェックリスト (npm + macOS)

リポジトリ ルートの `pnpm` (ノード 22+) を使用します。タグ付け/公開する前に、作業ツリーをクリーンな状態に保ってください。

## オペレータートリガー

オペレーターが「リリース」と言ったら、すぐに次のプリフライトを実行します (ブロックされない限り、追加の質問はありません)。

- このドキュメントと `docs/platforms/mac/release.md` をお読みください。
- `~/.profile` から環境をロードし、`SPARKLE_PRIVATE_KEY_FILE` + App Store Connect 変数が設定されていることを確認します (SPARKLE_PRIVATE_KEY_FILE は `~/.profile` に存在する必要があります)。
- 必要に応じて、`~/Library/CloudStorage/Dropbox/Backup/Sparkle` の Sparkle キーを使用します。

1. **バージョンとメタデータ**

- [ ] `package.json` バージョンをバンプします (例: `2026.1.29`)。
- [ ] `pnpm plugins:sync` を実行して、拡張機能パッケージのバージョンと変更ログを調整します。
- [ ] [`src/version.ts`](https://github.com/openclaw/openclaw/blob/main/src/version.ts) の CLI/バージョン文字列と、[`src/web/session.ts`](https://github.com/openclaw/openclaw/blob/main/src/web/session.ts) の Baileys ユーザー エージェントを更新します。
- [ ] パッケージのメタデータ (名前、説明、リポジトリ、キーワード、ライセンス) を確認し、`bin` マップが `openclaw` の [`openclaw.mjs`](https://github.com/openclaw/openclaw/blob/main/openclaw.mjs) をポイントしていることを確認します。
- [ ] 依存関係が変更された場合は、`pnpm-lock.yaml` が最新になるように `pnpm install` を実行します。

2. **ビルドとアーティファクト**- [ ] A2UI 入力が変更された場合は、`pnpm canvas:a2ui:bundle` を実行し、更新された [`src/canvas-host/a2ui/a2ui.bundle.js`](https://github.com/openclaw/openclaw/blob/main/src/canvas-host/a2ui/a2ui.bundle.js) をコミットします。

- [ ] `pnpm run build` (`dist/` を再生成します)。
- [ ] npm パッケージ `files` に、必要なすべての `dist/*` フォルダー (特に、ヘッドレス ノード + ACP CLI の `dist/node-host/**` および `dist/acp/**`) が含まれていることを確認します。
- [ ] `dist/build-info.json` が存在し、予期される `commit` ハッシュが含まれていることを確認します (CLI バナーは npm インストールにこれを使用します)。
- [ ] オプション: ビルド後の `npm pack --pack-destination /tmp`。 tarball の内容を検査し、GitHub リリースに備えて保管しておいてください (コミットしないでください)。

3. **変更履歴とドキュメント**

- [ ] `CHANGELOG.md` をユーザー向けのハイライトで更新します (見つからない場合はファイルを作成します)。エントリは厳密にバージョン順に降順に保持します。
- [ ] README の例/フラグが現在の CLI の動作 (特に新しいコマンドやオプション) と一致していることを確認します。

4. **検証**- [ ] `pnpm build`

- [ ] `pnpm check`
- [ ] `pnpm test` (カバレッジ出力が必要な場合は `pnpm test:coverage`)
- [ ] `pnpm release:check` (npm パックの内容を確認します)
- [ ] `OPENCLAW_INSTALL_SMOKE_SKIP_NONROOT=1 pnpm test:install:smoke` (Docker インストール スモーク テスト、高速パス。リリース前に必要)
  - 直前の npm リリースが壊れていることがわかっている場合は、プレインストール ステップに `OPENCLAW_INSTALL_SMOKE_PREVIOUS=<last-good-version>` または `OPENCLAW_INSTALL_SMOKE_SKIP_PREVIOUS=1` を設定します。
- [ ] (オプション) フルインストーラスモーク (非 root + CLI のカバレッジを追加): `pnpm test:install:smoke`
- [ ] (オプション) インストーラー E2E (Docker、`curl -fsSL https://openclaw.ai/install.sh | bash` を実行し、オンボードして実際のツール呼び出しを実行します):
  - `pnpm test:install:e2e:openai` (`OPENAI_API_KEY` が必要)
  - `pnpm test:install:e2e:anthropic` (`ANTHROPIC_API_KEY` が必要)
  - `pnpm test:install:e2e` (両方のキーが必要、両方のプロバイダーを実行)
- [ ] (オプション) 変更が送受信パスに影響を与えるかどうか、Web ゲートウェイをスポットチェックします。

5. **macOS アプリ (Sparkle)**- [ ] macOS アプリをビルドして署名し、配布用に圧縮します。

- [ ] Sparkle アプリキャスト ([`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh) 経由の HTML ノート) を生成し、`appcast.xml` を更新します。
- [ ] アプリ zip (およびオプションの dSYM zip) を GitHub リリースに添付できるようにしておきます。
- [ ] 正確なコマンドと必要な環境変数については、[macOS リリース](/platforms/mac/release) に従ってください。
  - Sparkle がバージョンを正しく比較できるように、`APP_BUILD` は数値 + 単調でなければなりません (`-beta` は不可)。
  - 公証する場合は、App Store Connect API 環境変数から作成された `openclaw-notary` キーチェーン プロファイルを使用します ([macOS リリース](/platforms/mac/release) を参照)。

6. **公開 (npm)**

- [ ] git ステータスがクリーンであることを確認します。必要に応じてコミットとプッシュを行います。
- [ ] `npm login` (2FA を確認) (必要な場合)。
- [ ] `npm publish --access public` (プレリリースには `--tag beta` を使用してください)。
- [ ] レジストリを確認します: `npm view openclaw version`、`npm view openclaw dist-tags`、および `npx -y openclaw@X.Y.Z --version` (または `--help`)。

### トラブルシューティング (2.0.0-beta2 リリースのメモ)- **npm Pack/publish がハングする、または巨大な tarball が生成される**: `dist/OpenClaw.app` の macOS アプリ バンドル (およびリリース zip) がパッケージに取り込まれます。 `package.json` `files` 経由で公開コンテンツをホワイトリストに登録することで修正します (dist サブディレクトリ、ドキュメント、スキルを含み、アプリ バンドルは除外します)。 `npm pack --dry-run` で、`dist/OpenClaw.app` がリストされていないことを確認します

- **dist-tags の npm 認証 Web ループ**: 従来の認証を使用して OTP プロンプトを取得します。
  - `NPM_CONFIG_AUTH_TYPE=legacy npm dist-tag add openclaw@X.Y.Z latest`
- **`npx` 検証が `ECOMPROMISED: Lock compromised`** で失敗します: 新しいキャッシュを使用して再試行してください:
  - `NPM_CONFIG_CACHE=/tmp/npm-cache-$(date +%s) npx -y openclaw@X.Y.Z --version`
- **後期修正後にタグを再ポイントする必要があります**: タグを強制的に更新してプッシュし、GitHub リリース アセットがまだ一致していることを確認します。
  - `git tag -f vX.Y.Z && git push -f origin vX.Y.Z`

7. **GitHub リリース + アプリキャスト**- [ ] タグを付けてプッシュ: `git tag vX.Y.Z && git push origin vX.Y.Z` (または `git push --tags`)。

- [ ] **タイトル `openclaw X.Y.Z`** (タグだけでなく) を使用して `vX.Y.Z` の GitHub リリースを作成/更新します。本文には、そのバージョンの **完全**な変更ログ セクション (ハイライト + 変更 + 修正) をインラインで (裸のリンクは禁止) 含める必要があり、**本文内でタイトルを繰り返してはなりません**。
- [ ] アーティファクトを添付します: `npm pack` tarball (オプション)、`OpenClaw-X.Y.Z.zip`、および `OpenClaw-X.Y.Z.dSYM.zip` (生成された場合)。
- [ ] 更新された `appcast.xml` をコミットしてプッシュします (メインからの Sparkle フィード)。
- [ ] クリーンな一時ディレクトリ (`package.json` なし) から `npx -y openclaw@X.Y.Z send --help` を実行して、インストール/CLI エントリポイントが機能することを確認します。
- [ ] リリースノートを発表/共有します。

## プラグインの公開スコープ (npm)

**既存の npm プラグイン**のみを `@openclaw/*` スコープで公開します。同梱
npm にないプラグインは **ディスクツリーのみ** のままです (引き続き
`extensions/**`)。

リストを取得するプロセス:

1. `npm search @openclaw --json` とパッケージ名を取得します。
2. `extensions/*/package.json` の名前と比較します。
3. **交差点**のみを公開します（すでにnpm上にあります）。

現在の npm プラグイン リスト (必要に応じて更新):

- @openclaw/bluebubbles
- @openclaw/diagnostics-otel
- @openclaw/ディスコード
- @openclaw/フェイシュ
- @openclaw/ロブスター
- @openclaw/マトリックス
- @openclaw/msteams
- @openclaw/nextcloud-talk
- @openclaw/nostr
- @openclaw/音声通話
- @openclaw/ザロ
- @openclaw/zalouserリリース ノートでは、**新しいオプションのバンドル プラグイン**についても言及する必要があります。
  デフォルトでオン\*\* (例: `tlon`)。
