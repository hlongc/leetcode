/**
 * Diff结果的单条记录
 *
 * @example
 * // 表示一行被删除
 * { type: "delete", oldLine: 5, content: "console.log('old')" }
 *
 * // 表示一行被添加
 * { type: "add", newLine: 5, content: "console.log('new')" }
 *
 * // 表示一行相同（作为上下文）
 * { type: "common", oldLine: 5, newLine: 5, content: "return true;" }
 */
interface DiffResult {
  type: "add" | "delete" | "common"; // 变更类型：添加、删除、相同
  oldLine?: number; // 在旧文件中的行号（0-based）
  newLine?: number; // 在新文件中的行号（0-based）
  content: string; // 行内容
}

/**
 * Diff块（Hunk）：一组相关的连续变更
 *
 * Git会将相邻的变更分组，每组前后保留几行上下文
 *
 * @example
 * // 假设第10-15行有变更
 * {
 *   oldStart: 7,     // 从旧文件第8行开始（保留3行上下文）
 *   oldLines: 9,     // 包含9行旧文件内容
 *   newStart: 7,     // 从新文件第8行开始
 *   newLines: 10,    // 包含10行新文件内容
 *   changes: [...]   // 具体的变更列表
 * }
 */
interface DiffHunk {
  oldStart: number; // 在旧文件中的起始行号
  oldLines: number; // 旧文件包含的行数
  newStart: number; // 在新文件中的起始行号
  newLines: number; // 新文件包含的行数
  changes: DiffResult[]; // 该块的所有变更
}

/**
 * GitDiff 类 - 基于 LCS（最长公共子序列）算法
 *
 * 核心思想：
 * 1. 找出两个文件的最长公共子序列（相同的行）
 * 2. 不在公共子序列中的就是差异：
 *    - 只在旧文件 → 删除（-）
 *    - 只在新文件 → 添加（+）
 *    - 都存在 → 相同（上下文）
 *
 * 时间复杂度：O(M * N)，M和N是两个文件的行数
 * 空间复杂度：O(M * N)，需要一个二维DP表
 *
 * @example
 * const differ = new GitDiff();
 * const hunks = differ.diff("line1\nline2", "line1\nline3");
 * const output = differ.format(hunks);
 * // 输出：
 * // @@ -1,2 +1,2 @@
 * //  line1
 * // -line2
 * // +line3
 */
class GitDiff {
  /**
   * 主函数：比较两个文件
   *
   * @param oldText - 旧文件内容（字符串）
   * @param newText - 新文件内容（字符串）
   * @returns 差异块（hunks）数组
   *
   * @example
   * const hunks = differ.diff(
   *   "function hello() {\n  console.log('hi');\n}",
   *   "function hello(name) {\n  console.log('hi ' + name);\n}"
   * );
   */
  diff(oldText: string, newText: string): DiffHunk[] {
    const oldLines = this.splitLines(oldText);
    const newLines = this.splitLines(newText);

    // 1. 计算LCS（最长公共子序列）
    const dp = this.computeLCS(oldLines, newLines);

    // 2. 生成diff结果（回溯DP表）
    const diffResults = this.generateDiff(oldLines, newLines, dp);

    // 3. 分组成hunks（差异块），保留上下文
    const hunks = this.groupIntoHunks(diffResults);

    return hunks;
  }

  /**
   * 按行分割文本
   *
   * @param text - 要分割的文本
   * @returns 行数组
   *
   * @example
   * splitLines("line1\nline2\nline3")
   * // 返回: ["line1", "line2", "line3"]
   */
  private splitLines(text: string): string[] {
    return text.split("\n");
  }

