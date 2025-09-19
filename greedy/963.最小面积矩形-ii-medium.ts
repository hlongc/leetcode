/*
 * @lc app=leetcode.cn id=963 lang=typescript
 *
 * [963] 最小面积矩形 II
 *
 * https://leetcode.cn/problems/minimum-area-rectangle-ii/description/
 *
 * algorithms
 * Medium (52.58%)
 * Likes:    73
 * Dislikes: 0
 * Total Accepted:    5K
 * Total Submissions: 9.4K
 * Testcase Example:  '[[1,2],[2,1],[1,0],[0,1]]'
 *
 * 给定在 xy 平面上的一组点，确定由这些点组成的任何矩形的最小面积，其中矩形的边不一定平行于 x 轴和 y 轴。
 *
 * 如果没有任何矩形，就返回 0。
 *
 *
 *
 * 示例 1：
 *
 *
 *
 * 输入：[[1,2],[2,1],[1,0],[0,1]]
 * 输出：2.00000
 * 解释：最小面积的矩形出现在 [1,2],[2,1],[1,0],[0,1] 处，面积为 2。
 *
 * 示例 2：
 *
 *
 *
 * 输入：[[0,1],[2,1],[1,1],[1,0],[2,0]]
 * 输出：1.00000
 * 解释：最小面积的矩形出现在 [1,0],[1,1],[2,1],[2,0] 处，面积为 1。
 *
 *
 * 示例 3：
 *
 *
 *
 * 输入：[[0,3],[1,2],[3,1],[1,3],[2,1]]
 * 输出：0
 * 解释：没法从这些点中组成任何矩形。
 *
 *
 * 示例 4：
 *
 *
 *
 * 输入：[[3,1],[1,1],[0,1],[2,1],[3,3],[3,2],[0,2],[2,3]]
 * 输出：2.00000
 * 解释：最小面积的矩形出现在 [2,1],[2,3],[3,3],[3,1] 处，面积为 2。
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= points.length <= 50
 * 0 <= points[i][0] <= 40000
 * 0 <= points[i][1] <= 40000
 * 所有的点都是不同的。
 * 与真实值误差不超过 10^-5 的答案将视为正确结果。
 *
 *
 */

// @lc code=start
/**
 * 查找由给定点组成的最小面积矩形
 *
 * 思路：利用矩形的几何特性来查找可能的矩形
 * 1. 一个矩形可以由对角线上的两个点以及中心点确定
 * 2. 如果两条对角线互相平分（即有相同的中点），且长度相等，则这四个点可以组成矩形
 * 3. 遍历所有可能的点对作为对角线，检查是否能形成矩形
 *
 * 算法步骤：
 * 1. 遍历所有可能的点对(p, q)作为对角线上的两点
 * 2. 计算中心点坐标(中点)和向量特征(对角线长度的平方和方向)
 * 3. 将具有相同中心点和对角线长度的点对分组
 * 4. 对于每一组具有相同中心点和对角线长度的点对，尝试构建矩形并计算面积
 * 5. 返回最小面积
 *
 * @param points xy平面上的点集
 * @returns 可能形成的最小矩形面积，如果无法形成矩形则返回0
 */
function minAreaFreeRect(points: number[][]): number {
  const n = points.length;
  // 如果点数少于4个，无法形成矩形
  if (n < 4) return 0;

  // 存储所有点的集合，用于快速检查点是否存在
  const pointSet = new Set<string>();
  for (const [x, y] of points) {
    pointSet.add(`${x},${y}`);
  }

  let minArea = Infinity;

  // 遍历所有可能的三个点组合
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue; // 跳过相同的点

      for (let k = 0; k < n; k++) {
        if (i === k || j === k) continue; // 跳过相同的点

        const [x1, y1] = points[i];
        const [x2, y2] = points[j];
        const [x3, y3] = points[k];

        // 检查三个点能否组成直角三角形的一部分
        // 两个向量p1p2和p1p3，如果它们垂直，则可能是矩形的一部分
        const v1x = x2 - x1;
        const v1y = y2 - y1;
        const v2x = x3 - x1;
        const v2y = y3 - y1;

        // 判断两个向量是否垂直 (点积为0)
        if (v1x * v2x + v1y * v2y !== 0) continue;

        // 计算可能的第四个点坐标
        const x4 = x3 + (x2 - x1);
        const y4 = y3 + (y2 - y1);

        // 检查第四个点是否存在
        if (pointSet.has(`${x4},${y4}`)) {
          // 计算矩形面积
          const area =
            Math.sqrt(v1x * v1x + v1y * v1y) * Math.sqrt(v2x * v2x + v2y * v2y);
          minArea = Math.min(minArea, area);
        }
      }
    }
  }

  return minArea === Infinity ? 0 : minArea;
}

