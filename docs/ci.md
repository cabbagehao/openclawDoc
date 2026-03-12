---
title: "CIパイプライン"
seoTitle: "OpenClawのGitHub Actions CI構成と実行条件・運用フローガイド"
description: "GitHub Actions の CI ジョブ構成、変更範囲によるスキップ条件、ローカルでの確認方法を説明します。"
summary: "CIジョブグラフ、スコープゲート、およびローカルコマンドの同等機能"
read_when:
  - CIジョブが実行された理由または実行されなかった理由を理解する必要がある場合
  - GitHub Actionsチェックの失敗をデバッグしている場合
x-i18n:
  source_path: "ci.md"
  source_hash: "a480e57c9a49c23d1124f3e78934d2d58e54015970dd67cbb49cfae1378bdc6b"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T05:49:25.826Z"
---
CIは`main`へのすべてのプッシュとすべてのプルリクエストで実行されます。ドキュメントのみまたはネイティブコードのみが変更された場合、高コストなジョブをスキップするスマートスコープ機能を使用します。

## ジョブ概要

| ジョブ            | 目的                                               | 実行タイミング                                   |
| ----------------- | -------------------------------------------------- | ------------------------------------------------ |
| `docs-scope`      | ドキュメントのみの変更を検出                       | 常時                                             |
| `changed-scope`   | 変更された領域を検出（node/macos/android/windows） | ドキュメント以外のPR                             |
| `check`           | TypeScript型、lint、フォーマット                   | `main`へのプッシュ、またはNode関連の変更があるPR |
| `check-docs`      | Markdown lintと壊れたリンクチェック                | ドキュメントが変更された場合                     |
| `code-analysis`   | LOC閾値チェック（1000行）                          | PRのみ                                           |
| `secrets`         | 漏洩したシークレットを検出                         | 常時                                             |
| `build-artifacts` | distを一度ビルドし、他のジョブと共有               | ドキュメント以外、node変更                       |
| `release-check`   | npm packの内容を検証                               | ビルド後                                         |
| `checks`          | Node/Bunテスト + プロトコルチェック                | ドキュメント以外、node変更                       |
| `checks-windows`  | Windows固有のテスト                                | ドキュメント以外、windows関連の変更              |
| `macos`           | Swift lint/build/test + TSテスト                   | macos変更があるPR                                |
| `android`         | Gradleビルド + テスト                              | ドキュメント以外、android変更                    |

## Fail-Fast順序

ジョブは、高コストなジョブが実行される前に低コストなチェックが失敗するように順序付けられています：

1. `docs-scope` + `code-analysis` + `check`（並列、約1-2分）
2. `build-artifacts`（上記に依存）
3. `checks`、`checks-windows`、`macos`、`android`（ビルドに依存）

スコープロジックは`scripts/ci-changed-scope.mjs`にあり、`src/scripts/ci-changed-scope.test.ts`のユニットテストでカバーされています。

## ランナー

| ランナー                         | ジョブ                                  |
| -------------------------------- | --------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | スコープ検出を含むほとんどのLinuxジョブ |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                        |
| `macos-latest`                   | `macos`、`ios`                          |

## ローカル同等コマンド

```bash
pnpm check          # 型 + lint + フォーマット
pnpm test           # vitestテスト
pnpm check:docs     # docsフォーマット + lint + 壊れたリンク
pnpm release:check  # npm packを検証
```
