/**
 * 打卡次数统计 - 优秀员工
 *
 * 题目描述：
 * 公司某部门软件教导团正在组织新员工每日打卡学习活动，他们打算最顶尖学习活动已经一个月了，
 * 所以想统计下这个月优秀的打卡员工，每个员工会对应一个id，每天的打卡记录是当天打卡员工的id集合，
 * 一共30天。
 *
 * 请你实现代码帮助计算出打卡次数top5的员工，加入打卡次数相同，将较早参与打卡的员工排在前面，
 * 如果开始参与打卡的时间还是一样，将id较小的员工排在前面。
 *
 * 注：不考虑并列的情况，按规则排序回前5名员工的id即可，如果当月打卡的员工少于5个，
 * 按规则排序返回所有有打卡记录的员工id。
 *
 * 输入描述：
 * 第一行输入为新员工数量N，表示新员工编号id为0到N-1，N的范围为[1,100]
 * 第二行输入为30个整数，表示每天打卡的员工数量，每天至少有1名员工打卡。
 * 之后30行为每天打卡的员工id集合，id不会重复。
 *
 * 输出描述：
 * 按顺序输出打卡top5员工的id，用空格隔开。
 */

/**
 * 解题思路：统计 + 排序
 *
 * 核心思想：
 * 1. 统计每个员工的打卡次数
 * 2. 记录每个员工第一次打卡的时间（天数）
 * 3. 按照规则排序：
 *    - 优先按打卡次数降序
 *    - 次数相同，按首次打卡时间升序（越早越前）
 *    - 时间也相同，按id升序（id小的在前）
 * 4. 取前5名
 *
 * 时间复杂度：O(n log n)，主要是排序
 * 空间复杂度：O(n)，存储员工信息
 */

// 员工信息接口
interface Employee {
  id: number; // 员工id
  count: number; // 打卡次数
  firstDay: number; // 首次打卡的天数（1-30）
}

/**
 * 主函数：找出打卡top5的员工
 * @param n 员工总数
 * @param dailyRecords 每天打卡的员工id列表（30天）
 * @returns top5员工的id数组
 */
function findTop5Employees(n: number, dailyRecords: number[][]): number[] {
  // 步骤1：初始化员工信息
  // 使用Map存储每个员工的信息
  const employeeMap = new Map<number, Employee>();

  // 步骤2：遍历30天的打卡记录
  for (let day = 0; day < 30; day++) {
    const todayEmployees = dailyRecords[day];

    // 遍历今天打卡的每个员工
    for (const empId of todayEmployees) {
      if (!employeeMap.has(empId)) {
        // 第一次打卡，创建员工记录
        employeeMap.set(empId, {
          id: empId,
          count: 1,
          firstDay: day + 1, // 天数从1开始
        });
      } else {
        // 不是第一次打卡，增加打卡次数
        const emp = employeeMap.get(empId)!;
        emp.count++;
      }
    }
  }

  // 步骤3：将Map转换为数组，方便排序
  const employees = Array.from(employeeMap.values());

  // 步骤4：按规则排序
  employees.sort((a, b) => {
    // 规则1：打卡次数多的在前（降序）
    if (a.count !== b.count) {
      return b.count - a.count;
    }

    // 规则2：打卡次数相同，首次打卡时间早的在前（升序）
    if (a.firstDay !== b.firstDay) {
      return a.firstDay - b.firstDay;
    }

    // 规则3：首次打卡时间也相同，id小的在前（升序）
    return a.id - b.id;
  });

  // 步骤5：取前5名（如果不足5人，返回所有人）
  const top5 = employees.slice(0, Math.min(5, employees.length));

  // 返回id数组
  return top5.map((emp) => emp.id);
}

/**
 * 算法图解：
 *
 * 示例：
 * 员工数：11
 * 第1天打卡：4 4 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 2 2
 * 第2天打卡：0 1 7 10
 * 第3天打卡：0 1 6 10
 * 第4-30天：每天都是 10
 *
 * 统计结果：
 * 员工1：打卡2次，首次第1天
 * 员工2：打卡1次，首次第1天
 * 员工4：打卡1次，首次第1天
 * 员工0：打卡2次，首次第2天
 * 员工7：打卡1次，首次第2天
 * 员工10：打卡29次，首次第2天
 * 员工6：打卡1次，首次第3天
 *
 * 排序过程：
 * 1. 按打卡次数排序：
 *    10(29次) > 1(2次) = 0(2次) > 其他(1次)
 *
 * 2. 次数相同的，按首次打卡时间排序：
 *    1(第1天) > 0(第2天)
 *    2(第1天) > 4(第1天) > 7(第2天) > 6(第3天)
 *
 * 3. 时间也相同的，按id排序：
 *    2(id=2) < 4(id=4)
 *
 * 最终排序：10, 1, 0, 2, 4
 *
 * Top5：10 1 0 2 4
 */

// 测试用例
function test() {
  console.log("=== 测试开始 ===\n");

  // 示例1
  const n1 = 11;
  const dailyRecords1: number[][] = [];

  // 第1天：员工1打卡很多次，员工2和4各打卡1次
  dailyRecords1.push([
    4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 2, 2,
  ]);

  // 第2天：员工0,1,7,10打卡
  dailyRecords1.push([0, 1, 7, 10]);

  // 第3天：员工0,1,6,10打卡
  dailyRecords1.push([0, 1, 6, 10]);

  // 第4-30天：每天员工10打卡
  for (let i = 3; i < 30; i++) {
    dailyRecords1.push([10]);
  }

  const result1 = findTop5Employees(n1, dailyRecords1);
  console.log("示例1结果:", result1.join(" "));
  console.log("预期结果: 10 1 0 2 4\n");

  console.log("=== 测试结束 ===");
}

// 主函数：处理输入输出
function main() {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const lines: string[] = [];

  rl.on("line", (line: string) => {
    lines.push(line.trim());

    // 读取完所有输入（1行员工数 + 1行每天人数 + 30行打卡记录）
    if (lines.length === 32) {
      // 解析输入
      const n = parseInt(lines[0]);
      const dailyCounts = lines[1].split(" ").map(Number);

      const dailyRecords: number[][] = [];
      for (let i = 2; i < 32; i++) {
        const employees = lines[i].split(" ").map(Number);
        dailyRecords.push(employees);
      }

      // 计算结果
      const result = findTop5Employees(n, dailyRecords);
      console.log(result.join(" "));

      rl.close();
    }
  });
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  test();
  // main();
}

export { findTop5Employees };