/**
 * 使用中心点和向量特征的优化算法
 *
 * 优化思路：
 * 1. 对于每对点p和q，计算它们的中心点坐标和向量特征（距离平方）
 * 2. 将具有相同中心点和相同距离的点对分组
 * 3. 在每个组内，如果有多对点，则可以形成矩形
 *
 * @param points xy平面上的点集
 * @returns 可能形成的最小矩形面积，如果无法形成矩形则返回0
 */
function minAreaFreeRectOptimized(points: number[][]): number {
  const n = points.length;
  if (n < 4) return 0;

  // 用于存储中心点和距离相同的点对
  const centerMap = new Map<string, Array<[number, number, number, number]>>();

  // 遍历所有可能的点对
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[j];

      // 计算中心点坐标
      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;

      // 计算距离平方
      const dist = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);

      // 创建中心点和距离的唯一键
      const key = `${centerX},${centerY},${dist}`;

      // 将点对添加到对应的组中
      if (!centerMap.has(key)) {
        centerMap.set(key, []);
      }
      centerMap.get(key)!.push([x1, y1, x2, y2]);
    }
  }

  let minArea = Infinity;

  // 遍历所有具有相同中心点和距离的点对组
  for (const pairs of centerMap.values()) {
    const numPairs = pairs.length;

    // 如果一个组内只有一对点，无法形成矩形
    if (numPairs < 2) continue;

    // 尝试组合不同的点对形成矩形
    for (let i = 0; i < numPairs; i++) {
      for (let j = i + 1; j < numPairs; j++) {
        const [x1, y1, x2, y2] = pairs[i];
        const [x3, y3, x4, y4] = pairs[j];

        // 计算矩形的面积
        // 两组点对有相同的中心点和相同的距离，它们可以形成矩形
        // 通过计算边长来计算面积
        const v1x = x1 - x3;
        const v1y = y1 - y3;
        const v2x = x1 - x4;
        const v2y = y1 - y4;

        // 计算两个边的长度
        const side1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const side2 = Math.sqrt(v2x * v2x + v2y * v2y);

        // 计算矩形面积
        const area = side1 * side2;

        minArea = Math.min(minArea, area);
      }
    }
  }

  return minArea === Infinity ? 0 : minArea;
}

/**
 * 最终优化版本 - 使用点对的中心和向量特征
 *
 * 算法思路：
 * 1. 遍历所有可能的点对(p1, p2)和(p3, p4)
 * 2. 如果它们可以形成矩形，则它们共享相同的中心点
 * 3. 计算所有可能的矩形面积并返回最小值
 *
 * @param points xy平面上的点集
 * @returns 可能形成的最小矩形面积，如果无法形成矩形则返回0
 */
function minAreaFreeRect1(points: number[][]): number {
  const n = points.length;
  if (n < 4) return 0;

  // 将点转换为字符串键，用于快速查找
  const pointsSet = new Set<string>();
  for (const [x, y] of points) {
    pointsSet.add(`${x},${y}`);
  }

  let minArea = Infinity;

  // 遍历所有可能的三个点组合 (p1, p2, p3)
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const [x2, y2] = points[j];

      for (let k = 0; k < n; k++) {
        if (i === k || j === k) continue;
        const [x3, y3] = points[k];

        // 计算向量 p1p2 和 p1p3
        const v12x = x2 - x1;
        const v12y = y2 - y1;
        const v13x = x3 - x1;
        const v13y = y3 - y1;

        // 检查两个向量是否垂直 (点积为0)
        if (v12x * v13x + v12y * v13y !== 0) continue;

        // 计算第四个点的坐标：p4 = p1 + (p2 - p1) + (p3 - p1) = p2 + p3 - p1
        const x4 = x2 + x3 - x1;
        const y4 = y2 + y3 - y1;

        // 检查第四个点是否存在
        if (pointsSet.has(`${x4},${y4}`)) {
          // 计算矩形的面积 = |p1p2| * |p1p3|
          const area =
            Math.sqrt(v12x * v12x + v12y * v12y) *
            Math.sqrt(v13x * v13x + v13y * v13y);
          minArea = Math.min(minArea, area);
        }
      }
    }
  }

  return minArea === Infinity ? 0 : minArea;
}
// @lc code=end