  /**
   * 计算最长公共子序列（LCS）- 使用动态规划
   *
   * dp[i][j] 表示：oldLines[0..i-1] 和 newLines[0..j-1] 的LCS长度
   *
   * 状态转移方程：
   * - 如果 oldLines[i-1] === newLines[j-1]:
   *     dp[i][j] = dp[i-1][j-1] + 1  (匹配，长度+1)
   * - 否则:
   *     dp[i][j] = max(dp[i-1][j], dp[i][j-1])  (取两个子问题的最大值)
   *
   * @example
   * oldLines = ["A", "B", "C"]
   * newLines = ["A", "X", "C"]
   *
   * 生成的DP表：
   *       ""  A   X   C
   *   ""  0   0   0   0
   *   A   0   1   1   1
   *   B   0   1   1   1
   *   C   0   1   1   2
   *
   * LCS长度 = dp[3][3] = 2（"A" 和 "C"）
   *
   * 关键理解：
   * - dp[2][2] = 1: 因为 "B" !== "X"，取 max(dp[1][2], dp[2][1]) = max(1, 1) = 1
   * - dp[3][3] = 2: 因为 "C" === "C"，取 dp[2][2] + 1 = 2
   */
  private computeLCS(oldLines: string[], newLines: string[]): number[][] {
    const m = oldLines.length;
    const n = newLines.length;

    // 初始化 (m+1) x (n+1) 的DP表，多一行一列用于边界（空字符串）
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    // 填充DP表
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (oldLines[i - 1] === newLines[j - 1]) {
          // 情况1: 两行相同，LCS长度+1
          // 从左上角的值（不包含当前两行）继承，再加1
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          // 情况2: 两行不同，无法匹配
          // 从上方（跳过old当前行）或左方（跳过new当前行）取最大值
          // dp[i-1][j]: 不使用 oldLines[i-1]
          // dp[i][j-1]: 不使用 newLines[j-1]
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp;
  }

  /**
   * 回溯DP表，生成diff结果
   *
   * 从 dp[m][n] 开始，回溯到 dp[0][0]，确定每一行是添加、删除还是相同
   *
   * 回溯规则：
   * 1. 如果 oldLines[i-1] === newLines[j-1]:
   *    → 相同行，向左上移动 (i--, j--)
   * 2. 如果 dp[i][j-1] >= dp[i-1][j]:
   *    → 新增行，向左移动 (j--)
   * 3. 否则:
   *    → 删除行，向上移动 (i--)
   *
   * @example
   * oldLines = ["A", "B", "C"]
   * newLines = ["A", "X", "C"]
   *
   * 回溯过程（从右下到左上）：
   * 1. [3,3]: "C" === "C" → common, 移到 [2,2]
   * 2. [2,2]: "B" !== "X", dp[1][2]=1 >= dp[2][1]=1 → add "X", 移到 [2,1]
   * 3. [2,1]: j=1, i=2 → delete "B", 移到 [1,1]
   * 4. [1,1]: "A" === "A" → common, 移到 [0,0]
   *
   * 结果：
   * [
   *   { type: "common", content: "A" },
   *   { type: "delete", content: "B" },
   *   { type: "add", content: "X" },
   *   { type: "common", content: "C" }
   * ]
   */
  private generateDiff(
    oldLines: string[],
    newLines: string[],
    dp: number[][]
  ): DiffResult[] {
    const result: DiffResult[] = [];
    let i = oldLines.length; // 从最后一行开始
    let j = newLines.length;

    // 从右下角回溯到左上角
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
        // 情况1: 两行相同（在LCS中）
        // 向左上角移动（对角线方向）
        result.unshift({
          type: "common",
          oldLine: i - 1,
          newLine: j - 1,
          content: oldLines[i - 1],
        });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        // 情况2: 新增行（只在新文件中）
        // 向左移动（new文件向前）
        result.unshift({
          type: "add",
          newLine: j - 1,
          content: newLines[j - 1],
        });
        j--;
      } else if (i > 0) {
        // 情况3: 删除行（只在旧文件中）
        // 向上移动（old文件向前）
        result.unshift({
          type: "delete",
          oldLine: i - 1,
          content: oldLines[i - 1],
        });
        i--;
      }
    }

