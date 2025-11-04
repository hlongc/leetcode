# 大文件行重复统计（Node.js 实现）

## 问题分析

统计超大文件中重复最多的行，核心挑战：

| 挑战         | 问题                 | 解决方案              |
| ------------ | -------------------- | --------------------- |
| **内存限制** | 无法一次性加载到内存 | 流式读取              |
| **性能要求** | 文件可能几 GB        | 使用 Stream 和 Buffer |
| **统计精度** | 需要准确计数         | HashMap 或数据库      |
| **存储优化** | 重复行可能很长       | 使用哈希（类似 Git）  |

---

## 方案一：基础流式处理（适合中等文件）

### 实现代码

```javascript
// basic-line-counter.js
const fs = require("fs");
const readline = require("readline");

class LineCounter {
  constructor(filePath) {
    this.filePath = filePath;
    this.lineCount = new Map(); // 存储每行的出现次数
  }

  async process() {
    return new Promise((resolve, reject) => {
      // 创建可读流
      const fileStream = fs.createReadStream(this.filePath, {
        encoding: "utf8",
        highWaterMark: 64 * 1024, // 64KB 缓冲区
      });

      // 创建逐行读取接口
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity, // 处理 \r\n 和 \n
      });

      // 逐行处理
      rl.on("line", (line) => {
        const trimmedLine = line.trim();

        if (trimmedLine) {
          // 忽略空行
          const count = this.lineCount.get(trimmedLine) || 0;
          this.lineCount.set(trimmedLine, count + 1);
        }
      });

      rl.on("close", () => {
        resolve(this.getMostFrequent());
      });

      rl.on("error", reject);
    });
  }

  getMostFrequent() {
    let maxCount = 0;
    let mostFrequentLine = null;

    for (const [line, count] of this.lineCount.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentLine = line;
      }
    }

    return {
      line: mostFrequentLine,
      count: maxCount,
      totalUniqueLines: this.lineCount.size,
    };
  }

  // 获取 Top N
  getTopN(n = 10) {
    return Array.from(this.lineCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([line, count]) => ({ line, count }));
  }

  // 获取统计信息
  getStats() {
    const counts = Array.from(this.lineCount.values());
    const total = counts.reduce((sum, count) => sum + count, 0);

    return {
      totalLines: total,
      uniqueLines: this.lineCount.size,
      averageOccurrence: total / this.lineCount.size,
    };
  }
}

// 使用示例
async function main() {
  const counter = new LineCounter("./large-file.log");

  console.time("处理时间");
  const result = await counter.process();
  console.timeEnd("处理时间");

  console.log("\n最频繁的行:");
  console.log("内容:", result.line);
  console.log("出现次数:", result.count);
  console.log("唯一行数:", result.totalUniqueLines);

  console.log("\nTop 10:");
  console.table(counter.getTopN(10));

  console.log("\n统计信息:");
  console.table(counter.getStats());
}

main().catch(console.error);
```

---

## 方案二：使用哈希优化（Git 启发）

Git 使用 SHA-1 哈希来存储对象，避免存储重复内容。我们可以借鉴这个思路。

### 实现代码

```javascript
// hash-based-counter.js
const fs = require("fs");
const crypto = require("crypto");
const readline = require("readline");

class HashBasedLineCounter {
  constructor(filePath) {
    this.filePath = filePath;
    this.hashCount = new Map(); // hash → count
    this.hashToLine = new Map(); // hash → 实际内容（采样）
    this.sampleRate = 0.1; // 只存储 10% 的实际内容
  }

  // 计算行的哈希值
  hashLine(line) {
    return crypto.createHash("sha256").update(line).digest("hex");
  }

  async process() {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(this.filePath, {
        encoding: "utf8",
        highWaterMark: 64 * 1024,
      });

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let processedLines = 0;

      rl.on("line", (line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // 计算哈希
        const hash = this.hashLine(trimmedLine);

        // 增加计数
        const count = this.hashCount.get(hash) || 0;
        this.hashCount.set(hash, count + 1);

        // 采样存储实际内容（避免内存爆炸）
        if (!this.hashToLine.has(hash) && Math.random() < this.sampleRate) {
          this.hashToLine.set(hash, trimmedLine);
        }

        processedLines++;

        // 进度提示
        if (processedLines % 100000 === 0) {
          console.log(`已处理 ${processedLines} 行`);
          this.printMemoryUsage();
        }
      });

      rl.on("close", () => {
        console.log(`\n总共处理 ${processedLines} 行`);
        resolve(this.getMostFrequent());
      });

      rl.on("error", reject);
    });
  }

  getMostFrequent() {
    let maxCount = 0;
    let maxHash = null;

    for (const [hash, count] of this.hashCount.entries()) {
      if (count > maxCount) {
        maxCount = count;
        maxHash = hash;
      }
    }

    return {
      hash: maxHash,
      line: this.hashToLine.get(maxHash) || "（未采样，仅有哈希）",
      count: maxCount,
      totalUniqueLines: this.hashCount.size,
    };
  }

  getTopN(n = 10) {
    return Array.from(this.hashCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([hash, count]) => ({
        hash: hash.substring(0, 8), // 显示前 8 位
        line: this.hashToLine.get(hash)?.substring(0, 50) || "（未采样）",
        count,
      }));
  }

  printMemoryUsage() {
    const used = process.memoryUsage();
    console.log({
      rss: `${(used.rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(used.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    });
  }
}

