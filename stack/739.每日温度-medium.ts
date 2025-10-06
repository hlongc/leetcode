/*
 * @lc app=leetcode.cn id=739 lang=typescript
 *
 * [739] 每日温度
 *
 * https://leetcode.cn/problems/daily-temperatures/description/
 *
 * algorithms
 * Medium (69.84%)
 * Likes:    2044
 * Dislikes: 0
 * Total Accepted:    834.1K
 * Total Submissions: 1.2M
 * Testcase Example:  '[73,74,75,71,69,72,76,73]'
 *
 * 给定一个整数数组 temperatures ，表示每天的温度，返回一个数组 answer ，其中 answer[i] 是指对于第 i
 * 天，下一个更高温度出现在几天后。如果气温在这之后都不会升高，请在该位置用 0 来代替。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: temperatures = [73,74,75,71,69,72,76,73]
 * 输出: [1,1,4,2,1,1,0,0]
 *
 *
 * 示例 2:
 *
 *
 * 输入: temperatures = [30,40,50,60]
 * 输出: [1,1,1,0]
 *
 *
 * 示例 3:
 *
 *
 * 输入: temperatures = [30,60,90]
 * 输出: [1,1,0]
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= temperatures.length <= 10^5
 * 30 <= temperatures[i] <= 100
 *
 *
 */

// @lc code=start
/**
 * 解法：单调栈（推荐）
 * 时间复杂度：O(n)，每个元素最多入栈和出栈一次
 * 空间复杂度：O(n)，最坏情况下栈的大小为n
 *
 * 核心思想：
 * 1. 使用单调递减栈维护待处理的温度索引
 * 2. 当遇到更高温度时，栈中所有较低温度都能找到答案
 * 3. 栈中元素按温度从高到低排列，栈顶温度最低
 *
 * 算法流程：
 * 1. 遍历每个温度
 * 2. 如果当前温度 > 栈顶温度，说明找到了栈顶温度的答案
 * 3. 弹出栈顶元素，计算天数差，更新结果
 * 4. 重复步骤2-3，直到栈空或当前温度 <= 栈顶温度
 * 5. 将当前温度索引压入栈中
 *
 * 详细例子：temperatures = [73,74,75,71,69,72,76,73]
 *
 * 执行过程：
 * i=0, temp=73: 栈空，入栈 [0]
 * i=1, temp=74: 74>73，弹出0，result[0]=1-0=1，入栈 [1]
 * i=2, temp=75: 75>74，弹出1，result[1]=2-1=1，入栈 [2]
 * i=3, temp=71: 71<75，入栈 [2,3]
 * i=4, temp=69: 69<71，入栈 [2,3,4]
 * i=5, temp=72: 72>69，弹出4，result[4]=5-4=1；72>71，弹出3，result[3]=5-3=2；入栈 [2,5]
 * i=6, temp=76: 76>72，弹出5，result[5]=6-5=1；76>75，弹出2，result[2]=6-2=4；入栈 [6]
 * i=7, temp=73: 73<76，入栈 [6,7]
 *
 * 最终结果：[1,1,4,2,1,1,0,0]
 */
function dailyTemperatures(temperatures: number[]): number[] {
  // 边界情况：空数组直接返回空数组
  if (temperatures.length === 0) {
    return [];
  }

  // 单调递减栈：存储温度索引，栈中温度从栈底到栈顶递减
  // 栈顶元素对应的温度是最小的，当遇到更高温度时，栈顶元素就能找到答案
  const stack: number[] = [];

  // 结果数组：answer[i] 表示第i天需要等待多少天才能遇到更高温度
  // 初始化为0，表示如果没有更高温度就保持0
  const result: number[] = Array(temperatures.length).fill(0);

  // 遍历每一天的温度
  for (let i = 0; i < temperatures.length; i++) {
    const currentTemperature = temperatures[i];

    // 维护单调递减栈的性质
    // 当当前温度 > 栈顶温度时，说明找到了栈顶温度的答案
    // 需要弹出所有比当前温度低的元素，并计算它们需要等待的天数
    while (
      stack.length > 0 &&
      temperatures[stack[stack.length - 1]] < currentTemperature
    ) {
      // 弹出栈顶元素（温度较低的某一天）
      const prevIndex = stack.pop()!;

      // 计算等待天数：当前索引 - 之前某天的索引
      // 例如：第3天温度71，第5天温度72，则第3天需要等待 5-3=2 天
      result[prevIndex] = i - prevIndex;
    }

    // 将当前天的索引压入栈中，等待后续更高温度的出现
    stack.push(i);
  }

  // 返回结果数组
  // 注意：栈中剩余的元素都是没有更高温度的，它们的result值保持为0
  return result;
}
// @lc code=end
