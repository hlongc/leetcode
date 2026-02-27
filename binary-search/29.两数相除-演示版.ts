/**
 * 两数相除 - 详细演示版（100 ÷ 3）
 *
 * 这个版本会打印每一步的执行过程，帮助理解算法
 */
function divideDemo(dividend: number, divisor: number): number {
  console.log("=".repeat(60));
  console.log(`计算：${dividend} ÷ ${divisor}`);
  console.log("=".repeat(60));

  // 步骤1：定义边界值
  const INT_MIN = -(2 ** 31);
  const INT_MAX = 2 ** 31 - 1;
  console.log(`\n步骤1：定义边界值`);
  console.log(`INT_MIN = ${INT_MIN}`);
  console.log(`INT_MAX = ${INT_MAX}`);

  // 步骤2：处理溢出
  if (dividend === INT_MIN && divisor === -1) {
    console.log(`\n步骤2：检测到溢出情况，返回 INT_MAX`);
    return INT_MAX;
  }
  console.log(`\n步骤2：无溢出情况`);

  // 步骤3：判断符号
  const isNegative = dividend > 0 !== divisor > 0;
  console.log(`\n步骤3：判断结果符号`);
  console.log(`dividend > 0: ${dividend > 0}`);
  console.log(`divisor > 0: ${divisor > 0}`);
  console.log(`结果是负数: ${isNegative}`);

  // 步骤4：转换为负数
  let a = dividend > 0 ? -dividend : dividend;
  let b = divisor > 0 ? -divisor : divisor;
  console.log(`\n步骤4：统一转换为负数处理`);
  console.log(`a (被除数) = ${a}`);
  console.log(`b (除数) = ${b}`);
  console.log(`为什么用负数？因为负数范围更大，避免 -2147483648 转正数溢出`);

  let result = 0;
  let roundCount = 0;

  console.log(`\n步骤5：开始主循环`);
  console.log(`循环条件：a <= b (即 |a| >= |b|)`);

  // 步骤5：主循环
  while (a <= b) {
    roundCount++;
    console.log(`\n${"─".repeat(50)}`);
    console.log(`第 ${roundCount} 轮循环开始`);
    console.log(`当前 a = ${a} (剩余被除数)`);
    console.log(`当前 b = ${b} (原始除数)`);
    console.log(`当前 result = ${result} (累计商)`);

    // 步骤5.1：初始化
    let currentDivisor = b;
    let currentQuotient = 1;
    console.log(`\n  初始化：`);
    console.log(`  currentDivisor = ${currentDivisor}`);
    console.log(`  currentQuotient = ${currentQuotient}`);

    // 步骤5.2：快速翻倍
    console.log(`\n  开始翻倍过程：`);
    let doubleCount = 0;
    while (
      currentDivisor >= INT_MIN >> 1 &&
      currentDivisor + currentDivisor >= a
    ) {
      doubleCount++;
      const nextDivisor = currentDivisor + currentDivisor;
      const nextQuotient = currentQuotient + currentQuotient;

      console.log(`    翻倍 ${doubleCount}:`);
      console.log(`      ${currentDivisor} × 2 = ${nextDivisor}`);
      console.log(`      ${currentQuotient} × 2 = ${nextQuotient}`);
      console.log(`      检查：${nextDivisor} >= ${a}? ${nextDivisor >= a}`);
      console.log(
        `      含义：|${-nextDivisor}| <= |${-a}|? ${-nextDivisor <= -a}`
      );

      currentDivisor = nextDivisor;
      currentQuotient = nextQuotient;
    }

    console.log(`\n  翻倍结束！`);
    console.log(
      `  最终 currentDivisor = ${currentDivisor} (绝对值: ${-currentDivisor})`
    );
    console.log(`  最终 currentQuotient = ${currentQuotient}`);

    // 步骤5.3：减去当前倍数
    const oldA = a;
    a -= currentDivisor;
    console.log(`\n  减法操作：`);
    console.log(`  ${oldA} - (${currentDivisor}) = ${a}`);
    console.log(`  含义：|${-oldA}| - |${-currentDivisor}| = |${-a}|`);
    console.log(`  即：${-oldA} - ${-currentDivisor} = ${-a}`);

    // 步骤5.4：累加商
    result += currentQuotient;
    console.log(`\n  累加商：`);
    console.log(
      `  result = ${result - currentQuotient} + ${currentQuotient} = ${result}`
    );

    console.log(`\n  检查是否继续循环：a <= b? ${a} <= ${b}? ${a <= b}`);
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`循环结束！共执行 ${roundCount} 轮`);

  // 步骤6：返回结果
  const finalResult = isNegative ? -result : result;
  console.log(`\n步骤6：根据符号返回结果`);
  console.log(`result = ${result}`);
  console.log(`isNegative = ${isNegative}`);
  console.log(`最终结果 = ${finalResult}`);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`验证：${dividend} ÷ ${divisor} = ${finalResult}`);
  console.log(`JavaScript 内置除法：${Math.trunc(dividend / divisor)}`);
  console.log("=".repeat(60));

  return finalResult;
}

// 测试用例
console.log("\n\n");
divideDemo(100, 3);

console.log("\n\n\n");
divideDemo(10, 3);

console.log("\n\n\n");
divideDemo(7, -3);
