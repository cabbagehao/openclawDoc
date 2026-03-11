---
summary: "stable / beta / dev 各チャネルの意味、切り替え方法、タグ運用"
read_when:
  - stable / beta / dev を切り替えたい
  - プレリリースのタグ付けや公開ルールを確認したい
title: "開発チャネル"
---

# 開発チャネル

最終更新: 2026-01-21

OpenClaw には、3 つの更新チャネルがあります。

- **stable**: npm dist-tag は `latest`
- **beta**: npm dist-tag は `beta`（検証中のビルド）
- **dev**: `main` ブランチの最新 head（git）。npm dist-tag は `dev`（公開されている場合）

OpenClaw では、まず **beta** にビルドを出し、検証が終わったものを **同じバージョン番号のまま `latest` に昇格** させます。npm install において正本になるのはバージョン番号ではなく dist-tag です。

## チャネルの切り替え

Git checkout 版:

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

- `stable` / `beta` は、条件に合う最新タグを checkout します（同じタグを指すこともよくあります）
- `dev` は `main` に切り替え、upstream に対して rebase します

npm / pnpm のグローバルインストール版:

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

この場合は、対応する npm dist-tag（`latest`、`beta`、`dev`）を使って更新されます。

`--channel` で **明示的に** チャネルを切り替えると、OpenClaw はインストール方式も自動で揃えます。

- `dev` は git checkout を確実に用意し（既定は `~/openclaw`、`OPENCLAW_GIT_DIR` で変更可能）、それを更新したうえで、その checkout からグローバル CLI を再インストールします
- `stable` / `beta` は、対応する dist-tag を使って npm からインストールします

補足: stable と dev を並行運用したい場合は clone を 2 つ用意し、ゲートウェイは stable 側を向けると扱いやすくなります。

## プラグインとチャネル

`openclaw update` でチャネルを切り替えると、プラグインの取得元も同期されます。

- `dev` は git checkout に同梱されたプラグインを優先します
- `stable` と `beta` は npm でインストールしたプラグインパッケージへ戻します

## タグ運用のベストプラクティス

- Git checkout が着地すべきリリースにはタグを打ちます（stable は `vYYYY.M.D`、beta は `vYYYY.M.D-beta.N`）
- 互換性のため `vYYYY.M.D.beta.N` も認識されますが、推奨は `-beta.N` です
- 旧形式の `vYYYY.M.D-<patch>` タグも、引き続き stable（非 beta）として扱われます
- タグは不変に保ち、移動や再利用はしないでください
- npm install における正本は dist-tag のままです:
  - `latest` → stable
  - `beta` → 候補ビルド
  - `dev` → `main` のスナップショット（任意）

## macOS アプリの提供状況

beta や dev のビルドには、macOS アプリのリリースが **含まれない** 場合があります。これは問題ありません。

- Git tag と npm dist-tag はそのまま公開できます
- リリースノートや changelog に「この beta には macOS ビルドがない」ことを明記してください
