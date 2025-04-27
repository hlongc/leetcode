/*
 * @lc app=leetcode.cn id=389 lang=typescript
 *
 * [389] 找不同
 */

// @lc code=start
/**
 * 找出字符串t中比字符串s多出的那个字符
 * @param s 原始字符串
 * @param t 新字符串，它是由s添加一个字母并打乱顺序得到的
 * @return 返回t中比s多出的那个字符
 */
function findTheDifference(s: string, t: string): string {
  // 利用异或运算的性质解决问题
  // 异或运算的关键特性:
  // 1. a ^ a = 0 (相同数异或为0)
  // 2. a ^ 0 = a (任何数与0异或等于其本身)
  // 3. 异或满足交换律和结合律: a ^ b ^ c = a ^ c ^ b

  let i = 0;
  let tmp = 0;

  // 遍历字符串t的每个字符
  // 由于t比s多一个字符，所以用t的长度作为循环条件
  while (i < t.length) {
    // 对s和t中的每个字符的ASCII码进行异或运算
    // 如果i超出了s的长度，s.charCodeAt(i)会返回undefined，使用??运算符将其转为0
    tmp ^= (s.charCodeAt(i) ?? 0) ^ (t.charCodeAt(i) ?? 0);
    i++;
  }

  // 由于相同的字符异或后会变成0，所有s中的字符都会在t中找到匹配
  // 唯一剩下的就是t中多出的那个字符的ASCII码
  // 将ASCII码转换回字符并返回
  return String.fromCharCode(tmp);
}
// @lc code=end
