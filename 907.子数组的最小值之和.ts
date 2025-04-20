/*
 * @lc app=leetcode.cn id=907 lang=typescript
 *
 * [907] 子数组的最小值之和
 */

// @lc code=start

/**
 * 计算所有子数组的最小值之和
 *
 * 优化思路：
 * 1. 使用单调栈找出每个元素作为最小值的子数组范围
 * 2. 对于每个元素，计算以它为最小值的所有子数组的贡献
 *
 * 时间复杂度：O(n)，其中n是数组长度
 * 空间复杂度：O(n)，用于存储单调栈
 *
 * @param arr 输入数组
 * @returns 所有子数组最小值之和
 */
function sumSubarrayMins1(arr: number[]): number {
  const MOD = 10 ** 9 + 7;
  const n = arr.length;

  // 存储每个元素左边第一个比它小的元素的位置
  const left: number[] = new Array(n).fill(-1);
  // 存储每个元素右边第一个比它小的元素的位置
  const right: number[] = new Array(n).fill(n);

  // 单调递增栈
  const stack: number[] = [];

  // 计算每个元素左边第一个比它小的元素位置
  for (let i = 0; i < n; i++) {
    // 当栈不为空且当前元素小于等于栈顶元素时，弹出栈顶
    while (stack.length > 0 && arr[stack[stack.length - 1]] >= arr[i]) {
      stack.pop();
    }
    // 如果栈不为空，栈顶元素就是左边第一个比当前元素小的元素
    if (stack.length > 0) {
      left[i] = stack[stack.length - 1];
    }
    // 将当前元素索引入栈
    stack.push(i);
  }

  // 清空栈，用于计算右边界
  stack.length = 0;

  // 计算每个元素右边第一个比它小的元素位置
  for (let i = n - 1; i >= 0; i--) {
    // 注意这里使用 > 而不是 >=，处理相等元素时保证不重复计算
    while (stack.length > 0 && arr[stack[stack.length - 1]] > arr[i]) {
      stack.pop();
    }
    if (stack.length > 0) {
      right[i] = stack[stack.length - 1];
    }
    stack.push(i);
  }

  let sum = 0;

  // 计算每个元素的贡献
  for (let i = 0; i < n; i++) {
    // 以arr[i]为最小值的子数组数量 = 左边界数量 * 右边界数量
    // 左边界数量 = i - left[i]
    // 右边界数量 = right[i] - i
    const contribution =
      ((((i - left[i]) * (right[i] - i)) % MOD) * arr[i]) % MOD;
    sum = (sum + contribution) % MOD;
  }

  return sum;
}

/**
 * 计算所有子数组的最小值之和
 *
 * 优化思路：使用单调栈找出每个元素作为最小值的贡献范围
 * 时间复杂度：O(n)，其中n是数组长度
 * 空间复杂度：O(n)，用于存储单调栈
 */
function sumSubarrayMins(arr: number[]): number {
  const MOD = 1e9 + 7;
  const n = arr.length;
  let sum = 0;
  const stack: number[] = [];

  // 通过一次遍历计算每个元素的贡献
  // 我们扩展数组两端，便于处理边界情况
  for (let i = 0; i <= n; i++) {
    // 当栈不为空，且当前元素小于栈顶元素或已到达数组末尾时
    // 栈顶元素可以确定其作为最小值的范围了
    while (
      stack.length > 0 &&
      (i === n || arr[stack[stack.length - 1]] >= arr[i])
    ) {
      // 弹出栈顶元素，这个元素将作为一些子数组的最小值
      const mid = stack.pop()!;

      // 确定左边界：栈顶元素的下一个位置或-1
      const left = stack.length ? stack[stack.length - 1] : -1;

      // 确定右边界：当前遍历到的位置
      const right = i;

      // 计算贡献：元素值 × 左边界数量 × 右边界数量
      // 左边界数量：mid - left
      // 右边界数量：right - mid
      const contribution =
        ((((mid - left) * (right - mid)) % MOD) * arr[mid]) % MOD;

      // 累加到结果中
      sum = (sum + contribution) % MOD;
    }

    // 将当前元素索引入栈
    if (i < n) {
      stack.push(i);
    }
  }

  return sum;
}
/**
 * 示例说明（arr = [3,1,2,4]）：
 *
 * 遍历过程：
 * i=0: 栈=[]，3入栈 -> 栈=[0]
 * i=1: arr[0]=3 > arr[1]=1，0出栈，计算贡献：(0-(-1))*(1-0)*3 = 3
 *      1入栈 -> 栈=[1]
 * i=2: arr[1]=1 < arr[2]=2，2入栈 -> 栈=[1,2]
 * i=3: arr[2]=2 < arr[3]=4，4入栈 -> 栈=[1,2,3]
 * i=4: 数组结束，依次计算栈中元素贡献：
 *      3出栈，计算贡献：(3-2)*(4-3)*4 = 4
 *      2出栈，计算贡献：(2-1)*(4-2)*2 = 4
 *      1出栈，计算贡献：(1-(-1))*(4-1)*1 = 6
 *
 * 总和 = 3 + 4 + 4 + 6 = 17
 */
// @lc code=end
