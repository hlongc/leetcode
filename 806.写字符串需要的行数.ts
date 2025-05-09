/*
 * @lc app=leetcode.cn id=806 lang=typescript
 *
 * [806] 写字符串需要的行数
 *
 * 题目描述：
 * 我们要把给定的字符串 S 从左到右写到每一行上，每一行的最大宽度为100个单位，
 * 如果我们在写某个字母的时候会使这行超过了100个单位，那么我们应该把这个字母写到下一行。
 * 我们给定了一个数组 widths，这个数组 widths[0] 代表 'a' 需要的单位，widths[1] 代表 'b' 需要的单位，...，
 * widths[25] 代表 'z' 需要的单位。
 *
 * 现在回答两个问题：至少多少行能放下S，以及最后一行使用的宽度是多少个单位？
 * 将你的答案作为长度为2的整数列表返回。
 */

// @lc code=start
/**
 * 计算写字符串S需要的行数以及最后一行使用的宽度
 *
 * @param widths - 26个小写字母每个字母所占的宽度数组
 * @param s - 要写的字符串
 * @returns - 返回一个数组，第一个元素是行数，第二个元素是最后一行使用的宽度
 */
function numberOfLines(widths: number[], s: string): number[] {
  // 定义常量
  const MAX_WIDTH = 100;
  const BASE_CODE = "a".charCodeAt(0);

  // 初始化行数和当前行已使用的宽度
  let lines = 1;
  let currentWidth = 0;

  // 遍历字符串中的每个字符
  for (const char of s) {
    // 计算当前字符需要的宽度
    const charWidth = widths[char.charCodeAt(0) - BASE_CODE];

    // 检查当前行是否能容纳这个字符
    if (currentWidth + charWidth > MAX_WIDTH) {
      // 开始新的一行
      lines++;
      currentWidth = charWidth;
    } else {
      // 在当前行添加这个字符
      currentWidth += charWidth;
    }
  }

  // 返回结果数组：[总行数, 最后一行已使用的宽度]
  return [lines, currentWidth];
}
// @lc code=end

/**
 * 优化说明：
 *
 * 1. 代码可读性优化：
 *    - 使用更有意义的变量名：lines替代col，currentWidth替代ret
 *    - 使用常量MAX_WIDTH和BASE_CODE增强代码可读性
 *    - 使用for...of循环代替while循环和索引，更简洁
 *
 * 2. 逻辑优化：
 *    - 直接跟踪当前行已使用的宽度，而不是剩余宽度，避免最后的减法操作
 *    - 减少不必要的变量i
 *
 * 3. 边界情况处理保持不变：
 *    - 仍然从第一行开始计数
 *    - 正确处理每个字符的宽度计算
 *
 * 时间复杂度：O(n)，其中n是字符串s的长度
 * 空间复杂度：O(1)，只使用了常量级别的额外空间
 */
