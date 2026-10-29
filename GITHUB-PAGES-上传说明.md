# GitHub Pages 首次发布步骤

这个包是“土豆的十九岁 · 杨宇的生日小岛”的当前静态网站。无需安装 Node.js，无需构建，也无需服务器或数据库。照片、视频、录音暂为占位内容。

## 1. 创建仓库

1. 登录 https://github.com ，点击右上角 + → New repository。
2. Repository name 填 `birthday-island`（也可用其他英文名字，但印二维码后不要随意更名）。
3. 选择 Public。GitHub Free 的这条 Pages 发布方式使用公开仓库。
4. 勾选 Add a README file，然后 Create repository。

## 2. 上传网站文件

1. 解压 `github-pages-ready.zip`。
2. 在 GitHub 仓库页面点击 Add file → Upload files。
3. 打开解压后的文件夹，将里面的文件全选拖进去，不是把 ZIP 文件上传，也不是把外层文件夹拖进去。
4. 确保上传列表中的 `index.html` 位于仓库根目录，和 `styles.css`、`app.js` 在同一级。
5. 页面底部点击 Commit changes。

压缩包内共 12 个文件。`.nojekyll` 可能被文件管理器隐藏；能上传就一起上传。此网站没有下划线目录，遗漏该空文件通常不会妨碍当前页面发布。

## 3. 启用 Pages

1. 打开仓库的 Settings → 左侧 Pages。
2. 在 Build and deployment 下，将 Source 选为 Deploy from a branch。
3. Branch 选 main，文件夹选 / (root)，点击 Save。
4. 等待部署结束。可以到 Actions 查看部署是否成功。
5. 回到 Settings → Pages，找到 Your site is live at，复制平台实际给出的 HTTPS 地址。

若用户名为 YOURNAME，仓库名为 birthday-island，通常地址为：

https://YOURNAME.github.io/birthday-island/

以上 YOURNAME 是占位符，不能直接写进 NFC。实际地址以 Pages 页面显示为准。

## 4. 手机上试用

关闭 VPN，分别用 Wi-Fi 和移动数据打开正式网站地址。检查首页蛋糕为 19、地图可点击、猜题能完成、彩蛋可以拆开。音视频按钮目前只显示等待素材提示。

不要把 GitHub 仓库地址 github.com/... 当成网站入口，应使用 github.io/...。

如果 404：先等 Actions 显示部署成功，再检查发布源为 main / (root)，且 index.html 没有多套一层目录。
如果页面无样式：检查 styles.css、gifts.css 和所有脚本与 SVG 都在同一级，文件名大小写一致。
如果大陆手机访问不稳定：先不要印正式二维码或锁定 NFC 卡，换用其他托管方案后再确定入口。

## 5. 后面继续精修

后续将更新文件上传覆盖到同一个仓库的同一位置，然后 Commit changes。Pages 重新部署后，原网址显示新内容，二维码和 NFC 不用改。

不要随意改变 GitHub 用户名、仓库名或入口路径。确认网址后，NFC 和二维码都用相同的稳定 HTTPS 首页地址。

## 公开范围

公开仓库中的源文件和素材可被查看、下载。noindex / robots.txt 仅请求搜索引擎不要收录，不是密码或访问控制；以后上传真实照片、视频时请考虑这一点。
