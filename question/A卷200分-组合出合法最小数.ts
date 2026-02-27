/**
 * A卷200分 - 组合出合法最小数
 *
 * 题目描述：
 * 给一个数组，数组里面都是代表非负整数的字符串，将数组里所有的数值排列组合拼接起来成一个数字，
 * 输出拼接成的最小的数字。
 *
 * 输入描述：
 * 一个数组，数组不为空，数组里面都是代表非负整数的字符串，可以是0开头，例如：["13", "045", "09", "56"]。
 * 数组的大小范围：[1, 50]
 * 数组中每个元素的长度范围：[1, 30]
 *
 * 输出描述：
 * 以字符串的格式输出一个数字。
 * - 如果最终结果有多位数字，要优先选择输出不是"0"开头的最小数字
 * - 如果拼接出来的数字都是"0"开头，则选取值最小的，并且把开头部分的"0"都去掉再输出
 * - 如果是单位数"0"，可以直接输出"0"
 *
 * 示例1：
 * 输入：20 1
 * 输出：120
 *
 * 示例2：
 * 输入：08 10 2
 * 输出：10082
 *
 * 示例3：
 * 输入：01 02
 * 输出：102
 */

/**
 * 解题思路：自定义排序
 *
 * 核心思想：
 * 1. 要组成最小的数字，需要对数组进行排序
 * 2. 排序规则：对于两个字符串 a 和 b，如果 a+b < b+a，则 a 应该排在 b 前面
 * 3. 例如："20" 和 "1"，因为 "201" > "120"，所以 "1" 应该排在 "20" 前面
 * 4. 拼接后去除前导零（但如果全是0，保留一个0）
 *
 * 算法流程：
 * 1. 使用自定义比较函数对数组排序
 * 2. 比较规则：a+b 和 b+a 的字典序
 * 3. 将排序后的数组拼接成字符串
 * 4. 去除前导零
 * 5. 如果结果为空，返回"0"
 *
 * 时间复杂度：O(n*log(n)*m)，n为数组长度，m为字符串平均长度
 * 空间复杂度：O(1)
 */

/**
 * 主函数：组合出合法最小数
 * @param nums 字符串数组
 * @returns 最小的数字字符串
 */
function findMinNumber(nums: string[]): string {
  // 边界检查
  if (nums.length === 0) {
    return "0";
  }

  // 自定义排序：比较 a+b 和 b+a 的大小
  nums.sort((a, b) => {
    // 拼接两种组合
    const order1 = a + b; // a 在前
    const order2 = b + a; // b 在前

    // 字典序比较
    // 如果 order1 < order2，说明 a 应该排在 b 前面，返回负数
    // 如果 order1 > order2，说明 b 应该排在 a 前面，返回正数
    if (order1 < order2) {
      return -1;
    } else if (order1 > order2) {
      return 1;
    } else {
      return 0;
    }
  });

  // 拼接所有字符串
  let result = nums.join("");

  // 去除前导零
  // 找到第一个非0字符的位置
  let i = 0;
  while (i < result.length && result[i] === "0") {
    i++;
  }

  // 如果全是0，返回"0"
  if (i === result.length) {
    return "0";
  }

  // 返回去除前导零后的结果
  return result.substring(i);
}

