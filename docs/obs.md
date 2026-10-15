# OBS / 直播使用指南

## 首次开播

1. 安装并打开 EggLive，选择真实 USB 摄像头，保持脸部在画面中。
2. 点击 **正脸校准**，把当前姿势设为动作中心。
3. 点击 **打开已配置的 OBS**。附带的 OBS 会创建 `EggLive` 场景和透明浏览器来源。
4. 在 OBS 添加 **音频输入捕获**，选择麦克风。EggLive 自带形象录制没有声音。
5. 在 OBS 设置自己的录制或直播平台信息。EggLive 不会替你开始公开直播。

第一次 OBS 启动需要完成初始化，EggLive 会短暂等待场景就绪；若启动超时，请检查日志后重试。

## 在你自己的 OBS 中手动添加

EggLive 保持运行，新增 **浏览器** 来源：

| 设置 | 值 |
|---|---|
| URL | `http://127.0.0.1:18739/output.html` |
| 宽度 / 高度 | `1280` / `720` |
| 自定义帧率 | `30` |

添加后应该只看到鸡蛋，背景透明。可以在鸡蛋下方放游戏、摄像头以外的背景或其他来源。该地址只供同一台电脑使用，请勿把本地端口暴露到公网。

真实摄像头由 EggLive 使用，OBS 接收形象输出。如果其他软件占用摄像头，请先释放设备。

## 虚拟摄像头 / 视频会议

首次使用点击 **安装虚拟摄像头** 并批准 Windows 授权，再点击 **启动虚拟摄像头**。在会议或聊天软件中选择 **OBS Virtual Camera**。

OBS 虚拟摄像头不提供透明通道，也不包含麦克风声音。在 OBS 中放好背景，在会议软件中选择自己的麦克风。保持 EggLive 和 OBS 运行。

## 排查无画面

- EggLive 只有蛋壳：未检测到人脸，或者没有真实摄像头。先确认 EggLive 的追踪状态。
- 摄像头无法打开：检查 Windows 隐私权限、USB 连接和其他软件占用。
- OBS 刚启动黑屏：等待连接完成；仍无画面时刷新浏览器来源或重新点击配置按钮。
- 使用已有 OBS：确认它的控制端口没有与附带 OBS 的 `4457` 端口冲突。
- 画面或占用异常：切到 **省 CPU**，保留 30 帧，记录显卡驱动、画质档位及实际占用，再提交 Issue。日志分享前请移除用户名、文件路径、令牌、OBS 密码和直播密钥。

## English button labels

| Chinese UI | Meaning |
|---|---|
| 连接摄像头 | Connect camera |
| 正脸校准 | Center pose |
| 暂停追踪 / 恢复追踪 | Pause / resume tracking |
| 省 CPU / 均衡 / 清晰 | Low / balanced / high quality |
| 打开已配置的 OBS | Open configured OBS |
| 安装虚拟摄像头 | Install virtual camera |
| 启动虚拟摄像头 | Start virtual camera |
| 无镜参考眼睛 | Personal clean-eye reference |
| 删除参考眼睛 | Delete saved eye reference |

For a normal stream: connect a physical webcam in EggLive, center your pose, open the configured OBS scene, add your microphone in OBS, then start recording or configure your streaming platform. For manual OBS setup, add a Browser Source with the URL and dimensions above. For video calls, install/start OBS Virtual Camera and select it in the receiving application.
