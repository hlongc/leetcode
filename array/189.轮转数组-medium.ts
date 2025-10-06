/*
 * @lc app=leetcode.cn id=189 lang=typescript
 *
 * [189] 轮转数组
 *
 * https://leetcode.cn/problems/rotate-array/description/
 *
 * algorithms
 * Medium (47.27%)
 * Likes:    2444
 * Dislikes: 0
 * Total Accepted:    1.3M
 * Total Submissions: 2.8M
 * Testcase Example:  '[1,2,3,4,5,6,7]\n3'
 *
 * 给定一个整数数组 nums，将数组中的元素向右轮转 k 个位置，其中 k 是非负数。
 *
 *
 *
 * 示例 1:
 *
 *
 * 输入: nums = [1,2,3,4,5,6,7], k = 3
 * 输出: [5,6,7,1,2,3,4]
 * 解释:
 * 向右轮转 1 步: [7,1,2,3,4,5,6]
 * 向右轮转 2 步: [6,7,1,2,3,4,5]
 * 向右轮转 3 步: [5,6,7,1,2,3,4]
 *
 *
 * 示例 2:
 *
 *
 * 输入：nums = [-1,-100,3,99], k = 2
 * 输出：[3,99,-1,-100]
 * 解释:
 * 向右轮转 1 步: [99,-1,-100,3]
 * 向右轮转 2 步: [3,99,-1,-100]
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 10^5
 * -2^31 <= nums[i] <= 2^31 - 1
 * 0 <= k <= 10^5
 *
 *
 *
 *
 * 进阶：
 *
 *
 * 尽可能想出更多的解决方案，至少有 三种 不同的方法可以解决这个问题。
 * 你可以使用空间复杂度为 O(1) 的 原地 算法解决这个问题吗？
 *
 *
 */

// @lc code=start
/**
 Do not return anything, modify nums in-place instead.
 */
function rotate(nums: number[], k: number): void {
  // 方法1: 使用额外数组 (时间复杂度O(n), 空间复杂度O(n))
  // rotateWithExtraArray(nums, k);

  // 方法2: 多次反转 (时间复杂度O(n), 空间复杂度O(1)) - 推荐
  rotateWithReverse(nums, k);

  // 方法3: 环状替换 (时间复杂度O(n), 空间复杂度O(1))
  // rotateWithCycle(nums, k);

  // 方法4: 暴力轮转 (时间复杂度O(n*k), 空间复杂度O(1))
  // rotateBruteForce(nums, k);
}

/**
 * 方法1: 使用额外数组
 * 时间复杂度: O(n)
 * 空间复杂度: O(n)
 * 思路: 创建一个新数组，将原数组的元素按轮转后的位置放入新数组
 */
function rotateWithExtraArray(nums: number[], k: number): void {
  const n = nums.length;
  k = k % n; // 处理k大于数组长度的情况

  const result = new Array(n);

  // 将原数组元素按轮转后的位置放入新数组
  for (let i = 0; i < n; i++) {
    result[(i + k) % n] = nums[i];
  }

  // 将结果复制回原数组
  for (let i = 0; i < n; i++) {
    nums[i] = result[i];
  }
}

