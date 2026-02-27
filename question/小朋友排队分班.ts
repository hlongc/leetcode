/**
 * 小朋友排队分班
 *
 * 题目描述：
 * 儿园两个班的小朋友在排队时混在了一起，每位小朋友都知道自己是否与前面一位小朋友同班，
 * 请你帮忙把同班的小朋友找出来。
 *
 * 小朋友的编号是整数，与前一位小朋友同班用Y表示，不同班用N表示。
 *
 * 输入描述：
 * 输入为空格分开的小朋友编号和是否同班标志。
 *
 * 比如：6/N 2/Y 3/N 4/Y，表示4位小朋友，2和6同班，3和2不同班，4和3同班。
 *
 * 其中，小朋友总数不超过999，每个小朋友编号大于0，小于等于999。
 *
 * 不考虑输入格式错误问题。
 *
 * 输出描述：
 * 输出为两行，每一行记录一个班小朋友的编号，编号用空格分开，且：
 * 1. 编号需要按大小升序排列，分班记录中第一个编号小的排在第一行。
 * 2. 若只有一个班的小朋友，第二行为空行。
 * 3. 若输入不符合要求，则直接输出字符串ERROR。
 */

/**
 * 解题思路：并查集 / 分组模拟
 *
 * 核心思想：
 * 1. 第一个小朋友自成一班
 * 2. 后续小朋友根据标记（Y/N）决定：
 *    - Y：与前一个小朋友同班
 *    - N：与前一个小朋友不同班
 * 3. 最后将所有小朋友按班级分组并排序
 *
 * 简单方法：
 * 使用两个数组分别存储两个班的小朋友
 * - 第一个小朋友放入班级1
 * - 遇到Y：放入与前一个相同的班级
 * - 遇到N：放入与前一个不同的班级
 *
 * 时间复杂度：O(n log n)，主要是排序
 * 空间复杂度：O(n)
 */

/**
 * 主函数：分班
 * @param input 输入字符串，格式如 "6/N 2/Y 3/N 4/Y"
 * @returns 分班结果，两行字符串
 */
function classifyChildren(input: string): string {
  try {
    // 解析输入
    const parts = input.trim().split(/\s+/);

    if (parts.length === 0) {
      return "ERROR";
    }

    // 存储每个小朋友的信息
    interface Child {
      id: number; // 编号
      sameAsPrev: boolean; // 是否与前一个同班（第一个为null）
    }

    const children: Child[] = [];

    // 解析每个小朋友的信息
    for (const part of parts) {
      const [idStr, flag] = part.split("/");
      const id = parseInt(idStr);

      // 验证输入
      if (isNaN(id) || id <= 0 || id > 999) {
        return "ERROR";
      }

      if (flag !== "Y" && flag !== "N") {
        return "ERROR";
      }

      children.push({
        id: id,
        sameAsPrev: flag === "Y",
      });
    }

    // 特殊情况：只有一个小朋友
    if (children.length === 1) {
      return `${children[0].id}\n`;
    }

    // 分班：使用两个数组存储两个班级
    const class1: number[] = [];
    const class2: number[] = [];

    // 第一个小朋友放入班级1
    class1.push(children[0].id);
    let prevClass = 1; // 记录前一个小朋友在哪个班（1或2）

    // 处理后续小朋友
    for (let i = 1; i < children.length; i++) {
      const child = children[i];

      if (child.sameAsPrev) {
        // Y：与前一个同班
        if (prevClass === 1) {
          class1.push(child.id);
        } else {
          class2.push(child.id);
        }
        // prevClass 不变
      } else {
        // N：与前一个不同班
        if (prevClass === 1) {
          class2.push(child.id);
          prevClass = 2;
        } else {
          class1.push(child.id);
          prevClass = 1;
        }
      }
    }

    // 对每个班级的编号排序
    class1.sort((a, b) => a - b);
    class2.sort((a, b) => a - b);

    // 确定哪个班在第一行（第一个编号小的在前）
    let line1: number[];
    let line2: number[];

    if (class2.length === 0) {
      // 只有一个班
      line1 = class1;
      line2 = [];
    } else if (class1.length === 0) {
      // 只有一个班
      line1 = class2;
      line2 = [];
    } else {
      // 两个班都有人，比较第一个编号
      if (class1[0] < class2[0]) {
        line1 = class1;
        line2 = class2;
      } else {
        line1 = class2;
        line2 = class1;
      }
    }

    // 格式化输出
    const result1 = line1.join(" ");
    const result2 = line2.length > 0 ? line2.join(" ") : "";

    return `${result1}\n${result2}`;
  } catch (error) {
    return "ERROR";
  }
}

/**
 * 算法图解：
 *
 * 示例：输入 "1/N 2/Y 3/N 4/Y"
 *
 * 解析：
 * 小朋友1：编号1，标记N（第一个，自成一班）
 * 小朋友2：编号2，标记Y（与1同班）
 * 小朋友3：编号3，标记N（与2不同班）
 * 小朋友4：编号4，标记Y（与3同班）
 *
 * 分班过程：
 *
 * 1. 小朋友1 → 班级1
 *    班级1: [1]
 *    班级2: []
 *    prevClass = 1
 *
 * 2. 小朋友2，标记Y（与前一个同班）
 *    前一个在班级1，所以2也在班级1
 *    班级1: [1, 2]
 *    班级2: []
 *    prevClass = 1
 *
 * 3. 小朋友3，标记N（与前一个不同班）
 *    前一个在班级1，所以3在班级2
 *    班级1: [1, 2]
 *    班级2: [3]
 *    prevClass = 2
 *
 * 4. 小朋友4，标记Y（与前一个同班）
 *    前一个在班级2，所以4也在班级2
 *    班级1: [1, 2]
 *    班级2: [3, 4]
 *    prevClass = 2
 *
 * 排序：
 * 班级1: [1, 2] （已排序）
 * 班级2: [3, 4] （已排序）
 *
 * 输出：
 * 第一行：1 2 （班级1的第一个编号1 < 班级2的第一个编号3）
 * 第二行：3 4
 *
 *
 * 示例2：输入 "6/N 2/Y 3/N 4/Y"
 *
 * 分班过程：
 * 1. 6 → 班级1: [6], prevClass=1
 * 2. 2, Y → 班级1: [6,2], prevClass=1
 * 3. 3, N → 班级2: [3], prevClass=2
 * 4. 4, Y → 班级2: [3,4], prevClass=2
 *
 * 排序：
 * 班级1: [2, 6]
 * 班级2: [3, 4]
 *
 * 输出：
 * 第一行：2 6 （2 < 3）
 * 第二行：3 4
 */

// 测试用例
function test() {
  console.log("=== 测试开始 ===\n");

  // 示例1
  console.log('示例1: "1/N 2/Y 3/N 4/Y"');
  console.log("结果:");
  console.log(classifyChildren("1/N 2/Y 3/N 4/Y"));
  console.log("预期: 1 2\\n3 4\n");

  // 示例2
  console.log('示例2: "6/N 2/Y 3/N 4/Y"');
  console.log("结果:");
  console.log(classifyChildren("6/N 2/Y 3/N 4/Y"));
  console.log("预期: 2 6\\n3 4\n");

  // 示例3：只有一个班
  console.log('示例3: "1/N 2/Y 3/Y"');
  console.log("结果:");
  console.log(classifyChildren("1/N 2/Y 3/Y"));
  console.log("预期: 1 2 3\\n\n");

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
    const result = classifyChildren(line);
    console.log(result);
    rl.close();
  });
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  test();
  // main();
}

export { classifyChildren };
