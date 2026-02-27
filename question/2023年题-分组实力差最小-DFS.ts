/**
 * 2023年题：分组实力差最小（DFS回溯解法）
 *
 * 题目描述：
 * 部门准备举办一场王者荣耀表演赛，有10名游戏爱好者参与，分5人两队。
 * 每队5人，每位参与者都有一个评分，代表着他的游戏水平。
 * 为了表演赛尽可能精彩，我们需要把10名参赛者分为实力尽量相近的两队。
 * 一队的实力可以表示为这一队5名队员的评分总和。
 *
 * 现在给你10名参赛者的游戏水平评分，请你根据上述要求分成两组，
 * 使得这两组的实力差绝对值最小。
 *
 * 输入描述：
 * 10个整数，表示10名参与者的游戏水平评分，范围在[1,10000]之间
 *
 * 输出描述：
 * 1个整数，表示分组后两组实力差绝对值的最小值
 */

/**
 * 解题思路：DFS（深度优先搜索）+ 回溯 + 剪枝
 *
 * 核心思想：
 * 枚举所有可能的分组方式，找到实力差最小的分组
 *
 * 算法流程：
 * 1. 计算所有人的总评分 totalSum
 * 2. 目标和 targetSum = totalSum / 2
 * 3. 使用DFS尝试为第一队选择5个人
 * 4. 对于每个人，有两种选择：
 *    - 选入第一队
 *    - 不选入第一队
 * 5. 当选够5个人时，计算两队差值并更新最小值
 *
 * 剪枝优化：
 * - 如果当前队伍的和已经超过目标和，停止继续选择（因为只会更大）
 * - 这样可以大幅减少搜索空间
 *
 * 时间复杂度：O(C(10,5)) = O(252)，最多252种分组方式
 * 空间复杂度：O(n)，递归栈深度
 */

let res = Number.MAX_SAFE_INTEGER; // 记录最小差值
let totalSum = 0; // 总评分
let targetSum = 0; // 目标和（总和的一半）

/**
 * 深度优先搜索函数
 * @param nums 所有玩家的评分数组
 * @param idx 当前考虑的玩家索引
 * @param count 第一队已选择的人数
 * @param currentSum 第一队当前的总评分
 */
function dfs(
  nums: number[],
  idx: number,
  count: number,
  currentSum: number
): void {
  // 剪枝条件：如果当前总和超过目标和，则停止
  // 因为继续选只会让差值更大，去掉可得100%
  // if (currentSum > targetSum) return;

  // 当我们为第一队选择了5名玩家时
  if (count === 5) {
    // 计算另一队的总和
    const otherTeamSum = totalSum - currentSum;
    // 用较小的差值更新结果
    res = Math.min(res, Math.abs(currentSum - otherTeamSum));
    return;
  }

  // 如果我们已经考虑了所有玩家，停止递归
  if (idx === 10) return;

  // 选择1：为第一队选择当前玩家
  dfs(nums, idx + 1, count + 1, currentSum + nums[idx]);

  // 选择2：不为第一队选择当前玩家
  dfs(nums, idx + 1, count, currentSum);
}

/**
 * 主函数：计算最小实力差
 * @param scores 10名玩家的评分数组
 * @returns 最小实力差
 */
function minPowerDifference(scores: number[]): number {
  // 重置全局变量
  res = Number.MAX_SAFE_INTEGER;
  totalSum = 0;

  // 计算总评分
  for (const score of scores) {
    totalSum += score;
  }

  // 目标和为总和的一半
  targetSum = totalSum / 2;

  // 从索引0开始，选0个人，当前和为0
  dfs(scores, 0, 0, 0);

  return res;
}

/**
 * 算法图解：
 *
 * 示例：scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 *
 * 1. 计算总和：
 *    totalSum = 55
 *    targetSum = 27.5
 *
 * 2. DFS搜索树（部分展示）：
 *
 *                    开始(idx=0, count=0, sum=0)
 *                   /                          \
 *          选1(1,1,1)                    不选1(1,0,0)
 *         /          \                   /            \
 *    选2(2,2,3)   不选2(2,1,1)    选2(2,1,2)    不选2(2,0,0)
 *       ...          ...              ...            ...
 *
 * 3. 当count=5时，计算差值：
 *    例如选了[1,3,5,8,10]：
 *    - 第一队和：27
 *    - 第二队和：55-27=28
 *    - 差值：|27-28|=1
 *
 * 4. 遍历所有可能的5人组合（C(10,5)=252种）
 *    找到最小差值
 *
 *
 * 剪枝优化说明：
 *
 * 如果加上剪枝 if (currentSum > targetSum) return;
 *
 * 当第一队的和超过27.5时，就不再继续选择
 * 因为：
 * - 第一队和 > 27.5
 * - 第二队和 < 27.5
 * - 差值只会越来越大
 *
 * 但注意：这个剪枝可能会漏掉一些情况
 * 例如：第一队和=28，第二队和=27，差值=1
 * 如果剪枝掉28，可能找不到最优解
 *
 * 所以图片中的代码注释说"去掉可得100%"
 * 意思是去掉这个剪枝条件，可以得到完全正确的答案
 */

// 测试用例
function test() {
  console.log("=== 测试开始 ===\n");

  // 示例1：题目给出的例子
  const scores1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  console.log("示例1:", scores1);
  console.log("结果:", minPowerDifference(scores1)); // 输出: 1
  console.log("说明: 可以分为 [1,3,5,8,10]=27 和 [2,4,6,7,9]=28\n");

  // 示例2：所有人实力相同
  const scores2 = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
  console.log("示例2:", scores2);
  console.log("结果:", minPowerDifference(scores2)); // 输出: 0
  console.log("说明: 任意分组都是 25 vs 25\n");

  // 示例3：实力差距大
  const scores3 = [1, 1, 1, 1, 1, 10, 10, 10, 10, 10];
  console.log("示例3:", scores3);
  console.log("结果:", minPowerDifference(scores3)); // 输出: 45
  console.log("说明: 最优分组 [1,1,1,1,1]=5 和 [10,10,10,10,10]=50\n");

  console.log("=== 测试结束 ===");
}

// 主函数：处理输入输出
function main() {
  // Node.js 环境下读取输入
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (input: string) => {
    const nums = input.split(" ").map(Number);

    if (nums.length !== 10) {
      console.log("错误：需要输入10个评分");
      rl.close();
      return;
    }

    const result = minPowerDifference(nums);
    console.log(result);
    rl.close();
  });
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  // 可以选择运行测试或主函数
  test();
  // main();
}

export { minPowerDifference };
