---
summary: "安定版、ベータ版、開発版チャネル: セマンティクス、切り替え、タグ付け"
read_when:
  - stable/beta/dev 間を切り替えたい場合
  - プレリリースのタグ付けや公開を行う場合
title: "開発チャネル"
---

# 開発チャネル

最終更新: 2026-01-21

OpenClaw は3つのアップデートチャネルを提供しています:

- **stable**: npm dist-tag `latest`。
- **beta**: npm dist-tag `beta` (テスト中のビルド)。
- **dev**: `main` (git) の最新のヘッド。npm dist-tag: `dev` (公開されている場合)。

私たちはビルドを **beta** に提供し、テストした後、バージョン番号を変更することなく **検証済みのビルドを `latest` に昇格させます**
— npm インストールの場合、dist-tag が信頼できる情報源となります。

## チャネルの切り替え

Git チェックアウト:

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

- `stable`/`beta` は、一致する最新のタグをチェックアウトします (多くの場合、同じタグになります)。
- `dev` は `main` に切り替え、アップストリームでリベースします。

npm/pnpm グローバルインストール:

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

これは、対応する npm dist-tag (`latest`, `beta`, `dev`) を介して更新されます。

`--channel` を使用して**明示的に**チャネルを切り替えると、OpenClaw はインストール方法も調整します:

- `dev` は git チェックアウトを確実にし (デフォルトは `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能)、それを更新し、そのチェックアウトからグローバル CLI をインストールします。
- `stable`/`beta` は、一致する dist-tag を使用して npm からインストールします。

ヒント: stable と dev を並行して使いたい場合は、2つのクローンを保持し、Gateway が stable の方を指すようにします。

## プラグインとチャネル

`openclaw update` でチャネルを切り替えると、OpenClaw はプラグインのソースも同期します:

- `dev` は、git チェックアウトからバンドルされたプラグインを優先します。
- `stable` と `beta` は、npm でインストールされたプラグインパッケージを復元します。

## タグ付けのベストプラクティス

- git チェックアウトが着地させたいリリースにタグを付けます (stable は `vYYYY.M.D`、beta は `vYYYY.M.D-beta.N`)。
- 互換性のために `vYYYY.M.D.beta.N` も認識されますが、`-beta.N` を推奨します。
- 従来の `vYYYY.M.D-<patch>` タグは、引き続き stable (非 beta) として認識されます。
- タグは不変に保ちます: タグを移動したり再利用したりしないでください。
- npm dist-tag は引き続き npm インストールの信頼できる情報源です:
  - `latest` → stable
  - `beta` → 候補ビルド
  - `dev` → main スナップショット (オプション)

## macOS アプリの可用性

Beta と dev ビルドには、macOS アプリのリリースが含まれて**いない**場合があります。それで問題ありません:

- git タグと npm dist-tag は引き続き公開できます。
- リリースノートまたは変更ログで「この beta には macOS ビルドはありません」と明記してください。