    return result;
  }

  /**
   * 将连续的差异分组成hunks（差异块）
   *
   * Git会将相邻的变更分组，每组前后保留3行上下文，方便阅读
   * 如果两个变更之间的相同行超过6行（3+3），则分为两个hunks
   *
   * @example
   * 输入：
   * [
   *   { type: "common", content: "line1" },
   *   { type: "common", content: "line2" },
   *   { type: "delete", content: "line3" },  ← 变更1
   *   { type: "add", content: "line3_new" },
   *   { type: "common", content: "line4" },
   *   ... (很多common行) ...
   *   { type: "common", content: "line20" },
   *   { type: "delete", content: "line21" },  ← 变更2（距离变更1很远）
   * ]
   *
   * 输出：两个hunks
   * hunk1: [line1, line2, -line3, +line3_new, line4, line5, line6]
   * hunk2: [line18, line19, line20, -line21, ...]
   */
  private groupIntoHunks(diffResults: DiffResult[]): DiffHunk[] {
    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;
    const CONTEXT_LINES = 3; // 保留的上下文行数

    let consecutiveCommon = 0; // 连续相同行的计数器

    for (let i = 0; i < diffResults.length; i++) {
      const item = diffResults[i];

      if (item.type === "common") {
        consecutiveCommon++;

        // 如果连续的相同行超过阈值（6行），结束当前hunk
        // 说明两个变更距离太远，应该分成两个独立的hunks
        if (consecutiveCommon > CONTEXT_LINES * 2 && currentHunk) {
          // 保留前3行作为当前hunk的后置上下文
          for (let j = 0; j < CONTEXT_LINES; j++) {
            if (currentHunk.changes.length > 0) {
              currentHunk.changes.push(diffResults[i - consecutiveCommon + j]);
            }
          }
          hunks.push(currentHunk);
          currentHunk = null; // 重置，等待下一个变更开启新hunk
          consecutiveCommon = 0;
        } else if (currentHunk) {
          // 在hunk内部，添加上下文行
          currentHunk.changes.push(item);
        }
      } else {
        // 遇到差异行（add或delete）
        consecutiveCommon = 0;

        if (!currentHunk) {
          // 创建新的hunk
          currentHunk = {
            oldStart: item.oldLine ?? 0,
            oldLines: 0,
            newStart: item.newLine ?? 0,
            newLines: 0,
            changes: [],
          };

          // 添加前面的上下文行（最多3行）
          for (let j = Math.max(0, i - CONTEXT_LINES); j < i; j++) {
            if (diffResults[j].type === "common") {
              currentHunk.changes.push(diffResults[j]);
            }
          }
        }

        currentHunk.changes.push(item);
      }
    }

    // 添加最后一个hunk
    if (currentHunk) {
      hunks.push(currentHunk);
    }

    return hunks;
  }

  /**
   * 格式化输出（类似git diff格式）
   *
   * Git Diff格式说明：
   * @@ -旧文件起始行,行数 +新文件起始行,行数 @@
   * -删除的行（红色）
   * +添加的行（绿色）
   *  相同的行（上下文）
   *
   * @example
   * 输入hunk:
   * {
   *   oldStart: 0, newStart: 0,
   *   changes: [
   *     { type: "delete", content: "old line" },
   *     { type: "add", content: "new line" },
   *     { type: "common", content: "same line" }
   *   ]
   * }
   *
   * 输出：
   * @@ -1,2 +1,2 @@
   * -old line
   * +new line
   *  same line
   */
  format(hunks: DiffHunk[]): string {
    let output = "";

    for (const hunk of hunks) {
      // 计算行数统计
      let oldCount = 0,
        newCount = 0;

      for (const change of hunk.changes) {
        // 删除和相同的行计入旧文件行数
        if (change.type === "delete" || change.type === "common") oldCount++;
        // 添加和相同的行计入新文件行数
        if (change.type === "add" || change.type === "common") newCount++;
      }

      // 输出hunk头部
      // 格式: @@ -旧起始行,旧行数 +新起始行,新行数 @@
      // 注意：Git的行号从1开始，所以要+1
      output += `@@ -${hunk.oldStart + 1},${oldCount} +${
        hunk.newStart + 1
      },${newCount} @@\n`;

      // 输出每一行的变化
      for (const change of hunk.changes) {
        switch (change.type) {
          case "delete":
            output += `-${change.content}\n`; // 删除：以 - 开头
            break;
          case "add":
            output += `+${change.content}\n`; // 添加：以 + 开头
            break;
          case "common":
            output += ` ${change.content}\n`; // 相同：以空格开头（上下文）
            break;
        }
      }
    }

    return output;
  }
}

/**
 * Myers Diff 算法（Git实际使用的核心算法）
 *
 * 核心思想：
 * 1. 将diff问题转化为图搜索问题：
 *    - 坐标系：x轴=old文件行号，y轴=new文件行号
 *    - 起点(0,0)，终点(M,N)
 *    - 向右移动(x+1) = 删除old中的一行
 *    - 向下移动(y+1) = 插入new中的一行
 *    - 对角线移动(x+1,y+1) = 相同的行（免费移动）
 *
 * 2. 对角线k = x - y（对角线编号）
 *    - 每条对角线上的点满足 x - y = k
 *    - k从-N到M，共M+N+1条对角线
 *
 * 3. 编辑距离D：
 *    - D=0: 不需要编辑（完全相同）
 *    - D=1: 一次编辑（一次插入或删除）
 *    - D=N: N次编辑
 *
 * 时间复杂度：O((M+N) × D)，D是编辑距离
 * - 对于相似文件，D很小，比LCS的O(M×N)快很多
 * - 对于完全不同的文件，D≈M+N，接近O((M+N)²)
 *
 * 空间复杂度：O(M+N)，只需要存储每条对角线的最远位置
 *
 * @example
 * old = ["A", "B", "C"]
 * new = ["A", "X", "C"]
 *
 * 图示（x=old，y=new）：
 *   0   A   B   C
 * 0 ●───○───○───○
 *   │╲  │   │   │
 * A ○──●───○───○
 *   │   │╲  │   │
 * X ○───○───○───○
 *   │   │   │╲  │
 * C ○───○───○──●
 *
 * 最短路径：(0,0) → (1,1) → (1,2) → (2,2) → (3,3)
 * 解读：A相同 → 删B加X → C相同
 */
