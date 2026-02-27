/**
 * 2023年题：分组实力差最小
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
 * 例如：10名参赛者的评分分别为5 1 8 3 4 6 7 10 9 2，
 * 分组为 (1 3 5 8 10) (2 4 6 7 9)，两组实力差最小，差值为1。
 * 有多种分法，但实力差的绝对值最小为1。
 *
 * 输入描述：
 * 10个整数，表示10名参与者的游戏水平评分，范围在[1,10000]之间
 *
 * 输出描述：
 * 1个整数，表示分组后两组实力差绝对值的最小值
 */

/**
 * 解题思路：动态规划（背包问题变种）
 *
 * 核心思想：
 * 这是一个"将10个数分成两组，使两组和的差最小"的问题
 * 可以转化为：从10个数中选5个，使其和尽可能接近总和的一半
 *
 * 算法流程：
 * 1. 计算所有人的总评分 total
 * 2. 目标：找一组5人，使其和尽可能接近 total/2
 * 3. 使用动态规划：
 *    dp[i][j][k] 表示前i个人中选j个人，和为k是否可行
 * 4. 遍历所有可能的和，找到最接近 total/2 的值
 * 5. 计算实力差：|sum - (total - sum)|
 *
 * 优化：
 * 可以用二维DP：dp[j][k] 表示选j个人，和为k是否可行
 *
 * 时间复杂度：O(n * m * sum)，n=10, m=5, sum=总和
 * 空间复杂度：O(m * sum)
 */

function minPowerDifference(scores: number[]): number {
  const n = scores.length; // 10
  const teamSize = 5;

  // 计算总评分
  const total = scores.reduce((sum, score) => sum + score, 0);
  const target = Math.floor(total / 2);

  // dp[j][k] 表示选j个人，和为k是否可行
  // 初始化：选0个人，和为0是可行的
  const dp: boolean[][] = Array.from({ length: teamSize + 1 }, () =>
    Array(target + 1).fill(false)
  );
  dp[0][0] = true;

  // 遍历每个人
  for (let i = 0; i < n; i++) {
    const score = scores[i];

    // 倒序遍历人数和总分（避免重复使用同一个人）
    for (let j = Math.min(i + 1, teamSize); j >= 1; j--) {
      for (let k = target; k >= score; k--) {
        // 如果选了当前这个人
        if (dp[j - 1][k - score]) {
          dp[j][k] = true;
        }
      }
    }
  }

  // 找到最接近 target 的可行和
  let closestSum = 0;
  for (let k = target; k >= 0; k--) {
    if (dp[teamSize][k]) {
      closestSum = k;
      break;
    }
  }

  // 计算实力差
  const otherSum = total - closestSum;
  const diff = Math.abs(closestSum - otherSum);

  return diff;
}

/**
 * 算法图解：
 *
 * 示例：scores = [5, 1, 8, 3, 4, 6, 7, 10, 9, 2]
 *
 * 1. 计算总和：
 *    total = 5+1+8+3+4+6+7+10+9+2 = 55
 *    target = 55 / 2 = 27.5 → 27
 *
 * 2. 目标：从10个人中选5个，使和尽可能接近27
 *
 * 3. DP过程：
 *    dp[5][27] 表示选5个人，和为27是否可行
 *
 *    遍历所有人，更新dp表
 *    最终找到最接近27的可行和
 *
 * 4. 假设找到的最接近和为27：
 *    一队：27
 *    另一队：55 - 27 = 28
 *    差值：|27 - 28| = 1
 *
 *
 * 示例分组：
 * 队1：1, 3, 5, 8, 10 → 和 = 27
 * 队2：2, 4, 6, 7, 9  → 和 = 28
 * 差值：1
 */

// 测试用例
function test() {
  // 示例1
  const scores1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  console.log("示例1:", minPowerDifference(scores1)); // 输出: 1

  // 示例2：所有人实力相同
  const scores2 = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
  console.log("示例2:", minPowerDifference(scores2)); // 输出: 0

  // 示例3：实力差距大
  const scores3 = [1, 1, 1, 1, 1, 10, 10, 10, 10, 10];
  console.log("示例3:", minPowerDifference(scores3)); // 输出: 45
}

// 主函数：处理输入输出
function main() {
  // Node.js 环境下读取输入
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (line: string) => {
    const scores = line.trim().split(/\s+/).map(Number);

    if (scores.length !== 10) {
      console.log("错误：需要输入10个评分");
      rl.close();
      return;
    }

    const result = minPowerDifference(scores);
    console.log(result);
    rl.close();
  });
}

// 如果直接运行此文件，执行main函数
if (require.main === module) {
  // 可以选择运行测试或主函数
  // test();
  main();
}

export { minPowerDifference };
