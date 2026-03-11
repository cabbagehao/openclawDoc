---
summary: "スキル構成スキーマと例"
read_when:
  - スキル構成の追加または変更
  - バンドルされたホワイトリストまたはインストール動作の調整
title: "スキル構成"
x-i18n:
  source_hash: "6f00565595d7ab01892e45e38152c2f81220db6b1c998b2fdc49ec1cf4d7dcf4"
---

# スキル構成

すべてのスキル関連の構成は、`~/.openclaw/openclaw.json` の `skills` の下に存在します。

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

## フィールド

* `allowBundled`: **バンドル** スキルのみのオプションの許可リスト。設定した場合のみ、
  リスト内のバンドルされたスキルが対象となります (管理/ワークスペース スキルは影響を受けません)。
* `load.extraDirs`: スキャンする追加のスキル ディレクトリ (最も低い優先順位)。
* `load.watch`: スキル フォルダーを監視し、スキル スナップショットを更新します (デフォルト: true)。
* `load.watchDebounceMs`: スキル ウォッチャー イベントのデバウンス (ミリ秒単位) (デフォルト: 250)。
* `install.preferBrew`: 利用可能な場合は brew インストーラーを優先します (デフォルト: true)。
* `install.nodeManager`: ノード インストーラーの設定 (`npm` | `pnpm` | `yarn` | `bun`、デフォルト: npm)。
  これは **スキルのインストール**にのみ影響します。ゲートウェイ ランタイムは依然として Node である必要があります
  (WhatsApp/Telegram には推奨されません)。
* `entries.<skillKey>`: スキルごとのオーバーライド。

スキルごとのフィールド:

* `enabled`: スキルがバンドル/インストールされている場合でもスキルを無効にするには、`false` を設定します。
* `env`: エージェントの実行のために挿入された環境変数 (まだ設定されていない場合のみ)。
* `apiKey`: プライマリ環境変数を宣言するスキルのオプションの利便性。
  プレーンテキスト文字列または SecretRef オブジェクト (`{ source, provider, id }`) をサポートします。

## 注意事項- `entries` の下のキーは、デフォルトでスキル名にマップされます。スキルが定義する場合

`metadata.openclaw.skillKey`、代わりにそのキーを使用してください。

* ウォッチャーが有効になっている場合、スキルへの変更は次のエージェントのターンに反映されます。

### サンドボックス化されたスキル + 環境変数

セッションが **サンドボックス** の場合、スキル プロセスは Docker 内で実行されます。サンドボックス
ホスト `process.env` を継承しません\*\*。

次のいずれかを使用します。

* `agents.defaults.sandbox.docker.env` (またはエージェントごとの `agents.list[].sandbox.docker.env`)
* カスタム サンドボックス イメージに環境をベイク処理します

グローバル `env` および `skills.entries.<skill>.env/apiKey` は **ホスト** の実行にのみ適用されます。