/**
 * 方法2: 多次反转 (推荐方法)
 * 时间复杂度: O(n)
 * 空间复杂度: O(1)
 * 思路: 通过三次反转实现轮转
 *
 * 核心思想：
 * 轮转数组可以分解为两个部分：前n-k个元素和后k个元素
 * 轮转后，后k个元素会移到前面，前n-k个元素会移到后面
 *
 * 数学原理：
 * 假设原数组为 [A, B]，其中A是前n-k个元素，B是后k个元素
 * 轮转k位后应该变成 [B, A]
 *
 * 通过三次反转实现：
 * 1. 反转整个数组：[A, B] -> [B', A']  (B'表示B的反转，A'表示A的反转)
 * 2. 反转前k个元素：[B', A'] -> [B, A']  (将B'反转为B)
 * 3. 反转后n-k个元素：[B, A'] -> [B, A]  (将A'反转为A)
 *
 * 例子：nums = [1,2,3,4,5,6,7], k = 3
 * 目标：将后3个元素[5,6,7]移到前面，前4个元素[1,2,3,4]移到后面
 * 结果应该是：[5,6,7,1,2,3,4]
 *
 * 详细步骤：
 * 初始数组：[1,2,3,4,5,6,7]
 * A = [1,2,3,4] (前4个元素)
 * B = [5,6,7]   (后3个元素)
 *
 * 步骤1: 反转整个数组 [1,2,3,4,5,6,7] -> [7,6,5,4,3,2,1]
 *        现在数组变成：[B', A'] = [7,6,5,4,3,2,1]
 *
 * 步骤2: 反转前k=3个元素 [7,6,5,4,3,2,1] -> [5,6,7,4,3,2,1]
 *        现在数组变成：[B, A'] = [5,6,7,4,3,2,1]
 *
 * 步骤3: 反转后n-k=4个元素 [5,6,7,4,3,2,1] -> [5,6,7,1,2,3,4]
 *        现在数组变成：[B, A] = [5,6,7,1,2,3,4]
 *
 * 最终结果：[5,6,7,1,2,3,4] ✅
 *
 * 图解说明：
 *
 * 原数组：[1,2,3,4,5,6,7]
 * 分割：  [1,2,3,4] [5,6,7]
 *         A部分      B部分
 *
 * 目标：  [5,6,7,1,2,3,4]
 * 分割：  [5,6,7] [1,2,3,4]
 *         B部分    A部分
 *
 * 三次反转过程：
 *
 * 步骤1: 反转整个数组
 * [1,2,3,4,5,6,7] -> [7,6,5,4,3,2,1]
 *  A     B            B'    A'
 *
 * 步骤2: 反转前k=3个元素
 * [7,6,5,4,3,2,1] -> [5,6,7,4,3,2,1]
 *  B'    A'           B     A'
 *
 * 步骤3: 反转后n-k=4个元素
 * [5,6,7,4,3,2,1] -> [5,6,7,1,2,3,4]
 *  B     A'           B     A
 *
 * 完成！现在B在前，A在后，实现了轮转效果
 */
function rotateWithReverse(nums: number[], k: number): void {
  const n = nums.length;
  k = k % n; // 处理k大于数组长度的情况，因为轮转n次等于不轮转

  // 步骤1: 反转整个数组
  // 将 [A, B] 变成 [B', A']
  // 例如：[1,2,3,4,5,6,7] -> [7,6,5,4,3,2,1]
  reverse(nums, 0, n - 1);

  // 步骤2: 反转前k个元素
  // 将 B' 反转为 B
  // 例如：[7,6,5,4,3,2,1] -> [5,6,7,4,3,2,1]
  reverse(nums, 0, k - 1);

  // 步骤3: 反转后n-k个元素
  // 将 A' 反转为 A
  // 例如：[5,6,7,4,3,2,1] -> [5,6,7,1,2,3,4]
  reverse(nums, k, n - 1);
}

/**
 * 辅助函数: 反转数组中指定范围的元素
 *
 * 参数：
 * - nums: 要操作的数组
 * - start: 反转范围的起始位置（包含）
 * - end: 反转范围的结束位置（包含）
 *
 * 算法：使用双指针从两端向中间移动，交换元素
 *
 * 例子：reverse([1,2,3,4,5], 1, 3)
 * 初始：[1,2,3,4,5]
 * 步骤1: start=1, end=3, 交换nums[1]和nums[3] -> [1,4,3,2,5]
 * 步骤2: start=2, end=2, 循环结束
 * 结果：[1,4,3,2,5]
 */
function reverse(nums: number[], start: number, end: number): void {
  // 使用双指针从两端向中间移动
  while (start < end) {
    // 交换start和end位置的元素
    [nums[start], nums[end]] = [nums[end], nums[start]];
    // 移动指针
    start++; // 左指针向右移动
    end--; // 右指针向左移动
  }
}

