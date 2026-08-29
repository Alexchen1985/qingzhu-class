# 家委助手 - 设计指南

## 品牌定位

- 应用定位：小学班级家委会信息整合管理工具
- 设计风格：温暖活泼、卡片式布局、圆角设计
- 目标用户：小学班级家委会成员和普通家长

## 配色方案

| 用途 | Tailwind 类名 | 色值 | 说明 |
|------|-------------|------|------|
| 主色 | `bg-orange-500` / `text-orange-500` | #F97316 | 按钮、TabBar选中、关键操作 |
| 主色浅底 | `bg-orange-50` | #FFF7ED | 卡片高亮背景、标签底色 |
| 辅色 | `bg-blue-500` / `text-blue-500` | #3B82F6 | 信息提示、链接 |
| 页面背景 | `bg-amber-50/30` | #FFFBF5 | 页面整体背景色 |
| 卡片背景 | `bg-white` | #FFFFFF | 卡片容器 |
| 文字主色 | `text-gray-800` | #1F2937 | 标题、正文 |
| 文字辅色 | `text-gray-500` | #6B7280 | 说明文字、时间 |
| 成功色 | `text-emerald-500` / `bg-emerald-50` | #10B981 | 已读、报名成功 |
| 警示色 | `text-red-500` / `bg-red-50` | #EF4444 | 未读、截止提醒 |

## 字体规范

- 页面大标题：`text-xl font-bold text-gray-800`
- 卡片标题：`text-base font-semibold text-gray-800`
- 正文内容：`text-sm text-gray-700`
- 辅助说明：`text-xs text-gray-500`
- 关键数字：`text-lg font-bold text-orange-500`

## 间距系统

- 页面水平边距：`px-4`
- 卡片间距：`gap-3` 或 `space-y-3`
- 卡片内边距：`p-4`
- 元素间距：`gap-2`
- 区块间距：`space-y-4`

## 组件使用原则

- 通用 UI 组件（按钮、输入框、弹窗、Tabs、Toast、Card、Badge 等）统一优先使用 `@/components/ui/*`
- 页面开发前先拆分 UI 单元，再映射到组件库
- 禁止用 View/Text 手搓通用组件

## 容器样式

- 卡片：`bg-white rounded-2xl p-4 shadow-sm`
- 页面容器：`min-h-full bg-amber-50/30`
- 分组标题：`text-base font-semibold text-gray-800 mb-3`

## 导航结构

TabBar 5个页面：
1. 首页（班级动态） - `pages/index/index`
2. 公告 - `pages/notice/index`
3. 活动 - `pages/activity/index`
4. 班费 - `pages/finance/index`
5. 我的 - `pages/profile/index`

注：值日排班作为首页快捷入口进入的独立页面 `pages/duty/index`，通过 navigateTo 跳转。

TabBar 配色：
- 未选中文字：`#9CA3AF`（gray-400）
- 选中文字：`#F97316`（orange-500，主色）
- 背景：`#FFFFFF`

## 状态展示

- 空状态：居中图标 + "暂无数据" 文字，使用 `text-gray-400`
- 加载态：使用 Skeleton 组件
- 状态标签：使用 Badge 组件，不同状态不同颜色

## 小程序约束

- 图片策略：所有图片通过 TOS 对象存储管理
- 性能优化：列表使用虚拟滚动，避免大数据量渲染
- 包体积：合理拆分页面，避免单页面过大
