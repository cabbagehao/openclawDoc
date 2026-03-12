---
summary: "OpenClaw (macOS アプリ) の初回オンボーディングフロー"
read_when:
  - macOS オンボーディングアシスタントの設計時
  - 認証やアイデンティティ設定の実装時
title: "オンボーディング (macOS アプリ)"
sidebarTitle: "オンボーディング: macOS アプリ"
---
このドキュメントでは、**現在の**初回オンボーディングフローについて説明します。目標はスムーズな「1日目 (day 0)」のエクスペリエンスです。Gateway をどこで実行するかを選択し、認証を接続し、ウィザードを実行して、エージェント自体にブートストラップさせます。
オンボーディングパスの概要については、[オンボーディングの概要](/start/onboarding-overview)を参照してください。

<Steps>
<Step title="macOS の警告を承認する">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="ローカルネットワークの検索を承認する">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="ウェルカムとセキュリティ通知">
<Frame caption="表示されたセキュリティ通知を読み、それに応じて決定してください">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

セキュリティトラストモデル:

- デフォルトでは、OpenClaw はパーソナルエージェントです。つまり、1つの信頼できるオペレーターの境界内にあります。
- 共有/マルチユーザーのセットアップでは、ロックダウンが必要です (信頼境界を分割し、ツールへのアクセスを最小限に抑え、[セキュリティ](/gateway/security)に従ってください)。
- 現在、ローカルオンボーディングでは新しい設定のデフォルトが `tools.profile: "coding"` になっているため、新規のローカルセットアップでは、無制限の `full` プロファイルを強制することなく、ファイルシステム/ランタイムツールを維持できます。
- フック/Webhook またはその他の信頼できないコンテンツフィードが有効になっている場合は、強力で最新のモデル層を使用し、厳格なツールポリシー/サンドボックス化を維持してください。

</Step>
<Step title="ローカル vs リモート">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** はどこで実行されますか？

- **この Mac (ローカルのみ):** オンボーディングで認証を設定し、資格情報をローカルに書き込むことができます。
- **リモート (SSH/Tailnet 経由):** オンボーディングではローカルの認証は**設定しません**。資格情報は Gateway ホスト上に存在する必要があります。
- **後で設定する:** セットアップをスキップし、アプリを未設定のままにします。

<Tip>
**Gateway 認証のヒント:**

- 現在のウィザードでは、ループバック用であっても**トークン**が生成されるため、ローカルの WS クライアントは認証する必要があります。
- 認証を無効にすると、任意のローカルプロセスが接続できるようになります。これは完全に信頼できるマシンでのみ使用してください。
- 複数マシンからのアクセスや非ループバックのバインドには、**トークン**を使用してください。

</Tip>
</Step>
<Step title="権限 (Permissions)">
<Frame caption="OpenClaw に付与する権限を選択してください">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

オンボーディングでは、以下に必要な TCC (Transparency, Consent, and Control) 権限を要求します:

- オートメーション (AppleScript)
- 通知
- アクセシビリティ
- 画面収録
- マイク
- 音声認識
- カメラ
- 位置情報

</Step>
<Step title="CLI">
  <Info>このステップはオプションです</Info>
  アプリは、ターミナルのワークフローや launchd タスクがすぐに機能するように、npm/pnpm を介してグローバルの `openclaw` CLI をインストールできます。
</Step>
<Step title="オンボーディングチャット (専用セッション)">
  セットアップ後、アプリは専用のオンボーディングチャットセッションを開き、エージェントが自己紹介を行い、次のステップを案内できるようにします。これにより、初回起動のガイダンスと通常の会話が分離されます。最初のエージェント実行時に Gateway ホストで何が起こるかについては、[ブートストラップ](/start/bootstrapping)を参照してください。
</Step>
</Steps>
