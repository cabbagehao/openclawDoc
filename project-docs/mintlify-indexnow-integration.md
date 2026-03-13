# Mintlify & IndexNow 搜索引擎推送集成方案

在集成 IndexNow 以将 Mintlify 文档自动推送到 Bing 等搜索引擎时，由于 Mintlify 自身的一些架构限制，我们会遇到几个难点。本文档记录了针对这些限制的最终解决方案（“SVG 伪装法”）。

## 问题背景

IndexNow 的标准验证流程要求你在网站根目录下放置一个与密钥同名的 `.txt` 文件（例如 `key.txt`），其内容必须**仅包含**密钥字符串。

但在 Mintlify 中直接实现这一标准流程会遇到以下三个阻碍：

1. **根目录文本文件拦截**：Mintlify 默认拒绝直接托管根目录的纯文本 `.txt` 文件。它要么尝试将其解析为需要编译的 Markdown/MDX 页面，要么直接返回 404。
2. **Markdown 页面验证失败**：如果我们将密钥写入 `.md` 文件并利用 Mintlify 的路由或者在 `docs.json` 中配置重定向将 `.txt` 请求导向该页面，虽然页面能加载，但 Mintlify 会在响应中包裹完整的 HTML 标签（`<html><body>...`）。IndexNow 的爬虫非常严格，一旦读取到 HTML 标签便会验证失败（返回 403 Forbidden）。
3. **子目录权限降级**：Mintlify 允许在 `assets/` 文件夹下存放静态文件。如果我们将 `key.txt` 放入 `assets/`，文件确实可以被直接访问。但是，根据 IndexNow 的安全规范，子目录中的验证文件**只能赋予提交该子目录下 URL 的权限**（即只能提交 `/assets/*`）。如果尝试提交根目录或其他路径的文档 URL，IndexNow 接口会返回 `422 Unprocessable Entity`。

## 解决方案：“SVG 伪装法”

为了绕过 Mintlify 对静态文件的过滤，同时满足 IndexNow 对根目录文件和纯文本内容的严苛要求，我们采取了如下技巧：

1. **生成密钥**：生成一个标准的 32 位 Hex 字符串作为 IndexNow 密钥（当前使用的是 `aaee62069928a24e1781403d61296f62`）。
2. **伪装文件类型**：在文档的根目录下创建一个扩展名为 `.svg` 的文件（即 `aaee62069928a24e1781403d61296f62.svg`）。
3. **写入纯文本**：在这个 `.svg` 文件中，**不写入任何 SVG/XML 标签**，仅仅写入纯文本的密钥字符串。
4. **利用 Mintlify 的白名单**：Mintlify 的构建系统允许 `.svg` 图片素材直接放置在根目录并原样输出。因此，它会原封不动地在 `https://openclawdoc.org/aaee62069928a24e1781403d61296f62.svg` 暴露我们的密钥。
5. **指定 `keyLocation`**：在向 IndexNow 发送 POST 请求时，我们显式在 JSON Payload 中带上 `keyLocation` 参数，指向我们的 `.svg` 文件地址。

### 请求示例 Payload
```json
{
  "host": "openclawdoc.org",
  "key": "aaee62069928a24e1781403d61296f62",
  "keyLocation": "https://openclawdoc.org/aaee62069928a24e1781403d61296f62.svg",
  "urlList": [
    "https://openclawdoc.org/",
    "https://openclawdoc.org/start/getting-started"
  ]
}
```

由于文件确切存在于根目录（拥有整站提交权限），且其响应内容干干净净只有密钥，IndexNow 的爬虫会完美验证通过（返回 200/202 状态码）。

## 自动提交脚本

我们在项目根目录提供了 `scripts/submit-indexnow.ts` 脚本用于自动提交。它会自动：
1. 请求线上的 `sitemap.xml` 
2. 提取所有的有效 URL
3. 按照每批 50 个的上限分批推送给 IndexNow 接口

### 运行方式

在项目根目录下，执行以下命令：
```bash
# 在 CI 环境下或手动设置环境变量绕过本地限制
CI=true pnpm docs:indexnow
```

（该命令已在 `package.json` 的 `scripts` 中配置）

> **注意**：如果未来需要更换 IndexNow 密钥，请务必同步更新根目录下的 `.svg` 文件名及其内部内容，以及 `scripts/submit-indexnow.ts` 中的 `INDEXNOW_KEY` 常量。
