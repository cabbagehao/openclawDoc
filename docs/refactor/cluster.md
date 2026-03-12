---
summary: "LOC 削減の可能性が最も高いクラスターをリファクタリングする"
read_when:
  - 動作を変えずに合計 LOC を削減したい
  - 次の重複排除または抽出パスを選択しています
title: "クラスターバックログのリファクタリング"
x-i18n:
  source_hash: "0d35dd202f3febea20057624f97608332aa1753148ac8a4fcc5f2a89884d67e2"
---
LOC の削減の可能性、安全性、幅の広さによってランク付けされます。

## 1. チャネルプラグイン構成とセキュリティスキャフォールディング

最高値のクラスター。

多くのチャネル プラグインで繰り返される形状:

- `config.listAccountIds`
- `config.resolveAccount`
- `config.defaultAccountId`
- `config.setAccountEnabled`
- `config.deleteAccount`
- `config.describeAccount`
- `security.resolveDmPolicy`

有力な例:

- `extensions/telegram/src/channel.ts`
- `extensions/googlechat/src/channel.ts`
- `extensions/slack/src/channel.ts`
- `extensions/discord/src/channel.ts`
- `extensions/matrix/src/channel.ts`
- `extensions/irc/src/channel.ts`
- `extensions/signal/src/channel.ts`
- `extensions/mattermost/src/channel.ts`

考えられる抽出形状:

- `buildChannelConfigAdapter(...)`
- `buildMultiAccountConfigAdapter(...)`
- `buildDmSecurityAdapter(...)`

期待される節約量:

- ~250-450 LOC

リスク:

- 中程度。各チャネルにはわずかに異なる `isConfigured`、警告、および正規化があります。

## 2. 拡張ランタイム シングルトン ボイラープレート

とても安全です。

ほぼすべての拡張機能には同じランタイム ホルダーがあります。

- `let runtime: PluginRuntime | null = null`
- `setXRuntime`
- `getXRuntime`

有力な例:

- `extensions/telegram/src/runtime.ts`
- `extensions/matrix/src/runtime.ts`
- `extensions/slack/src/runtime.ts`
- `extensions/discord/src/runtime.ts`
- `extensions/whatsapp/src/runtime.ts`
- `extensions/imessage/src/runtime.ts`
- `extensions/twitch/src/runtime.ts`

特殊なケースのバリエーション:

- `extensions/bluebubbles/src/runtime.ts`
- `extensions/line/src/runtime.ts`
- `extensions/synology-chat/src/runtime.ts`

考えられる抽出形状:

- `createPluginRuntimeStore<T>(errorMessage)`

期待される節約量:

- ~180-260 LOC

リスク:

- 低い

## 3. オンボーディング プロンプトと構成パッチの手順

広い表面積。

多くのオンボーディング ファイルでは次のことが繰り返されます。- アカウントIDを解決する

- プロンプト許可リストのエントリ
  -allowFromをマージする
- DMポリシーを設定する
- プロンプトの秘密
- パッチのトップレベル構成とアカウント スコープの構成

有力な例:

- `extensions/bluebubbles/src/onboarding.ts`
- `extensions/googlechat/src/onboarding.ts`
- `extensions/msteams/src/onboarding.ts`
- `extensions/zalo/src/onboarding.ts`
- `extensions/zalouser/src/onboarding.ts`
- `extensions/nextcloud-talk/src/onboarding.ts`
- `extensions/matrix/src/onboarding.ts`
- `extensions/irc/src/onboarding.ts`

既存のヘルパー シーム:

- `src/channels/plugins/onboarding/helpers.ts`

考えられる抽出形状:

- `promptAllowFromList(...)`
- `buildDmPolicyAdapter(...)`
- `applyScopedAccountPatch(...)`
- `promptSecretFields(...)`

期待される節約量:

- ~300-600 LOC

リスク:

- 中程度。過度に一般化しやすい。ヘルパーを狭くして構成可能な状態に保ちます。

## 4. マルチアカウント構成スキーマのフラグメント

