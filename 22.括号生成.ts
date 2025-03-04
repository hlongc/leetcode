/*
 * @lc app=leetcode.cn id=22 lang=typescript
 *
 * [22] 括号生成
 */

// @lc code=start
function generateParenthesis(n: number): string[] {
  const result: string[] = [];

  const dfs = (val: string, leftCount: number, rightCount: number) => {
    if (leftCount === 1) {
      if (rightCount === 1) {
        result.push(val + ")");
      } else {
        dfs(val + ")", leftCount, rightCount - 1);
      }
    } else {
      // TODO:还没处理完
    }
  };

  dfs("", n, n);

  return result;
}
// @lc code=end
