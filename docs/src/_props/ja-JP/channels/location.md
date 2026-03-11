---
summary: "インバウンドチャンネルの位置情報解析（Telegram + WhatsApp）とコンテキストフィールド"
read_when:
  - チャンネルの位置情報解析を追加または変更する場合
  - エージェントプロンプトやツールで位置情報コンテキストフィールドを使用する場合
title: "チャンネル位置情報解析"
x-i18n:
  source_path: "channels/location.md"
  source_hash: "5602ef105c3da7e47497bfed8fc343dd8d7f3c019ff7e423a08b25092c5a1837"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T06:39:47.852Z"
---

# チャンネル位置情報解析

OpenClawは、チャットチャンネルから共有された位置情報を以下のように正規化します：

* インバウンドボディに追加される人間が読みやすいテキスト
* 自動返信コンテキストペイロード内の構造化フィールド

現在サポートされているもの：

* **Telegram**（位置情報ピン + 場所 + ライブ位置情報）
* **WhatsApp**（locationMessage + liveLocationMessage）
* **Matrix**（`geo_uri`を含む`m.location`）

## テキストフォーマット

位置情報は括弧なしのわかりやすい行として表示されます：

* ピン：
  * `📍 48.858844, 2.294351 ±12m`
* 名前付きの場所：
  * `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
* ライブ共有：
  * `🛰 Live location: 48.858844, 2.294351 ±12m`

チャンネルにキャプション/コメントが含まれている場合、次の行に追加されます：

```
📍 48.858844, 2.294351 ±12m
Meet here
```

## コンテキストフィールド

位置情報が存在する場合、以下のフィールドが`ctx`に追加されます：

* `LocationLat`（数値）
* `LocationLon`（数値）
* `LocationAccuracy`（数値、メートル単位；オプション）
* `LocationName`（文字列；オプション）
* `LocationAddress`（文字列；オプション）
* `LocationSource`（`pin | place | live`）
* `LocationIsLive`（真偽値）

## チャンネルに関する注意事項

* **Telegram**：場所は`LocationName/LocationAddress`にマッピングされます；ライブ位置情報は`live_period`を使用します。
* **WhatsApp**：`locationMessage.comment`と`liveLocationMessage.caption`はキャプション行として追加されます。
* **Matrix**：`geo_uri`はピン位置情報として解析されます；高度は無視され、`LocationIsLive`は常にfalseです。
