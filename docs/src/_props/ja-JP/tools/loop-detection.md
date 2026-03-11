---
title: "ツールループの検出"
description: "Configure optional guardrails for preventing repetitive or stalled tool-call loops"
summary: "反復的なツール呼び出しループを検出するガードレールを有効にして調整する方法"
read_when:
  - ユーザーから、エージェントがツール呼び出しを繰り返してスタックしていると報告されました。
  - 反復通話保護を調整する必要がある
  - エージェント ツール/ランタイム ポリシーを編集しています
x-i18n:
  source_hash: "5a1ac7541b178213cac587f5bdff19389b88c0f9425b325adc69c84c8707fdfd"
---

# ツールループの検出

OpenClaw は、エージェントが繰り返しのツール呼び出しパターンに陥るのを防ぐことができます。
ガードは **デフォルトでは無効になっています**。

厳密な設定を使用すると正当な繰り返し呼び出しをブロックできるため、必要な場合にのみ有効にします。

## これが存在する理由

* 進行しない反復シーケンスを検出します。
* 高頻度の結果のないループ (同じツール、同じ入力、繰り返されるエラー) を検出します。
* 既知のポーリング ツールの特定の繰り返し通話パターンを検出します。

## 構成ブロック

グローバルデフォルト:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

エージェントごとのオーバーライド (オプション):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### フィールドの動作

* `enabled`: マスター スイッチ。 `false` は、ループ検出が実行されないことを意味します。
* `historySize`: 分析のために保存されている最近のツール呼び出しの数。
* `warningThreshold`: パターンを警告のみとして分類する前のしきい値。
* `criticalThreshold`: 反復ループ パターンをブロックするためのしきい値。
* `globalCircuitBreakerThreshold`: グローバルな進行状況なしブレーカーのしきい値。
* `detectors.genericRepeat`: 繰り返される同じツール + 同じパラメータのパターンを検出します。
* `detectors.knownPollNoProgress`: 状態変化のない既知のポーリングのようなパターンを検出します。
* `detectors.pingPong`: 交互のピンポン パターンを検出します。

## 推奨されるセットアップ- `enabled: true` で始まり、デフォルトは変更されません

* しきい値を `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold` として順序付けします。
* 誤検知が発生した場合:
  * `warningThreshold` および/または `criticalThreshold` を発生させます
  * (オプションで) `globalCircuitBreakerThreshold` を発生させます
  * 問題の原因となっている検出器のみを無効にします
  * 厳密性の低い歴史的コンテキストのために `historySize` を削減します

## ログと予期される動作

ループが検出されると、OpenClaw はループ イベントを報告し、重大度に応じて次のツール サイクルをブロックまたは抑制します。
これにより、通常のツールへのアクセスを維持しながら、ユーザーをトークンの暴走やロックアップから保護します。

* 警告と一時的な抑制を優先します。
* 繰り返しの証拠が蓄積された場合にのみエスカレーションします。

## 注意事項

* `tools.loopDetection` はエージェント レベルのオーバーライドとマージされます。
* エージェントごとの設定は、グローバル値を完全に上書きまたは拡張します。
* 構成が存在しない場合、ガードレールはオフのままになります。
