# 家委助手 P4 UI 改造需求文档

## 一、改造背景

基于主对话中确认的设计风格（青竹班主题），将现有橙色系 UI 全面升级为薄荷绿色系，贴合"南京南站小学 青竹班"品牌视觉。

## 二、设计规范

### 2.1 配色方案

| 用途 | 色值 | Tailwind 类名 | 说明 |
|------|------|-------------|------|
| 主色 | #5EC4A0 | `text-[#5EC4A0]` / `bg-[#5EC4A0]` | 按钮、TabBar 选中、关键操作 |
| 主色深 | #4AA886 | `text-[#4AA886]` | 主色 hover/按压态 |
| 主色浅底 | #E8F5F0 | `bg-[#E8F5F0]` | 标签底色、高亮背景 |
| 页面背景 | #F0F8F4 | `bg-[#F0F8F4]` | 全局页面背景 |
| 卡片背景 | #FFFFFF | `bg-white` | 卡片容器 |
| 文字主色 | #1F2937 | `text-gray-800` | 标题、正文 |
| 文字辅色 | #6B7280 | `text-gray-500` | 说明文字、时间 |
| 成功色 | #10B981 | `text-emerald-500` | 已读、报名成功 |
| 警示色 | #EF4444 | `text-red-500` | 未读、截止提醒 |
| 公告-官方红 | #EF4444 | `bg-red-500` | 官方通知左侧色条 |
| 公告-学科黄 | #F59E0B | `bg-amber-500` | 学科通知左侧色条 |
| 公告-家委蓝 | #3B82F6 | `bg-blue-500` | 家委通知左侧色条 |

### 2.2 字体规范

- 页面大标题：`text-xl font-bold text-gray-800`
- 卡片标题：`text-base font-semibold text-gray-800`
- 正文内容：`text-sm text-gray-700`
- 辅助说明：`text-xs text-gray-500`
- 关键数字：`text-lg font-bold text-[#5EC4A0]`

### 2.3 间距系统

- 页面水平边距：`px-4`
- 卡片间距：`gap-3` 或 `space-y-3`
- 卡片内边距：`p-4`
- 元素间距：`gap-2`
- 区块间距：`space-y-4`

### 2.4 容器样式

- 卡片：`bg-white rounded-2xl p-4 shadow-sm`
- 页面容器：`min-h-full bg-[#F0F8F4]`
- 分组标题：`text-base font-semibold text-gray-800 mb-3`

### 2.5 圆角规范

- 大卡片：`rounded-2xl`（16px）
- 小卡片/按钮：`rounded-xl`（12px）
- 标签/徽章：`rounded-full`
- 头像/Logo：`rounded-full`

### 2.6 阴影规范

- 卡片阴影：`shadow-sm`
- 悬浮/点击态：`shadow-md`
- 弹窗/浮层：`shadow-lg`

## 三、改造范围

### 3.1 全局主题色
- [ ] 更新 `src/app.css` CSS 变量（primary 色值）
- [ ] 更新 `design_guidelines.md` 配色方案
- [ ] 更新 TabBar 选中色（`selectedColor: '#5EC4A0'`）
- [ ] 重新生成 TabBar 图标（薄荷绿色）

### 3.2 启动页（新增）
- [ ] 创建 `pages/splash/index` 页面
- [ ] 展示青竹班 Logo（`/assets/logo.png`）
- [ ] 展示品牌名"家委助手" + 副标题"青竹班"
- [ ] 1.5 秒后自动跳转到首页或引导页
- [ ] 背景使用薄荷绿渐变

### 3.3 首页重构
- [ ] 顶部班级信息卡片（薄荷绿渐变背景 + 班级名 + 角色标签）
- [ ] 三大色块区域：
  - 公告概览（最新公告标题 + 未读数）
  - 活动概览（最近活动 + 报名状态）
  - 班费概览（当前余额）
- [ ] 5宫格快捷入口（公告、活动、班费、排班、名单）
- [ ] 待办事项区（待确认公告 + 即将截止活动）
- [ ] 底部 TabBar 保持 5 个 tab

### 3.4 全局组件统一
- [ ] Button 组件：主色按钮使用薄荷绿
- [ ] Card 组件：统一圆角 `rounded-2xl` + `shadow-sm`
- [ ] Badge 组件：状态标签颜色统一
- [ ] 所有页面的 `bg-orange-50` / `bg-amber-50` 替换为 `bg-[#F0F8F4]`
- [ ] 所有 `text-orange-500` / `bg-orange-500` 替换为薄荷绿
- [ ] 所有 `from-orange-500 to-orange-400` 渐变替换为薄荷绿渐变

## 四、实施批次

### 第 1 批：全局主题色
- 更新 CSS 变量、design_guidelines.md、TabBar 配置、重新生成图标

### 第 2 批：启动页
- 创建 splash 页面，配置为首页入口

### 第 3 批：首页重构
- 重写首页布局（三大色块 + 5宫格 + 待办区）

### 第 4 批：全局组件样式统一
- 批量替换所有页面中的橙色系类名为薄荷绿色系

## 五、验收标准

- [ ] `pnpm validate` 通过（lint + tsc 无 error）
- [ ] `pnpm build:weapp` 编译成功
- [ ] `pnpm build:web` 编译成功
- [ ] 全局主色为薄荷绿 #5EC4A0
- [ ] 页面背景为 #F0F8F4
- [ ] 启动页正常展示 Logo 并自动跳转
- [ ] 首页三大色块 + 5宫格布局正确
- [ ] TabBar 图标为薄荷绿色
