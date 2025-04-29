/*
 * @lc app=leetcode.cn id=542 lang=typescript
 *
 * [542] 01 矩阵
 */

// @lc code=start
/**
 * 计算矩阵中每个元素到最近的0的距离
 * 题目要求：给定一个由0和1组成的矩阵，找到每个元素到最近的0的距离
 *
 * 解题思路：多源BFS（广度优先搜索）
 * 1. 从所有的0元素开始向外扩散（而不是从每个1开始找最近的0）
 * 2. 使用队列记录当前正在处理的位置，每次扩散一步
 * 3. 当首次访问到矩阵中的1时，当前的步数就是该位置到最近的0的距离
 *
 * 图解流程：
 * - 将所有的0元素加入队列，距离设为0
 * - 从队列取出元素，向四个方向扩散
 * - 如果遇到未访问的元素，更新其距离并加入队列
 * - 重复直到队列为空
 *
 * 时间复杂度：O(m*n)，其中m和n是矩阵的行数和列数
 * 空间复杂度：O(m*n)，用于存储结果矩阵和队列
 *
 * @param mat 由0和1组成的矩阵
 * @return 每个位置到最近的0的距离矩阵
 */
function updateMatrix(mat: number[][]): number[][] {
  // 获取矩阵的行数和列数
  const rows = mat.length;
  const cols = mat[0].length;

  // 创建结果矩阵，初始化为-1（表示未访问）
  const result: number[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(-1)
  );

  // 创建队列，存储坐标和距离：[row, col]
  const queue: [number, number][] = [];

  // 第一步：将所有的0元素加入队列，距离设为0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (mat[r][c] === 0) {
        // 0元素的距离为0
        result[r][c] = 0;
        // 将0元素加入队列
        queue.push([r, c]);
      }
    }
  }

  // 定义四个方向：上、右、下、左
  const directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  // 第二步：BFS扩散
  while (queue.length > 0) {
    // 取出队首元素
    const [r, c] = queue.shift()!;

    // 向四个方向扩散
    for (const [dr, dc] of directions) {
      const newR = r + dr;
      const newC = c + dc;

      // 检查新坐标是否有效且未访问过
      if (
        newR >= 0 &&
        newR < rows && // 行坐标在范围内
        newC >= 0 &&
        newC < cols && // 列坐标在范围内
        result[newR][newC] === -1 // 未访问过
      ) {
        // 更新距离：当前位置的距离 + 1
        result[newR][newC] = result[r][c] + 1;
        // 将新位置加入队列
        queue.push([newR, newC]);
      }
    }
  }

  return result;
}
// @lc code=end
