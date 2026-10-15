<div align="center">

# 🥚 EggLive · 鸡蛋虚拟主播

### 插上摄像头，变成一颗有表情的鸡蛋。

**真人眼嘴 × 逼真 3D 蛋壳 × 弹性晃动 × OBS 透明输出**

[![Windows](https://img.shields.io/badge/Windows-10%20%2F%2011-0078D4?style=flat-square)](https://github.com/ShiroPpu69/EggLive/releases/latest)
[![MIT](https://img.shields.io/badge/License-MIT-D3AC70?style=flat-square)](LICENSE)
[![Release](https://img.shields.io/github/v/release/ShiroPpu69/EggLive?style=flat-square&color=748E74)](https://github.com/ShiroPpu69/EggLive/releases/latest)

**[下载 Windows 安装包](https://github.com/ShiroPpu69/EggLive/releases/latest) · [English](README.md) · [OBS 使用指南](docs/obs.md) · [开发与打包](docs/building.md)**

![EggLive 实际渲染，演示人物为 AI 生成](docs/assets/hero.png)

</div>

想直播，又想让一颗鸡蛋替你出镜？EggLive 用普通 USB 摄像头追踪你的脸，把真人眼睛和嘴巴自然贴到 3D 蛋壳上。眨眼、说话、转头，鸡蛋跟着动，再带一点惯性和弹性。

Windows 安装包内置面捕模型和官方 OBS，不需要安装 Node、Python，也不需要账号。追踪在本机完成，适合直播、录屏和虚拟摄像头出镜。

<div align="center">

![实际程序渲染动图](docs/assets/demo.gif)

<sub>动图由 EggLive 实际渲染，输入为 AI 生成的虚构人物照片；动作经过脚本编排，仅演示画面与运动效果，不代表真人摄像头追踪精度。</sub>

</div>

## 这颗蛋会什么

| 功能 | 实际实现 |
|---|---|
| 🥚 **有质感的蛋壳** | 3D 曲面、连续微纹理、物理材质、摄影棚光照；乳白 / 浅褐两种颜色。 |
| 👀 **真人眼睛和嘴巴** | 基于 MediaPipe 478 个面部关键点裁切，柔边融合到蛋壳上。 |
| 🫧 **自然晃动** | 弹簧阻尼、惯性、轻微拉伸压缩，动作幅度和弹性可调。 |
| 🎥 **接上 OBS 就能播** | 一键创建透明形象场景，支持 OBS Virtual Camera。 |
| ⚡ **面向 30 帧直播** | 后台面捕、同帧图像与关键点配对、帧间插值、本机视频传输。 |
| 🔒 **本地离线运行** | 模型随安装包分发，摄像头画面和个人参考眼睛在本机处理。 |
| 👓 **应对强镜片反光** | 可记录摘镜时的干净眼睛，以实时面捕驱动眨眼，避免直接使用反光镜片画面。 |

## 从下载到开播

1. 从 **[Releases](https://github.com/ShiroPpu69/EggLive/releases/latest)** 下载 `EggLive-Setup-1.6.1-x64.exe` 并安装。
2. 插上 USB 摄像头，双击桌面 **EggLive 鸡蛋直播**，看向镜头，点 **正脸校准**。
3. 点 **打开已配置的 OBS**。需要说话录音时，在 OBS 添加自己的麦克风，然后录屏或直播。

支持目标是 **Windows 10 / 11 x64**。首次使用可能需要在 Windows 隐私设置中允许桌面应用访问摄像头。

会议软件中使用：首次点 **安装虚拟摄像头** 并批准 Windows 系统授权，再点 **启动虚拟摄像头**，在会议软件选择 **OBS Virtual Camera**。使用时保持 EggLive 和 OBS 运行。

## 戴眼镜，反光很强怎么办

普通“反光抑制”滑块能压低白色、青色和蓝紫色反光，但不能可靠恢复已经过曝、被遮住的眼睛。

**无镜参考眼睛** 提供另一种取舍：

1. 暂时摘镜，点 **① 摘镜记录睁眼**，睁眼保持约 4 秒。
2. 点 **② 摘镜记录闭眼**，闭眼保持约 4 秒。
3. 提示已启用后戴回眼镜。软件使用你的干净眼睛参考，通过实时眼睑关键点驱动眨眼；嘴巴和头部继续实时捕捉。

**这是参考驱动的眼部替代动画，不是 AI 还原被反光遮住的实时眼睛。** 眼球视线和细微眼周表情无法完整复现；强反光使关键点失准时，眨眼仍可能不准确。采集时必须摘镜，否则反光也会被记录。

参考只保存在这台电脑，可以在软件内关闭或删除；换电脑需要重新采集。

## 占用有多低

开发机 Ryzen 9 5900HX、16 逻辑核心，使用合成摄像头输入、启用参考眼睛并接入 OBS 时，约 16 秒采样中：

- **EggLive 全部进程合计 CPU 平均约 4.2%**，按整机总 CPU 计算。
- 形象渲染约 **29 FPS**，上限 30；面捕约 **15 FPS**，显示通过插值平滑。
- 测试配置下 H.264 视频编码约 **30 FPS**，使用硬件编码。
- 默认形象分辨率 **640×360**，OBS 输出 **1280×720**，也可选更高形象画质。

CPU 数字不包含 OBS、游戏和直播录制编码的开销，不是所有电脑的性能保证。详见 [验证范围与限制](docs/validation.md)。

## 为什么眼嘴不再追着旧画面跑

摄像头图像在送入面捕前先拍成快照，返回的关键点始终和这张快照配对。程序不会拿旧关键点去裁切新画面。头部跳变会被过滤；短暂漏检先保留有效画面，再在持续丢失后渐隐。

```text
USB 摄像头 → 同帧图像与关键点 → 3D 鸡蛋 + 弹簧运动
                              ↓
                   本机 RGB + Alpha 视频 → OBS → 直播 / 录制 / 虚拟摄像头
```

OBS 收到的是形象画面。服务仅监听 `127.0.0.1:18739`；OBS 控制使用带认证的本机 WebSocket。参阅 [架构与隐私](docs/architecture.md)。

## 开发者快速开始

Windows 上安装 Node.js 22.12+、Git，然后运行：

```powershell
git clone https://github.com/ShiroPpu69/EggLive.git
cd EggLive
npm ci
npm run setup
npm run build
npm start
```

第一次资源准备需要联网下载固定版本模型，之后面捕可离线运行。需要自动配置 OBS 时执行 `npm run setup -- --with-obs`。安装包构建见 [开发文档](docs/building.md)。普通用户直接下载安装包即可。

## 欢迎一起把蛋做好

适合参与的方向：英文界面、更多摄像头兼容性、戴镜追踪稳定性、低端显卡性能测试、参考眼睛动画改进。这些是贡献方向，不代表已经实现。

[报告问题](https://github.com/ShiroPpu69/EggLive/issues/new?template=bug_report.yml) · [提出想法](https://github.com/ShiroPpu69/EggLive/issues/new?template=feature_request.yml) · [贡献指南](CONTRIBUTING.md)

如果这颗蛋让你的直播更有趣，欢迎点个 **Star**，让更多创作者找到它。分享演示片段时，请确认你有权公开其中的人像和声音。

## 许可与致谢

项目原创应用代码采用 **[MIT](LICENSE)**。依赖 MediaPipe、Three.js、Electron、ws；摄影棚 HDRI 来自 Greg Zaal / Poly Haven，采用 CC0。

安装包附带未修改的官方 **OBS Studio 32.2.2**，它是单独采用 GPL-2.0-or-later 许可的程序，对应官方源码压缩包随 Release 提供。微软运行库及其他组件保留各自许可，详见 [第三方声明](THIRD_PARTY_NOTICES.md)。

本项目独立开发，与 TheBurntPeanut、Snapchat 无官方关联，不包含其专有形象、滤镜或提取的商业 Lens 资源。