// 使用
async function main() {
  const counter = new HashBasedLineCounter("./huge-file.log");

  console.log("开始处理大文件...\n");
  console.time("总耗时");

  const result = await counter.process();

  console.timeEnd("总耗时");

  console.log("\n结果:");
  console.log("最频繁的行:", result.line);
  console.log("出现次数:", result.count);
  console.log("唯一行数:", result.totalUniqueLines);

  console.log("\nTop 10:");
  console.table(counter.getTopN(10));

  console.log("\n最终内存使用:");
  counter.printMemoryUsage();
}

main().catch(console.error);
```

---

## 方案三：分块处理 + 外部归并（超大文件）

适合处理几十 GB 的文件。

### 实现代码

```javascript
// chunked-processor.js
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { promisify } = require("util");
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

class ChunkedLineCounter {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.chunkSize = options.chunkSize || 10000000; // 每块处理 1000 万行
    this.tempDir = options.tempDir || "./temp";
    this.chunkFiles = [];
  }

  async process() {
    console.log("阶段 1: 分块处理...");
    await this.createTempDir();
    await this.splitAndCount();

    console.log("\n阶段 2: 归并结果...");
    const result = await this.mergeResults();

    console.log("\n阶段 3: 清理临时文件...");
    await this.cleanup();

    return result;
  }

  async createTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async splitAndCount() {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(this.filePath, {
        encoding: "utf8",
      });

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let currentChunk = new Map();
      let lineCount = 0;
      let chunkIndex = 0;

      rl.on("line", async (line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // 统计当前块
        const count = currentChunk.get(trimmedLine) || 0;
        currentChunk.set(trimmedLine, count + 1);

        lineCount++;

        // 达到块大小，保存到文件
        if (lineCount >= this.chunkSize) {
          rl.pause(); // 暂停读取

          await this.saveChunk(chunkIndex, currentChunk);
          console.log(
            `保存块 ${chunkIndex}, 包含 ${currentChunk.size} 个唯一行`
          );

          currentChunk = new Map();
          lineCount = 0;
          chunkIndex++;

          rl.resume(); // 继续读取
        }
      });

      rl.on("close", async () => {
        // 保存最后一块
        if (currentChunk.size > 0) {
          await this.saveChunk(chunkIndex, currentChunk);
          console.log(`保存最后一块 ${chunkIndex}`);
        }

        resolve();
      });

      rl.on("error", reject);
    });
  }

  async saveChunk(index, chunkMap) {
    const chunkFile = path.join(this.tempDir, `chunk_${index}.json`);

    // 转换 Map 为对象
    const obj = Object.fromEntries(chunkMap);

    await writeFile(chunkFile, JSON.stringify(obj));
    this.chunkFiles.push(chunkFile);
  }

  async mergeResults() {
    const finalCount = new Map();

    // 读取所有块文件并归并
    for (let i = 0; i < this.chunkFiles.length; i++) {
      console.log(`归并块 ${i + 1}/${this.chunkFiles.length}`);

      const chunkData = await readFile(this.chunkFiles[i], "utf8");
      const chunkMap = JSON.parse(chunkData);

      // 合并计数
      for (const [line, count] of Object.entries(chunkMap)) {
        const totalCount = finalCount.get(line) || 0;
        finalCount.set(line, totalCount + count);
      }

      // 释放内存
      delete chunkData;
      delete chunkMap;

      if (global.gc) {
        global.gc();
      }
    }

    // 找出最频繁的行
    return this.findMostFrequent(finalCount);
  }

  findMostFrequent(countMap) {
    let maxCount = 0;
    let maxLine = null;

    for (const [line, count] of countMap.entries()) {
      if (count > maxCount) {
        maxCount = count;
        maxLine = line;
      }
    }

    return {
      line: maxLine,
      count: maxCount,
      uniqueLines: countMap.size,
    };
  }

  async cleanup() {
    for (const file of this.chunkFiles) {
      fs.unlinkSync(file);
    }
    fs.rmdirSync(this.tempDir);
    console.log("临时文件已清理");
  }
}

