---
summary: "OpenClaw 用 VPS ホスティング ハブ (Oracle/Fly/Hetzner/GCP/exe.dev)"
read_when:
  - ゲートウェイをクラウドで実行したい
  - VPS/ホスティング ガイドの簡単な地図が必要です
title: "VPSホスティング"
x-i18n:
  source_hash: "f318a6f719121da27565de9f9869235b77d4b5ef05b86a11be82933da579e459"
---
このハブは、サポートされている VPS/ホスティング ガイドにリンクしており、クラウドの利用方法について説明しています。
導入は高いレベルで機能します。

## プロバイダーを選択してください

- **鉄道** (ワンクリック + ブラウザ設定): [鉄道](/install/railway)
- **ノースフランク** (ワンクリック + ブラウザ設定): [ノースフランク](/install/northflank)
- **Oracle Cloud (常時無料)**: [Oracle](/platforms/oracle) — 月額 0 ドル (常時無料、ARM、容量/サインアップは難しい場合があります)
- **Fly.io**: [Fly.io](/install/fly)
- **ヘッツナー (Docker)**: [ヘッツナー](/install/hetzner)
- **GCP (コンピューティング エンジン)**: [GCP](/install/gcp)
- **exe.dev** (VM + HTTPS プロキシ): [exe.dev](/install/exe-dev)
- **AWS (EC2/Lightsail/無料利用枠)**: もうまく機能します。ビデオガイド:
  [https://x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)

## クラウド設定の仕組み

- **ゲートウェイは VPS** 上で実行され、状態とワークスペースを所有します。
- **コントロール UI** または **Tailscale/SSH** を介してラップトップ/電話から接続します。
- VPS を信頼できる情報源として扱い、状態とワークスペースを **バックアップ**します。
- 安全なデフォルト: ゲートウェイをループバックに保ち、SSH トンネルまたは Tailscale Serve 経由でアクセスします。
  `lan`/`tailnet` にバインドする場合は、`gateway.auth.token` または `gateway.auth.password` が必要です。

リモート アクセス: [ゲートウェイ リモート](/gateway/remote)  
プラットフォーム ハブ: [プラットフォーム](/platforms)

## VPS 上の共有会社エージェントこれは、ユーザーが 1 つの信頼境界内 (たとえば、1 つの企業チーム) に属し、エージェントがビジネス専用である場合に有効な設定です

- 専用ランタイム (VPS/VM/コンテナ + 専用 OS ユーザー/アカウント) 上に保持します。
- そのランタイムを個人の Apple/Google アカウントまたは個人のブラウザ/パスワード マネージャー プロファイルにサインインしないでください。
- ユーザーが互いに敵対する場合は、ゲートウェイ/ホスト/OS ユーザーごとに分割します。

セキュリティ モデルの詳細: [セキュリティ](/gateway/security)

## VPS でノードを使用する

ゲートウェイをクラウドに保持し、ローカル デバイス上で **ノード** をペアリングできます
(Mac/iOS/Android/ヘッドレス)。ノードはローカル画面/カメラ/キャンバスと `system.run` を提供します
ゲートウェイがクラウド上にある間も、これらの機能を利用できます。

ドキュメント: [ノード](/nodes)、[ノード CLI](/cli/nodes)

## 小規模な VM および ARM ホストの起動チューニング

低電力 VM (または ARM ホスト) で CLI コマンドが遅いと感じる場合は、ノードのモジュール コンパイル キャッシュを有効にします。

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` は、コマンドの繰り返し起動時間を短縮します。
- `OPENCLAW_NO_RESPAWN=1` は、自己リスポーン パスによる余分な起動オーバーヘッドを回避します。
- 最初のコマンド実行によりキャッシュがウォーム化されます。以降の実行は高速になります。
- Raspberry Pi の詳細については、[Raspberry Pi](/platforms/raspberry-pi) を参照してください。

### systemd チューニング チェックリスト (オプション)

`systemd` を使用する VM ホストの場合は、次のことを考慮してください。- 安定した起動パス用のサービス環境を追加します。

- `OPENCLAW_NO_RESPAWN=1`
- `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 再起動動作を明示的に保ちます。
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- ランダム I/O コールド スタート ペナルティを軽減するために、ステート/キャッシュ パスには SSD バックアップ ディスクを優先します。

例:

```bash
sudo systemctl edit openclaw
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

`Restart=` ポリシーが自動リカバリにどのように役立つか:
[systemd はサービスの回復を自動化できます](https://www.redhat.com/en/blog/systemd-automate-recovery)。
