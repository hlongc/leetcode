/**
 * 三角形个数
 *
 * 问题：给定一个非负整数数组，将数组元素作为三角形的边长，
 *      求能构成多少个三角形
 *
 * 示例 1:
 * 输入: [2, 2, 3, 4]
 * 输出: 3
 * 解释: 可以组成的三角形:
 *      (2, 2, 3)
 *      (2, 3, 4)
 *      (2, 2, 4)
 *
 * 示例 2:
 * 输入: [4, 2, 3, 4]
 * 输出: 4
 * 解释: (2, 3, 4), (2, 4, 4), (3, 4, 4), (2, 4, 4)
 *
 * 三角形成立条件：
 * 三条边 a, b, c，需要满足：
 * - a + b > c
 * - a + c > b
 * - b + c > a
 *
 * 优化：如果 a ≤ b ≤ c，只需检查 a + b > c
 */

// ============ 解法 1: 双指针（最优解）⭐⭐⭐⭐⭐ ============

/**
 * 时间复杂度: O(n²) - 外层循环 n，内层双指针 n
 * 空间复杂度: O(1) - 只使用常量额外空间（不考虑排序的空间）
 *
 * 核心思路：
 * 1. 先对数组排序
 * 2. 固定最大边 c (从右往左)
 * 3. 使用双指针在 c 左侧找满足 a + b > c 的组合
 * 4. 如果 nums[left] + nums[right] > nums[c]，
 *    则 [left, right-1] 之间的所有数与 right 都能组成三角形
 */
function triangleNumber(nums: number[]): number {
  // 边界情况：少于 3 个元素无法组成三角形
  if (nums.length < 3) {
    return 0;
  }

  // 1. 排序数组（从小到大）
  nums.sort((a, b) => a - b);

  let count = 0;

  // 2. 固定最大边，从右往左遍历
  // i 代表最大边的索引
  for (let i = nums.length - 1; i >= 2; i--) {
    let left = 0; // 最小边的指针
    let right = i - 1; // 中间边的指针

    // 3. 双指针查找
    while (left < right) {
      // 检查三角形条件：a + b > c
      if (nums[left] + nums[right] > nums[i]) {
        // ✅ 满足条件
        // 关键点：[left, right-1] 之间的所有数都可以和 right、i 组成三角形
        // 因为数组有序，如果 nums[left] + nums[right] > nums[i]
        // 那么 nums[left+1...right-1] + nums[right] 也都 > nums[i]
        count += right - left;

        // 缩小右指针，继续查找
        right--;
      } else {
        // ❌ 不满足条件，nums[left] 太小了
        // 增大左指针
        left++;
      }
    }
  }

  return count;
}

// ============ 解法 2: 三重循环（暴力，仅供理解）============

/**
 * 时间复杂度: O(n³)
 * 空间复杂度: O(1)
 *
 * 枚举所有三元组，检查是否能组成三角形
 */
function triangleNumberBruteForce(nums: number[]): number {
  if (nums.length < 3) return 0;

  let count = 0;

  // 枚举所有三元组
  for (let i = 0; i < nums.length - 2; i++) {
    for (let j = i + 1; j < nums.length - 1; j++) {
      for (let k = j + 1; k < nums.length; k++) {
        const a = nums[i];
        const b = nums[j];
        const c = nums[k];

        // 检查三角形条件（三个条件都要满足）
        if (a + b > c && a + c > b && b + c > a) {
          count++;
        }
      }
    }
  }

  return count;
}

// ============ 解法 3: 排序 + 优化的三重循环 ============

/**
 * 时间复杂度: O(n³)（但有剪枝优化）
 * 空间复杂度: O(1)
 *
 * 先排序，利用有序性质进行剪枝
 */
