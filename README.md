# Salesforce OAuth Demo

本应用程序展示了与 Salesforce 的 OAuth 2.0 集成，支持全球和中国实例

## 项目结构

```
server
├── .env
├── app.js
├── bin
│   └── www
├── package-lock.json
├── package.json
├── public
│   ├── images
│   ├── javascripts
│   └── stylesheets
│       └── style.css
├── routes
│   └── auth.routes.js
├── utils
│   └── auth.service.js
└── views
    ├── error.pug
    ├── index.pug
    └── layout.pug
client
├── .gitignore
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── public
│   └── vite.svg
├── src
│   ├── App.css
│   ├── App.jsx
│   ├── assets
│   │   ├── react.svg
│   │   ├── sf.png
│   │   └── sfoa.png
│   ├── components
│   │   ├── EnvironmentSelector.jsx
│   │   └── Layout.jsx
│   ├── config
│   │   └── environments.js
│   ├── context
│   │   └── AuthContext.jsx
│   ├── index.css
│   ├── main.jsx
│   └── pages
│       ├── Dashboard.jsx
│       └── HomePage.jsx
└── vite.config.js

```

## 本地部署步骤

### 前提条件

-   Node.js 20.x
-   npm 10.x
-   Redis

有关在本地安装 Redis 的具体说明，请参考[此处](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/)。

### 1. Fork 和克隆

1. Fork 此仓库
2. 在本地克隆您的 fork 仓库

### 2. 创建两个外部客户端应用程序

对 Salesforce 和阿里云上的 Salesforce 实例重复此步骤

1. 登录您的 Salesforce 组织
2. 进入设置 > 应用程序 > 应用程序管理器
3. 点击"新建连接应用程序"并选择"创建外部客户端应用程序"
4. 填写基本信息
5. 启用 OAuth 设置
6. 将回调 URL 设置为`http://localhost:3000/auth/salesforce/callback`
7. 添加以下 OAuth 范围：
    - 访问和管理您的数据(api)
    - 访问您的基本信息(id, profile, email, address, phone)
    - 随时执行请求(refresh_token, offline_access)
8. 保存应用程序
9. 复制您的消费者密钥(客户端 ID)和消费者密钥

### 3. 在 server 目录中创建一个.env 文件，包含以下详细信息

    ```
    SESSION_SECRET=your-random-secret-key
    SF_CLIENT_ID=your-salesforce-client-id
    SF_CLIENT_SECRET=your-salesforce-client-secret
    SFOA_CLIENT_ID=your-salesforce-on-alibaba-cloud-client-id
    SFOA_CLIENT_SECRET=your-salesforce-on-alibaba-cloud-client-secret
    SF_CALLBACK_URL=http://localhost:3000/auth/salesforce/callback
    SF_LOGIN_URL=https://login.salesforce.com
    SFOA_LOGIN_URL=https://login.sfcrmproducts.cn
    REDIS_URL=your-redis-connection-string
    NODE_ENV=production

    ```

### 4. 运行应用程序

要同时启动前端和后端，从项目根目录运行

```bash
npm run dev
```

这将启动：

-   后端服务器在 http://localhost:3000
-   前端开发服务器在 http://localhost:5173

#### 分别运行前端和后端

```bash
# 仅启动后端
npm run dev:server

# 仅启动前端
npm run dev:client
```

## 许可证

MIT
