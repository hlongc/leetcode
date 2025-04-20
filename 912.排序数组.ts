/*
 * @lc app=leetcode.cn id=912 lang=typescript
 *
 * [912] 排序数组
 *
 * 给你一个整数数组 nums，请你将该数组升序排列。
 * 要求：实现一个时间复杂度为 O(nlogn) 的排序算法。
 */

// @lc code=start
/**
 * 排序数组的主函数
 *
 * 这里我们实现了三种常见的O(nlogn)排序算法：
 * 1. 快速排序 - 平均O(nlogn)，最差O(n²)
 * 2. 归并排序 - 稳定O(nlogn)
 * 3. 堆排序 - 稳定O(nlogn)
 *
 * @param nums 要排序的数组
 * @returns 排序后的数组
 */
function sortArray(nums: number[]): number[] {
  // 在此选择使用快速排序 - 可根据需要替换为其他排序算法
  return quickSort(nums);
  // return mergeSort(nums);
  // return heapSort(nums);
}

/**
 * 快速排序实现
 *
 * 时间复杂度：
 * - 平均情况：O(nlogn)
 * - 最坏情况：O(n²) - 当数组已经排序时
 *
 * 空间复杂度：O(logn) - 递归调用栈的深度
 *
 * 思路：
 * 1. 选择一个基准值（pivot）
 * 2. 将数组分区，小于基准值的放左边，大于基准值的放右边
 * 3. 递归地对左右两个分区进行排序
 *
 * @param nums 要排序的数组
 * @returns 排序后的数组
 */
function quickSort(nums: number[]): number[] {
  // 复制数组，避免修改原数组
  const arr = [...nums];

  // 内部辅助函数，对数组的 [left, right] 部分进行排序
  function _quickSort(arr: number[], left: number, right: number): void {
    // 基本情况：如果左右指针相遇或交叉，结束递归
    if (left >= right) return;

    // 随机选择基准值以避免最坏情况
    const pivotIndex = Math.floor(Math.random() * (right - left + 1)) + left;
    const pivot = arr[pivotIndex];

    // 将基准值交换到末尾
    [arr[pivotIndex], arr[right]] = [arr[right], arr[pivotIndex]];

    // 分区过程
    let i = left; // i指向小于pivot的最后一个元素的位置
    for (let j = left; j < right; j++) {
      if (arr[j] < pivot) {
        // 将小于pivot的元素交换到左侧
        [arr[i], arr[j]] = [arr[j], arr[i]];
        i++;
      }
    }

    // 将基准值放到正确的位置
    [arr[i], arr[right]] = [arr[right], arr[i]];

    // 递归排序左右两个分区
    _quickSort(arr, left, i - 1);
    _quickSort(arr, i + 1, right);
  }

  // 开始排序
  _quickSort(arr, 0, arr.length - 1);
  return arr;
}

/**
 * 归并排序实现
 *
 * 时间复杂度：稳定的O(nlogn)，不受输入数据影响
 * 空间复杂度：O(n) - 需要额外的数组来存储合并结果
 *
 * 思路：
 * 1. 将数组分成两半
 * 2. 递归地对两半进行排序
 * 3. 合并两个已排序的子数组
 *
 * @param nums 要排序的数组
 * @returns 排序后的数组
 */
function mergeSort(nums: number[]): number[] {
  // 复制数组，避免修改原数组
  const arr = [...nums];

  // 如果数组长度小于2，已经排序好
  if (arr.length < 2) return arr;

  // 将数组分成两半
  const mid = Math.floor(arr.length / 2);
  const left = arr.slice(0, mid);
  const right = arr.slice(mid);

  // 递归排序左右两半，然后合并
  return merge(mergeSort(left), mergeSort(right));

  // 合并两个已排序的数组
  function merge(left: number[], right: number[]): number[] {
    const result: number[] = [];
    let i = 0,
      j = 0;

    // 比较两个数组的元素，将较小的放入结果数组
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) {
        result.push(left[i]);
        i++;
      } else {
        result.push(right[j]);
        j++;
      }
    }

    // 将剩余元素添加到结果中
    return result.concat(left.slice(i)).concat(right.slice(j));
  }
}

/**
 * 堆排序实现
 *
 * 时间复杂度：稳定的O(nlogn)
 * 空间复杂度：O(1) - 原地排序
 *
 * 思路：
 * 1. 将数组构建成最大堆
 * 2. 交换堆顶元素（最大值）和最后一个元素
 * 3. 减小堆大小，重新调整堆
 * 4. 重复步骤2-3直到堆大小为1
 *
 * @param nums 要排序的数组
 * @returns 排序后的数组
 */
function heapSort(nums: number[]): number[] {
  // 复制数组，避免修改原数组
  const arr = [...nums];
  const n = arr.length;

  // 构建最大堆
  buildMaxHeap(arr, n);

  // 逐个将最大值（堆顶）移到数组末尾
  for (let i = n - 1; i > 0; i--) {
    // 交换堆顶元素和当前最后一个元素
    [arr[0], arr[i]] = [arr[i], arr[0]];
    // 重新调整堆，不包括已排序的部分
    heapify(arr, 0, i);
  }

  return arr;

  // 构建最大堆
  function buildMaxHeap(arr: number[], n: number): void {
    // 从最后一个非叶子节点开始，自下而上调整堆
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      heapify(arr, i, n);
    }
  }

  // 调整堆，使其满足最大堆性质
  function heapify(arr: number[], i: number, n: number): void {
    const left = 2 * i + 1; // 左子节点
    const right = 2 * i + 2; // 右子节点
    let largest = i; // 假设当前节点是最大的

    // 如果左子节点存在且大于当前最大值
    if (left < n && arr[left] > arr[largest]) {
      largest = left;
    }

    // 如果右子节点存在且大于当前最大值
    if (right < n && arr[right] > arr[largest]) {
      largest = right;
    }

    // 如果最大值不是当前节点，交换并继续调整
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      heapify(arr, largest, n);
    }
  }
}
// @lc code=end