class MyersDiff {
  /**
   * 主函数：比较两个文本文件（接受字符串）
   *
   * @param oldText - 旧文件内容
   * @param newText - 新文件内容
   * @returns 差异块数组
   */
  compare(oldText: string, newText: string): DiffHunk[] {
    const oldLines = this.splitLines(oldText);
    const newLines = this.splitLines(newText);

    // 1. 使用Myers算法生成diff结果
    const diffResults = this.diff(oldLines, newLines);

    // 2. 分组成hunks（差异块）
    const hunks = this.groupIntoHunks(diffResults);

    return hunks;
  }

  /**
   * 按行分割文本
   */
  private splitLines(text: string): string[] {
    return text.split("\n");
  }

  /**
   * Myers算法核心：计算两个数组的diff
   *
   * 关键数据结构：
   * - V[k]：对角线k上能到达的最远的x坐标
   * - trace：记录每一步的V，用于回溯路径
   *
   * 算法流程：
   * 1. 从D=0开始，逐步增加编辑距离
   * 2. 对于每个D，探索所有可能的对角线k（从-D到D）
   * 3. 对于每条对角线k，决定从哪里来（k-1或k+1）
   * 4. 尽可能沿对角线前进（相同行）
   * 5. 到达终点时，回溯生成diff
   *
   * @example
   * old = ["A", "B"]
   * new = ["A", "C"]
   *
   * D=0: 尝试不编辑，失败
   * D=1:
   *   k=-1: 从(0,0)向下到(0,1)，对角线到(1,2)，但超出范围
   *   k=0:  从(0,0)对角线到(1,1)
   *   k=1:  从(0,0)向右到(1,0)，对角线到(2,1)，但B≠C
   * D=2:
   *   ...继续探索，最终找到路径
   */
  diff(oldLines: string[], newLines: string[]): DiffResult[] {
    const M = oldLines.length;
    const N = newLines.length;
    const MAX = M + N; // 最大编辑距离

    // V[k]存储对角线k上能到达的最远的x坐标
    // k = x - y，表示对角线编号
    const V: Map<number, number> = new Map();
    V.set(1, 0); // 初始化

    // trace记录每一步的V状态，用于回溯
    const trace: Map<number, number>[] = [];

    // 逐步增加编辑距离D，直到找到路径
    for (let D = 0; D <= MAX; D++) {
      const currentV = new Map(V);
      trace.push(currentV); // 保存当前状态

      // 对于编辑距离D，探索从-D到D的所有对角线
      // 步长为2是因为每次移动会改变k的奇偶性
      for (let k = -D; k <= D; k += 2) {
        let x: number;

        // 决定从哪个对角线来：k-1（向右/删除）或k+1（向下/插入）
        if (
          k === -D || // 左边界，只能向下
          (k !== D && (V.get(k - 1) ?? 0) < (V.get(k + 1) ?? 0)) // 选择更远的
        ) {
          // 从对角线k+1来（向下移动，即插入）
          x = V.get(k + 1) ?? 0;
        } else {
          // 从对角线k-1来（向右移动，即删除）
          x = (V.get(k - 1) ?? 0) + 1;
        }

        // 根据 k = x - y 计算y坐标
        let y = x - k;

        // 🔥 关键优化：尽可能沿对角线前进（相同的行，免费移动）
        while (x < M && y < N && oldLines[x] === newLines[y]) {
          x++;
          y++;
        }

        // 更新对角线k上的最远位置
        V.set(k, x);

        // 如果到达终点(M, N)，开始回溯生成diff
        if (x >= M && y >= N) {
          return this.backtrack(trace, oldLines, newLines, D);
        }
      }
    }

    return []; // 理论上不会到这里
  }