function triangleNumberOptimized(nums: number[]): number {
  if (nums.length < 3) return 0;

  nums.sort((a, b) => a - b);
  let count = 0;

  for (let i = 0; i < nums.length - 2; i++) {
    // 剪枝：如果最小边是 0，跳过
    if (nums[i] === 0) continue;

    for (let j = i + 1; j < nums.length - 1; j++) {
      for (let k = j + 1; k < nums.length; k++) {
        // 由于已排序：nums[i] <= nums[j] <= nums[k]
        // 只需检查 nums[i] + nums[j] > nums[k]
        if (nums[i] + nums[j] > nums[k]) {
          count++;
        } else {
          // 剪枝：如果 nums[i] + nums[j] <= nums[k]
          // 后面的 k 更大，也不会满足，直接跳出
          break;
        }
      }
    }
  }

  return count;
}

// ============ 解法 4: 二分查找优化 ============

/**
 * 时间复杂度: O(n² log n)
 * 空间复杂度: O(1)
 *
 * 固定两条边，用二分查找找最大的第三条边
 */
function triangleNumberBinarySearch(nums: number[]): number {
  if (nums.length < 3) return 0;

  nums.sort((a, b) => a - b);
  let count = 0;

  for (let i = 0; i < nums.length - 2; i++) {
    for (let j = i + 1; j < nums.length - 1; j++) {
      // 找最大的 k，使得 nums[i] + nums[j] > nums[k]
      const maxK = binarySearch(
        nums,
        j + 1,
        nums.length - 1,
        nums[i] + nums[j]
      );

      if (maxK > j) {
        count += maxK - j;
      }
    }
  }

  return count;
}

/**
 * 二分查找：找最大的索引 k，使得 nums[k] < target
 */