// 使用
async function main() {
  const processor = new ChunkedLineCounter("./huge-file.log", {
    chunkSize: 5000000, // 每块 500 万行
    tempDir: "./temp",
  });

  console.time("总耗时");
  const result = await processor.process();
  console.timeEnd("总耗时");

  console.log("\n最终结果:");
  console.log("最频繁的行:", result.line);
  console.log("出现次数:", result.count);
  console.log("唯一行数:", result.uniqueLines);
}

main().catch(console.error);
```

---

## 方案三：Git 启发的哈希存储方案

参考 Git 的对象存储模型，使用哈希来避免存储重复内容。

### Git 的对象存储原理

```
Git 存储模型：

1. 对内容计算 SHA-1 哈希
   ┌──────────────────────┐
   │ "Hello World"        │
   └──────────────────────┘
            ↓ SHA-1
   557db03de997c86a4a028e1ebd3a1ceb225be238

2. 使用哈希作为 key 存储
   .git/objects/55/7db03de997c86a4a028e1ebd3a1ceb225be238

3. 相同内容只存储一次
   - 节省空间
   - 通过哈希快速查找
```

### 实现代码

```javascript
// git-inspired-counter.js
const fs = require("fs");
const crypto = require("crypto");
const readline = require("readline");
const path = require("path");

class GitInspiredCounter {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.objectsDir = options.objectsDir || "./.objects";
    this.hashCount = new Map(); // hash → count
    this.indexFile = path.join(this.objectsDir, "index");
  }

  async process() {
    await this.initObjectsDir();

    console.log("阶段 1: 扫描文件并计算哈希...");
    await this.scanAndHash();

    console.log("\n阶段 2: 分析结果...");
    const result = await this.analyze();

    return result;
  }

  async initObjectsDir() {
    if (!fs.existsSync(this.objectsDir)) {
      fs.mkdirSync(this.objectsDir, { recursive: true });
    }
  }

  computeHash(line) {
    // 使用 SHA-256（比 Git 的 SHA-1 更安全）
    return crypto.createHash("sha256").update(line).digest("hex");
  }

  getObjectPath(hash) {
    // Git 风格：前 2 位作为目录，后面作为文件名
    const dir = hash.substring(0, 2);
    const file = hash.substring(2);
    return {
      dir: path.join(this.objectsDir, dir),
      file: path.join(this.objectsDir, dir, file),
    };
  }

  async storeObject(hash, content) {
    const { dir, file } = this.getObjectPath(hash);

    // 如果对象已存在，跳过
    if (fs.existsSync(file)) {
      return;
    }

    // 创建目录
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 存储内容（可以压缩）
    fs.writeFileSync(file, content, "utf8");
  }

  async scanAndHash() {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(this.filePath, {
        encoding: "utf8",
      });

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let processedLines = 0;

      rl.on("line", async (line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // 计算哈希
        const hash = this.computeHash(trimmedLine);

        // 更新计数
        const count = this.hashCount.get(hash) || 0;
        this.hashCount.set(hash, count + 1);

        // 存储对象（首次出现时）
        if (count === 0) {
          await this.storeObject(hash, trimmedLine);
        }

        processedLines++;

        if (processedLines % 100000 === 0) {
          console.log(
            `已处理 ${processedLines} 行, 唯一行: ${this.hashCount.size}`
          );
        }
      });

      rl.on("close", async () => {
        // 保存索引
        await this.saveIndex();
        resolve();
      });

      rl.on("error", reject);
    });
  }

  async saveIndex() {
    const indexData = JSON.stringify({
      hashCount: Array.from(this.hashCount.entries()),
      timestamp: new Date().toISOString(),
    });

    fs.writeFileSync(this.indexFile, indexData);
  }

  async loadIndex() {
    if (!fs.existsSync(this.indexFile)) return false;

    const indexData = fs.readFileSync(this.indexFile, "utf8");
    const { hashCount } = JSON.parse(indexData);

    this.hashCount = new Map(hashCount);
    return true;
  }

  async analyze() {
    // 找出最频繁的哈希
    let maxCount = 0;
    let maxHash = null;

    for (const [hash, count] of this.hashCount.entries()) {
      if (count > maxCount) {
        maxCount = count;
        maxHash = hash;
      }
    }

    // 从对象存储中读取实际内容
    const { file } = this.getObjectPath(maxHash);
    let content = "（无法读取）";

    if (fs.existsSync(file)) {
      content = fs.readFileSync(file, "utf8");
    }

    return {
      hash: maxHash,
      line: content,
      count: maxCount,
      uniqueLines: this.hashCount.size,
    };
  }

  async cleanup() {
    // 递归删除对象目录
    fs.rmSync(this.objectsDir, { recursive: true, force: true });
  }
}

