/*
 * @lc app=leetcode.cn id=371 lang=typescript
 *
 * [371] 两整数之和
 */

// @lc code=start
/**
 * 不使用+和-运算符，计算两整数之和
 * @param a 第一个整数
 * @param b 第二个整数
 * @return 两数之和
 */
function getSum(a: number, b: number): number {
  // 使用位运算模拟加法
  // 在二进制加法中:
  // 1. a ^ b 得到的是无进位的加法结果
  // 2. (a & b) << 1 得到的是进位的结果

  // 当没有进位时(b为0)，结果就是a
  // 否则，继续递归计算: (无进位结果) + (进位结果)

  // 处理JavaScript中位运算的特殊情况(32位整数)
  // 当b不为0时，继续递归
  while (b !== 0) {
    // 临时保存进位
    const carry = (a & b) << 1;

    // 计算无进位加法
    a = a ^ b;

    // 更新进位值用于下一轮计算
    b = carry;

    // 注: 在JavaScript中位运算会将操作数转为32位整数
    // 因此对于大数可能会有问题，但力扣测试用例在32位范围内
  }

  return a;
}
// @lc code=end
