/*
 * @lc app=leetcode.cn id=78 lang=typescript
 *
 * [78] 子集
 *
 * https://leetcode.cn/problems/subsets/description/
 *
 * algorithms
 * Medium (82.22%)
 * Likes:    2479
 * Dislikes: 0
 * Total Accepted:    993.1K
 * Total Submissions: 1.2M
 * Testcase Example:  '[1,2,3]'
 *
 * 给你一个整数数组 nums ，数组中的元素 互不相同 。返回该数组所有可能的子集（幂集）。
 *
 * 解集 不能 包含重复的子集。你可以按 任意顺序 返回解集。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [1,2,3]
 * 输出：[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]
 *
 *
 * 示例 2：
 *
 *
 * 输入：nums = [0]
 * 输出：[[],[0]]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 10
 * -10 <= nums[i] <= 10
 * nums 中的所有元素 互不相同
 *
 *
 */

// @lc code=start
function subsets(nums: number[]): number[][] {
  /**
   * 生成数组的所有子集（幂集）
   *
   * 解法一：回溯算法（DFS）- 优化版
   * 核心思路：
   * 1. 对于每个元素，都有两种选择：选择或不选择
   * 2. 使用回溯遍历所有可能的组合
   * 3. 每到一个节点就记录当前路径作为一个子集
   *
   * 时间复杂度：O(2^n * n) - 2^n个子集，每个子集最多n个元素
   * 空间复杂度：O(n) - 递归栈深度
   *
   * 执行过程示例（nums = [1,2,3]）：
   *
   * dfs(0, [])
   * ├─ 记录 []
   * ├─ 选择1: dfs(1, [1])
   * │  ├─ 记录 [1]
   * │  ├─ 选择2: dfs(2, [1,2])
   * │  │  ├─ 记录 [1,2]
   * │  │  └─ 选择3: dfs(3, [1,2,3]) → 记录 [1,2,3]
   * │  └─ 选择3: dfs(2, [1]) → dfs(3, [1,3]) → 记录 [1,3]
   * ├─ 选择2: dfs(1, [])
   * │  ├─ 记录 [2]
   * │  └─ 选择3: dfs(2, [2]) → dfs(3, [2,3]) → 记录 [2,3]
   * └─ 选择3: dfs(2, []) → dfs(3, [3]) → 记录 [3]
   */

  const result: number[][] = [];

  const backtrack = (start: number, currentSubset: number[]): void => {
    // 每次进入函数都记录当前子集（包括空集）
    result.push(currentSubset.slice()); // 使用展开运算符代替slice()，更简洁

    // 从start开始遍历剩余元素，避免重复组合
    for (let i = start; i < nums.length; i++) {
      // 选择当前元素
      currentSubset.push(nums[i]);

      // 递归处理下一个位置，注意是i+1而不是start+1
      backtrack(i + 1, currentSubset);

      // 回溯：撤销选择
      currentSubset.pop();
    }
  };

  backtrack(0, []);
  return result;
}

/**
 * 解法二：位运算法
 * 核心思路：用二进制位表示每个元素的选择状态
 * n个元素对应n位二进制，1表示选择，0表示不选择
 * 总共有2^n种状态，对应2^n个子集
 */
function subsetsWithBitManipulation(nums: number[]): number[][] {
  const result: number[][] = [];
  const n = nums.length;

  // 遍历所有可能的二进制状态：0 到 2^n - 1
  for (let mask = 0; mask < 1 << n; mask++) {
    const subset: number[] = [];

    // 检查每一位，如果为1则选择对应元素
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        subset.push(nums[i]);
      }
    }

    result.push(subset);
  }

  return result;
}

/**
 * 解法三：迭代法
 * 核心思路：从空集开始，每次添加一个新元素
 * 对于每个新元素，将其添加到现有的所有子集中，形成新的子集
 */
function subsetsWithIteration(nums: number[]): number[][] {
  let result: number[][] = [[]]; // 从空集开始

  // 对于每个元素
  for (const num of nums) {
    const newSubsets: number[][] = [];

    // 将当前元素添加到所有现有子集中
    for (const subset of result) {
      newSubsets.push([...subset, num]);
    }

    // 合并原有子集和新子集
    result = result.concat(newSubsets);
  }

  return result;
}
// @lc code=end
