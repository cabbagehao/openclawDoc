---
summary: "コミュニティ プラグインの品質基準、公開要件、PR 提出方法"
read_when:
  - サードパーティ製 OpenClaw プラグインを公開したいとき
  - ドキュメント掲載用のプラグインを提案したいとき
title: "OpenClawのコミュニティプラグインの探し方と導入判断ガイド"
description: "このページでは、OpenClaw 向けの コミュニティ保守プラグイン のうち、一定の品質基準を満たしたものを掲載します。品質基準を満たしていれば、このページへの追加 PR を受け付けます。"
x-i18n:
  source_hash: "5203b7a6973ed0551fe87d17cda2f6f6e35ce520fe7f8078b1840a445ed67642"
---
このページでは、OpenClaw 向けの **コミュニティ保守プラグイン** のうち、一定の品質基準を満たしたものを掲載します。

品質基準を満たしていれば、このページへの追加 PR を受け付けます。

## 掲載条件

- プラグイン パッケージが npmjs に公開されていること（`openclaw plugins install <npm-spec>` でインストール可能）
- ソースコードが GitHub の公開リポジトリでホストされていること
- リポジトリにセットアップ手順、使用方法のドキュメント、issue tracker があること
- 明確なメンテナンス シグナルがあること（アクティブな maintainer、最近の更新、issue への継続対応など）

## 提出方法

このページにプラグインを追加する PR を作成し、次の情報を含めてください。

- プラグイン名
- npm package 名
- GitHub repository URL
- 1 行の説明
- インストール コマンド

## 審査基準

有用で、文書化されており、安全に運用できるプラグインを優先します。低労力な wrapper、所有者が不明確なもの、保守されていない package は掲載を見送る場合があります。

## 候補の記載形式

エントリを追加するときは、次の形式を使ってください。

- **Plugin Name** — short description
  npm: `@scope/package`
  repo: `https://github.com/org/repo`
  install: `openclaw plugins install @scope/package`

## 掲載済みプラグイン

- **WeChat** — WeChatPadPro（iPad protocol）を通じて、OpenClaw を WeChat の個人アカウントへ接続します。キーワード起動の会話で、テキスト、画像、ファイルをやり取りできます。
  npm: `@icesword760/openclaw-wechat`
  repo: `https://github.com/icesword0760/openclaw-wechat`
  install: `openclaw plugins install @icesword760/openclaw-wechat`
