/*
 * @lc app=leetcode.cn id=338 lang=typescript
 *
 * [338] 比特位计数
 */

// @lc code=start
/**
 * 计算从0到n的每个数字的二进制表示中1的个数
 * @param n 给定的非负整数
 * @return 长度为n+1的数组，其中ans[i]表示数字i的二进制表示中1的个数
 */
function countBits(n: number): number[] {
  // 创建结果数组，长度为n+1，包含从0到n的所有数字
  const result: number[] = new Array(n + 1).fill(0);

  // 0的二进制表示中没有1，已经初始化为0

  // 动态规划：从1到n计算每个数字的比特位计数
  for (let i = 1; i <= n; i++) {
    // 方法一：利用 i & (i-1) 可以消除i的二进制表示中最低位的1
    // i的1的个数 = i消除一个1后的数字的1的个数 + 1
    result[i] = result[i & (i - 1)] + 1;

    // 方法二（注释掉）：利用奇偶性
    // 如果i是偶数，则i的1的个数与i/2相同（右移一位不影响1的个数）
    // 如果i是奇数，则i的1的个数是i-1（偶数）的1的个数加1
    // result[i] = i % 2 === 0 ? result[i >> 1] : result[i - 1] + 1;

    // 方法三（注释掉）：最低有效位
    // i的1的个数 = i右移一位的数字的1的个数 + i最低位是否为1
    // result[i] = result[i >> 1] + (i & 1);
  }

  return result;
}

/**
 * 方法二：利用奇偶性解决比特位计数问题
 */
function countBitsMethod2(n: number): number[] {
  const result: number[] = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    // 如果i是偶数，则i的1的个数与i/2相同（右移一位不影响1的个数）
    // 如果i是奇数，则i的1的个数是i-1（偶数）的1的个数加1
    result[i] = i % 2 === 0 ? result[i >> 1] : result[i - 1] + 1;
  }

  return result;
}

/**
 * 方法三：利用最低有效位解决比特位计数问题
 */
function countBitsMethod3(n: number): number[] {
  const result: number[] = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    // i的1的个数 = i右移一位的数字的1的个数 + i最低位是否为1
    result[i] = result[i >> 1] + (i & 1);
  }

  return result;
}
// @lc code=end
