# 土豆的十九岁生日小岛

纯静态生日网站，无需构建工具或数据库。入口是 `index.html`。

## 真实照片与视频

本版包含 13 张照片、10 段出游视频，均来自桌面 `111` 文件夹。原片没有修改。

- `media/photos/`：长边最多 1600px 的大图、640px 的缩略图；去除 EXIF 数据。
- `media/videos/`：H.264 + AAC、最多 1280px 长边、30fps 的 MP4，保留原声。
- `media/posters/`：每段视频的封面。
- `media-config.js`：显示顺序、标题、地址和时长；可以编辑 title 或调整数组顺序。
- `media.js` / `media.css`：相册和放映室交互及样式。

照片支持点击放大、上一张/下一张、键盘方向键和 Escape 关闭。视频点击片单后才加载；切换页面或浏览器进入后台时自动暂停。进度与原有猜题、彩蛋互不影响。

## 预览

在本目录运行 `py -m http.server 4173 --bind 127.0.0.1`，访问 `http://127.0.0.1:4173/`。本地地址不能作为手机 NFC 公网入口。

## GitHub Pages 更新

固定网址： https://myqin18.github.io/birthday-island/

解压最新媒体更新包，把根目录文件和整个 `media` 文件夹拖进现有仓库根目录，提交后等待 Pages 部署。不要上传 ZIP 本身，也不要额外套一层文件夹。不要上传桌面 `111` 的原片。网页副本都小于 GitHub 浏览器上传的 25MB 单文件限制。

更新后 GitHub 用户名、仓库名和入口路径保持不变，二维码及 NFC 均可沿用。公开仓库中的照片和视频可以被访问、下载；noindex 不是密码或访问控制。

## 章节入口

- `?entry=home`：生日首页
- `?entry=map`：小岛地图
- `?entry=travel`：照片花园
- `?entry=training`：土豆训练营
- `?entry=video`：落日放映室
- `?entry=final`：礼物小屋

## 彩蛋

`gifts-config.js` 中配置五站礼物和十五道题。`correct` 是从 0 开始的答案编号。`birthday-gifts-v1` 和 `birthday-island-visited-v2` 分别保存彩蛋及地图访问进度，本次更新保持键名不变。

## 素材制作

`prepare-media.py` 制作网页副本，依赖 Pillow、imageio-ffmpeg 和 ffprobe。`media-build-report.json` 只供本地核对原文件映射，不需要上传。发布包只包含网站运行所需内容。
