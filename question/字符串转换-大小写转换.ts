/**
 * 打乱字符串还原正整数序列
 *
 * 题目描述：
 * 对于一个连续正整数组成的序列，可以将其拼接成一个字符串，再将字符串打乱顺序。
 * 如序列 9 10 11 12，拼接成的字符串为 9101112，打乱一部分字符后得到 90811211。
 * 原来的正整数 10 就被拆成了 0 和 1。
 *
 * 现给定一个按如上规则得到的打乱字符串，请将其还原成正整数序列，并输出序列中最小的数字。
 *
 * 输入描述：
 * 输入一行，为打乱字符的字符串和正整数序列的长度，两者间用空格分隔。
 * 字符串长度不超过 200，正整数不超过 1000，保证输入可以还原成唯一一序列。
 *
 * 输出描述：
 * 输出一个数字，为序列中最小的数字。
 *
 * 示例1：
 * 输入：19801211 5
 * 输出：8
 *
 * 说明：
 * 还原后的序列为：8 9 10 11 12（连续的5个正整数）
 * 拼接后：89101112
 * 打乱后：19801211
 * 最小值为 8
 *
 * 示例2：
 * 输入：432111111111 4
 * 输出：111
 *
 * 说明：
 * 还原后的序列为：111 112 113 114（连续的4个正整数）
 * 拼接后：111112113114
 * 打乱后：432111111111
 * 最小值为 111
 */

/**
 * 解题思路：枚举起始数字 + 字符频率验证
 *
 * 核心思想：
 * 1. 因为是连续的正整数序列，只需要知道起始数字和长度，就能确定整个序列
 * 2. 枚举所有可能的起始数字（从1到1000）
 * 3. 对于每个起始数字，生成连续序列并拼接成字符串
 * 4. 检查拼接后的字符串是否是输入字符串的某个排列（字符频率相同）
 * 5. 找到符合条件的起始数字，即为最小值
 *
 * 算法流程：
 * 1. 统计输入字符串中每个字符的出现次数
 * 2. 枚举起始数字 start（从1开始）
 * 3. 生成从 start 开始的 count 个连续数字，拼接成字符串
 * 4. 统计拼接字符串中每个字符的出现次数
 * 5. 比较两个字符频率是否完全相同
 * 6. 如果相同，start 就是答案
 *
 * 时间复杂度：O(n * m)，n 为可能的起始数字范围，m 为字符串长度
 * 空间复杂度：O(1)，只需要固定大小的字符计数数组
 */

/**
 * 主函数：找出序列中的最小数字
 * @param str 打乱后的字符串
 * @param count 序列长度（数字个数）
 * @returns 序列中的最小数字（即起始数字）
 */
function findMinNumber(str: string, count: number): number {
  // 统计输入字符串中每个数字字符的出现次数
  const targetFreq = getCharFrequency(str);

  // 枚举所有可能的起始数字（从1到1000）
  for (let start = 1; start <= 1000; start++) {
    // 生成从 start 开始的 count 个连续数字的拼接字符串
    const sequence = generateSequence(start, count);

    // 统计生成序列的字符频率
    const seqFreq = getCharFrequency(sequence);

    // 比较两个字符频率是否完全相同
    if (isSameFrequency(targetFreq, seqFreq)) {
      return start; // 找到答案，返回起始数字
    }
  }

  return -1; // 理论上不会到这里，题目保证有解
}

/**
 * 辅助函数：生成从 start 开始的 count 个连续数字的拼接字符串
 * @param start 起始数字
 * @param count 数字个数
 * @returns 拼接后的字符串
 */
function generateSequence(start: number, count: number): string {
  let result = "";
  for (let i = 0; i < count; i++) {
    result += (start + i).toString();
  }
  return result;
}

/**
 * 辅助函数：统计字符串中每个字符的出现次数
 * @param str 输入字符串
 * @returns 字符频率数组（索引0-9对应数字字符'0'-'9'）
 */
function getCharFrequency(str: string): number[] {
  const freq = new Array(10).fill(0); // 0-9 的频率
  for (const char of str) {
    const digit = parseInt(char);
    freq[digit]++;
  }
  return freq;
}

