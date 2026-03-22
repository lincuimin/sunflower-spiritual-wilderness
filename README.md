# 向日葵·精神荒野

一个个人网页，支持写作、听歌和 AI 对话。

## 功能特性

- **✍️ 写作** — 创建、编辑、删除文章，数据保存在本地浏览器
- **🎵 听歌** — 内置音乐播放器，支持自定义播放列表
- **🤖 AI 对话** — 与 AI 助手「小葵」聊天（需配置 OpenAI API Key）

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build && npm start
```

## 配置 AI 功能

复制 `.env.local.example` 为 `.env.local` 并填入 OpenAI API Key：

```bash
cp .env.local.example .env.local
```

```env
OPENAI_API_KEY=your_api_key_here
# 可选：自定义 API 地址（兼容 OpenAI 协议的服务）
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_MODEL=gpt-3.5-turbo
```

未配置 API Key 时，AI 会以内置的离线模式回复。

## 技术栈

- [Next.js 16](https://nextjs.org/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- 数据存储：浏览器 localStorage
