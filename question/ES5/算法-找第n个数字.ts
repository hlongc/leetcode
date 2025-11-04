/**
 * ============================================
 * 算法题：序列中的第 m 个数字
 * ============================================
 * 
 * 问题描述：
 * 序列："123456789101112131415...n+1"
 * 求：第 m 个数字是什么？
 * 
 * 示例：
 * 序列：1 2 3 4 5 6 7 8 9 1 0 1 1 1 2 1 3 ...
 * 位置：1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17
 * 
 * 第1个数字：1
 * 第10个数字：1（来自 10）
 * 第11个数字：0（来自 10）
 * 第12个数字：1（来自 11）
 */

/**
 * ============================================
 * 解题思路
 * ============================================
 * 
 * 关键观察：
 * 1位数（1-9）：     9 个数字，共占 9 × 1 = 9 位
 * 2位数（10-99）：   90 个数字，共占 90 × 2 = 180 位
 * 3位数（100-999）： 900 个数字，共占 900 × 3 = 2700 位
 * ...
 * 
 * 步骤：
 * 1. 确定第 m 位在几位数的范围内（1位数、2位数、3位数...）
 * 2. 确定是哪个具体的数字
 * 3. 确定是这个数字的第几位
 */

function findNthDigit(m: number): number {
  // 边界情况
  if (m <= 0) return -1;
  
  // 1位数特殊处理
  if (m <= 9) return m;
  
  // 当前位数（1位、2位、3位...）
  let digits = 1;
  
  // 当前位数范围的起始数字（1, 10, 100, ...）
  let start = 1;
  
  // 当前位数范围的数字个数（9, 90, 900, ...）
  let count = 9;
  
  // 第 1 步：确定第 m 位在几位数的范围内
  while (m > count * digits) {
    m -= count * digits;  // 减去当前范围占用的位数
    
    digits++;             // 进入下一位数范围
    start *= 10;          // 10, 100, 1000, ...
    count *= 10;          // 90, 900, 9000, ...
  }
  
  // 第 2 步：确定是哪个具体的数字
  // m-1 是因为索引从 0 开始
  const numberIndex = Math.floor((m - 1) / digits);
  const number = start + numberIndex;
  
  // 第 3 步：确定是这个数字的第几位
  const digitIndex = (m - 1) % digits;
  const digit = String(number)[digitIndex];
  
  return Number(digit);
}

// ============================================
// 详细示例演示
// ============================================

console.log('=== 序列中的第 n 个数字 ===\n');

// 测试用例
const testCases = [
  { m: 1, expected: 1, desc: '第1个数字' },
  { m: 9, expected: 9, desc: '第9个数字（1位数的最后一个）' },
  { m: 10, expected: 1, desc: '第10个数字（10的第一位）' },
  { m: 11, expected: 0, desc: '第11个数字（10的第二位）' },
  { m: 12, expected: 1, desc: '第12个数字（11的第一位）' },
  { m: 15, expected: 2, desc: '第15个数字（12的第二位）' },
  { m: 190, expected: 1, desc: '第190个数字（100的第一位）' },
  { m: 1000, expected: 3, desc: '第1000个数字' },
];