/**
 * 方法3: 环状替换
 * 时间复杂度: O(n)
 * 空间复杂度: O(1)
 * 思路: 将数组看作一个环，每个元素直接移动到其最终位置
 *
 * 核心思想：
 * 1. 数组轮转k位后，原位置i的元素应该移动到位置(i+k)%n
 * 2. 我们可以直接让每个元素移动到其最终位置，而不需要额外的空间
 * 3. 但是直接移动会覆盖目标位置的元素，所以需要保存被覆盖的元素
 * 4. 被覆盖的元素也需要移动到它的最终位置，形成一条"替换链"
 * 5. 当替换链回到起点时，说明这个环上的所有元素都已经正确放置
 *
 * 例子：nums = [1,2,3,4,5,6,7], k = 3
 * 轮转后应该是：[5,6,7,1,2,3,4]
 *
 * 位置映射关系：
 * 0 -> 3, 1 -> 4, 2 -> 5, 3 -> 6, 4 -> 0, 5 -> 1, 6 -> 2
 *
 * 替换过程：
 * 从位置0开始：1 -> 位置3，但位置3的4需要先保存
 * 4 -> 位置6，但位置6的7需要先保存
 * 7 -> 位置2，但位置2的3需要先保存
 * 3 -> 位置5，但位置5的6需要先保存
 * 6 -> 位置1，但位置1的2需要先保存
 * 2 -> 位置4，但位置4的5需要先保存
 * 5 -> 位置0，回到起点，完成一个环
 *
 * 最终结果：[5,6,7,1,2,3,4]
 *
 * 详细步骤演示：
 * 初始数组：[1,2,3,4,5,6,7]
 *
 * 步骤1: start=0, current=0, prev=1
 *   next = (0+3)%7 = 3, temp = nums[3] = 4
 *   nums[3] = 1, prev = 4, current = 3
 *   数组变为：[1,2,3,1,5,6,7] (位置3现在是1)
 *
 * 步骤2: current=3, prev=4
 *   next = (3+3)%7 = 6, temp = nums[6] = 7
 *   nums[6] = 4, prev = 7, current = 6
 *   数组变为：[1,2,3,1,5,6,4] (位置6现在是4)
 *
 * 步骤3: current=6, prev=7
 *   next = (6+3)%7 = 2, temp = nums[2] = 3
 *   nums[2] = 7, prev = 3, current = 2
 *   数组变为：[1,2,7,1,5,6,4] (位置2现在是7)
 *
 * 步骤4: current=2, prev=3
 *   next = (2+3)%7 = 5, temp = nums[5] = 6
 *   nums[5] = 3, prev = 6, current = 5
 *   数组变为：[1,2,7,1,5,3,4] (位置5现在是3)
 *
 * 步骤5: current=5, prev=6
 *   next = (5+3)%7 = 1, temp = nums[1] = 2
 *   nums[1] = 6, prev = 2, current = 1
 *   数组变为：[1,6,7,1,5,3,4] (位置1现在是6)
 *
 * 步骤6: current=1, prev=2
 *   next = (1+3)%7 = 4, temp = nums[4] = 5
 *   nums[4] = 2, prev = 5, current = 4
 *   数组变为：[1,6,7,1,2,3,4] (位置4现在是2)
 *
 * 步骤7: current=4, prev=5
 *   next = (4+3)%7 = 0, temp = nums[0] = 1
 *   nums[0] = 5, prev = 1, current = 0
 *   数组变为：[5,6,7,1,2,3,4] (位置0现在是5)
 *
 * 此时current=0=start，环完成，所有元素都已正确放置！
 */
function rotateWithCycle(nums: number[], k: number): void {
  const n = nums.length;
  k = k % n; // 处理k大于数组长度的情况，因为轮转n次等于不轮转

  let count = 0; // 记录已经移动的元素数量，当count=n时说明所有元素都已正确放置

  // 外层循环：处理不同的替换环
  // 有些情况下，数组可能形成多个独立的替换环
  for (let start = 0; count < n; start++) {
    let current = start; // 当前处理的位置
    let prev = nums[start]; // 保存当前位置的元素，它将被移动到下一个位置

    // 内层循环：处理一个完整的替换环
    do {
      const next = (current + k) % n; // 计算当前位置元素应该移动到的目标位置
      const temp = nums[next]; // 保存目标位置的元素，避免被覆盖

      nums[next] = prev; // 将当前元素移动到目标位置
      prev = temp; // 更新prev为被覆盖的元素，它将成为下一个要移动的元素
      current = next; // 更新当前位置为目标位置
      count++; // 增加已处理元素计数
    } while (start !== current); // 当回到起始位置时，说明这个环已经处理完毕
  }
}

/**
 * 方法4: 暴力轮转
 * 时间复杂度: O(n*k)
 * 空间复杂度: O(1)
 * 思路: 每次向右移动一位，重复k次
 */
function rotateBruteForce(nums: number[], k: number): void {
  const n = nums.length;
  k = k % n;

  for (let i = 0; i < k; i++) {
    // 保存最后一个元素
    const last = nums[n - 1];

    // 将所有元素向右移动一位
    for (let j = n - 1; j > 0; j--) {
      nums[j] = nums[j - 1];
    }

    // 将最后一个元素放到第一位
    nums[0] = last;
  }
}

/**
 * 方法5: 使用JavaScript内置方法 (仅作演示，不符合题目要求)
 * 时间复杂度: O(n)
 * 空间复杂度: O(n)
 */
function rotateWithSplice(nums: number[], k: number): void {
  const n = nums.length;
  k = k % n;

  // 将后k个元素移到前面
  const rotated = nums.splice(n - k, k).concat(nums);

  // 复制回原数组
  for (let i = 0; i < n; i++) {
    nums[i] = rotated[i];
  }
}
// @lc code=end