  /**
   * 回溯路径，生成diff结果
   *
   * 从终点(M,N)开始，根据trace记录的V值，逆向还原路径
   *
   * 回溯逻辑：
   * 1. 确定当前所在的对角线k = x - y
   * 2. 确定上一步来自哪条对角线（prevK）
   * 3. 回溯对角线移动（相同行）
   * 4. 确定是删除(x++)还是插入(y++)
   *
   * @example
   * 假设找到路径 D=2，终点(2,2)
   *
   * D=2: (2,2), k=0
   *   → prevK=1 (从k=1来)
   *   → prevX=V[1]=1, prevY=0
   *   → 对角线：(2,2)→(1,1)，记录"C"为common
   *   → 删除：(1,1)→(1,0)，记录"B"为delete
   *
   * D=1: (1,0), k=1
   *   → prevK=0
   *   → prevX=0, prevY=0
   *   → 插入：(1,0)→(0,0)，但x=0，跳过
   *
   * D=0: 到达起点
   */
  private backtrack(
    trace: Map<number, number>[],
    oldLines: string[],
    newLines: string[],
    D: number
  ): DiffResult[] {
    const result: DiffResult[] = [];
    let x = oldLines.length; // 从终点开始
    let y = newLines.length;

    // 从D往回走到0，逐步还原路径
    for (let d = D; d > 0; d--) {
      const V = trace[d]; // 当前步骤的V状态
      const k = x - y; // 当前所在的对角线

      // 确定上一步来自哪条对角线
      // 逻辑与前向搜索时相同
      let prevK: number;
      if (k === -d || (k !== d && (V.get(k - 1) ?? 0) < (V.get(k + 1) ?? 0))) {
        prevK = k + 1; // 从k+1来（向下移动，插入）
      } else {
        prevK = k - 1; // 从k-1来（向右移动，删除）
      }

      // 计算上一步的位置
      const prevX = V.get(prevK) ?? 0;
      const prevY = prevX - prevK;

      // 回溯对角线移动（相同的行）
      // 从当前位置(x,y)回溯到(prevX,prevY)的对角线部分
      while (x > prevX && y > prevY) {
        x--;
        y--;
        result.unshift({
          type: "common",
          oldLine: x,
          newLine: y,
          content: oldLines[x],
        });
      }

      // 确定是删除还是插入
      if (x > prevX) {
        // x变化了，说明是向右移动（删除）
        x--;
        result.unshift({
          type: "delete",
          oldLine: x,
          content: oldLines[x],
        });
      } else if (y > prevY) {
        // y变化了，说明是向下移动（插入）
        y--;
        result.unshift({
          type: "add",
          newLine: y,
          content: newLines[y],
        });
      }
    }

    // 处理起点(0,0)到当前位置的对角线（D=0的情况）
    while (x > 0 && y > 0) {
      x--;
      y--;
      result.unshift({
        type: "common",
        oldLine: x,
        newLine: y,
        content: oldLines[x],
      });
    }

    return result;
  }

  /**
   * 将diff结果分组成hunks（差异块）
   * 与GitDiff的逻辑相同，保留上下文行
   */
  private groupIntoHunks(diffResults: DiffResult[]): DiffHunk[] {
    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;
    const CONTEXT_LINES = 3; // 上下文行数

    let consecutiveCommon = 0;

    for (let i = 0; i < diffResults.length; i++) {
      const item = diffResults[i];

      if (item.type === "common") {
        consecutiveCommon++;

        // 如果连续的相同行超过阈值，结束当前hunk
        if (consecutiveCommon > CONTEXT_LINES * 2 && currentHunk) {
          // 保留前3行作为上下文
          for (let j = 0; j < CONTEXT_LINES; j++) {
            if (currentHunk.changes.length > 0) {
              currentHunk.changes.push(diffResults[i - consecutiveCommon + j]);
            }
          }
          hunks.push(currentHunk);
          currentHunk = null;
          consecutiveCommon = 0;
        } else if (currentHunk) {
          currentHunk.changes.push(item);
        }
      } else {
        // 遇到差异行
        consecutiveCommon = 0;

        if (!currentHunk) {
          // 创建新的hunk
          currentHunk = {
            oldStart: item.oldLine ?? 0,
            oldLines: 0,
            newStart: item.newLine ?? 0,
            newLines: 0,
            changes: [],
          };

          // 添加前面的上下文行
          for (let j = Math.max(0, i - CONTEXT_LINES); j < i; j++) {
            if (diffResults[j].type === "common") {
              currentHunk.changes.push(diffResults[j]);
            }
          }
        }

        currentHunk.changes.push(item);
      }
    }

    // 添加最后一个hunk
    if (currentHunk) {
      hunks.push(currentHunk);
    }

    return hunks;
  }