// 使用
async function main() {
  const counter = new GitInspiredCounter("./huge-file.log");

  console.time("总耗时");
  const result = await counter.process();
  console.timeEnd("总耗时");

  console.log("\n结果:");
  console.log("Hash:", result.hash);
  console.log("内容:", result.line);
  console.log("出现次数:", result.count);
  console.log("唯一行数:", result.uniqueLines);
}

main().catch(console.error);
```

---

## 方案四：使用数据库（最适合超大文件）

### SQLite 实现

```javascript
// sqlite-counter.js
const fs = require("fs");
const readline = require("readline");
const sqlite3 = require("sqlite3").verbose();
const { promisify } = require("util");

class SQLiteLineCounter {
  constructor(filePath, dbPath = ":memory:") {
    // 使用内存数据库或文件数据库
    this.filePath = filePath;
    this.db = new sqlite3.Database(dbPath);
    this.runAsync = promisify(this.db.run.bind(this.db));
    this.getAsync = promisify(this.db.get.bind(this.db));
    this.allAsync = promisify(this.db.all.bind(this.db));
  }

  async init() {
    // 创建表
    await this.runAsync(`
      CREATE TABLE IF NOT EXISTS line_count (
        line_hash TEXT PRIMARY KEY,
        line_content TEXT,
        count INTEGER DEFAULT 1
      )
    `);

    // 创建索引
    await this.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_count ON line_count(count DESC)
    `);
  }

  async process() {
    await this.init();

    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(this.filePath, {
        encoding: "utf8",
      });

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let batch = [];
      let processedLines = 0;
      const batchSize = 1000;

      rl.on("line", async (line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        batch.push(trimmedLine);
        processedLines++;

        // 批量插入
        if (batch.length >= batchSize) {
          rl.pause();
          await this.insertBatch(batch);
          batch = [];
          rl.resume();

          if (processedLines % 100000 === 0) {
            console.log(`已处理 ${processedLines} 行`);
          }
        }
      });

      rl.on("close", async () => {
        // 插入剩余的行
        if (batch.length > 0) {
          await this.insertBatch(batch);
        }

        console.log(`总共处理 ${processedLines} 行`);
        resolve(await this.getMostFrequent());
      });

      rl.on("error", reject);
    });
  }

  async insertBatch(lines) {
    await this.runAsync("BEGIN TRANSACTION");

    for (const line of lines) {
      const hash = this.computeHash(line);

      await this.runAsync(
        `
        INSERT INTO line_count (line_hash, line_content, count)
        VALUES (?, ?, 1)
        ON CONFLICT(line_hash) DO UPDATE SET count = count + 1
      `,
        [hash, line]
      );
    }

    await this.runAsync("COMMIT");
  }

  computeHash(line) {
    return require("crypto").createHash("md5").update(line).digest("hex");
  }

  async getMostFrequent() {
    const result = await this.getAsync(`
      SELECT line_content, count, line_hash
      FROM line_count
      ORDER BY count DESC
      LIMIT 1
    `);

    const stats = await this.getAsync(`
      SELECT COUNT(*) as uniqueLines, SUM(count) as totalLines
      FROM line_count
    `);

    return {
      line: result?.line_content,
      count: result?.count || 0,
      hash: result?.line_hash,
      uniqueLines: stats.uniqueLines,
      totalLines: stats.totalLines,
    };
  }

  async getTopN(n = 10) {
    return await this.allAsync(
      `
      SELECT line_content, count
      FROM line_count
      ORDER BY count DESC
      LIMIT ?
    `,
      [n]
    );
  }

  async close() {
    return new Promise((resolve) => {
      this.db.close(resolve);
    });
  }
}

// 使用
async function main() {
  // 使用文件数据库（适合超大文件）
  const counter = new SQLiteLineCounter("./huge-file.log", "./line_count.db");

  console.time("总耗时");
  const result = await counter.process();
  console.timeEnd("总耗时");

  console.log("\n结果:");
  console.log("最频繁的行:", result.line);
  console.log("出现次数:", result.count);
  console.log("唯一行数:", result.uniqueLines);

  console.log("\nTop 10:");
  const top10 = await counter.getTopN(10);
  console.table(top10);

  await counter.close();
}

main().catch(console.error);
```

---

## 方案五：外部排序（适合极端情况）

### 实现思路

```
1. 分块读取并排序
   ┌──────────────────┐
   │ 原文件（100GB）   │
   └──────────────────┘
         ↓ 分块
   ┌─────┬─────┬─────┐
   │ 块1 │ 块2 │ 块3 │
   └─────┴─────┴─────┘
         ↓ 各自排序
   ┌─────┬─────┬─────┐
   │ 排序│ 排序│ 排序│
   └─────┴─────┴─────┘

2. 归并排序
         ↓ 归并
   ┌──────────────────┐
   │ 合并后的排序文件  │
   └──────────────────┘

3. 统计重复
         ↓ 扫描
   ┌──────────────────┐
   │ 相邻相同的行计数  │
   └──────────────────┘
```

### 简化实现

```javascript
// external-sort-counter.js
const fs = require("fs");
const readline = require("readline");
const path = require("path");

class ExternalSortCounter {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.chunkSize = options.chunkSize || 1000000;
    this.tempDir = options.tempDir || "./temp-sort";
    this.sortedChunks = [];
  }

  async process() {
    await this.createTempDir();

    console.log("阶段 1: 分块排序...");
    await this.sortChunks();

    console.log("\n阶段 2: 归并并统计...");
    const result = await this.mergeAndCount();

    console.log("\n阶段 3: 清理...");
    await this.cleanup();

    return result;
  }

  async createTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async sortChunks() {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(this.filePath, {
        encoding: "utf8",
      });

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let currentChunk = [];
      let chunkIndex = 0;

      rl.on("line", async (line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        currentChunk.push(trimmedLine);

        // 达到块大小，排序并保存
        if (currentChunk.length >= this.chunkSize) {
          rl.pause();

          await this.saveSortedChunk(chunkIndex, currentChunk);
          console.log(`块 ${chunkIndex}: ${currentChunk.length} 行已排序`);

          currentChunk = [];
          chunkIndex++;

          rl.resume();
        }
      });

      rl.on("close", async () => {
        // 保存最后一块
        if (currentChunk.length > 0) {
          await this.saveSortedChunk(chunkIndex, currentChunk);
        }

        resolve();
      });

      rl.on("error", reject);
    });
  }

  async saveSortedChunk(index, lines) {
    // 排序
    lines.sort();

    // 保存到文件
    const chunkFile = path.join(this.tempDir, `sorted_${index}.txt`);
    fs.writeFileSync(chunkFile, lines.join("\n"));

    this.sortedChunks.push(chunkFile);
  }

  async mergeAndCount() {
    // 简化版：依次读取排序好的块，统计连续相同的行
    const lineCount = new Map();

    for (const chunkFile of this.sortedChunks) {
      const content = fs.readFileSync(chunkFile, "utf8");
      const lines = content.split("\n");

      for (const line of lines) {
        if (!line) continue;
        const count = lineCount.get(line) || 0;
        lineCount.set(line, count + 1);
      }
    }

    // 找出最大值
    let maxCount = 0;
    let maxLine = null;

    for (const [line, count] of lineCount.entries()) {
      if (count > maxCount) {
        maxCount = count;
        maxLine = line;
      }
    }

    return {
      line: maxLine,
      count: maxCount,
      uniqueLines: lineCount.size,
    };
  }

  async cleanup() {
    fs.rmSync(this.tempDir, { recursive: true, force: true });
  }
}
```

---

## 性能对比和选择建议

### 方案对比

| 方案         | 内存占用 | 速度 | 适用文件大小 | 复杂度 |
| ------------ | -------- | ---- | ------------ | ------ |
| **基础流式** | 中等     | 快   | < 1GB        | 低     |
| **哈希优化** | 低       | 快   | < 10GB       | 中     |
| **分块处理** | 低       | 中   | < 50GB       | 中     |
| **数据库**   | 低       | 中   | 任意大小     | 中     |
| **外部排序** | 极低     | 慢   | 任意大小     | 高     |

### 选择指南

```javascript
if (文件大小 < 500MB && 内存充足) {
  使用方案一（基础流式处理）;
} else if (文件大小 < 10GB) {
  使用方案二（哈希优化）;
} else if (需要持久化或多次查询) {
  使用方案四（数据库）;
} else {
  使用方案三（分块处理）或方案五（外部排序）;
}
```

---

## 完整的生产级实现

### 包含进度条、错误处理、配置等

```javascript
// production-line-counter.js
const fs = require("fs");
const readline = require("readline");
const crypto = require("crypto");
const cliProgress = require("cli-progress");

class ProductionLineCounter {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.useHash = options.useHash !== false;
    this.maxMemoryMB = options.maxMemoryMB || 500;
    this.progressBar = null;

    this.lineCount = new Map();
    this.stats = {
      totalLines: 0,
      uniqueLines: 0,
      processedBytes: 0,
      fileSize: 0,
    };
  }

  async process() {
    try {
      // 获取文件大小
      const stats = fs.statSync(this.filePath);
      this.stats.fileSize = stats.size;

      console.log(`文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`使用哈希: ${this.useHash ? "是" : "否"}\n`);