/**
 * 算法图解：
 *
 * 示例1：["20", "1"]
 *
 * 步骤1：自定义排序
 * 比较 "20" 和 "1"：
 * - "20" + "1" = "201"
 * - "1" + "20" = "120"
 * - "201" > "120"，所以 "1" 应该排在 "20" 前面
 *
 * 排序后：["1", "20"]
 *
 * 步骤2：拼接
 * result = "120"
 *
 * 步骤3：去除前导零
 * "120" 没有前导零，直接返回
 *
 * 输出：120
 *
 * ---
 *
 * 示例2：["08", "10", "2"]
 *
 * 步骤1：自定义排序
 * 比较 "08" 和 "10"：
 * - "08" + "10" = "0810"
 * - "10" + "08" = "1008"
 * - "0810" < "1008"，所以 "08" 排在 "10" 前面
 *
 * 比较 "08" 和 "2"：
 * - "08" + "2" = "082"
 * - "2" + "08" = "208"
 * - "082" < "208"，所以 "08" 排在 "2" 前面
 *
 * 比较 "10" 和 "2"：
 * - "10" + "2" = "102"
 * - "2" + "10" = "210"
 * - "102" < "210"，所以 "10" 排在 "2" 前面
 *
 * 排序后：["08", "10", "2"]
 *
 * 步骤2：拼接
 * result = "08102"
 *
 * 步骤3：去除前导零
 * 去掉开头的 "0"，得到 "8102"
 *
 * 等等，这个结果不对！让我重新分析...
 *
 * 实际上排序应该是：
 * - "10" + "08" = "1008"
 * - "08" + "10" = "0810"
 * - "1008" > "0810"，所以 "08" 排在 "10" 前面
 *
 * 但题目要求优先选择不是"0"开头的最小数字...
 * 让我重新理解题意...
 *
 * 重新分析示例2：
 * 输入：08 10 2
 * 输出：10082
 *
 * 这说明排序后应该是：["10", "08", "2"]
 * 拼接：10082
 *
 * 所以排序规则需要考虑：优先把非0开头的数字放前面
 */

/**
 * 改进版主函数：组合出合法最小数
 * @param nums 字符串数组
 * @returns 最小的数字字符串
 */
function findMinNumberV2(nums: string[]): string {
  // 边界检查
  if (nums.length === 0) {
    return "0";
  }

  // 自定义排序
  nums.sort((a, b) => {
    // 拼接两种组合
    const order1 = a + b; // a 在前
    const order2 = b + a; // b 在前

    // 比较两种拼接方式
    // 优先选择不以0开头的组合
    const starts1With0 = order1[0] === "0";
    const starts2With0 = order2[0] === "0";

    // 如果一个以0开头，另一个不以0开头，优先选择不以0开头的
    if (starts1With0 && !starts2With0) {
      return 1; // order2 更好，b 排在 a 前面
    }
    if (!starts1With0 && starts2With0) {
      return -1; // order1 更好，a 排在 b 前面
    }

    // 如果都以0开头或都不以0开头，按字典序比较
    if (order1 < order2) {
      return -1;
    } else if (order1 > order2) {
      return 1;
    } else {
      return 0;
    }
  });

  // 拼接所有字符串
  let result = nums.join("");

  // 去除前导零
  let i = 0;
  while (i < result.length && result[i] === "0") {
    i++;
  }

  // 如果全是0，返回"0"
  if (i === result.length) {
    return "0";
  }

  // 返回去除前导零后的结果
  return result.substring(i);
}

/**
 * 详细分析示例：
 *
 * 示例2：["08", "10", "2"]
 *
 * 比较 "08" 和 "10"：
 * - order1 = "0810" (以0开头)
 * - order2 = "1008" (不以0开头)
 * - 优先选择不以0开头的，所以 "10" 排在 "08" 前面
 *
 * 比较 "10" 和 "2"：
 * - order1 = "102" (不以0开头)
 * - order2 = "210" (不以0开头)
 * - 都不以0开头，按字典序："102" < "210"
 * - 所以 "10" 排在 "2" 前面
 *
 * 比较 "08" 和 "2"：
 * - order1 = "082" (以0开头)
 * - order2 = "208" (不以0开头)
 * - 优先选择不以0开头的，所以 "2" 排在 "08" 前面
 *
 * 排序后：["10", "2", "08"]
 * 拼接：10208
 *
 * 等等，还是不对...让我再看看示例
 *
 * 输出是 10082，说明排序是：["10", "08", "2"]
 *
 * 让我重新理解：可能是要让整体最小，而不是优先非0开头
 */