  /**
   * 格式化输出（类似git diff格式）
   *
   * Git Diff格式说明：
   * @@ -旧文件起始行,行数 +新文件起始行,行数 @@
   * -删除的行（红色）
   * +添加的行（绿色）
   *  相同的行（上下文）
   *
   * @example
   * 输入hunk:
   * {
   *   oldStart: 0, newStart: 0,
   *   changes: [
   *     { type: "delete", content: "old line" },
   *     { type: "add", content: "new line" },
   *     { type: "common", content: "same line" }
   *   ]
   * }
   *
   * 输出：
   * @@ -1,2 +1,2 @@
   * -old line
   * +new line
   *  same line
   */
  format(hunks: DiffHunk[]): string {
    let output = "";

    for (const hunk of hunks) {
      // 计算行数统计
      let oldCount = 0,
        newCount = 0;

      for (const change of hunk.changes) {
        // 删除和相同的行计入旧文件行数
        if (change.type === "delete" || change.type === "common") oldCount++;
        // 添加和相同的行计入新文件行数
        if (change.type === "add" || change.type === "common") newCount++;
      }

      // 输出hunk头部
      // 格式: @@ -旧起始行,旧行数 +新起始行,新行数 @@
      // 注意：Git的行号从1开始，所以要+1
      output += `@@ -${hunk.oldStart + 1},${oldCount} +${
        hunk.newStart + 1
      },${newCount} @@\n`;

      // 输出每一行的变化
      for (const change of hunk.changes) {
        switch (change.type) {
          case "delete":
            output += `-${change.content}\n`; // 删除：以 - 开头
            break;
          case "add":
            output += `+${change.content}\n`; // 添加：以 + 开头
            break;
          case "common":
            output += ` ${change.content}\n`; // 相同：以空格开头（上下文）
            break;
        }
      }
    }

    return output;
  }
}

/**
 * 1. LCS (最长公共子序列)
 *    时间复杂度: O(M * N)
 *    空间复杂度: O(M * N)
 *    优点: 简单易懂，实现直观
 *    缺点: 对大文件效率较低
 *
 * 2. Myers Diff
 *    时间复杂度: O((M+N) * D)  D是编辑距离
 *    空间复杂度: O(M+N)
 *    优点: 对相似文件非常高效（D很小时）
 *    缺点: 实现较复杂
 *
 * 3. 实际Git优化
 *    - 预处理：去除首尾相同的行
 *    - 哈希优化：对行内容计算哈希加速比较
 *    - 分块处理：大文件分块diff
 *    - Patience Diff：改进的Myers算法
 */

/**
 * 优化版Diff：预处理 + Myers算法
 *
 * 优化策略：
 * 1. 去除首尾相同的行（快速路径）
 * 2. 只对中间有差异的部分运行Myers算法
 * 3. 合并结果
 *
 * 性能提升：
 * - 如果文件只在中间有少量改动，可以大幅减少计算量
 * - 前后缀处理是O(N)，比Myers的O(N×D)快
 *
 * @example
 * oldLines = [
 *   "import React",     // 相同
 *   "import { Foo }",   // 相同
 *   "function old() {", // 不同
 *   "  return 1;",      // 不同
 *   "}",                // 相同
 *   "export default"    // 相同
 * ]
 *
 * newLines = [
 *   "import React",     // 相同
 *   "import { Foo }",   // 相同
 *   "function new() {", // 不同
 *   "  return 2;",      // 不同
 *   "}",                // 相同
 *   "export default"    // 相同
 * ]
 *
 * 优化后：
 * - prefix: ["import React", "import { Foo }"]
 * - suffix: ["}", "export default"]
 * - trimmed: 只对中间2行运行Myers
 */
class OptimizedDiff {
  /**
   * 主函数：优化的diff计算
   */
  diff(oldLines: string[], newLines: string[]): DiffResult[] {
    // 1. 去除首尾相同部分（快速路径）
    const { common_prefix, common_suffix, trimmed_old, trimmed_new } =
      this.trimCommonParts(oldLines, newLines);

    // 2. 对剩余部分使用Myers算法
    const myersDiff = new MyersDiff();
    const middleDiff = myersDiff.diff(trimmed_old, trimmed_new);

    // 3. 合并结果
    return [
      ...this.createCommonResults(common_prefix, "prefix"),
      ...middleDiff,
      ...this.createCommonResults(common_suffix, "suffix"),
    ];
  }

