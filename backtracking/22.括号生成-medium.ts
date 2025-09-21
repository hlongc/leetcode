/*
 * @lc app=leetcode.cn id=22 lang=typescript
 *
 * [22] 括号生成
 *
 * https://leetcode.cn/problems/generate-parentheses/description/
 *
 * algorithms
 * Medium (78.74%)
 * Likes:    3928
 * Dislikes: 0
 * Total Accepted:    1.1M
 * Total Submissions: 1.4M
 * Testcase Example:  '3'
 *
 * 数字 n 代表生成括号的对数，请你设计一个函数，用于能够生成所有可能的并且 有效的 括号组合。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：n = 3
 * 输出：["((()))","(()())","(())()","()(())","()()()"]
 *
 *
 * 示例 2：
 *
 *
 * 输入：n = 1
 * 输出：["()"]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= n <= 8
 *
 *
 */

// @lc code=start
/**
 * 生成所有有效的括号组合
 * 使用回溯算法，通过深度优先搜索生成所有可能的括号组合
 *
 * 时间复杂度: O(4^n / √n) - 卡特兰数，每个有效括号组合的长度为2n
 * 空间复杂度: O(n) - 递归调用栈的深度最多为2n
 *
 * @param n 括号的对数
 * @returns 所有有效的括号组合数组
 */
function generateParenthesis(n: number): string[] {
  const result: string[] = [];

  /**
   * 深度优先搜索生成括号组合
   *
   * @param leftCount 剩余可用的左括号数量
   * @param rightCount 剩余可用的右括号数量
   * @param currentStr 当前构建的字符串
   */
  const backtrack = (
    leftCount: number,
    rightCount: number,
    currentStr: string
  ): void => {
    // 基准情况：所有括号都已使用完毕，找到一个有效组合
    if (leftCount === 0 && rightCount === 0) {
      result.push(currentStr);
      return;
    }

    // 如果还有左括号可用，添加左括号
    // 左括号可以在任何时候添加（只要还有剩余）
    if (leftCount > 0) {
      backtrack(leftCount - 1, rightCount, currentStr + "(");
    }

    // 如果右括号数量大于左括号数量，可以添加右括号
    // 这确保了右括号总是与前面的左括号匹配，保持有效性
    if (rightCount > leftCount) {
      backtrack(leftCount, rightCount - 1, currentStr + ")");
    }
  };

  // 从n个左括号和n个右括号开始构建
  backtrack(n, n, "");

  return result;
}
// @lc code=end
