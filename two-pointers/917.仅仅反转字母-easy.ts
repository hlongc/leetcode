/*
 * @lc app=leetcode.cn id=917 lang=typescript
 *
 * [917] 仅仅反转字母
 *
 * https://leetcode.cn/problems/reverse-only-letters/description/
 *
 * algorithms
 * Easy (59.29%)
 * Likes:    221
 * Dislikes: 0
 * Total Accepted:    89.2K
 * Total Submissions: 150.4K
 * Testcase Example:  '"ab-cd"'
 *
 * 给你一个字符串 s ，根据下述规则反转字符串：
 *
 *
 * 所有非英文字母保留在原有位置。
 * 所有英文字母（小写或大写）位置反转。
 *
 *
 * 返回反转后的 s 。
 *
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：s = "ab-cd"
 * 输出："dc-ba"
 *
 *
 *
 *
 *
 * 示例 2：
 *
 *
 * 输入：s = "a-bC-dEf-ghIj"
 * 输出："j-Ih-gfE-dCba"
 *
 *
 *
 *
 *
 * 示例 3：
 *
 *
 * 输入：s = "Test1ng-Leet=code-Q!"
 * 输出："Qedo1ct-eeLg=ntse-T!"
 *
 *
 *
 *
 * 提示
 *
 *
 * 1 <= s.length <= 100
 * s 仅由 ASCII 值在范围 [33, 122] 的字符组成
 * s 不含 '\"' 或 '\\'
 *
 *
 */

// @lc code=start
/**
 * 仅仅反转字符串中的字母
 *
 * 思路：使用双指针法
 * 1. 将字符串转换为字符数组，方便原地修改
 * 2. 设置两个指针，一个从头开始，一个从尾开始
 * 3. 同时移动两个指针，直到找到字母
 * 4. 交换两个字母的位置
 * 5. 重复步骤3和4，直到两个指针相遇
 *
 * @param s 原始字符串
 * @returns 仅反转字母后的字符串
 */
function reverseOnlyLetters(s: string): string {
  // 将字符串转换为字符数组，方便修改
  const chars: string[] = s.split("");

  // 初始化双指针
  let left = 0;
  let right = s.length - 1;

  // 当左指针小于右指针时继续交换
  while (left < right) {
    // 如果左指针不是字母，则右移
    if (!isLetter(chars[left])) {
      left++;
      continue;
    }

    // 如果右指针不是字母，则左移
    if (!isLetter(chars[right])) {
      right--;
      continue;
    }

    // 两个指针都指向字母，交换它们
    [chars[left], chars[right]] = [chars[right], chars[left]];

    // 移动两个指针
    left++;
    right--;
  }

  // 将字符数组转回字符串并返回
  return chars.join("");
}

/**
 * 判断一个字符是否为字母
 *
 * @param char 需要判断的字符
 * @returns 是否为字母(英文大小写)
 */
function isLetter(char: string): boolean {
  // 使用正则表达式判断是否为字母
  return /[a-zA-Z]/.test(char);

  // 或者使用字符编码判断
  // const code = char.charCodeAt(0);
  // return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}
// @lc code=end