  /**
   * 去除首尾相同的部分
   *
   * @returns {
   *   common_prefix: 相同的前缀行,
   *   common_suffix: 相同的后缀行,
   *   trimmed_old: 去除前后缀的old,
   *   trimmed_new: 去除前后缀的new
   * }
   *
   * @example
   * old = ["A", "B", "C", "D"]
   * new = ["A", "B", "X", "D"]
   *
   * 返回：
   * {
   *   common_prefix: ["A", "B"],
   *   common_suffix: ["D"],
   *   trimmed_old: ["C"],
   *   trimmed_new: ["X"]
   * }
   */
  private trimCommonParts(oldLines: string[], newLines: string[]) {
    let prefixLen = 0;
    const minLen = Math.min(oldLines.length, newLines.length);

    // 从前往后找相同的行
    while (prefixLen < minLen && oldLines[prefixLen] === newLines[prefixLen]) {
      prefixLen++;
    }

    // 从后往前找相同的行（注意不要和前缀重叠）
    let suffixLen = 0;
    while (
      suffixLen < minLen - prefixLen &&
      oldLines[oldLines.length - 1 - suffixLen] ===
        newLines[newLines.length - 1 - suffixLen]
    ) {
      suffixLen++;
    }

    return {
      common_prefix: oldLines.slice(0, prefixLen),
      common_suffix: oldLines.slice(oldLines.length - suffixLen),
      trimmed_old: oldLines.slice(prefixLen, oldLines.length - suffixLen),
      trimmed_new: newLines.slice(prefixLen, newLines.length - suffixLen),
    };
  }

  /**
   * 将相同的行转换为DiffResult格式
   *
   * @param lines - 相同的行
   * @param type - 类型标识（用于调试）
   * @returns DiffResult数组
   */
  private createCommonResults(lines: string[], type: string): DiffResult[] {
    return lines.map((content, i) => ({
      type: "common" as const,
      oldLine: i,
      newLine: i,
      content,
    }));
  }
}

// 示例代码
const oldFile = `function hello() {
  console.log("Hello");
  return true;
}`;

const newFile = `function hello(name) {
  console.log("Hello " + name);
  console.log("Welcome!");
  return true;
}`;

// 使用LCS方法
const differ = new GitDiff();
const hunks = differ.diff(oldFile, newFile);
const output = differ.format(hunks);

console.log(output);

/**
 * 输出类似：
 * @@ -1,4 +1,5 @@
 * -function hello() {
 * -  console.log("Hello");
 * +function hello(name) {
 * +  console.log("Hello " + name);
 * +  console.log("Welcome!");
 *    return true;
 *  }
 */

// 使用Myers算法（更高效）
const myersDiffer = new MyersDiff();

// 方式1：直接比较字符串（推荐）
const myersHunks = myersDiffer.compare(oldFile, newFile);
const myersOutput = myersDiffer.format(myersHunks);

console.log("=== Myers Diff Output ===");
console.log(myersOutput);

// 方式2：直接使用diff方法比较数组
const myersResult = myersDiffer.diff(oldFile.split("\n"), newFile.split("\n"));
console.log("\n=== Myers Diff Result (Array) ===");
console.log(myersResult);

