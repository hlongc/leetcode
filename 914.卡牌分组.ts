/*
 * @lc app=leetcode.cn id=914 lang=typescript
 *
 * [914] 卡牌分组
 *
 * 给定一副牌，每张牌上都写着一个整数。
 * 此时，你需要选定一个数字 X，使我们可以将整副牌按下述规则分成 1 组或更多组：
 * - 每组都有 X 张牌。
 * - 组内所有的牌上都写着相同的整数。
 * 仅当你可选的 X >= 2 时返回 true。
 */

// @lc code=start
/**
 * 判断卡牌是否可以分组
 *
 * 思路：
 * 1. 统计每个数字出现的次数
 * 2. 求所有出现次数的最大公约数(GCD)
 * 3. 如果GCD >= 2，则可以分组
 *
 * @param deck 卡牌数组
 * @returns 是否可以按要求分组
 */
function hasGroupsSizeX(deck: number[]): boolean {
  // 特殊情况：如果牌的数量小于2，无法分组
  if (deck.length < 2) {
    return false;
  }

  // 统计每个数字出现的次数
  const countMap = new Map<number, number>();
  for (const num of deck) {
    countMap.set(num, (countMap.get(num) || 0) + 1);
  }

  // 计算所有出现次数的最大公约数
  let gcdResult = 0;

  // 遍历Map，计算GCD
  for (const count of countMap.values()) {
    // 第一个数直接赋值，后续计算GCD
    gcdResult = gcdResult === 0 ? count : gcd(gcdResult, count);

    // 提前返回：如果GCD已经是1，不可能分组
    if (gcdResult === 1) {
      return false;
    }
  }

  // 判断最大公约数是否大于等于2
  return gcdResult >= 2;
}

/**
 * 计算两个数的最大公约数(GCD)
 * 使用欧几里得算法(辗转相除法)的迭代版本，避免递归
 */
function gcd(a: number, b: number): number {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}
// @lc code=end
