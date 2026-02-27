/**
 * 矩阵单词搜索
 *
 * 题目描述：
 * 找到它是一个小游戏，你需要在一个矩阵中找到给定的单词。
 *
 * 假设给定单词 HELLOWORLD，在矩阵中只要能找到 H->E->L->L->O->W->O->R->L->D 连成的单词，就算通过。
 *
 * 注意区分英文字母大小写，并且您只能上下左右行走，不能走回头路。
 *
 * 输入描述：
 * 输入第 1 行包含两个整数 n、m (0 < n,m < 21) 分别表示 n 行 m 列的矩阵，
 * 第 2 行是长度不超过100的单词 W (在整个矩阵中给定单词 W 只会出现一次)，
 * 从第 3 行到第 n+2 行是指包含大小写英文字母的长度为 m 的字符串矩阵。
 *
 * 输出描述：
 * 如果能在矩阵中连成给定的单词，则输出给定单词首字母在矩阵中的位置(第几行 第几列)，
 * 否则输出 "NO"。
 *
 * 示例1：
 * 输入：
 * 5 5
 * HELLOWORLD
 * CPUCY
 * EKLQH
 * CHELL
 * LROWO
 * DGRBC
 *
 * 输出：
 * 3 2
 *
 * 说明：
 * 从第3行第2列的 'H' 开始，可以找到完整路径：
 * H(3,2) -> E(2,2) -> L(2,3) -> L(3,3) -> O(4,3) -> W(4,2) -> O(4,1) -> R(5,1) -> L(3,1) -> D(5,2)
 */

/**
 * 解题思路：DFS（深度优先搜索）+ 回溯
 *
 * 核心思想：
 * 1. 遍历矩阵，找到单词首字母的位置
 * 2. 从首字母位置开始，使用 DFS 尝试匹配整个单词
 * 3. 每次只能向上下左右四个方向移动
 * 4. 使用 visited 数组标记已访问的位置，避免走回头路
 * 5. 如果能匹配完整个单词，返回首字母位置；否则返回 "NO"
 *
 * 算法流程：
 * 1. 遍历矩阵每个位置
 * 2. 如果当前位置字符等于单词首字母，开始 DFS
 * 3. DFS 过程：
 *    - 如果已匹配完整个单词，返回 true
 *    - 标记当前位置为已访问
 *    - 尝试向四个方向移动
 *    - 如果某个方向能继续匹配，递归搜索
 *    - 回溯：取消当前位置的访问标记
 * 4. 如果 DFS 成功，返回起始位置；否则继续遍历
 *
 * 时间复杂度：O(n * m * 4^L)，L 为单词长度
 * 空间复杂度：O(n * m)，visited 数组
 */

/**
 * 主函数：在矩阵中搜索单词
 * @param n 矩阵行数
 * @param m 矩阵列数
 * @param word 要搜索的单词
 * @param matrix 字符矩阵
 * @returns 单词首字母位置 "行 列" 或 "NO"
 */
function searchWord(
  n: number,
  m: number,
  word: string,
  matrix: string[]
): string {
  // 边界检查
  if (n === 0 || m === 0 || word.length === 0) {
    return "NO";
  }

  // 四个方向：上、下、左、右
  const directions = [
    [-1, 0], // 上
    [1, 0], // 下
    [0, -1], // 左
    [0, 1], // 右
  ];

  /**
   * DFS 搜索函数
   * @param row 当前行
   * @param col 当前列
   * @param index 当前匹配到单词的第几个字符
   * @param visited 访问标记数组
   * @returns 是否能匹配完整个单词
   */
  function dfs(
    row: number,
    col: number,
    index: number,
    visited: boolean[][]
  ): boolean {
    // 递归终止条件：已经匹配完整个单词
    if (index === word.length) {
      return true;
    }

    // 边界检查：越界
    if (row < 0 || row >= n || col < 0 || col >= m) {
      return false;
    }

    // 检查：已访问过（避免走回头路）
    if (visited[row][col]) {
      return false;
    }

    // 检查：当前字符不匹配
    if (matrix[row][col] !== word[index]) {
      return false;
    }

    // 标记当前位置为已访问
    visited[row][col] = true;

    // 尝试向四个方向移动
    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;

      // 递归搜索下一个字符
      if (dfs(newRow, newCol, index + 1, visited)) {
        return true; // 找到完整路径
      }
    }

    // 回溯：取消当前位置的访问标记
    // 这样其他路径可以重新访问这个位置
    visited[row][col] = false;

    return false; // 当前路径不通
  }

  // 遍历矩阵，寻找单词首字母
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      // 如果当前字符是单词首字母
      if (matrix[i][j] === word[0]) {
        // 创建访问标记数组
        const visited: boolean[][] = Array.from({ length: n }, () =>
          Array(m).fill(false)
        );

        // 从当前位置开始 DFS 搜索
        if (dfs(i, j, 0, visited)) {
          // 找到完整单词，返回位置（注意：题目要求从1开始计数）
          return `${i + 1} ${j + 1}`;
        }
      }
    }
  }

  // 没有找到单词
  return "NO";
}