      // 创建进度条
      this.progressBar = new cliProgress.SingleBar(
        {
          format: "进度 |{bar}| {percentage}% | {value}/{total} MB",
        },
        cliProgress.Presets.shades_classic
      );

      this.progressBar.start(Math.ceil(stats.size / 1024 / 1024), 0);

      // 处理文件
      await this.processFile();

      this.progressBar.stop();

      // 分析结果
      return this.analyze();
    } catch (error) {
      if (this.progressBar) {
        this.progressBar.stop();
      }
      throw error;
    }
  }

  async processFile() {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(this.filePath, {
        encoding: "utf8",
        highWaterMark: 64 * 1024,
      });

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let processedBytes = 0;

      fileStream.on("data", (chunk) => {
        processedBytes += chunk.length;
        this.stats.processedBytes = processedBytes;

        // 更新进度条
        this.progressBar.update(Math.ceil(processedBytes / 1024 / 1024));
      });

      rl.on("line", (line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        this.stats.totalLines++;

        // 使用哈希或原始内容作为 key
        const key = this.useHash ? this.hash(trimmedLine) : trimmedLine;

        const count = this.lineCount.get(key) || 0;
        this.lineCount.set(key, count + 1);

        // 内存检查
        if (this.stats.totalLines % 100000 === 0) {
          this.checkMemory();
        }
      });

      rl.on("close", () => {
        this.stats.uniqueLines = this.lineCount.size;
        resolve();
      });

      rl.on("error", reject);
    });
  }

  hash(str) {
    return crypto.createHash("md5").update(str).digest("hex");
  }

  checkMemory() {
    const usage = process.memoryUsage();
    const usedMB = usage.heapUsed / 1024 / 1024;

    if (usedMB > this.maxMemoryMB) {
      console.warn(
        `\n⚠️  内存使用过高: ${usedMB.toFixed(2)} MB (限制: ${
          this.maxMemoryMB
        } MB)`
      );
      console.warn("建议使用数据库方案或增加内存限制");
    }
  }

  analyze() {
    let maxCount = 0;
    let maxKey = null;

    for (const [key, count] of this.lineCount.entries()) {
      if (count > maxCount) {
        maxCount = count;
        maxKey = key;
      }
    }

    return {
      key: maxKey,
      line: this.useHash ? `Hash: ${maxKey}` : maxKey,
      count: maxCount,
      stats: this.stats,
    };
  }

  getTopN(n = 10) {
    return Array.from(this.lineCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key, count], index) => ({
        rank: index + 1,
        line: this.useHash
          ? `Hash: ${key.substring(0, 16)}...`
          : key.substring(0, 50),
        count,
      }));
  }
}