/**
 * 辅助函数：比较两个字符频率数组是否完全相同
 * @param freq1 第一个频率数组
 * @param freq2 第二个频率数组
 * @returns 是否相同
 */
function isSameFrequency(freq1: number[], freq2: number[]): boolean {
  for (let i = 0; i < 10; i++) {
    if (freq1[i] !== freq2[i]) {
      return false;
    }
  }
  return true;
}

/**
 * 算法图解：
 *
 * 示例1：str = "19801211", count = 5
 *
 * 步骤1：统计输入字符串的字符频率
 * "19801211"
 * 0: 1个
 * 1: 4个
 * 2: 1个
 * 8: 1个
 * 9: 1个
 *
 * 步骤2：枚举起始数字
 *
 * start = 1:
 * 序列：1, 2, 3, 4, 5
 * 拼接：12345
 * 频率：1:1, 2:1, 3:1, 4:1, 5:1
 * 比较：不匹配 ❌
 *
 * start = 2:
 * 序列：2, 3, 4, 5, 6
 * 拼接：23456
 * 频率：2:1, 3:1, 4:1, 5:1, 6:1
 * 比较：不匹配 ❌
 *
 * ...
 *
 * start = 8:
 * 序列：8, 9, 10, 11, 12
 * 拼接：89101112
 * 频率：0:1, 1:4, 2:1, 8:1, 9:1
 * 比较：完全匹配 ✓
 * 返回：8
 *
 * 示例2：str = "432111111111", count = 4
 *
 * 步骤1：统计输入字符串的字符频率
 * "432111111111"
 * 1: 9个
 * 2: 1个
 * 3: 1个
 * 4: 1个
 *
 * 步骤2：枚举起始数字
 *
 * start = 111:
 * 序列：111, 112, 113, 114
 * 拼接：111112113114
 * 频率：1:9, 2:1, 3:1, 4:1
 * 比较：完全匹配 ✓
 * 返回：111
 *
 * 详细过程图示：
 *
 * 原始序列（示例1）：
 * 8 → 9 → 10 → 11 → 12
 *
 * 拼接：
 * 8 9 1 0 1 1 1 2
 * ↓
 * "89101112"
 *
 * 打乱：
 * "19801211"
 *
 * 还原过程：
 * 尝试 start=1: "12345" ❌
 * 尝试 start=2: "23456" ❌
 * ...
 * 尝试 start=8: "89101112" ✓ (字符频率匹配)
 *
 * 答案：8
 */

// 测试用例
function test() {
  console.log("=== 测试开始 ===\n");

  // 示例1
  const str1 = "19801211";
  const count1 = 5;
  console.log("示例1:");
  console.log(`输入: "${str1}" ${count1}`);
  console.log("输出:", findMinNumber(str1, count1));
  console.log("预期: 8");
  console.log("解释: 序列为 8,9,10,11,12，拼接后为 89101112\n");

  // 示例2
  const str2 = "432111111111";
  const count2 = 4;
  console.log("示例2:");
  console.log(`输入: "${str2}" ${count2}`);
  console.log("输出:", findMinNumber(str2, count2));
  console.log("预期: 111");
  console.log("解释: 序列为 111,112,113,114，拼接后为 111112113114\n");

  // 示例3：简单测试
  const str3 = "123";
  const count3 = 3;
  console.log("示例3:");
  console.log(`输入: "${str3}" ${count3}`);
  console.log("输出:", findMinNumber(str3, count3));
  console.log("预期: 1");
  console.log("解释: 序列为 1,2,3，拼接后为 123\n");

  // 示例4：包含两位数
  const str4 = "9101112";
  const count4 = 4;
  console.log("示例4:");
  console.log(`输入: "${str4}" ${count4}`);
  console.log("输出:", findMinNumber(str4, count4));
  console.log("预期: 9");
  console.log("解释: 序列为 9,10,11,12，拼接后为 9101112\n");

  console.log("=== 测试结束 ===");
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  test();
}

export { findMinNumber };