function binarySearch(
  nums: number[],
  left: number,
  right: number,
  target: number
): number {
  let result = left - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] < target) {
      result = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

// ============ 测试用例 ============

console.log("========== 测试解法 1（双指针，最优） ==========");

console.log("\n测试 1: 基本用例");
console.log("输入: [2, 2, 3, 4]");
console.log("输出:", triangleNumber([2, 2, 3, 4])); // 3
console.log("预期: 3");

console.log("\n测试 2: 多个元素");
console.log("输入: [4, 2, 3, 4]");
console.log("输出:", triangleNumber([4, 2, 3, 4])); // 4
console.log("预期: 4");

console.log("\n测试 3: 无法组成三角形");
console.log("输入: [1, 2, 10]");
console.log("输出:", triangleNumber([1, 2, 10])); // 0
console.log("预期: 0 (因为 1 + 2 < 10)");

console.log("\n测试 4: 所有组合都能组成三角形");
console.log("输入: [3, 4, 5, 6]");
console.log("输出:", triangleNumber([3, 4, 5, 6])); // 4
console.log("预期: 4");
console.log("组合: (3,4,5), (3,4,6), (3,5,6), (4,5,6)");

console.log("\n测试 5: 包含 0");
console.log("输入: [0, 1, 2, 3]");
console.log("输出:", triangleNumber([0, 1, 2, 3])); // 0
console.log("预期: 0 (包含 0 无法组成三角形)");

console.log("\n测试 6: 边界情况");
console.log("输入: [1, 1, 1]");
console.log("输出:", triangleNumber([1, 1, 1])); // 1
console.log("预期: 1");

console.log("\n测试 7: 大数组");
const largeArray = [7, 0, 0, 0, 10, 15, 20, 25, 30, 35];
console.log("输入:", largeArray);
console.log("输出:", triangleNumber(largeArray));

// ============ 对比测试 ============

console.log("\n========== 解法对比测试 ==========");

const testArray = [2, 2, 3, 4, 5, 6];

console.log("测试数组:", testArray);

console.log("\n解法 1 (双指针):");
console.time("双指针");
const result1 = triangleNumber([...testArray]);
console.timeEnd("双指针");
console.log("结果:", result1);

console.log("\n解法 2 (暴力):");
console.time("暴力");
const result2 = triangleNumberBruteForce([...testArray]);
console.timeEnd("暴力");
console.log("结果:", result2);

console.log("\n解法 3 (排序+剪枝):");
console.time("排序+剪枝");
const result3 = triangleNumberOptimized([...testArray]);
console.timeEnd("排序+剪枝");
console.log("结果:", result3);

console.log("\n解法 4 (二分查找):");
console.time("二分查找");
const result4 = triangleNumberBinarySearch([...testArray]);
console.timeEnd("二分查找");
console.log("结果:", result4);

console.log(
  "\n所有解法结果是否一致:",
  result1 === result2 && result2 === result3 && result3 === result4
);

// ============ 图解示例 ============

/**
 * 以 [2, 2, 3, 4] 为例，解法 1 的执行过程：
 *
 * 排序后: [2, 2, 3, 4]
 *
 * i=3 (nums[i]=4, 最大边):
 *   left=0, right=2: nums[0] + nums[2] = 2 + 3 = 5 > 4 ✅
 *     count += 2 - 0 = 2  （组合: (2,2,4), (2,3,4)）
 *     right = 1
 *   left=0, right=1: nums[0] + nums[1] = 2 + 2 = 4 > 4 ❌
 *     left = 1
 *   left=1, right=1: left == right，退出
 *
 * i=2 (nums[i]=3, 最大边):
 *   left=0, right=1: nums[0] + nums[1] = 2 + 2 = 4 > 3 ✅
 *     count += 1 - 0 = 1  （组合: (2,2,3)）
 *     right = 0
 *   left=0, right=0: left == right，退出
 *
 * i=1: left=0, right=0，直接跳过
 *
 * 总计: count = 2 + 1 = 3
 */

// ============ 详细步骤追踪版本 ============

function triangleNumberWithLog(nums: number[]): number {
  if (nums.length < 3) return 0;

  nums.sort((a, b) => a - b);
  console.log("\n排序后数组:", nums);

  let count = 0;
  const triangles: number[][] = []; // 记录所有三角形

  for (let i = nums.length - 1; i >= 2; i--) {
    console.log(`\n固定最大边 nums[${i}] = ${nums[i]}`);

    let left = 0;
    let right = i - 1;

    while (left < right) {
      const sum = nums[left] + nums[right];
      const max = nums[i];

      console.log(
        `  检查: nums[${left}](${nums[left]}) + nums[${right}](${nums[right]}) = ${sum} vs ${max}`
      );

      if (sum > max) {
        // 找到 (right - left) 个三角形
        const foundCount = right - left;
        console.log(`    ✅ ${sum} > ${max}, 找到 ${foundCount} 个三角形`);

        // 记录这些三角形
        for (let k = left; k < right; k++) {
          triangles.push([nums[k], nums[right], nums[i]]);
        }

        count += foundCount;
        right--;
      } else {
        console.log(`    ❌ ${sum} <= ${max}, left++`);
        left++;
      }
    }
  }

  console.log("\n所有三角形:");
  triangles.forEach((tri, idx) => {
    console.log(`  ${idx + 1}. (${tri[0]}, ${tri[1]}, ${tri[2]})`);
  });

  return count;
}

// 测试详细追踪版本
console.log("\n========== 详细执行过程演示 ==========");
const demoResult = triangleNumberWithLog([2, 2, 3, 4]);
console.log("\n最终结果:", demoResult);

// ============ 边界情况测试 ============

console.log("\n========== 边界情况测试 ==========");

console.log("\n测试: 空数组");
console.log("输入: []");
console.log("输出:", triangleNumber([])); // 0

console.log("\n测试: 1 个元素");
console.log("输入: [5]");
console.log("输出:", triangleNumber([5])); // 0

console.log("\n测试: 2 个元素");
console.log("输入: [3, 4]");
console.log("输出:", triangleNumber([3, 4])); // 0

console.log("\n测试: 恰好 3 个元素（能组成）");
console.log("输入: [3, 4, 5]");
console.log("输出:", triangleNumber([3, 4, 5])); // 1

console.log("\n测试: 恰好 3 个元素（不能组成）");
console.log("输入: [1, 2, 5]");
console.log("输出:", triangleNumber([1, 2, 5])); // 0

console.log("\n测试: 所有元素相等");
console.log("输入: [5, 5, 5, 5]");
console.log("输出:", triangleNumber([5, 5, 5, 5])); // 4
console.log("说明: C(4,3) = 4 种组合");

console.log("\n测试: 包含重复值");
console.log("输入: [2, 2, 2, 3, 3, 4]");
console.log("输出:", triangleNumber([2, 2, 2, 3, 3, 4]));

// ============ 性能测试 ============

console.log("\n========== 性能测试 ==========");

// 生成测试数据
function generateTestData(size: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < size; i++) {
    arr.push(Math.floor(Math.random() * 100) + 1);
  }
  return arr;
}

