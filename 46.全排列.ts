/*
 * @lc app=leetcode.cn id=46 lang=typescript
 *
 * [46] 全排列
 */

// @lc code=start
function permute(nums: number[]): number[][] {
  const ret: number[][] = [];
  const used: Record<number, boolean> = {};
  const list: number[] = [];

  const dfs = () => {
    if (list.length === nums.length) {
      ret.push(list.slice());
      return;
    }

    for (const num of nums) {
      // 不重复使用
      if (used[num]) continue;
      list.push(num);
      used[num] = true;
      dfs();
      used[num] = false;
      list.pop();
    }
  };

  dfs();

  return ret;
}
// @lc code=end
