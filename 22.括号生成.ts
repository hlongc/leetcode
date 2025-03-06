/*
 * @lc app=leetcode.cn id=22 lang=typescript
 *
 * [22] 括号生成
 */

// @lc code=start
function generateParenthesis(n: number): string[] {
  const result: string[] = [];

  const dfs = (val: string, leftCount: number, rightCount: number) => {
    if (leftCount === 0 && rightCount === 0) {
      result.push(val);
      return;
    }

    if (leftCount > 0) {
      dfs(val + "(", leftCount - 1, rightCount);
    }
    if (rightCount > 0 && rightCount > leftCount) {
      dfs(val + ")", leftCount, rightCount - 1);
    }
  };

  dfs("", n, n);
  return result;
}
// @lc code=end