// CLI 使用
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("用法: node production-line-counter.js <文件路径> [选项]");
    console.log("选项:");
    console.log("  --use-hash         使用哈希（节省内存）");
    console.log("  --max-memory=MB    最大内存限制（默认 500MB）");
    process.exit(1);
  }

  const filePath = args[0];
  const options = {
    useHash: args.includes("--use-hash"),
    maxMemoryMB:
      parseInt(
        args.find((arg) => arg.startsWith("--max-memory="))?.split("=")[1]
      ) || 500,
  };

  console.log("开始处理文件:", filePath);
  console.log("配置:", options, "\n");

  const counter = new ProductionLineCounter(filePath, options);

  console.time("总耗时");
  const result = await counter.process();
  console.timeEnd("总耗时");

  console.log("\n" + "=".repeat(60));
  console.log("最频繁的行:");
  console.log("内容:", result.line);
  console.log("出现次数:", result.count.toLocaleString());
  console.log("\n统计信息:");
  console.log("总行数:", result.stats.totalLines.toLocaleString());
  console.log("唯一行数:", result.stats.uniqueLines.toLocaleString());
  console.log(
    "重复率:",
    (
      ((result.stats.totalLines - result.stats.uniqueLines) /
        result.stats.totalLines) *
      100
    ).toFixed(2) + "%"
  );

  console.log("\nTop 10:");
  console.table(counter.getTopN(10));
}