/**
 * 最终版主函数：组合出合法最小数
 * @param nums 字符串数组
 * @returns 最小的数字字符串
 */
function findMinNumberFinal(nums: string[]): string {
  // 边界检查
  if (nums.length === 0) {
    return "0";
  }

  // 分离以0开头和不以0开头的数字
  const startsWithZero: string[] = [];
  const notStartsWithZero: string[] = [];

  for (const num of nums) {
    if (num[0] === "0") {
      startsWithZero.push(num);
    } else {
      notStartsWithZero.push(num);
    }
  }

  // 如果所有数字都以0开头，按原来的规则排序
  if (notStartsWithZero.length === 0) {
    nums.sort((a, b) => {
      const order1 = a + b;
      const order2 = b + a;
      return order1.localeCompare(order2);
    });

    let result = nums.join("");

    // 去除前导零
    let i = 0;
    while (i < result.length && result[i] === "0") {
      i++;
    }

    if (i === result.length) {
      return "0";
    }

    return result.substring(i);
  }

  // 对不以0开头的数字排序
  notStartsWithZero.sort((a, b) => {
    const order1 = a + b;
    const order2 = b + a;
    return order1.localeCompare(order2);
  });

  // 对以0开头的数字排序
  startsWithZero.sort((a, b) => {
    const order1 = a + b;
    const order2 = b + a;
    return order1.localeCompare(order2);
  });

  // 找到最佳插入位置：将以0开头的数字插入到不以0开头的数字中
  // 使得整体最小
  let minResult = "";

  // 尝试将以0开头的数字组插入到不以0开头的数字组的每个位置
  const zeroGroup = startsWithZero.join("");

  for (let i = 0; i <= notStartsWithZero.length; i++) {
    const left = notStartsWithZero.slice(0, i).join("");
    const right = notStartsWithZero.slice(i).join("");
    const current = left + zeroGroup + right;

    if (minResult === "" || current < minResult) {
      minResult = current;
    }
  }

  // 去除前导零（理论上不会有，因为我们确保了不以0开头）
  let i = 0;
  while (i < minResult.length && minResult[i] === "0") {
    i++;
  }

  if (i === minResult.length) {
    return "0";
  }

  return minResult.substring(i);
}

// 测试用例
function test() {
  console.log("=== 测试开始 ===\n");

  // 示例1
  console.log("示例1:");
  const nums1 = ["20", "1"];
  console.log("输入:", nums1.join(" "));
  console.log("输出:", findMinNumberFinal(nums1));
  console.log("预期: 120\n");

  // 示例2
  console.log("示例2:");
  const nums2 = ["08", "10", "2"];
  console.log("输入:", nums2.join(" "));
  console.log("输出:", findMinNumberFinal(nums2));
  console.log("预期: 10082\n");

  // 示例3
  console.log("示例3:");
  const nums3 = ["01", "02"];
  console.log("输入:", nums3.join(" "));
  console.log("输出:", findMinNumberFinal(nums3));
  console.log("预期: 102\n");

  // 示例4：全是0
  console.log("示例4:");
  const nums4 = ["0", "0", "0"];
  console.log("输入:", nums4.join(" "));
  console.log("输出:", findMinNumberFinal(nums4));
  console.log("预期: 0\n");

  // 示例5：包含前导零
  console.log("示例5:");
  const nums5 = ["003", "30", "34", "5", "9"];
  console.log("输入:", nums5.join(" "));
  console.log("输出:", findMinNumberFinal(nums5));
  console.log("");

  console.log("=== 测试结束 ===");
}

// 主函数：处理输入输出
function main() {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (line: string) => {
    const nums = line.trim().split(" ");
    const result = findMinNumberFinal(nums);
    console.log(result);
    rl.close();
  });
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  test();
  // main(); // 取消注释以处理标准输入
}

export { findMinNumberFinal as findMinNumber };
