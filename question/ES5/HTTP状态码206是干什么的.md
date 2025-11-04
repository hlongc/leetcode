# HTTP 状态码 206 Partial Content

## 什么是 206？

**HTTP 206 Partial Content** 表示服务器成功处理了部分 GET 请求，返回了**资源的一部分内容**。

### 核心用途

| 场景             | 说明                         |
| ---------------- | ---------------------------- |
| **断点续传**     | 下载大文件时可以从中断处继续 |
| **视频/音频流**  | 在线播放时按需加载片段       |
| **分片下载**     | 多线程下载，提高速度         |
| **预览部分内容** | 只获取文件的前几个字节       |

---

## 工作原理

### 1. 客户端请求

客户端通过 `Range` 请求头指定要获取的字节范围：

```http
GET /video.mp4 HTTP/1.1
Host: example.com
Range: bytes=0-1023
```

**Range 语法**：

```http
Range: bytes=<start>-<end>       # 获取指定范围
Range: bytes=<start>-            # 从 start 到文件末尾
Range: bytes=-<count>            # 获取最后 count 个字节
Range: bytes=<start>-<end>, <start>-<end>  # 多个范围
```

### 2. 服务器响应

```http
HTTP/1.1 206 Partial Content
Content-Type: video/mp4
Content-Length: 1024
Content-Range: bytes 0-1023/1048576
Accept-Ranges: bytes

[视频内容的前 1024 字节]
```

**关键响应头**：

- `Content-Range`: 指明返回的内容范围和总大小
- `Content-Length`: 本次返回的内容大小
- `Accept-Ranges`: 告诉客户端服务器支持范围请求

---

## 实战示例

### 示例 1：视频分段加载

```javascript
// 前端请求视频片段
async function loadVideoChunk(url, start, end) {
  const response = await fetch(url, {
    headers: {
      Range: `bytes=${start}-${end}`,
    },
  });

  if (response.status === 206) {
    console.log("✅ 成功获取部分内容");
    console.log("Content-Range:", response.headers.get("Content-Range"));

    const blob = await response.blob();
    return blob;
  } else if (response.status === 200) {
    console.log("⚠️ 服务器不支持范围请求，返回完整内容");
    return await response.blob();
  }
}

// 使用
loadVideoChunk("https://example.com/video.mp4", 0, 1048575).then((chunk) => {
  console.log("获取到视频片段:", chunk.size, "字节");
});
```

### 示例 2：断点续传下载

```javascript
class ResumableDownloader {
  constructor(url, filename) {
    this.url = url;
    this.filename = filename;
    this.downloadedBytes = 0;
    this.totalBytes = 0;
    this.chunks = [];
  }

  // 检查服务器是否支持范围请求
  async checkRangeSupport() {
    const response = await fetch(this.url, { method: "HEAD" });
    const acceptRanges = response.headers.get("Accept-Ranges");
    this.totalBytes = parseInt(response.headers.get("Content-Length"), 10);

    console.log("文件大小:", this.totalBytes, "字节");
    console.log("支持范围请求:", acceptRanges === "bytes");

    return acceptRanges === "bytes";
  }

  // 下载指定范围的内容
  async downloadRange(start, end) {
    const response = await fetch(this.url, {
      headers: {
        Range: `bytes=${start}-${end}`,
      },
    });

    if (response.status !== 206) {
      throw new Error("服务器不支持范围请求");
    }

    const blob = await response.blob();
    return blob;
  }

  // 分片下载
  async download(chunkSize = 1024 * 1024) {
    // 1MB per chunk
    const supportsRange = await this.checkRangeSupport();

    if (!supportsRange) {
      console.log("服务器不支持断点续传，使用普通下载");
      return this.downloadNormal();
    }

    // 计算分片数量
    const numChunks = Math.ceil(this.totalBytes / chunkSize);
    console.log(`将分 ${numChunks} 个片段下载`);

    // 下载所有分片
    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min((i + 1) * chunkSize - 1, this.totalBytes - 1);

      console.log(`下载分片 ${i + 1}/${numChunks}: bytes ${start}-${end}`);

      try {
        const chunk = await this.downloadRange(start, end);
        this.chunks.push(chunk);
        this.downloadedBytes += chunk.size;

        // 更新进度
        const progress = (
          (this.downloadedBytes / this.totalBytes) *
          100
        ).toFixed(2);
        console.log(`进度: ${progress}%`);
      } catch (error) {
        console.error(`分片 ${i + 1} 下载失败:`, error);
        // 可以实现重试逻辑
        throw error;
      }
    }

    // 合并所有分片
    return this.mergeChunks();
  }

  // 合并分片
  mergeChunks() {
    const completeBlob = new Blob(this.chunks);
    console.log("✅ 下载完成，文件大小:", completeBlob.size, "字节");

    // 创建下载链接
    const url = URL.createObjectURL(completeBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = this.filename;
    a.click();
    URL.revokeObjectURL(url);

    return completeBlob;
  }

  // 普通下载（不支持范围请求时）
  async downloadNormal() {
    const response = await fetch(this.url);
    const blob = await response.blob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = this.filename;
    a.click();
    URL.revokeObjectURL(url);

    return blob;
  }
}

// 使用
const downloader = new ResumableDownloader(
  "https://example.com/large-file.zip",
  "download.zip"
);

downloader
  .download()
  .then(() => console.log("下载成功"))
  .catch((error) => console.error("下载失败:", error));
```

