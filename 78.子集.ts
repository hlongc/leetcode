/*
 * @lc app=leetcode.cn id=78 lang=typescript
 *
 * [78] 子集
 *
 * 给你一个整数数组 nums ，返回该数组所有可能的子集（幂集）。
 * 解集不能包含重复的子集。
 */

// @lc code=start
/**
 * 使用位运算生成所有子集
 *
 * 位运算思路：
 * 1. 对于长度为n的数组，共有2^n个子集
 * 2. 可以用一个n位的二进制数表示选择状态，第i位为1表示选择nums[i]，为0表示不选择
 * 3. 从0到2^n-1的每个数字对应一种选择方式，即一个子集
 *
 * 详细解释：
 * 例如，对于数组 [1,2,3]：
 * - 000 (0) 表示空集 []
 * - 001 (1) 表示选择第0个元素 [1]
 * - 010 (2) 表示选择第1个元素 [2]
 * - 011 (3) 表示选择第0和第1个元素 [1,2]
 * - 100 (4) 表示选择第2个元素 [3]
 * - 101 (5) 表示选择第0和第2个元素 [1,3]
 * - 110 (6) 表示选择第1和第2个元素 [2,3]
 * - 111 (7) 表示选择所有元素 [1,2,3]
 *
 * 位运算核心：
 * - (1 << i) 创建一个第i位为1，其余位为0的二进制数
 * - (mask & (1 << i)) 检查mask的第i位是否为1
 * - 如果结果不为0，说明应该选择nums[i]
 * @param nums 输入数组
 * @returns 所有可能的子集数组
 */
function subsets1(nums: number[]): number[][] {
  const result: number[][] = []; // 存储所有子集的结果数组
  const n = nums.length; // 数组长度

  // 一共有2^n个子集
  const totalSubsets = 1 << n; // 等价于 Math.pow(2, n)

  // 遍历从0到2^n-1的每个数
  for (let mask = 0; mask < totalSubsets; mask++) {
    const currentSubset: number[] = []; // 当前子集

    // 检查mask的每一位，决定是否选择对应的元素
    for (let i = 0; i < n; i++) {
      // 修复：使用位与(&)操作符而不是逻辑与(&&)
      // 检查mask的第i位是否为1
      if ((mask & (1 << i)) !== 0) {
        // 如果第i位为1，则将nums[i]加入当前子集
        currentSubset.push(nums[i]);
      }
    }

    // 将当前子集加入结果
    result.push(currentSubset);
  }

  return result;
}

/**
 * 使用回溯算法生成所有子集
 * 思路：
 * 1. 从空集开始，逐步添加元素
 * 2. 每次递归时，从当前位置开始向后遍历
 * 3. 对于每个元素，都有选择和不选择两种可能
 * 4. 通过回溯的方式遍历所有可能的选择
 *
 * 例如，对于数组 [1,2,3]：
 * 第一层递归：[] -> [1] -> [1,2] -> [1,2,3]
 * 回溯后：    [1] -> [1,3]
 * 回溯后：    [] -> [2] -> [2,3]
 * 回溯后：    [] -> [3]
 */
function subsets(nums: number[]): number[][] {
  const result: number[][] = []; // 存储所有子集的结果数组
  const n = nums.length; // 数组长度

  /**
   * 深度优先搜索函数
   * @param start 当前开始位置，避免重复选择
   * @param path 当前已选择的元素路径
   */
  const dfs = (start: number, path: number[]) => {
    // 将当前路径的副本加入结果集
    result.push(path.slice());

    // 从start位置开始遍历剩余元素
    for (let i = start; i < n; i++) {
      // 选择当前元素
      path.push(nums[i]);
      // 递归处理下一个位置
      dfs(i + 1, path);
      // 回溯，撤销选择
      path.pop();
    }
  };

  // 从第0个位置开始搜索
  dfs(0, []);

  return result;
}
// @lc code=end