main().catch(console.error);
```

---

## 测试数据生成

### 生成测试文件

```javascript
// generate-test-file.js
const fs = require("fs");

function generateLargeFile(filePath, lines = 10000000) {
  console.log(`生成测试文件: ${lines.toLocaleString()} 行`);

  const writeStream = fs.createWriteStream(filePath);

  // 模拟真实场景：有些行重复很多
  const commonLines = [
    "ERROR: Connection timeout",
    "INFO: Request processed successfully",
    "WARN: High memory usage detected",
    "ERROR: Database connection failed",
    "INFO: User logged in",
  ];

  for (let i = 0; i < lines; i++) {
    let line;

    // 30% 是常见行（重复）
    if (Math.random() < 0.3) {
      line = commonLines[Math.floor(Math.random() * commonLines.length)];
    } else {
      // 70% 是随机行（较少重复）
      line = `LOG ${i}: ${Math.random().toString(36).substring(7)}`;
    }

    writeStream.write(line + "\n");

    if (i % 1000000 === 0) {
      console.log(`已生成 ${i.toLocaleString()} 行`);
    }
  }

  writeStream.end();

  return new Promise((resolve) => {
    writeStream.on("finish", () => {
      const stats = fs.statSync(filePath);
      console.log(
        `\n文件生成完成: ${(stats.size / 1024 / 1024).toFixed(2)} MB`
      );
      resolve();
    });
  });
}

// 使用
generateLargeFile("./test-file.log", 10000000).catch(console.error);
```

---

## 性能优化技巧

### 1. 使用 Buffer 和流

```javascript
// 优化读取性能
const stream = fs.createReadStream(filePath, {
  encoding: "utf8",
  highWaterMark: 256 * 1024, // 256KB 缓冲区（根据实际调整）
});
```

### 2. 批量操作

```javascript
// 批量插入数据库，而不是逐行
const batchSize = 1000;
let batch = [];

rl.on("line", async (line) => {
  batch.push(line);

  if (batch.length >= batchSize) {
    await insertBatch(batch);
    batch = [];
  }
});
```

### 3. 使用 Worker Threads 并行处理

```javascript
// worker-counter.js
const { Worker } = require("worker_threads");
const os = require("os");

class ParallelLineCounter {
  constructor(filePath) {
    this.filePath = filePath;
    this.numWorkers = os.cpus().length;
  }