### 示例 3：视频播放器实现

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Range Request 视频播放器</title>
  </head>
  <body>
    <h1>支持范围请求的视频播放器</h1>
    <video id="video" controls width="640"></video>
    <div id="info"></div>

    <script>
      class RangeVideoPlayer {
        constructor(videoElement, videoUrl) {
          this.video = videoElement;
          this.videoUrl = videoUrl;
          this.mediaSource = new MediaSource();
          this.sourceBuffer = null;
          this.chunkSize = 1024 * 1024; // 1MB
          this.currentChunk = 0;

          this.init();
        }

        async init() {
          // 使用 MediaSource API
          this.video.src = URL.createObjectURL(this.mediaSource);

          this.mediaSource.addEventListener("sourceopen", async () => {
            console.log("MediaSource opened");

            // 获取视频元数据
            await this.loadMetadata();

            // 创建 SourceBuffer
            this.sourceBuffer = this.mediaSource.addSourceBuffer(
              'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
            );

            // 监听 updateend 事件以加载下一个片段
            this.sourceBuffer.addEventListener("updateend", () => {
              if (
                !this.sourceBuffer.updating &&
                this.mediaSource.readyState === "open"
              ) {
                this.loadNextChunk();
              }
            });

            // 加载第一个片段
            this.loadNextChunk();
          });
        }

        async loadMetadata() {
          // 获取视频总大小
          const response = await fetch(this.videoUrl, { method: "HEAD" });
          this.totalSize = parseInt(response.headers.get("Content-Length"), 10);
          console.log("视频总大小:", this.totalSize, "字节");
        }

        async loadNextChunk() {
          const start = this.currentChunk * this.chunkSize;
          const end = Math.min(start + this.chunkSize - 1, this.totalSize - 1);

          if (start >= this.totalSize) {
            console.log("所有片段加载完成");
            this.mediaSource.endOfStream();
            return;
          }

          console.log(`加载片段 ${this.currentChunk}: bytes ${start}-${end}`);

          const response = await fetch(this.videoUrl, {
            headers: {
              Range: `bytes=${start}-${end}`,
            },
          });

          if (response.status === 206) {
            const arrayBuffer = await response.arrayBuffer();
            this.sourceBuffer.appendBuffer(arrayBuffer);
            this.currentChunk++;

            // 更新信息
            document.getElementById("info").textContent = `已加载: ${
              this.currentChunk
            } 片段 / ${Math.ceil(this.totalSize / this.chunkSize)} 总片段`;
          } else {
            console.error("服务器不支持范围请求");
          }
        }
      }

      // 使用
      const video = document.getElementById("video");
      const player = new RangeVideoPlayer(
        video,
        "https://example.com/video.mp4"
      );
    </script>
  </body>
</html>
```

---

## Node.js 服务器端实现

### Express 实现范围请求

```javascript
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

// 支持范围请求的文件服务
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "files", filename);

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  // 获取文件信息
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  // 解析 Range 请求头
  const range = req.headers.range;

  if (range) {
    console.log("收到范围请求:", range);

    // 解析范围 (例如: "bytes=0-1023")
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    // 验证范围
    if (start >= fileSize || end >= fileSize) {
      res.status(416).send("Requested Range Not Satisfiable");
      return;
    }

    // 创建文件流
    const file = fs.createReadStream(filePath, { start, end });

    // 设置 206 响应头
    res.status(206);
    res.set({
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "application/octet-stream",
    });

    // 发送文件片段
    file.pipe(res);
  } else {
    // 没有 Range 请求头，返回完整文件
    console.log("返回完整文件");

    res.status(200);
    res.set({
      "Content-Length": fileSize,
      "Content-Type": "application/octet-stream",
      "Accept-Ranges": "bytes", // 告诉客户端支持范围请求
    });

    fs.createReadStream(filePath).pipe(res);
  }
});

