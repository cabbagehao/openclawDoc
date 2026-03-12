---
summary: "WSL2 ゲートウェイ + Windows Chrome リモート CDP およびレイヤー内の拡張リレー設定のトラブルシューティング"
read_when:
  - Chrome が Windows 上で動作している間に WSL2 で OpenClaw Gateway を実行する
  - WSL2 と Windows 間でブラウザ/コントロール UI エラーが重複して表示される
  - 分割ホスト設定で生のリモート CDP と Chrome 拡張機能リレーのどちらを使用するかを決定する
title: "OpenClawのWSL2・Windows間リモートChrome CDP接続トラブル対処ガイド"
description: "このガイドでは、次のような一般的な分割ホスト設定について説明します。また、問題 #39369 の階層化された障害パターンについても説明しています。複数の独立した問題が一度に発生する可能性があり、間違ったレイヤーが最初に壊れているように見えます。"
x-i18n:
  source_hash: "c41349ed0c61ff7f8d828fd98cbfbcbceb8e7867e7a94ead07d6b2962d82ec59"
---
このガイドでは、次のような一般的な分割ホスト設定について説明します。

- OpenClaw ゲートウェイは WSL2 内で実行されます
- Chrome は Windows 上で動作します
- ブラウザ制御は WSL2/Windows の境界を越える必要があります