/**
 * 算法图解：
 *
 * 示例：搜索 "HELLOWORLD"
 *
 * 矩阵：
 *     0   1   2   3   4
 * 0   C   P   U   C   Y
 * 1   E   K   L   Q   H
 * 2   C   H   E   L   L
 * 3   L   R   O   W   O
 * 4   D   G   R   B   C
 *
 * 步骤1：遍历矩阵，找到首字母 'H'
 * - 在位置 (1,4) 找到 'H'，开始 DFS
 * - 在位置 (2,1) 找到 'H'，开始 DFS ✓
 *
 * 步骤2：从 (2,1) 开始 DFS 搜索 "HELLOWORLD"
 *
 * H(2,1) -> 标记已访问，尝试四个方向
 *   ↓ 向上 (1,1)='K' ❌ 不匹配 'E'
 *   ↓ 向下 (3,1)='R' ❌ 不匹配 'E'
 *   ↓ 向左 (2,0)='C' ❌ 不匹配 'E'
 *   ↓ 向右 (2,2)='E' ✓ 匹配！继续搜索
 *
 * E(2,2) -> 标记已访问，尝试四个方向
 *   ↓ 向上 (1,2)='L' ✓ 匹配！继续搜索
 *
 * L(1,2) -> 标记已访问，尝试四个方向
 *   ↓ 向右 (1,3)='Q' ❌ 不匹配 'L'
 *   ↓ 向下 (2,2)='E' ❌ 已访问
 *   ↓ 向左 (1,1)='K' ❌ 不匹配 'L'
 *   ↓ 向上 越界 ❌
 *   回溯...
 *
 * （继续尝试其他路径，最终找到完整路径）
 *
 * 完整路径：
 * H(2,1) -> E(2,2) -> L(2,3) -> L(3,3) -> O(3,2) ->
 * W(3,1) -> O(3,0) -> R(4,0) -> L(2,0) -> D(4,1)
 *
 * 返回：3 2（从1开始计数）
 *
 * 关键点：
 * 1. visited 数组防止走回头路
 * 2. 回溯机制允许尝试不同路径
 * 3. 四个方向的遍历顺序不影响结果
 */

// 测试用例
function test() {
  console.log("=== 测试开始 ===\n");

  // 示例1：能找到单词
  console.log("示例1:");
  const n1 = 5;
  const m1 = 5;
  const word1 = "HELLOWORLD";
  const matrix1 = ["CPUCY", "EKLQH", "CHELL", "LROWO", "DGRBC"];
  console.log(`矩阵 ${n1}x${m1}:`);
  matrix1.forEach((row) => console.log(row));
  console.log(`搜索单词: ${word1}`);
  console.log("输出:", searchWord(n1, m1, word1, matrix1));
  console.log("预期: 3 2\n");

  // 示例2：找不到单词
  console.log("示例2:");
  const n2 = 5;
  const m2 = 5;
  const word2 = "HELLOWORLD";
  const matrix2 = ["CPUCY", "EKLQH", "CHELL", "LROWO", "AGRBC"];
  console.log(`矩阵 ${n2}x${m2}:`);
  matrix2.forEach((row) => console.log(row));
  console.log(`搜索单词: ${word2}`);
  console.log("输出:", searchWord(n2, m2, word2, matrix2));
  console.log("预期: NO\n");

  // 示例3：简单测试
  console.log("示例3:");
  const n3 = 3;
  const m3 = 3;
  const word3 = "ABC";
  const matrix3 = ["ABC", "DEF", "GHI"];
  console.log(`矩阵 ${n3}x${m3}:`);
  matrix3.forEach((row) => console.log(row));
  console.log(`搜索单词: ${word3}`);
  console.log("输出:", searchWord(n3, m3, word3, matrix3));
  console.log("预期: 1 1\n");

  // 示例4：需要转弯的路径
  console.log("示例4:");
  const n4 = 3;
  const m4 = 3;
  const word4 = "ABCF";
  const matrix4 = ["ABC", "DEF", "GHI"];
  console.log(`矩阵 ${n4}x${m4}:`);
  matrix4.forEach((row) => console.log(row));
  console.log(`搜索单词: ${word4}`);
  console.log("输出:", searchWord(n4, m4, word4, matrix4));
  console.log("预期: 1 1（路径：A->B->C->F）\n");

  console.log("=== 测试结束 ===");
}

// 主函数：处理输入输出
function main() {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const lines: string[] = [];

  rl.on("line", (line: string) => {
    lines.push(line.trim());

    // 第一行是 n 和 m
    if (lines.length === 1) {
      return;
    }

    // 第二行是单词
    if (lines.length === 2) {
      return;
    }

    // 读取矩阵
    const [n, m] = lines[0].split(" ").map(Number);
    if (lines.length === n + 2) {
      const word = lines[1];
      const matrix = lines.slice(2);

      const result = searchWord(n, m, word, matrix);
      console.log(result);

      rl.close();
    }
  });
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  test();
  // main(); // 取消注释以处理标准输入
}

export { searchWord };
