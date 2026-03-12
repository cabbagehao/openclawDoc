# Japanese Metadata SEO Rollout

## Goal

- 为当前日文主站的全部文档页补齐 `description`
- 逐页根据实际内容优化 `title`
- 保留现有 `summary`，不破坏现有脚本和翻译流程
- 让 Mint 在线上正确输出 `meta description`

## Baseline

- 当前文档页总数: `353`
- 当前 `summary` 页面数: `354` 次匹配（含少量重复统计来源）
- 当前 `description` 页面数: `15`
- 当前 Mint 版本: `4.2.424`
- 当前确认结论: Mint 运行时读取 `description` 生成 `meta description`，不会自动把 `summary` 映射为 `description`

## Metadata Rules

### Description

- 默认规则: 不以 `summary` 为基础直接复制，必须根据页面内容重写
- 信息来源:
  - frontmatter
  - 页面各级标题
  - 正文前部的核心说明段落
- 长度目标: `90-155` 字符为主，避免极短描述
- 写法要求:
  - 概述页面内容，说明用户在该页能获得什么
  - 以吸引点击和提升可理解性为目标
  - 不要求刻意堆砌 SEO 关键词
  - 避免“入口”“概要”“说明文档”这类过空表述
  - 除跳转页外，不要只写迁移提示

### Title

- 不强制以 `OpenClaw` 结尾
- 长度目标: `50-60` 字符优先
- 写法要求:
  - 以页面核心主题词和搜索词为主
  - 体现页面解决的问题、对象或平台
  - 不要只保留过短标题，如 `Docker`、`Telegram`、`FAQ`
  - 不要机械复制正文首段
  - 同类页面保持目录内风格一致

### Suggested Patterns

- `install/*`: `<手段> で OpenClaw を導入する方法`
- `providers/*`: `<Provider/Model> の設定方法`
- `channels/*`: `<Platform> 連携ガイド`
- `cli/*`: ``<command>` コマンドの使い方`
- `concepts/*`: `<概念名> の仕組みと設定`
- `help/*`: `<課題/FAQ> と解決方法`

## Execution Order

### Phase 1: Highest SEO Value

- [ ] Root pages (`13`)
- [ ] `start/**` (`14`)
- [ ] `install/**` (`20`)
- [ ] `providers/**` (`29`)
- [ ] `channels/**` (`29`)
- [ ] `gateway/**` (`33`)
- [ ] `help/**` (`7`)

Focus:

- 首页、入门、安装、渠道、模型供应商、核心网关页优先
- 这些页面先人工逐页阅读内容，再写 `description`
- 同时重写过短 `title`

### Phase 2: Core Product Docs

- [ ] `concepts/**` (`27`)
- [ ] `tools/**` (`29`)
- [ ] `platforms/**` (`27`)
- [ ] `nodes/**` (`9`)
- [ ] `automation/**` (`8`)
- [ ] `web/**` (`5`)

Focus:

- 强化“用户问题 -> 页面答案”的表述
- title 更偏任务导向，避免纯分类名

### Phase 3: Long Tail / Reference

- [ ] `cli/**` (`47`)
- [ ] `reference/**` (`26`)
- [ ] `plugins/**` (`5`)
- [ ] `security/**` (`4`)
- [ ] `debug/**` (`1`)
- [ ] `design/**` (`1`)
- [ ] `diagnostics/**` (`1`)

Focus:

- `cli/**` 保持命令风格统一
- `reference/**` 保持精确，不要营销化
- `security/**` 和 `debug/**` 优先保留技术准确性

### Phase 4: Low-Priority Internal/Planning Docs

- [ ] `experiments/**` (`12`)
- [ ] `refactor/**` (`6`)

Focus:

- 这批页面默认搜索价值较低
- 先补 `description`
- title 以准确为先，不刻意追求搜索流量词

## Page-by-Page Workflow

For each page:

1. 读取 frontmatter 与正文前 `30-80` 行
2. 阅读页面各级标题，确认真实主题与用户意图
3. 判断当前 `summary` 是否准确，仅作为参考，不直接复用
4. 根据正文内容重写 `description`
5. 根据页面核心主题词优化 `title`
6. 保留 `summary`，除非它明显错误
7. 记录是否属于以下特殊情况:
   - 跳转页
   - Hub / index 页
   - 命令参考页
   - 设计/提案/实验页

## Special Cases

- `start/quickstart.md`
  - 当前是迁移提示页
  - `description` 需要明确它指向哪里
- `index.md`
  - 单独重写 title 和 description，不使用默认模板
- `faq.md`
  - title 不能只写 `FAQ`
- `cli/**`
  - title 以命令名 + “コマンドリファレンス” 为主
- `experiments/**` / `refactor/**`
  - 不强求商业 SEO，但 metadata 仍要完整

## Acceptance Criteria

- [ ] 全部 `353` 个页面具备 `description`
- [ ] 不再出现只有 `summary` 没有 `description` 的页面
- [ ] 首页和高价值目录页的 title 体现核心主题词，长度尽量落在 `50-60` 字符
- [ ] 抽样验证 `localhost:3000/`、`/install/docker`、`/providers/bedrock`、`/channels/telegram`、`/help/faq` 已输出:
  - `<meta name="description">`
  - `og:description`
  - `twitter:description`
- [ ] 增加仓库检查，防止以后再漏 `description`

## Follow-up Automation

- [ ] 新增脚本: 检查所有页面是否缺少 `description`
- [ ] 新增脚本: 标记过短或过长 title
- [ ] 新增脚本: 标记重复 title
- [ ] 可选: 先产出 title/description 候选，再人工审核高价值页面

## Notes

- 不要修改 Mint 本地安装包，避免“本地有效、线上无效”
- 不要删除 `summary`，因为现有仓库脚本和翻译流程仍在使用它
- 本计划的最终目标是: `summary` 继续作为内部摘要字段，`description` 成为线上 SEO 输出字段
- `title` 以主题词和搜索意图为主，不要求统一品牌后缀