また、[問題 #39369](https://github.com/openclaw/openclaw/issues/39369) の階層化された障害パターンについても説明しています。複数の独立した問題が一度に発生する可能性があり、間違ったレイヤーが最初に壊れているように見えます。

## 最初に適切なブラウザ モードを選択してください

有効なパターンは 2 つあります。

### オプション 1: 未加工のリモート CDP

WSL2 から Windows Chrome CDP エンドポイントを指すリモート ブラウザー プロファイルを使用します。

次の場合にこれを選択します。

- ブラウザ制御のみが必要です
- Chrome リモート デバッグを WSL2 に公開することに慣れている
- Chrome 拡張機能リレーは必要ありません

### オプション 2: Chrome 拡張機能リレー

組み込みの `chrome` プロファイルと OpenClaw Chrome 拡張機能を使用します。

次の場合にこれを選択します。

- ツールバー ボタンを使用して既存の Windows Chrome タブに接続したい場合
- 生の `--remote-debugging-port` ではなく、拡張機能ベースの制御が必要な場合
- リレー自体は WSL2/Windows の境界を越えて到達可能である必要があります

名前空間間で拡張機能リレーを使用する場合、`browser.relayBindHost` は、[ブラウザ](/tools/browser) および [Chrome 拡張機能](/tools/chrome-extension) で導入された重要な設定です。

## 実用的なアーキテクチャ

参考形状：- WSL2 は `127.0.0.1:18789` でゲートウェイを実行します

- Windows は、`http://127.0.0.1:18789/` で通常のブラウザーでコントロール UI を開きます。
- Windows Chrome はポート `9222` で CDP エンドポイントを公開します
- WSL2 は Windows CDP エンドポイントに到達できます
- OpenClaw は、WSL2 から到達可能なアドレスでブラウザー プロファイルをポイントします。

## この設定がわかりにくい理由

いくつかの障害が重なる可能性があります。

- WSL2 が Windows CDP エンドポイントに到達できない
- コントロール UI が安全でないオリジンから開かれている
- `gateway.controlUi.allowedOrigins` はページの原点と一致しません
- トークンまたはペアリングがありません
- ブラウザのプロファイルが間違ったアドレスを指している
- 実際にクロスネームスペースアクセスが必要な場合、拡張リレーは依然としてループバックのみです

そのため、1 つのレイヤーを修正しても、別のエラーが表示されたままになる可能性があります。

## コントロール UI の重要なルール

UI が Windows から開かれる場合は、意図的な HTTPS セットアップがない限り、Windows localhost を使用します。

使用:

`http://127.0.0.1:18789/`

コントロール UI の LAN IP をデフォルトにしないでください。 LAN またはテールネット アドレス上のプレーン HTTP は、CDP 自体とは関係のない、安全でない発信元/デバイス認証の動作を引き起こす可能性があります。 [コントロール UI](/web/control-ui) を参照してください。

## レイヤー内で検証する

上から下へ作業します。スキップしないでください。

### レイヤ 1: Chrome が Windows 上で CDP を提供していることを確認する

リモート デバッグを有効にして Windows 上で Chrome を起動します。

```powershell
chrome.exe --remote-debugging-port=9222
```

Windows からは、まず Chrome 自体を確認します。

````powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```Windows でこれが失敗した場合、OpenClaw はまだ問題ではありません。

### レイヤ 2: WSL2 が Windows エンドポイントに到達できることを確認する

WSL2 から、`cdpUrl` で使用する予定の正確なアドレスをテストします。

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
````

良い結果:

- `/json/version` は、ブラウザー/プロトコル バージョンのメタデータを含む JSON を返します
- `/json/list` は JSON を返します (ページが開いていない場合は空の配列でも問題ありません)

これが失敗した場合:

- Windows はまだポートを WSL2 に公開していません
- WSL2側のアドレスが間違っています
- ファイアウォール/ポート転送/ローカルプロキシがまだありません

OpenClaw 設定に触れる前に修正してください。

### レイヤ 3: 正しいブラウザ プロファイルを構成する

未加工のリモート CDP の場合、WSL2 から到達可能なアドレスを OpenClaw に指定します。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

注:

- Windows でのみ動作するものではなく、WSL2 で到達可能なアドレスを使用してください
- 外部管理ブラウザの場合は `attachOnly: true` を保持します
- OpenClaw が成功することを期待する前に、同じ URL を `curl` でテストします。

### レイヤ 4: 代わりに Chrome 拡張機能リレーを使用する場合

ブラウザ マシンとゲートウェイが名前空間の境界によって分離されている場合、リレーには非ループバック バインド アドレスが必要になる場合があります。

例:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "chrome",
    relayBindHost: "0.0.0.0",
  },
}
```

これは必要な場合にのみ使用してください。

- リレーはループバックのみであるため、デフォルトの動作の方が安全です
- `0.0.0.0` は露出面を拡大します
- ゲートウェイ認証、ノードペアリング、周囲のネットワークをプライベートに保ちます拡張リレーが必要ない場合は、上記の未加工のリモート CDP プロファイルを優先してください。

### レイヤ 5: コントロール UI レイヤを個別に確認する

Windows から UI を開きます。

`http://127.0.0.1:18789/`

次に、次のことを確認します。

- ページのオリジンが `gateway.controlUi.allowedOrigins` が期待するものと一致します
- トークン認証またはペアリングが正しく構成されている
- コントロール UI 認証の問題をブラウザーの問題であるかのようにデバッグしていない

役立つページ:

- [コントロールUI](/web/control-ui)

### レイヤ 6: エンドツーエンドのブラウザ制御を検証する

WSL2から:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

延長リレーの場合：

```bash
openclaw browser tabs --browser-profile chrome
```

良い結果:

- Windows Chromeでタブが開きます
- `openclaw browser tabs` はターゲットを返します
- 後のアクション (`snapshot`、`screenshot`、`navigate`) は同じプロファイルから機能します

## よくある誤解を招くエラー

各メッセージをレイヤー固有の手掛かりとして扱います。

- `control-ui-insecure-auth`
  - CDP トランスポートの問題ではなく、UI オリジン / セキュア コンテキストの問題
- `token_missing`
  - 認証設定の問題
- `pairing required`
  - デバイス承認の問題
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 は構成された `cdpUrl` に到達できません
- `gateway timeout after 1500ms`
  - 多くの場合、まだ CDP に到達可能であるか、リモート エンドポイントが遅い/到達不能である
- `Chrome extension relay is running, but no tab is connected`
  - 拡張リレー プロファイルが選択されましたが、添付されたタブはまだ存在しません

## 迅速なトリアージ チェックリスト1. Windows: `curl http://127.0.0.1:9222/json/version` は機能しますか?

2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` は機能しますか?
3. OpenClaw 構成: `browser.profiles.<name>.cdpUrl` は、WSL2 で到達可能なその正確なアドレスを使用しますか?
4. コントロール UI: LAN IP の代わりに `http://127.0.0.1:18789/` を開いていませんか?
5. 拡張リレーのみ: `browser.relayBindHost` は実際に必要ですか? 必要な場合は明示的に設定されますか?

## 実践的なポイント

通常、セットアップは実行可能です。難しいのは、ブラウザー トランスポート、コントロール UI オリジン セキュリティ、トークン/ペアリング、および拡張リレー トポロジが、ユーザー側からは同じように見えても、それぞれ独立して失敗する可能性があることです。

疑問がある場合:

- 最初に Windows Chrome エンドポイントをローカルで確認します
- WSL2 から同じエンドポイントを 2 番目に検証します。
- その後のみ、OpenClaw 構成またはコントロール UI 認証をデバッグします
