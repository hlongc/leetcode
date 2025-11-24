/**
 * 判断target在不在矩形范围内
 * @param points 矩形的四个坐标，矩形不一定是水平的
 * @param target 目标点坐标
 */
function isInRectangle(
  points: [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
  ],
  target: [number, number]
): boolean {
  /**
   * 使用向量叉积法判断点是否在矩形内
   * 原理：如果点在矩形内，那么点应该在矩形所有边的同一侧
   *
   * 叉积计算：(p2 - p1) × (target - p1)
   * - 如果结果 > 0，target 在向量 (p2 - p1) 的左侧
   * - 如果结果 < 0，target 在向量 (p2 - p1) 的右侧
   * - 如果结果 = 0，target 在向量 (p2 - p1) 上
   */

  // 计算叉积：(p2 - p1) × (target - p1)
  const crossProduct = (
    p1: [number, number],
    p2: [number, number],
    target: [number, number]
  ): number => {
    return (
      (p2[0] - p1[0]) * (target[1] - p1[1]) -
      (p2[1] - p1[1]) * (target[0] - p1[0])
    );
  };

  // 计算每条边的叉积
  const cross1 = crossProduct(points[0], points[1], target);
  const cross2 = crossProduct(points[1], points[2], target);
  const cross3 = crossProduct(points[2], points[3], target);
  const cross4 = crossProduct(points[3], points[0], target);

  // 检查所有叉积是否同号（都 >= 0 或都 <= 0）
  // 这意味着点在所有边的同一侧
  const allPositive = cross1 >= 0 && cross2 >= 0 && cross3 >= 0 && cross4 >= 0;
  const allNegative = cross1 <= 0 && cross2 <= 0 && cross3 <= 0 && cross4 <= 0;

  return allPositive || allNegative;
}

function isInRectangle2(
  points: [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
  ],
  target: [number, number]
): boolean {
  /**
   * 射线法（Ray Casting Algorithm）判断点是否在多边形内
   *
   * 核心原理：
   * 1. 从目标点向某个方向（通常是水平向右）发射一条射线
   * 2. 计算射线与多边形边界的交点数量
   * 3. 如果交点数量为奇数，点在多边形内
   * 4. 如果交点数量为偶数，点在多边形外
   *
   * 这个方法适用于任意多边形（凸多边形和凹多边形都适用）
   */

  const [tx, ty] = target;
  let intersectionCount = 0;

  /**
   * 检查从目标点发出的水平向右射线是否与线段相交
   * @param p1 线段起点
   * @param p2 线段终点
   * @returns 是否相交
   */
  const rayIntersectsSegment = (
    p1: [number, number],
    p2: [number, number]
  ): boolean => {
    const [x1, y1] = p1;
    const [x2, y2] = p2;

    // 确保 p1 的 y 坐标小于等于 p2 的 y 坐标（简化计算）
    const [px1, py1, px2, py2] = y1 <= y2 ? [x1, y1, x2, y2] : [x2, y2, x1, y1];

    // 射线是水平向右的，y 坐标固定为 ty
    // 检查目标点的 y 坐标是否在线段的 y 范围内
    if (ty < py1 || ty >= py2) {
      // 注意：这里用 >= 而不是 >，避免计算边界点两次
      // 如果射线经过顶点，只算一次相交
      return false;
    }

    // 如果线段是水平的（y1 === y2），且在射线上
    if (py1 === py2) {
      // 水平线段，检查目标点是否在线段的 x 范围内
      const minX = Math.min(px1, px2);
      const maxX = Math.max(px1, px2);

      // 如果目标点在水平线段上，特殊处理
      if (ty === py1 && tx >= minX && tx <= maxX) {
        // 点在边上，返回 true（边界算内部）
        return false; // 这里返回false是因为点在边上时不算交点
      }
      return false;
    }

    // 计算射线与线段的交点的 x 坐标
    // 使用线性插值：x = x1 + (x2 - x1) * (ty - y1) / (y2 - y1)
    const intersectionX = px1 + ((px2 - px1) * (ty - py1)) / (py2 - py1);

    // 如果交点在目标点的右侧（或正好在目标点上），则计数
    if (intersectionX >= tx) {
      return true;
    }

    return false;
  };

  // 遍历矩形的四条边
  for (let i = 0; i < 4; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % 4]; // 下一个顶点（最后一条边连接 points[3] 和 points[0]）

    if (rayIntersectsSegment(p1, p2)) {
      intersectionCount++;
    }
  }

  // 奇数个交点 = 在多边形内
  // 偶数个交点 = 在多边形外
  return intersectionCount % 2 === 1;
}
