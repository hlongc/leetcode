/*
 * @lc app=leetcode.cn id=306 lang=typescript
 *
 * [306] 累加数
 *
 * 累加数是一个字符串，组成它的数字可以形成累加序列。
 * 一个有效的累加序列必须至少包含 3 个数。除了最开始的两个数以外，序列中的每个后续数字必须是它之前两个数字之和。
 */

// @lc code=start
function isAdditiveNumber(num: string): boolean {
  const n = num.length; // 获取字符串长度

  // 大数相加函数，处理可能超过JS数字范围的加法
  // 参数a和b是两个字符串形式的数字，返回它们的和（也是字符串形式）
  const addStrings = (a: string, b: string): string => {
    let result = ""; // 用于存储计算结果
    let carry = 0; // 进位值
    let i = a.length - 1; // 从个位数开始处理
    let j = b.length - 1;

    // 从右向左逐位相加，直到所有位都处理完且没有进位
    while (i >= 0 || j >= 0 || carry > 0) {
      // 获取当前位的数字，如果已经超出字符串长度则为0
      const digitA = i >= 0 ? parseInt(a[i--]) : 0;
      const digitB = j >= 0 ? parseInt(b[j--]) : 0;

      // 计算当前位的和与进位
      const sum = digitA + digitB + carry;
      result = (sum % 10) + result; // 当前位的结果放在最终结果的前面
      carry = Math.floor(sum / 10); // 计算进位
    }

    return result;
  };

  /**
   * 回溯函数 - 核心算法部分
   * @param index 当前处理到的字符串索引位置
   * @param path 当前已经找到的数字序列
   * @returns 是否找到有效的累加序列
   */
  const backtrack = (index: number, path: string[]): boolean => {
    // 终止条件：已处理完整个字符串，且至少有3个数字
    // 如果满足这两个条件，说明找到了一个有效的累加序列
    if (index === n && path.length >= 3) {
      return true;
    }

    // 回溯的核心：尝试从当前位置截取不同长度的数字
    // 从长度1开始，最多到剩余字符串的长度
    for (let len = 1; len <= n - index; len++) {
      // 处理前导零情况：如果当前位置是0，只能单独作为一个数字0，不能有更长的长度
      // 例如：不允许"01"这样的数字，因为它应该表示为"1"
      if (num[index] === "0" && len > 1) break;

      // 截取当前尝试的数字
      const curr = num.slice(index, index + len);

      // 检查累加关系：如果已经有至少两个数字，当前数字必须等于前两个数字之和
      if (path.length >= 2) {
        // 计算前两个数字的和
        const sum = addStrings(path[path.length - 2], path[path.length - 1]);
        // 如果当前数字不等于和，这个长度的数字不满足条件，尝试下一个长度
        if (curr !== sum) continue;
      }

      // =========== 回溯三步骤 ===========

      // 1. 选择：将当前数字加入路径
      path.push(curr);

      // 2. 递归探索：继续处理剩余部分
      // 如果找到解，立即返回true
      if (backtrack(index + len, path)) {
        return true;
      }

      // 3. 回溯撤销：如果当前选择没有找到解，撤销选择
      path.pop();

      // ===================================
    }

    // 所有可能的长度都尝试过，仍未找到解，返回false
    return false;
  };

  // 从字符串起始位置开始，使用空路径初始化回溯过程
  return backtrack(0, []);
}
// @lc code=end