const testData = generateTestData(100);

console.log(`测试数组大小: ${testData.length}`);

console.log("\n双指针解法:");
console.time("双指针");
const optimizedResult = triangleNumber([...testData]);
console.timeEnd("双指针");
console.log("三角形数量:", optimizedResult);

console.log("\n暴力解法:");
console.time("暴力");
const bruteResult = triangleNumberBruteForce([...testData]);
console.timeEnd("暴力");
console.log("三角形数量:", bruteResult);

console.log("\n结果是否一致:", optimizedResult === bruteResult);

// ============ 辅助函数：验证三角形 ============

/**
 * 验证三条边能否组成三角形
 */
function isValidTriangle(a: number, b: number, c: number): boolean {
  return a + b > c && a + c > b && b + c > a;
}

/**
 * 获取所有可能的三角形组合
 */
function getAllTriangles(nums: number[]): number[][] {
  const triangles: number[][] = [];

  for (let i = 0; i < nums.length - 2; i++) {
    for (let j = i + 1; j < nums.length - 1; j++) {
      for (let k = j + 1; k < nums.length; k++) {
        if (isValidTriangle(nums[i], nums[j], nums[k])) {
          triangles.push([nums[i], nums[j], nums[k]]);
        }
      }
    }
  }

  return triangles;
}

// 测试辅助函数
console.log("\n========== 获取所有三角形组合 ==========");
const testArr = [2, 2, 3, 4];
console.log("输入:", testArr);
const allTriangles = getAllTriangles(testArr);
console.log("所有三角形:");
allTriangles.forEach((tri, idx) => {
  console.log(`  ${idx + 1}. (${tri[0]}, ${tri[1]}, ${tri[2]})`);
});
console.log("总数:", allTriangles.length);

// ============ 关键点总结 ============

/**
 * 核心知识点：
 *
 * 1. 三角形成立条件：
 *    任意两边之和大于第三边
 *    a + b > c && a + c > b && b + c > a
 *
 * 2. 优化技巧：
 *    排序后，如果 a ≤ b ≤ c
 *    只需检查 a + b > c（其他两个条件自动满足）
 *
 * 3. 双指针技巧：
 *    固定最大边 c
 *    用双指针在 [0, c-1] 范围内找满足条件的 (a, b)
 *    如果 a + b > c，则 [a, b-1] 都满足
 *
 * 4. 时间复杂度对比：
 *    - 暴力：O(n³)
 *    - 二分优化：O(n² log n)
 *    - 双指针：O(n²) ⭐ 最优
 *
 * 5. 关键优化：
 *    当 nums[left] + nums[right] > nums[i] 时
 *    [left, right-1] 之间的所有索引都满足
 *    一次性计数，避免逐个枚举
 */

// ============ 类似题目 ============

/**
 * 相关 LeetCode 题目：
 *
 * 1. LeetCode 611: Valid Triangle Number（本题）
 * 2. LeetCode 15: 3Sum
 * 3. LeetCode 16: 3Sum Closest
 * 4. LeetCode 18: 4Sum
 *
 * 共同点：
 * - 都可以用排序 + 双指针优化
 * - 时间复杂度从 O(n³) 降到 O(n²)
 */

export {
  triangleNumber,
  triangleNumberBruteForce,
  triangleNumberOptimized,
  triangleNumberBinarySearch,
  isValidTriangle,
  getAllTriangles,
};
