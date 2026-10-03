# 生日探险地图

这是一个无需构建工具的手机网页原型，入口文件是 `index.html`。

## 预览

直接打开 `index.html` 即可预览。若需要手机局域网测试，可在此目录启动任意静态文件服务器。

## NFC 链接

把同一个网站地址写入定制银行卡大小的 NFC 卡即可。可用查询参数直接进入章节：

- `?entry=home`：通行证首页
- `?entry=map`：路线地图
- `?entry=travel`：出游照片档案
- `?entry=training`：军训训练任务
- `?entry=video`：视频和语音章节
- `?entry=final`：钥匙扣终点页

例如：`https://你的域名.example/?entry=travel`

## 发布和 NFC

当前文件是静态网站，本地的 `http://localhost:4173` 只能在开发电脑上打开，不能写入 NFC 给手机使用。

正式使用时，需要先把整个 `birthday-adventure` 文件夹发布到一个公开的 HTTPS 静态网址，再把这个网址写入 NFC。适合的方式有：

- GitHub Pages：适合长期免费托管静态文件
- Netlify Drop：适合临时快速发布
- Vercel：适合以后持续更新
- 自己的域名 + 静态空间：最稳定、最像正式礼物

发布后，NFC 只需要保存一个普通的 NDEF URL 记录，例如：

```text
https://你的网址.example/?entry=home
```

这里的 `entry` 不是 NFC 的限制，而是网站自己用来选择打开章节的参数。可以为不同芯片写不同入口：

```text
?entry=home      通行证首页
?entry=travel    照片花园
?entry=training  土豆训练营
?entry=video     落日放映室
?entry=final     礼物小屋
```

建议同时在定制卡背面印一个二维码，二维码和 NFC 指向同一个 HTTPS 地址。写入前用两台手机测试：一台 Android 和一台 iPhone，确认 NFC 能弹出通知、浏览器能打开页面。不要把 `localhost`、`127.0.0.1` 或局域网地址写入芯片。


每个地点结束后都有 3 道抽象猜题。答错可以重猜，也可以使用“寿星特权”跳过；答完后会打开礼物彩蛋弹窗。点击“拆开彩蛋”后，页面会显示交接提示，方便你暂停手机、把现实中的礼物拿出来，再由寿星点击“礼物收到啦”。

五站的默认礼物安排写在 [gifts-config.js](gifts-config.js) 中，可直接修改：

- `gift.title`：拆开前看到的标题
- `gift.hint`：礼物线索
- `gift.reveal`：拆开彩蛋后的标题
- `gift.handoff`：你递礼物时看到的提示
- `questions`：每站 3 道题；`correct` 是正确选项的编号，从 0 开始

当前默认安排是玩偶、照片小卡、休息补给、下一次出游约定、浮雕合照钥匙扣。你可以把第二站改成照片包，把第三站的补给改成贴纸或零食，也可以把第四站只做成一张手写出游券，不需要额外购买大型礼物。

进度保存在浏览器的 `localStorage` 中，键名是 `birthday-gifts-v1`。如果要重新体验所有彩蛋，可在浏览器控制台执行：

```js
localStorage.removeItem('birthday-gifts-v1'); location.reload();
```


- 真实照片：替换 `index.html` 里的照片占位卡，推荐改为 `<img>` 并在 `styles.css` 中保留卡片比例。
- 视频：将 `video-placeholder` 替换成 `<video controls>`，不要自动播放。
- 音频：将 `audioMock` 替换为 `<audio controls>`。
- 妹妹称呼、生日日期和文案：集中修改 `index.html` 中的文字。
- 卡片二维码：生成网站首页或对应 `?entry=` 地址的二维码，印在 NFC 卡背面。

当前工程使用占位内容，没有包含真实个人照片、视频或音频。