  async process() {
    // 1. 将文件分成多个部分
    // 2. 每个 Worker 处理一部分
    // 3. 合并结果

    const workers = [];
    const chunkSize = this.getChunkSize();

    for (let i = 0; i < this.numWorkers; i++) {
      const worker = new Worker("./worker.js", {
        workerData: {
          filePath: this.filePath,
          start: i * chunkSize,
          end: (i + 1) * chunkSize,
        },
      });

      workers.push(
        new Promise((resolve) => {
          worker.on("message", resolve);
        })
      );
    }

    // 等待所有 Worker 完成
    const results = await Promise.all(workers);

    // 合并结果
    return this.mergeResults(results);
  }

  mergeResults(results) {
    const finalCount = new Map();

    results.forEach((result) => {
      for (const [line, count] of Object.entries(result)) {
        const total = finalCount.get(line) || 0;
        finalCount.set(line, total + count);
      }
    });

    // 找出最大值
    let maxCount = 0;
    let maxLine = null;

    for (const [line, count] of finalCount.entries()) {
      if (count > maxCount) {
        maxCount = count;
        maxLine = line;
      }
    }

    return { line: maxLine, count: maxCount };
  }
}
```

---

## 命令行工具完整示例

```javascript
#!/usr/bin/env node
// line-counter-cli.js

const fs = require("fs");
const readline = require("readline");
const { program } = require("commander");
const chalk = require("chalk");

program
  .version("1.0.0")
  .description("统计文件中重复最多的行")
  .argument("<file>", "要处理的文件路径")
  .option("-t, --top <n>", "显示前 N 个最频繁的行", "10")
  .option("--use-hash", "使用哈希（节省内存）")
  .option("--output <file>", "输出结果到文件")
  .parse(process.argv);

const options = program.opts();
const filePath = program.args[0];

async function main() {
  if (!fs.existsSync(filePath)) {
    console.error(chalk.red("错误: 文件不存在"));
    process.exit(1);
  }

  const counter = new LineCounter(filePath);

  console.log(chalk.blue("开始处理..."));
  console.time(chalk.green("✓ 完成"));

  const result = await counter.process();

  console.timeEnd(chalk.green("✓ 完成"));

  // 输出结果
  console.log("\n" + chalk.bold("最频繁的行:"));
  console.log(chalk.yellow(result.line));
  console.log(chalk.cyan(`出现次数: ${result.count.toLocaleString()}`));

  const topN = counter.getTopN(parseInt(options.top));
  console.log(`\n${chalk.bold(`Top ${options.top}:`)}`);
  console.table(topN);

  // 保存到文件
  if (options.output) {
    const output = {
      mostFrequent: result,
      topN: topN,
      stats: counter.getStats(),
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(options.output, JSON.stringify(output, null, 2));
    console.log(chalk.green(`\n结果已保存到: ${options.output}`));
  }
}

main().catch((error) => {
  console.error(chalk.red("错误:"), error.message);
  process.exit(1);
});
```

---

## 总结

### 核心思路

1. **流式处理**：避免一次性加载到内存
2. **哈希优化**：类似 Git，用哈希代替原始内容
3. **分块处理**：将大文件分成小块处理
4. **外部存储**：使用数据库或临时文件

### 推荐方案

| 文件大小     | 推荐方案 | 命令                            |
| ------------ | -------- | ------------------------------- |
| < 500MB      | 基础流式 | `node basic-line-counter.js`    |
| 500MB - 10GB | 哈希优化 | `node hash-based-counter.js`    |
| > 10GB       | 数据库   | `node sqlite-counter.js`        |
| 极端大       | 外部排序 | `node external-sort-counter.js` |

### 关键代码

```javascript
// 最简实现
const fs = require("fs");
const readline = require("readline");

async function findMostFrequent(filePath) {
  const count = new Map();
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed) {
      count.set(trimmed, (count.get(trimmed) || 0) + 1);
    }
  }

  return Array.from(count.entries()).reduce((max, curr) =>
    curr[1] > max[1] ? curr : max
  );
}

findMostFrequent("./file.log").then(([line, count]) => {
  console.log("最频繁的行:", line);
  console.log("出现次数:", count);
});
```

这套方案可以处理从几 MB 到几百 GB 的文件，根据实际情况选择合适的方案即可！
