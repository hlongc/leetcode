/*
 * @lc app=leetcode.cn id=852 lang=typescript
 *
 * [852] 山脉数组的峰顶索引
 *
 * https://leetcode.cn/problems/peak-index-in-a-mountain-array/description/
 *
 * algorithms
 * Medium (68.07%)
 * Likes:    462
 * Dislikes: 0
 * Total Accepted:    199.2K
 * Total Submissions: 292.7K
 * Testcase Example:  '[0,1,0]'
 *
 * 给定一个长度为 n 的整数 山脉 数组 arr ，其中的值递增到一个 峰值元素 然后递减。
 *
 * 返回峰值元素的下标。
 *
 * 你必须设计并实现时间复杂度为 O(log(n)) 的解决方案。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：arr = [0,1,0]
 * 输出：1
 *
 *
 * 示例 2：
 *
 *
 * 输入：arr = [0,2,1,0]
 * 输出：1
 *
 *
 * 示例 3：
 *
 *
 * 输入：arr = [0,10,5,2]
 * 输出：1
 *
 *
 *
 *
 * 提示：
 *
 *
 * 3 <= arr.length <= 10^5
 * 0 <= arr[i] <= 10^6
 * 题目数据 保证 arr 是一个山脉数组
 *
 *
 */

// @lc code=start
/**
 * 【详细解题思路】
 *
 * 1. 问题分析：
 *    什么是山脉数组？
 *    - 数组长度 >= 3
 *    - 存在一个索引 i（峰顶），满足：
 *      arr[0] < arr[1] < ... < arr[i-1] < arr[i]（严格递增）
 *      arr[i] > arr[i+1] > ... > arr[arr.length-1]（严格递减）
 *    - 峰顶左侧严格递增，右侧严格递减
 *
 *    示例：[0, 2, 1, 0]
 *           ↗  ↘
 *         峰顶在索引 1
 *
 * 2. 核心思路 - 二分查找：
 *    要求时间复杂度 O(log n)，提示我们使用二分查找
 *
 *    关键判断：
 *    - 如果 arr[mid] < arr[mid + 1]，说明 mid 在上坡阶段（峰顶在右侧）
 *      → 缩小左边界，向右搜索：left = mid + 1
 *
 *    - 如果 arr[mid] > arr[mid + 1]，说明 mid 在下坡阶段或就是峰顶（峰顶在左侧或当前位置）
 *      → 缩小右边界，向左搜索：right = mid
 *      → 注意这里不能是 mid - 1，因为 mid 本身可能就是峰顶
 *
 *    - 当 left == right 时，找到峰顶
 *
 * 3. 为什么这个方法有效？
 *    山脉数组的特性保证：
 *    - 只有一个峰顶
 *    - 峰顶左侧严格递增
 *    - 峰顶右侧严格递减
 *
 *    二分查找过程：
 *    - 每次都能确定峰顶在 mid 的哪一侧
 *    - 不断缩小搜索范围
 *    - 最终 left 和 right 会收敛到峰顶位置
 *
 * 4. 举例说明：
 *    arr = [0, 2, 5, 3, 1]，峰顶在索引 2
 *
 *    初始：left = 0, right = 4
 *
 *    第1轮：mid = 2
 *           arr[2] = 5, arr[3] = 3
 *           arr[mid] > arr[mid + 1] → 在下坡或峰顶
 *           right = mid = 2
 *           left = 0, right = 2
 *
 *    第2轮：mid = 1
 *           arr[1] = 2, arr[2] = 5
 *           arr[mid] < arr[mid + 1] → 在上坡
 *           left = mid + 1 = 2
 *           left = 2, right = 2
 *
 *    结束：left == right == 2，返回 2 ✓
 *
 * 5. 时间复杂度：O(log n)
 *    每次循环将搜索范围减半
 *
 * 6. 空间复杂度：O(1)
 *    只使用了常数个变量
 *
 * 【常见疑问解答】
 *
 * Q1: 为什么循环条件是 left < right 而不是 left <= right？
 * A1: 这是关键！我们来对比两种方式：
 *
 *     方式1：while (left < right)  ✓ 正确
 *     - 循环结束条件：left == right
 *     - 此时 left 和 right 指向同一个位置，这就是峰顶
 *     - 搜索区间从 [left, right] 逐渐缩小到只剩一个元素
 *
 *     方式2：while (left <= right)  ✗ 在此题中不适用
 *     - 循环结束条件：left > right
 *     - 这种方式适用于"精确查找某个值"的场景
 *     - 但本题是"查找峰顶位置"，不需要判断 left > right 的情况
 *
 *     举例说明：arr = [0, 2, 1]
 *
 *     使用 left < right：
 *     初始：left=0, right=2
 *     第1轮：mid=1, arr[1]=2 > arr[2]=1 → right=1
 *           left=0, right=1
 *     第2轮：mid=0, arr[0]=0 < arr[1]=2 → left=1
 *           left=1, right=1 → 退出循环，返回1 ✓
 *
 *     使用 left <= right：
 *     前两轮同上...
 *     第3轮：left=1, right=1, mid=1
 *           arr[1]=2 > arr[2]=1 → right=1
 *           left=1, right=1 → 陷入死循环！✗
 *
 * Q2: 为什么退出循环时 left 一定是峰顶？
 * A2: 这需要用到"循环不变量"的思想来证明：
 *
 *     循环不变量：在每次循环中，峰顶一定在 [left, right] 区间内
 *
 *     证明过程：
 *     ① 初始状态：left=0, right=n-1
 *        峰顶在 [0, n-1] 内 ✓（题目保证）
 *
 *     ② 保持不变性：每次循环后，峰顶仍在 [left, right] 内
 *        - 情况1：arr[mid] < arr[mid+1]（上坡）
 *          说明峰顶在 mid 右侧（因为 mid 还在上升）
 *          所以 left = mid + 1，峰顶在 [mid+1, right] 内 ✓
 *
 *        - 情况2：arr[mid] > arr[mid+1]（下坡或峰顶）
 *          说明峰顶在 mid 或 mid 左侧（mid 已经开始下降或就是顶点）
 *          所以 right = mid，峰顶在 [left, mid] 内 ✓
 *
 *     ③ 终止状态：left == right
 *        由于峰顶始终在 [left, right] 内
 *        当区间缩小到只剩一个元素时（left == right）
 *        这个元素就是峰顶！✓
 *
 *     图示理解（arr = [0, 2, 5, 3, 1]，峰顶在索引2）：
 *
 *     初始：[0, 2, 5, 3, 1]    峰顶在 [0, 4] ✓
 *            ↑        ↑
 *           left    right
 *
 *     第1轮：[0, 2, 5, 3, 1]    mid=2，下坡 → 峰顶在 [0, 2] ✓
 *            ↑     ↑
 *           left right
 *
 *     第2轮：[0, 2, 5, 3, 1]    mid=1，上坡 → 峰顶在 [2, 2] ✓
 *                  ↑
 *              left=right
 *
 *     结束：left == right == 2，峰顶找到！
 */
