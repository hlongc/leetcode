/*
 * @lc app=leetcode.cn id=50 lang=typescript
 *
 * [50] Pow(x, n)
 *
 * 实现 pow(x, n) ，即计算 x 的整数 n 次幂函数。
 * 要求时间复杂度为 O(log n)
 */

// @lc code=start

function myPow1(x: number, n: number): number {
  if (n === 0) return 1;
  if (n < 0) {
    return 1 / myPow(x, -n);
  }
  if (n % 2 === 0) {
    const val = myPow(x, n / 2);
    return val * val;
  }
  if (n % 2 === 1) {
    return x * myPow(x, n - 1);
  }

  return -1;
}

function myPow(x: number, n: number): number {
  // 处理特殊情况
  if (n === 0) return 1;

  // 处理负指数情况
  if (n < 0) {
    // 负指数转换为正指数的倒数
    // 注意避免 -n 溢出，所以先将 x 取倒数，再计算正指数
    x = 1 / x;
    // JavaScript 中 -n 可能溢出，使用绝对值
    n = Math.abs(n);
  }

  // 使用迭代版本的快速幂算法（二分思想）
  let result = 1;

  // 快速幂的本质：将指数 n 表示为二进制，对应的 x 进行平方操作
  // 例如：x^13 = x^(1101₂) = x^8 * x^4 * x^1
  while (n > 0) {
    // 如果 n 的最低位是 1，将当前的 x 累乘到结果中
    if (n & 1) {
      result *= x;
    }

    // 每次将 x 平方（对应于指数二进制左移）
    x *= x;

    // n 右移一位，相当于舍弃二进制的最低位
    n >>>= 1; // 或使用: n >>>= 1;
  }

  return result;
}
// @lc code=end