// 视频流服务
app.get("/video/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "videos", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Video not found");
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    const file = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    });

    file.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
    });

    fs.createReadStream(filePath).pipe(res);
  }
});

app.listen(3000, () => {
  console.log("服务器运行在 http://localhost:3000");
});
```

---

## Content-Range 响应头详解

### 格式

```http
Content-Range: bytes <start>-<end>/<total>
Content-Range: bytes <start>-<end>/*
Content-Range: bytes */<total>
```

### 示例

```http
# 返回前 1000 字节，总共 10000 字节
Content-Range: bytes 0-999/10000

# 返回最后 500 字节
Content-Range: bytes 9500-9999/10000

# 返回中间部分
Content-Range: bytes 5000-5999/10000

# 总大小未知
Content-Range: bytes 0-999/*

# 无法满足范围请求 (416 错误)
Content-Range: bytes */10000
```

---

## 多范围请求（Multipart Ranges）

### 请求多个范围

```http
GET /document.pdf HTTP/1.1
Host: example.com
Range: bytes=0-999, 5000-5999, 9000-9999
```

### 响应格式

```http
HTTP/1.1 206 Partial Content
Content-Type: multipart/byteranges; boundary=3d6b6a416f9b5

--3d6b6a416f9b5
Content-Type: application/pdf
Content-Range: bytes 0-999/10000

[前 1000 字节内容]
--3d6b6a416f9b5
Content-Type: application/pdf
Content-Range: bytes 5000-5999/10000

[中间 1000 字节内容]
--3d6b6a416f9b5
Content-Type: application/pdf
Content-Range: bytes 9000-9999/10000

[最后 1000 字节内容]
--3d6b6a416f9b5--
```

---

## 实用工具函数

### 解析 Range 请求头

```javascript
function parseRange(rangeHeader, fileSize) {
  // 例如: "bytes=0-1023" 或 "bytes=1024-"
  if (!rangeHeader || !rangeHeader.startsWith("bytes=")) {
    return null;
  }

  const ranges = [];
  const rangeStr = rangeHeader.substring(6); // 去掉 "bytes="

  rangeStr.split(",").forEach((range) => {
    const [start, end] = range.trim().split("-");

    let startByte = start ? parseInt(start, 10) : 0;
    let endByte = end ? parseInt(end, 10) : fileSize - 1;

    // 处理后缀范围 (例如: "-500" 表示最后 500 字节)
    if (!start && end) {
      startByte = fileSize - parseInt(end, 10);
      endByte = fileSize - 1;
    }

    // 验证范围
    if (startByte >= fileSize || endByte >= fileSize || startByte > endByte) {
      return null;
    }

    ranges.push({ start: startByte, end: endByte });
  });

  return ranges.length > 0 ? ranges : null;
}

// 使用
const fileSize = 10000;
const range = parseRange("bytes=0-999", fileSize);
console.log(range); // [{ start: 0, end: 999 }]

const multiRange = parseRange("bytes=0-999, 5000-5999", fileSize);
console.log(multiRange);
// [{ start: 0, end: 999 }, { start: 5000, end: 5999 }]
```

### 检测服务器支持

```javascript
async function checkRangeSupport(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
    });

    const acceptRanges = response.headers.get("Accept-Ranges");
    const contentLength = response.headers.get("Content-Length");

    return {
      supported: acceptRanges === "bytes",
      fileSize: contentLength ? parseInt(contentLength, 10) : null,
      acceptRanges,
    };
  } catch (error) {
    console.error("检测失败:", error);
    return { supported: false, fileSize: null };
  }
}

// 使用
checkRangeSupport("https://example.com/video.mp4").then((info) => {
  console.log("支持范围请求:", info.supported);
  console.log("文件大小:", info.fileSize);
});
```

---

## 相关 HTTP 状态码

| 状态码  | 名称                  | 说明                           |
| ------- | --------------------- | ------------------------------ |
| **206** | Partial Content       | 成功返回部分内容               |
| **200** | OK                    | 返回完整内容（不支持范围请求） |
| **416** | Range Not Satisfiable | 请求的范围无效或超出文件大小   |

### 416 Range Not Satisfiable

```http
GET /file.txt HTTP/1.1
Range: bytes=10000-20000