/**
 * ============================================
 * 📚 学习总结与最佳实践
 * ============================================
 *
 * ## 1. 三种算法对比
 *
 * ### GitDiff (LCS算法)
 * ✅ 优点：
 *   - 简单直观，容易理解
 *   - 适合学习算法思想
 *   - 代码实现清晰
 *
 * ❌ 缺点：
 *   - O(M×N)时间复杂度，大文件慢
 *   - O(M×N)空间复杂度，内存占用大
 *
 * 🎯 适用场景：
 *   - 小文件（<1000行）
 *   - 学习目的
 *   - 对性能要求不高的场景
 *
 *
 * ### MyersDiff (Myers算法)
 * ✅ 优点：
 *   - O((M+N)×D)时间复杂度，相似文件非常快
 *   - O(M+N)空间复杂度，内存友好
 *   - Git实际使用的算法
 *
 * ❌ 缺点：
 *   - 理解难度较高
 *   - 实现较复杂
 *
 * 🎯 适用场景：
 *   - 中大型文件
 *   - 生产环境
 *   - 相似度高的文件（D小）
 *
 *
 * ### OptimizedDiff (优化版)
 * ✅ 优点：
 *   - 结合预处理和Myers算法
 *   - 对局部修改的文件特别快
 *   - 实际应用推荐
 *
 * 🎯 适用场景：
 *   - 典型的代码修改（局部改动）
 *   - 版本控制系统
 *   - 实际生产环境
 *
 *
 * ## 2. 关键概念理解
 *
 * ### 最长公共子序列（LCS）
 * ```
 * old = ["A", "B", "C"]
 * new = ["A", "X", "C"]
 *
 * LCS = ["A", "C"]  (长度=2)
 *
 * 不在LCS中的就是差异：
 * - "B" 只在old → 删除
 * - "X" 只在new → 添加
 * ```
 *
 * ### 对角线（Myers算法核心）
 * ```
 * k = x - y (对角线编号)
 *
 * 图示：
 *     0   1   2   (x: old)
 * 0   k=0 k=1 k=2
 * 1   k=-1 k=0 k=1
 * 2   k=-2 k=-1 k=0
 * (y: new)
 *
 * 同一条对角线上的点都满足 x-y=k
 * ```
 *
 * ### 编辑距离（Edit Distance）
 * ```
 * 从old变成new需要的最少操作数
 *
 * old = "ABC"
 * new = "AXC"
 *
 * 操作：删除B，插入X → 编辑距离=2
 * ```
 *
 *
 * ## 3. 实际应用建议
 *
 * ### 场景1：版本控制系统
 * ```typescript
 * // 推荐使用 OptimizedDiff
 * const differ = new OptimizedDiff();
 * const results = differ.diff(oldLines, newLines);
 * ```
 *
 * ### 场景2：实时预览差异
 * ```typescript
 * // 小文件用GitDiff（简单快速）
 * const differ = new GitDiff();
 * const hunks = differ.diff(oldText, newText);
 * const output = differ.format(hunks);
 * ```
 *
 * ### 场景3：大文件比较
 * ```typescript
 * // 使用MyersDiff + 分块处理
 * const myersDiff = new MyersDiff();
 * // 可以先分块，再对每块进行diff
 * ```
 *
 *
 * ## 4. 性能优化技巧
 *
 * ### 技巧1：哈希加速
 * ```typescript
 * // 对行内容计算哈希，加速比较
 * const hashMap = new Map();
 * const hash = (line: string) => {
 *   if (!hashMap.has(line)) {
 *     hashMap.set(line, hashMap.size);
 *   }
 *   return hashMap.get(line);
 * };
 *
 * // 比较时用哈希值而不是字符串
 * if (hash(oldLines[i]) === hash(newLines[j])) {
 *   // 相同
 * }
 * ```
 *
 * ### 技巧2：分块处理
 * ```typescript
 * // 将大文件分成若干块，分别diff
 * function chunkDiff(oldLines, newLines, chunkSize = 1000) {
 *   const results = [];
 *   for (let i = 0; i < oldLines.length; i += chunkSize) {
 *     const chunk = diff(
 *       oldLines.slice(i, i + chunkSize),
 *       newLines.slice(i, i + chunkSize)
 *     );
 *     results.push(...chunk);
 *   }
 *   return results;
 * }
 * ```
 *
 * ### 技巧3：提前终止
 * ```typescript
 * // 如果编辑距离超过阈值，提前退出
 * if (D > MAX_EDIT_DISTANCE) {
 *   return fallbackDiff(oldLines, newLines);
 * }
 * ```
 *
 *
 * ## 5. 常见问题
 *
 * ### Q1: 为什么Myers算法用对角线？
 * A: 对角线k=x-y保持不变，意味着相同的行（免费移动）。
 *    通过追踪每条对角线的最远位置，可以高效找到最短编辑距离。
 *
 * ### Q2: LCS和编辑距离的关系？
 * A: 编辑距离 = M + N - 2×LCS长度
 *    LCS越长，需要的编辑操作越少
 *
 * ### Q3: 为什么k每次+2？
 * A: 每次移动（向右或向下）都会改变k的奇偶性：
 *    - 向右：k+1（x+1，k=x-y变大）
 *    - 向下：k-1（y+1，k=x-y变小）
 *    所以相邻的k值相差2
 *
 * ### Q4: 空间复杂度能进一步优化吗？
 * A: 可以！只保留当前和上一步的V，空间降到O(D)
 *    但会失去回溯路径的能力，需要二次扫描
 *
 *
 * ## 6. 扩展学习
 *
 * 相关算法：
 * - Patience Diff: Git的改进算法，更符合人类直觉
 * - Histogram Diff: 另一种Git算法变体
 * - Three-way Merge: 合并三个文件（base, ours, theirs）
 * - Semantic Diff: 基于语法树的diff，更智能
 *
 *
 * ============================================
 * 💡 学习建议
 * ============================================
 *
 * 1. 先理解LCS算法（GitDiff类）
 * 2. 手动模拟一个小例子的DP过程
 * 3. 理解Myers算法的图搜索思想
 * 4. 画出对角线图，理解k的含义
 * 5. 实现一个简化版的Myers算法
 * 6. 对比两种算法的性能差异
 * 7. 尝试添加更多优化（如哈希、分块）
 *
 * ============================================
 */