拡張機能間で繰り返されるスキーマ フラグメント。

よくあるパターン:

- `const allowFromEntry = z.union([z.string(), z.number()])`
- アカウント スキーマに加えて:
  - `accounts: z.object({}).catchall(accountSchema).optional()`
  - `defaultAccount: z.string().optional()`
- DM/グループフィールドの繰り返し
- マークダウン/ツールポリシーフィールドの繰り返し

有力な例:

- `extensions/bluebubbles/src/config-schema.ts`
- `extensions/zalo/src/config-schema.ts`
- `extensions/zalouser/src/config-schema.ts`
- `extensions/matrix/src/config-schema.ts`
- `extensions/nostr/src/config-schema.ts`

考えられる抽出形状:

- `AllowFromEntrySchema`
- `buildMultiAccountChannelSchema(accountSchema)`
- `buildCommonDmGroupFields(...)`

期待される節約量:

- ~120-220 LOC

リスク:

- 低から中程度。スキーマには単純なものもあれば、特殊なものもあります。

## 5. Webhook とモニターのライフサイクルの起動

良好な中値クラスター。

繰り返される `startAccount` / モニターのセットアップ パターン:

- アカウントを解決する
- Webhook パスを計算する
- 起動ログ
- モニターを開始します
- 中止を待ちます
- クリーンアップ
- ステータスシンクの更新

有力な例:- `extensions/googlechat/src/channel.ts`

- `extensions/bluebubbles/src/channel.ts`
- `extensions/zalo/src/channel.ts`
- `extensions/telegram/src/channel.ts`
- `extensions/nextcloud-talk/src/channel.ts`

既存のヘルパー シーム:

- `src/plugin-sdk/channel-lifecycle.ts`

考えられる抽出形状:

- アカウント監視ライフサイクルのヘルパー
- Webhook によるアカウント起動のヘルパー

期待される節約量:

- ~150-300 LOC

リスク:

- 中程度から高程度。輸送の詳細はすぐに異なります。

## 6. 小規模な完全クローンのクリーンアップ

低リスクのクリーンアップバケット。

例:

- 重複したゲートウェイ argv の検出:
  - `src/infra/gateway-lock.ts`
  - `src/cli/daemon-cli/lifecycle.ts`
- 重複したポート診断レンダリング:
  - `src/cli/daemon-cli/restart-health.ts`
- 重複したセッションキー構造:
  - `src/web/auto-reply/monitor/broadcast.ts`

期待される節約量:

- ~30-60LOC

リスク:

- 低い

## テストクラスター

### LINE Webhook イベントフィクスチャ

有力な例:

- `src/line/bot-handlers.test.ts`

おそらく抽出:

- `makeLineEvent(...)`
- `runLineEvent(...)`
- `makeLineAccount(...)`

期待される節約量:

- ~120-180 LOC

### Telegram ネイティブ コマンド認証マトリックス

有力な例:

- `src/telegram/bot-native-commands.group-auth.test.ts`
- `src/telegram/bot-native-commands.plugin-auth.test.ts`

おそらく抽出:

- フォーラムコンテキストビルダー
- 拒否されたメッセージ アサーション ヘルパー
- テーブル駆動型認証のケース

期待される節約量:

- ~80-140 LOC

### Zalo ライフサイクルのセットアップ

有力な例:

- `extensions/zalo/src/monitor.lifecycle.test.ts`

おそらく抽出:

- 共有モニターセットアップハーネス

期待される節約量:

- ~50-90 LOC

### Brave llm-context のサポートされていないオプションのテスト

有力な例:

- `src/agents/tools/web-tools.enabled-defaults.test.ts`

おそらく抽出:

- `it.each(...)` マトリックス期待される節約量:

- ~30-50LOC

## 推奨される順序

1. ランタイムシングルトンボイラープレート
2. 小規模な完全クローンのクリーンアップ
3. 構成およびセキュリティビルダーの抽出
4. テストヘルパーの抽出
5. オンボーディングステップの抽出
6. ライフサイクル ヘルパーの抽出を監視する