# 如果文件只有 5000 字节
HTTP/1.1 416 Range Not Satisfiable
Content-Range: bytes */5000
```

---

## 实际应用场景

### 1. 视频网站（如 YouTube、Netflix）

```javascript
// 视频播放器只加载当前播放位置附近的内容
const currentTime = video.currentTime; // 当前播放时间（秒）
const duration = video.duration; // 总时长
const fileSize = 100 * 1024 * 1024; // 100MB

// 计算当前位置对应的字节位置
const currentByte = Math.floor((currentTime / duration) * fileSize);

// 只加载当前位置前后 2MB 的内容
const start = Math.max(0, currentByte - 1024 * 1024);
const end = Math.min(fileSize - 1, currentByte + 1024 * 1024);

fetch(videoUrl, {
  headers: { Range: `bytes=${start}-${end}` },
});
```

### 2. 文件下载管理器（如 IDM、迅雷）

```javascript
// 多线程下载：将文件分成多个片段同时下载
class MultiThreadDownloader {
  constructor(url, numThreads = 4) {
    this.url = url;
    this.numThreads = numThreads;
  }

  async download() {
    // 获取文件大小
    const response = await fetch(this.url, { method: "HEAD" });
    const fileSize = parseInt(response.headers.get("Content-Length"), 10);

    const chunkSize = Math.ceil(fileSize / this.numThreads);
    const promises = [];

    // 创建多个下载任务
    for (let i = 0; i < this.numThreads; i++) {
      const start = i * chunkSize;
      const end = Math.min((i + 1) * chunkSize - 1, fileSize - 1);

      promises.push(
        fetch(this.url, {
          headers: { Range: `bytes=${start}-${end}` },
        }).then((r) => r.arrayBuffer())
      );
    }

    // 并行下载所有片段
    const chunks = await Promise.all(promises);

    // 合并片段
    return new Blob(chunks);
  }
}

// 使用 4 个线程下载
const downloader = new MultiThreadDownloader("https://example.com/file.zip", 4);
downloader.download().then((blob) => {
  console.log("下载完成:", blob.size, "字节");
});
```

### 3. 图片预览（加载前几个字节判断格式）

```javascript
async function previewImage(url) {
  // 只读取前 1KB 判断图片类型
  const response = await fetch(url, {
    headers: { Range: "bytes=0-1023" },
  });

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // 检测文件签名
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    console.log("这是 JPEG 图片");
  } else if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    console.log("这是 PNG 图片");
  }
}
```

---

## 注意事项

### ⚠️ 1. 缓存问题

```http
# 范围请求可能导致缓存问题
# 需要正确设置 Vary 响应头
Vary: Range

# 或禁用缓存
Cache-Control: no-store
```

### ⚠️ 2. 条件请求

```http
# 结合 ETag 使用，确保文件未被修改
GET /file.txt HTTP/1.1
Range: bytes=1000-1999
If-Range: "etag-value"

# 如果 ETag 不匹配，服务器返回 200 和完整内容
# 如果匹配，返回 206 和部分内容
```

### ⚠️ 3. CORS 配置

```javascript
// 服务器需要允许跨域范围请求
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Range");
  res.header("Access-Control-Expose-Headers", "Content-Range, Content-Length");
  next();
});
```

### ⚠️ 4. 性能考虑

```javascript
// ❌ 避免请求过小的片段（增加请求开销）
Range: bytes = 0 - 100; // 只有 100 字节，不值得

// ✅ 使用合理的片段大小
Range: bytes = 0 - 1048575; // 1MB
```

---

## 总结

### 核心要点

| 概念         | 说明                                         |
| ------------ | -------------------------------------------- |
| **状态码**   | 206 Partial Content                          |
| **请求头**   | `Range: bytes=<start>-<end>`                 |
| **响应头**   | `Content-Range: bytes <start>-<end>/<total>` |
| **支持检测** | `Accept-Ranges: bytes`                       |
| **主要用途** | 断点续传、流媒体、分片下载                   |

### 优势

✅ **节省带宽**：只传输需要的部分  
✅ **提升体验**：支持断点续传  
✅ **加快速度**：多线程并行下载  
✅ **按需加载**：视频/音频流式播放

### 应用场景

- 📹 **视频点播**：YouTube、Netflix
- 📥 **下载管理器**：IDM、迅雷
- 📱 **移动应用**：节省流量
- 🎵 **音乐播放**：Spotify、Apple Music
- 📄 **PDF 预览**：在线文档查看

掌握 HTTP 206 状态码和范围请求，能显著提升大文件传输的用户体验！
