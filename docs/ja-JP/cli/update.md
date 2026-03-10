---
summary: "「openclaw アップデート」の CLI リファレンス (安全なソースのアップデート + ゲートウェイの自動再起動)"
read_when:
  - ソースチェックアウトを安全に更新したい
  - 「--update」の省略表現の動作を理解する必要があります
title: "アップデート"
x-i18n:
  source_hash: "f0ab6c4d21952fc637f91e245bcacfe99e18d79d2782076b3bfba35ba4fc4300"
---

# `openclaw update`

OpenClaw を安全に更新し、安定版/ベータ版/開発チャネルを切り替えます。

**npm/pnpm** (グローバル インストール、git メタデータなし) 経由でインストールした場合、更新は [更新中](/install/updating) のパッケージ マネージャー フロー経由で行われます。

## 使用法

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --dry-run
openclaw update --no-restart
openclaw update --json
openclaw --update
```

## オプション

- `--no-restart`: 更新が成功した後のゲートウェイ サービスの再起動をスキップします。
- `--channel <stable|beta|dev>`: 更新チャネルを設定します (git + npm; config に保持されます)。
- `--tag <dist-tag|version>`: この更新の場合のみ、npm dist-tag またはバージョンをオーバーライドします。
- `--dry-run`: 設定の書き込み、プラグインのインストール、同期、または再起動を行わずに、計画された更新アクション (チャネル/タグ/ターゲット/再起動フロー) をプレビューします。
- `--json`: 機械可読な `UpdateRunResult` JSON を出力します。
- `--timeout <seconds>`: ステップごとのタイムアウト (デフォルトは 1200 秒)。

注: 古いバージョンでは構成が壊れる可能性があるため、ダウングレードには確認が必要です。

## `update status`

アクティブな更新チャネル + git タグ/ブランチ/SHA (ソース チェックアウト用)、および更新の可用性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読ステータス JSON を出力します。
- `--timeout <seconds>`: チェックのタイムアウト (デフォルトは 3 秒)。

## `update wizard`

更新チャネルを選択し、ゲートウェイを再起動するかどうかを確認する対話型フロー
アップデート後（デフォルトでは再起動）。 git チェックアウトなしで `dev` を選択すると、
作成することを提案します。

## 何をするのかチャンネルを明示的に切り替えると (`--channel ...`)、OpenClaw は

調整されたインストール方法:

- `dev` → git チェックアウトを保証します (デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` でオーバーライド)、
  それを更新し、そのチェックアウトからグローバル CLI をインストールします。
- `stable`/`beta` → 一致する dist-tag を使用して npm からインストールします。

ゲートウェイ コア自動アップデータ (構成によって有効になっている場合) は、これと同じ更新パスを再利用します。

## Git チェックアウト フロー

チャンネル:

- `stable`: 最新の非ベータ版タグをチェックアウトしてから、ビルド + ドクターを実行します。
- `beta`: 最新の `-beta` タグをチェックアウトし、ビルド + ドクターします。
- `dev`: `main` をチェックアウトし、フェッチ + リベースします。

高レベル:

1. クリーンなワークツリーが必要です (コミットされていない変更はありません)。
2. 選択したチャンネル (タグまたはブランチ) に切り替えます。
3. アップストリームをフェッチします (開発のみ)。
4. 開発のみ: 一時ワークツリーでのプリフライト lint + TypeScript ビルド。ヒントが失敗した場合は、最大 10 コミットまで遡って最新のクリーンなビルドを見つけます。
5. 選択したコミットにリベースします (開発のみ)。
6. deps をインストールします (pnpm が推奨、npm フォールバック)。
7. ビルド + コントロール UI をビルドします。
8. 最終的な「安全な更新」チェックとして `openclaw doctor` を実行します。
9. プラグインをアクティブなチャネルに同期し (開発はバンドルされた拡張機能を使用、安定版/ベータ版は npm を使用)、npm でインストールされたプラグインを更新します。

## `--update` 速記`openclaw --update` は `openclaw update` に書き換えられます (シェルとランチャー スクリプトに役立ちます)

## も参照

- `openclaw doctor` (git チェックアウトで最初に更新を実行することを提案)
- [開発チャネル](/install/development-channels)
- [更新中](/install/updating)
- [CLI リファレンス](/cli)
