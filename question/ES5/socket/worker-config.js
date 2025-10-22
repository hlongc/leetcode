// SharedWorker 版本配置
// 部署新版本时更新这个文件

export const WORKER_CONFIG = {
  version: "1.0.0",
  buildTime: "2025-10-20T14:30:00Z",

  // 检查更新间隔（毫秒）
  updateCheckInterval: 5 * 60 * 1000, // 5分钟

  // SharedWorker 最大生命周期（毫秒）
  maxLifetime: 60 * 60 * 1000, // 1小时
};
