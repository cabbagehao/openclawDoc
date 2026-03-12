---
summary: "`openclaw update` の CLI リファレンス (ソースコードの安全なアップデートとゲートウェイの自動再起動)"
read_when:
  - ソースインストール環境を安全にアップデートしたい場合
  - "`--update` 短縮コマンドの動作を理解したい場合"
title: "update"
seoTitle: "OpenClaw CLI: openclaw update コマンドの使い方と主要オプション・実行例"
description: "OpenClaw を安全にアップデートし、stable（安定版）、beta（ベータ版）、dev（開発版）の各チャンネルを切り替えます。使用法、オプション、update status (ステータス表示)を確認できます。"
x-i18n:
  source_hash: "f0ab6c4d21952fc637f91e245bcacfe99e18d79d2782076b3bfba35ba4fc4300"
---
OpenClaw を安全にアップデートし、stable（安定版）、beta（ベータ版）、dev（開発版）の各チャンネルを切り替えます。

**npm** または **pnpm** を使用してインストールした場合（グローバルインストールで git メタデータがない場合）、アップデートは [アップデートガイド](/install/updating) に記載されているパッケージマネージャーのフローに従って行われます。

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

- `--no-restart`: アップデート成功後のゲートウェイサービスの自動再起動をスキップします。
- `--channel <stable|beta|dev>`: アップデートチャンネルを設定します（git および npm。構成ファイルに保存されます）。
- `--tag <dist-tag|version>`: 今回のアップデートに限り、npm の dist-tag またはバージョンを上書き指定します。
- `--dry-run`: 構成の書き込み、インストール、プラグインの同期、再起動などの実際のアクションを行わず、予定されているアップデート内容（チャンネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読な `UpdateRunResult` JSON を出力します。
- `--timeout <秒>`: 各ステップのタイムアウト時間（デフォルトは 1200 秒）。

補足: ダウングレード（古いバージョンへの変更）は構成を壊す可能性があるため、実行時に確認が必要です。

## `update status` (ステータス表示)

現在有効なアップデートチャンネル、git のタグ/ブランチ/SHA（ソースインストールの場合）、およびアップデートの有無を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:
- `--json`: 機械可読なステータス JSON を出力。
- `--timeout <秒>`: チェックのタイムアウト時間（デフォルトは 3 秒）。

## `update wizard` (ウィザード)

アップデートチャンネルを選択し、アップデート後にゲートウェイを再起動するかどうかを確認する対話形式のフローです（デフォルトは再起動）。git チェックアウトがない状態で `dev` を選択した場合は、新規作成を提案します。

## アップデートの仕組み

チャンネルを明示的に切り替えた場合（`--channel ...`）、OpenClaw はインストール方法もそのチャンネルに合わせて調整します:

- `dev` → git チェックアウトが存在することを確認し（デフォルトは `~/openclaw`。`OPENCLAW_GIT_DIR` で変更可能）、それを更新した上で、そのチェックアウトからグローバル CLI をインストールします。
- `stable` / `beta` → 対応する dist-tag を使用して npm からインストールします。

ゲートウェイコアの自動アップデーター（構成で有効にしている場合）も、これと同じ内部パスを使用します。

## Git チェックアウト時のフロー

各チャンネルの動作:
- `stable`: 最新の非ベータタグをチェックアウトし、ビルドと `doctor` を実行。
- `beta`: 最新の `-beta` タグをチェックアウトし、ビルドと `doctor` を実行。
- `dev`: `main` ブランチをチェックアウトし、fetch と rebase を実行。

詳細な手順:
1. クリーンなワークツリー（未コミットの変更がない状態）であることを確認します。
2. 指定されたチャンネル（タグまたはブランチ）に切り替えます。
3. アップストリーム（送信元）から最新情報を取得します（dev のみ）。
4. dev のみ: 一時的なワークツリーで事前検証用の lint と TypeScript ビルドを実行します。最新のコミットで失敗した場合は、最大 10 コミット遡って最新のクリーンなビルドを探します。
5. 選択されたコミットに対して rebase を行います（dev のみ）。
6. 依存関係（deps）をインストールします（pnpm 優先、フォールバックは npm）。
7. プログラム本体とコントロール UI をビルドします。
8. 最終的な「安全なアップデート」の確認として `openclaw doctor` を実行します。
9. プラグインを現在有効なチャンネルに同期し（dev は同梱の拡張機能を、stable/beta は npm を使用）、npm インストール済みのプラグインをアップデートします。

## `--update` 短縮コマンド

`openclaw --update` は内部的に `openclaw update` に書き換えられます。シェルやランチャースクリプトでの利用に便利です。

## 関連項目

- `openclaw doctor`: git インストール環境において、先にアップデートの実行を提案する場合があります。
- [開発チャンネル](/install/development-channels)
- [アップデート](/install/updating)
- [CLI リファレンス](/cli)
