/*
 * @lc app=leetcode.cn id=47 lang=typescript
 *
 * [47] 全排列 II
 */

// @lc code=start
function permuteUnique(nums: number[]): number[][] {
  const ret: number[][] = [];
  const tmp: number[] = [];
  const used: boolean[] = Array(nums.length).fill(false);
  // 先升序排序，方便判断相同数字是否重复使用
  nums.sort((a, b) => a - b);

  const dfs = () => {
    if (tmp.length === nums.length) {
      ret.push(tmp.slice());
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      // 相同位置不重复取值
      if (used[i]) continue;
      /**
       * 如果当前的选项nums[i]，与同一层的前一个选项nums[i-1]相同，且nums[i-1]存在，且没有被使用过，则忽略选项nums[i]。
如果nums[i-1]被使用过，它会被第一条修剪掉，不是选项了，即便它和nums[i]重复，nums[i]还是可以选的。
比如[1,1,2]，第一次选了第一个1，第二次是可以选第二个1的，虽然它和前一个1相同。
因为前一个1被选过了，它在本轮已经被第一条规则修掉了，所以第二轮中第二个1是可选的。

作者：笨猪爆破组
链接：https://leetcode.cn/problems/permutations-ii/solutions/418052/shou-hua-tu-jie-li-yong-yue-shu-tiao-jian-chong-fe/

       */
      if (i - 1 >= 0 && nums[i] === nums[i - 1] && !used[i - 1]) {
        continue;
      }
      used[i] = true;
      tmp.push(nums[i]);
      dfs();
      tmp.pop();
      used[i] = false;
    }
  };

  dfs();

  return ret;
}
// @lc code=end