testCases.forEach(({ m, expected, desc }) => {
  const result = findNthDigit(m);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} ${desc}: m=${m}, 结果=${result}, 期望=${expected}`);
});

/**
 * ============================================
 * 详细推导过程（以 m=15 为例）
 * ============================================
 */
console.log('\n=== 详细推导：m=15 ===\n');

function findNthDigitDetailed(m: number): number {
  console.log(`查找第 ${m} 个数字\n`);
  
  if (m <= 9) {
    console.log(`在 1 位数范围内，直接返回 ${m}`);
    return m;
  }
  
  let originalM = m;
  let digits = 1;
  let start = 1;
  let count = 9;
  
  console.log('步骤1：确定在几位数的范围内\n');
  
  while (m > count * digits) {
    const totalDigits = count * digits;
    console.log(`  ${digits}位数范围：`);
    console.log(`    起始数字: ${start}`);
    console.log(`    数字个数: ${count}`);
    console.log(`    占用位数: ${count} × ${digits} = ${totalDigits}`);
    console.log(`    剩余位数: ${m} - ${totalDigits} = ${m - totalDigits}`);
    
    m -= totalDigits;
    digits++;
    start *= 10;
    count *= 10;
    
    console.log('');
  }
  
  console.log(`  ✅ 确定：在 ${digits} 位数范围内`);
  console.log(`      剩余位数: ${m}\n`);
  
  console.log('步骤2：确定是哪个具体的数字\n');
  
  const numberIndex = Math.floor((m - 1) / digits);
  const number = start + numberIndex;
  
  console.log(`  数字索引: (${m} - 1) ÷ ${digits} = ${numberIndex}`);
  console.log(`  具体数字: ${start} + ${numberIndex} = ${number}\n`);
  
  console.log('步骤3：确定是这个数字的第几位\n');
  
  const digitIndex = (m - 1) % digits;
  const digit = String(number)[digitIndex];
  
  console.log(`  位数索引: (${m} - 1) % ${digits} = ${digitIndex}`);
  console.log(`  数字 ${number} 的第 ${digitIndex} 位: ${digit}\n`);
  
  console.log(`结果：第 ${originalM} 个数字是 ${digit}`);
  
  return Number(digit);
}

findNthDigitDetailed(15);

/**
 * 输出：
 * 
 * 查找第 15 个数字
 * 
 * 步骤1：确定在几位数的范围内
 * 
 *   1位数范围：
 *     起始数字: 1
 *     数字个数: 9
 *     占用位数: 9 × 1 = 9
 *     剩余位数: 15 - 9 = 6
 * 
 *   ✅ 确定：在 2 位数范围内
 *       剩余位数: 6
 * 
 * 步骤2：确定是哪个具体的数字
 * 
 *   数字索引: (6 - 1) ÷ 2 = 2
 *   具体数字: 10 + 2 = 12
 * 
 * 步骤3：确定是这个数字的第几位
 * 
 *   位数索引: (6 - 1) % 2 = 1
 *   数字 12 的第 1 位: 2
 * 
 * 结果：第 15 个数字是 2
 */

/**
 * ============================================
 * 验证序列（前 20 位）
 * ============================================
 */
console.log('\n=== 验证：生成前 20 位序列 ===\n');

function generateSequence(n: number): string {
  let sequence = '';
  for (let i = 1; sequence.length < n; i++) {
    sequence += String(i);
  }
  return sequence.substring(0, n);
}

const sequence = generateSequence(20);
console.log('序列：', sequence);
console.log('位置：', '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20');
console.log('');

// 验证几个位置
[1, 9, 10, 11, 12, 15].forEach(m => {
  const result = findNthDigit(m);
  const actual = sequence[m - 1];
  const status = result === Number(actual) ? '✅' : '❌';
  console.log(`${status} 第${m}位: 计算=${result}, 实际=${actual}`);
});

/**
 * ============================================
 * 复杂度分析
 * ============================================
 * 
 * 时间复杂度：O(log m)
 * - while 循环次数取决于 m 在几位数范围
 * - 最多循环 log10(m) 次
 * - 例如 m=1000，最多循环约 3-4 次
 * 
 * 空间复杂度：O(1)
 * - 只使用常数个变量
 */

/**
 * ============================================
 * 扩展：找第 m-n 位的所有数字
 * ============================================
 */
function findDigitsInRange(m: number, n: number): number[] {
  const result: number[] = [];
  
  for (let i = m; i <= n; i++) {
    result.push(findNthDigit(i));
  }
  
  return result;
}

console.log('\n=== 扩展：找第 10-15 位 ===\n');
const range = findDigitsInRange(10, 15);
console.log('第 10-15 位:', range.join(''));
console.log('拼接结果: "' + range.join('') + '"');
console.log('对应数字: 10, 11, 12（的前两位）');

/**
 * ============================================
 * 边界情况测试
 * ============================================
 */
console.log('\n=== 边界情况测试 ===\n');

const edgeCases = [
  { m: 0, desc: '无效输入' },
  { m: 1, desc: '第一个数字' },
  { m: 9, desc: '1位数的最后一位' },
  { m: 10, desc: '2位数的第一位' },
  { m: 189, desc: '2位数的最后一位' },
  { m: 190, desc: '3位数的第一位' },
  { m: 1000000, desc: '第100万位' }
];

edgeCases.forEach(({ m, desc }) => {
  const result = findNthDigit(m);
  console.log(`${desc}: m=${m}, 结果=${result}`);
});

/**
 * ============================================
 * 性能测试
 * ============================================
 */
console.log('\n=== 性能测试 ===\n');

console.time('查找第 1000000 位');
const millionth = findNthDigit(1000000);
console.timeEnd('查找第 1000000 位');
console.log('结果:', millionth);

console.time('查找第 1000000000 位');
const billionth = findNthDigit(1000000000);
console.timeEnd('查找第 1000000000 位');
console.log('结果:', billionth);

/**
 * ============================================
 * 相关题目变种
 * ============================================
 */

/**
 * 变种1：找第 m 个数字所属的完整数字
 */
function findNumberContaining(m: number): number {
  if (m <= 9) return m;
  
  let digits = 1;
  let start = 1;
  let count = 9;
  
  while (m > count * digits) {
    m -= count * digits;
    digits++;
    start *= 10;
    count *= 10;
  }
  
  const numberIndex = Math.floor((m - 1) / digits);
  return start + numberIndex;
}

console.log('\n=== 变种1：找第 m 位所属的数字 ===\n');
console.log('第 15 位属于数字:', findNumberContaining(15));  // 12
console.log('第 190 位属于数字:', findNumberContaining(190)); // 100

/**
 * 变种2：找数字 n 在序列中的起始位置
 */
function findPositionOfNumber(n: number): number {
  if (n === 0) return -1;
  if (n < 1) return -1;
  
  // 计算 n 之前有多少位
  let position = 0;
  let digits = 1;
  let start = 1;
  let count = 9;
  
  // 计算 n 之前完整范围的位数
  while (start * 10 <= n) {
    position += count * digits;
    digits++;
    start *= 10;
    count *= 10;
  }
  
  // 计算 n 所在范围的位置
  const rangeStart = Math.pow(10, digits - 1);
  const offset = n - rangeStart;
  position += offset * digits + 1;  // +1 因为是起始位置（从1开始）
  
  return position;
}

console.log('\n=== 变种2：数字 n 的起始位置 ===\n');
console.log('数字 10 的起始位置:', findPositionOfNumber(10));   // 10
console.log('数字 100 的起始位置:', findPositionOfNumber(100)); // 190
console.log('数字 12 的起始位置:', findPositionOfNumber(12));   // 14

/**
 * 验证：
 * 序列：1 2 3 4 5 6 7 8 9 1 0 1 1 1 2 1 3 ...
 * 位置：1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17
 *                           ↑ ↑  ↑ ↑  ↑ ↑
 *                          10    11    12
 * 
 * 10 的起始位置：10 ✅
 * 11 的起始位置：12 ✅
 * 12 的起始位置：14 ✅
 */

/**
 * ============================================
 * LeetCode 相关题目
 * ============================================
 * 
 * - LeetCode 400. 第N个数字（Nth Digit）
 * - LeetCode 剑指 Offer 44. 数字序列中某一位的数字
 */

// 导出
export { findNthDigit, findNumberContaining, findPositionOfNumber };

/**
 * ============================================
 * 总结
 * ============================================
 * 
 * 核心思路：
 * 1. 数学规律：1位数9个，2位数90个，3位数900个...
 * 2. 二分查找思想：逐步缩小范围
 * 3. 位置计算：索引、整除、取余
 * 
 * 时间复杂度：O(log m)
 * 空间复杂度：O(1)
 * 
 * 关键点：
 * - 理解每个范围的数字个数和占用位数
 * - 索引从 0 开始还是从 1 开始（需要 -1 处理）
 * - 边界情况处理
 */

