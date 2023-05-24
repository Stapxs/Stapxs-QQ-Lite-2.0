[简体中文](README.md)
 | English
<br><br><br>


<p align="center">
  <a href="https://blog.stapxs.cn" target="blank">
    <img src="public/img/icons/icon.svg" alt="Logo" width="156" height="156">
  </a>
  <h2 align="center" style="font-weight: 600">Stapxs QQ Lite 2.0</h2>

  <p align="center">
    An unofficial web QQ client compatible with oicq-http2
    <br />
    <a href="https://stapxs.github.io/Stapxs-QQ-Lite-2.0/" target="blank"><strong>🌎 Live Demo</strong></a>&nbsp;&nbsp;|&nbsp;&nbsp;
    <a href="https://github.com/Stapxs/Stapxs-QQ-Lite-2.0/releases" target="blank"><strong>📦️ Downloads</strong></a>&nbsp;&nbsp;|&nbsp;&nbsp;
    <a href="https://github.com/Stapxs/Stapxs-QQ-Lite-2.0/issues/new?assignees=Stapxs&labels=%3Abug%3A+%E9%94%99%E8%AF%AF&template=----.md&title=%5B%E9%94%99%E8%AF%AF%5D" target="blank"><strong>💬 Feedback</strong></a>
    <br />
    <br />
    <strong>This application is for educational and research purposes only.</strong><br>
    <strong>For copyright issues, please file an issue for negotiation.</strong>
  </p>
</p>

![card](README/card.png)

## ✨ Supported Features
- ✅ Developed with a complete Vue.js framwork, and seperates frontend and backend
- 🎨 Adaptive landscape and portrait layouts
- 🖥️ PWA support (why not just use our cool Electon app anyway)
- 🌚 Auto Light/Dark Mode
- 🍱 Includes almost everything you need!
  - Sending, revoking, forwarding or replying to a message. Complex messages handled!
  - Group storage (files), announcements, some group-specified settings and **essence**
  - Sending images, files and your favorite emotes!
- 📦️ Multiple QQ bot APIs support
- 🔥 A nice-looking Electron desktop app
- 🥚 Easter eggs to be discovered!
- 🛠 More to come ...

## ♿️ Get Started
### > Running Services
Stapxs QQ Lite requires connecting to a QQ bot API to function properly. You can set one up by following [📖 this documentation](https://github.com/Stapxs/Stapxs-QQ-Lite-2.0/wiki/%E8%BF%9E%E6%8E%A5-oicq2-http).

### > Using the App on the go 
GitHub Pages is enabled and is serving a live demo [🌎 over here](https://stapxs.github.io/Stapxs-QQ-Lite-2.0).

### > Installing the App
Besides the live demo, you can also download the desktop app built with election that has more features [📦️ here](https://github.com/Stapxs/Stapxs-QQ-Lite-2.0/releases).

## 💬 Tips and FAQs

### > Insecure connections?
- When connecting to a WebSocket (ws) service via an HTTPS page, or vice versa, the connection will fail because one of them is insecure. In this case, you can choose to upgrade the WebSocket connection to a secure WebSocket (wss) or downgrade the HTTPS connection to HTTP (insecure) to solve the problem. However, specific solutions are not provided here. >> [Stapxs-QQ-Lite#32](https://github.com/Stapxs/Stapxs-QQ-Lite/issues/32)

### > Could I use other QQ bot APIs?

- You can give them a try if it supports the [OneBot 11 protocol](<https://github.com/botuniverse/onebot-11>). However, the differences in message body formats and extension APIs may prevent them from being fully usable.
  Bot APIs supported are listed [here](https://github.com/Stapxs/Stapxs-QQ-Lite-2.0/wiki).

### > What are the risks involved in using a bot API?

- For potential risks in using oicq-http, refer to [this page](<https://github.com/takayama-lily/oicq/wiki/98.%E5%85%B3%E4%BA%8E%E8%B4%A6%E5%8F%B7%E5%86%BB%E7%BB%93%E5%92%8C%E9%A3%8E%E6%8E%A7>). If you're using other QQ bot APIs, refer to their own repositories for more infomation.

### > I have questions / problems.

- Don't hesitate to send us a [issue](<https://github.com/Stapxs/Stapxs-QQ-Lite/issues>) if you do. Bug reports and suggestions are also welcome.

## 📦️ Building the App
### > Building Webpages
Stapxs QQ Lite 2.0 is a single-page Vue application, which means you'll have to build the page before serving it.

NOTE: if you do not serve the app at public web root, you'll have to modify the value of `publicPath` in `vue.config.js` to your need before you build it. You can also remove the mentioned key if you only plan to serve the app at web root.

Below are commands used to test and build this Vue app. Artifacts will be in `dist` folder.

``` bash
# Install dependencies
yarn install
# Test the app locally
yarn serve
# Check and format the code
yarn lint
# Build the app
yarn build
```

### > Building the Election App
Starting from version `2.3.0`, Stapxs QQ Lite 2.0 can be built into an Electron app with enhanced features for some platforms. You can also build the app yourself with instructions below.

Commands for testing and building the Electron app are shown below. Artifacts will be in `dist_electron/out` folder.

``` bash
# Run local electron test
yarn electron:serve
# Build the electron app
yarn electron:build
```
You can also specify the desired platform with an option:

```bash
yarn electron:build --linux
```
### > GitHub Actions
*Why would anyone be interested in build automation? Anyway, I had worked on it for so long and you can check it out yourself in GitHub Actions.*

![auto-build](README/auto-build.png)

## 🖼️ Screenshots
![1](README/pics/1.png)
![2](README/pics/2.png)
![3](README/pics/4.png)
![3](README/pics/3.png)

## 🎉 Credits
Shoutout to my friends who have offered help in development and translation.

<a href="https://github.com/Logic-Accepted"><img  src="https://avatars.githubusercontent.com/u/36406453?s=48&v=4"></a>
<a href="https://github.com/doodlehuang"><img  src="https://avatars.githubusercontent.com/u/25525621?s=48&v=4"></a>
