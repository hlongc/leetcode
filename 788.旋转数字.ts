/*
 * @lc app=leetcode.cn id=788 lang=typescript
 *
 * [788] 旋转数字
 */

// @lc code=start

const isGood = (num: number): boolean => {
  const map: Record<number, boolean | null> = {
    1: null,
    2: true,
    3: false,
    4: false,
    5: true,
    6: true,
    7: false,
    8: null,
    9: true,
    0: null,
  };
  let flag = false;

  while (num) {
    const last = num % 10;
    if (map[last] === false) {
      flag = false;
      break;
    }
    if (map[last] === true) {
      flag = true;
    }
    num = ~~(num / 10);
  }

  return flag;
};
function rotatedDigits1(n: number): number {
  let ret = 0;
  while (n >= 1) {
    if (isGood(n--)) {
      ret++;
    }
  }

  return ret;
}

/**
 * 788. 旋转数字
 *
 * 问题描述：
 * 我们称一个数 X 为好数, 如果它的每位数字逐个旋转 180° 后，我们仍可以得到一个有效的数，且这个数不同于 X。
 *
 * 数字旋转规则：
 * - 0,1,8 旋转后还是自己
 * - 2 旋转后变成 5
 * - 5 旋转后变成 2
 * - 6 旋转后变成 9
 * - 9 旋转后变成 6
 * - 3,4,7 旋转后不是有效数字
 *
 * 解题思路：
 * 1. 将问题转化为7进制和3进制的差值
 * 2. 7进制对应所有有效数字 (0,1,2,5,6,8,9)
 * 3. 3进制对应不变的数字 (0,1,8)
 * 4. 两者的差值就是好数的个数
 *
 * @param n 给定的上限数字
 * @returns 1到n之间的好数个数
 */
var rotatedDigits = function (n: number) {
  // 将数字转为字符串数组，方便按位处理
  const l = String(n).split("");
  const len = l.length;

  // 7进制映射表：将0-9映射到7进制数字
  // "2"表示到此位置后，后面都可以填充最大有效数字6
  const a = [0, 1, 2, "2", "2", 3, 4, "2", 5, 6];

  // 3进制映射表：将0-9映射到3进制数字
  // "1"表示到此位置后，后面都可以填充最大有效数字2
  const b = [0, 1, "1", "1", "1", "1", "1", "1", 2, "2"];

  // 构造7进制数
  let seven = "";
  let temp;
  for (let i = 0; i < len; i++) {
    temp = a[l[i] as any];
    seven += temp;
    // 如果遇到字符串（即"2"），表示后面的位数都可以是6
    if (typeof temp === "string") {
      // 用6填充剩余位置（6是7进制中的最大有效数字）
      seven += "6".repeat(len - i - 1);
      break;
    }
  }

  // 构造3进制数
  let three = "";
  for (let i = 0; i < len; i++) {
    temp = b[l[i] as any];
    three += temp;
    // 如果遇到字符串（即"1"），表示后面的位数都可以是2
    if (typeof temp === "string") {
      // 用2填充剩余位置（2是3进制中的最大有效数字）
      three += "2".repeat(len - i - 1);
      break;
    }
  }

  // 计算7进制数和3进制数的差值，即为好数的个数
  return parseInt(seven, 7) - parseInt(three, 3);
};

/**
 * 举例说明：
 * 假设 n = 20
 *
 * 7进制处理：
 * - 2对应a[2]=2
 * - 0对应a[0]=0
 * seven = "20"（7进制）
 *
 * 3进制处理：
 * - 2对应b[2]="1"
 * - 遇到"1"后，后面填充2
 * three = "12"（3进制）
 *
 * 结果：
 * parseInt("20", 7) = 14（十进制）
 * parseInt("12", 3) = 5（十进制）
 * 14 - 5 = 9，表示1到20之间有9个好数
 */
// @lc code=end
