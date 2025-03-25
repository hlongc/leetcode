/*
 * @lc app=leetcode.cn id=39 lang=typescript
 *
 * [39] 组合总和
 */

// @lc code=start
function combinationSum(candidates: number[], target: number): number[][] {
  const ret: number[][] = [];

  const dfs = (start: number, list: number[], sum: number) => {
    // 和大于等于目标值时就终止
    if (sum >= target) {
      if (sum === target) {
        ret.push(list.slice());
      }
      return;
    }
    // 枚举当前可选的数，从start开始
    for (let i = start; i < candidates.length; i++) {
      list.push(candidates[i]);
      // 基于此继续选择，传i，下一次就不会选到i左边的数
      dfs(i, list, sum + candidates[i]);
      // 撤销选择，回到选择candidates[i]之前的状态，继续尝试选同层右边的数
      list.pop();
    }
  };

  dfs(0, [], 0);

  return ret;
}
// @lc code=end