function peakIndexInMountainArray(arr: number[]): number {
  // 初始化左右边界
  let left = 0;
  let right = arr.length - 1;

  // 【循环条件：left < right】
  // 为什么不是 left <= right？
  // 因为我们要找的是峰顶的"位置"，不是判断某个值是否存在
  // 当 left == right 时，区间只剩一个元素，这就是峰顶
  // 如果用 left <= right，当 left == right 时还会继续循环，可能导致死循环
  while (left < right) {
    // 计算中点，使用位运算优化性能
    // (right - left) >> 1 等价于 Math.floor((right - left) / 2)
    const mid = left + ((right - left) >> 1);

    // 【关键判断】比较 mid 和 mid + 1 的大小关系

    // 情况1：arr[mid] < arr[mid + 1]（上坡阶段）
    // 说明 mid 处于上坡阶段，峰顶在右侧
    // 例如：[0, 1, 2, 5, 3]，mid=1 时，arr[1]=1 < arr[2]=2
    //       ↗ ↗ ↗ ↘      峰顶在右边
    if (arr[mid] < arr[mid + 1]) {
      // 峰顶在 [mid + 1, right] 区间
      // mid 一定不是峰顶（因为右边还有更大的值），所以 left = mid + 1
      // 注意：这里必须是 mid + 1，不能是 mid（否则区间不会缩小）
      left = mid + 1;
    }
    // 情况2：arr[mid] > arr[mid + 1]（下坡阶段或峰顶）
    // 说明 mid 处于下坡阶段或就是峰顶，峰顶在左侧或当前位置
    // 例如：[0, 1, 5, 2, 1]，mid=3 时，arr[3]=2 > arr[4]=1
    //       ↗ ↗ ↘ ↘      峰顶在左边（包括mid可能的位置）
    else {
      // 峰顶在 [left, mid] 区间
      // mid 可能是峰顶，所以 right = mid（不能是 mid - 1）
      // 注意：这里不能 right = mid - 1，因为 mid 本身可能就是峰顶
      right = mid;
    }
  }

  // 【为什么退出循环时 left 就是峰顶？】
  // 因为循环不变量保证了：峰顶始终在 [left, right] 区间内
  // 当 left == right 时，区间缩小到只剩一个元素
  // 这个元素既在区间内，又是唯一的元素，所以它就是峰顶！
  //
  // 严格来说，返回 left 或 right 都可以，因为此时 left == right
  return left;
}
// @lc code=end
