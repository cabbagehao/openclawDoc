---
title: "OpenClawのTOOLSテンプレート用途・記述ルール・設定例"
summary: "TOOLS.md のワークスペース テンプレート"
read_when:
description: "スキルはツールがどのように機能するかを定義します。このファイルは、your の仕様、つまりセットアップに固有のものです。ここに何が入るのか、例、Camerasを確認できます。"
x-i18n:
  source_hash: "eed204d57e7221ae0455a87272da2b0730d6aee6ddd2446a851703276e4a96b7"
---
スキルはツールがどのように機能するかを定義します。このファイルは、_your_ の仕様、つまりセットアップに固有のものです。

## ここに何が入るのか

次のようなもの:

- カメラの名前と場所
- SSH ホストとエイリアス
- TTS の優先音声
- スピーカー/ルーム名
- デバイスのニックネーム
- 環境固有のもの

## 例

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## なぜ別れるのですか?

スキルは共有されます。あなたのセットアップはあなたのものです。それらを分離すると、メモを失うことなくスキルを更新でき、インフラストラクチャを漏らすことなくスキルを共有できます。

---

仕事に役立つものは何でも追加してください。これはカンニングペーパーです。
