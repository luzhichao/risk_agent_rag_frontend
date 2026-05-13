# Risk Agent Frontend

基于 Vue 3 + TypeScript + Element Plus 的安全隐患识别智能问答系统前端。

## 效果演示

https://github.com/luzhichao/risk_agent_frontend/assets/1.mp4

## 功能设计

### 认证模块

| 功能 | 说明 |
|------|------|
| 用户注册 | 用户名 + 密码 + 确认密码 + 手机号 + 邮箱 |
| 用户登录 | 用户名 + 密码 |
| Token存储 | localStorage 持久存储 |
| 表单验证 | 前端格式校验 + 后端错误友好展示 |

### 页面设计

| 页面 | 路由 | 布局 |
|------|------|------|
| 登录页 | /login | PC左右分栏，移动端堆叠 |
| 注册页 | /register | 与登录页一致 |

### 技术架构

```
src/
├── services/
│   └── auth.ts          # 登录注册API封装
├── stores/
│   └── auth.ts          # 用户状态管理(Pinia)
├── views/
│   ├── LoginView.vue    # 登录页
│   └── RegisterView.vue # 注册页
└── router/
    └── index.ts         # 路由配置
```

### 项目结构

```
src/
├── assets/          → 静态CSS资源
├── components/      → Vue UI组件
│   └── icons/       → 图标组件
├── composables/     → Vue组合式函数
├── router/          → Vue Router配置
├── stores/          → Pinia状态管理
│   └── auth.ts      # 认证状态管理
├── services/        → API服务层
│   └── auth.ts      # 认证API封装
└── views/           → 页面级组件
    ├── LoginView.vue
    └── RegisterView.vue
```

## 开发命令

```sh
npm run dev      # 开发服务器
npm run build    # 生产构建
npm run preview  # 预览构建
npm run type-check # TypeScript检查
```

## 后端接口

- 基础URL: http://127.0.0.1:8000
- 注册: POST /api/v1/system/register
- 登录: POST /api/v1/system/login
- 问答: POST /api/v1/chat/ask

## 登录参考
https://github.com/katavii/animated-login
https://github.com/opscolin/animated-login-vue
