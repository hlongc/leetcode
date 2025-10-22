/*
 * @lc app=leetcode.cn id=729 lang=typescript
 *
 * [729] 我的日程安排表 I
 *
 * https://leetcode.cn/problems/my-calendar-i/description/
 *
 * algorithms
 * Medium (59.39%)
 * Likes:    343
 * Dislikes: 0
 * Total Accepted:    76.9K
 * Total Submissions: 129.5K
 * Testcase Example:  '["MyCalendar","book","book","book"]\n[[],[10,20],[15,25],[20,30]]'
 *
 * 实现一个 MyCalendar 类来存放你的日程安排。如果要添加的日程安排不会造成 重复预订 ，则可以存储这个新的日程安排。
 *
 * 当两个日程安排有一些时间上的交叉时（例如两个日程安排都在同一时间内），就会产生 重复预订 。
 *
 * 日程可以用一对整数 startTime 和 endTime 表示，这里的时间是半开区间，即 [startTime, endTime), 实数 x
 * 的范围为，  startTime <= x < endTime 。
 *
 * 实现 MyCalendar 类：
 *
 *
 * MyCalendar() 初始化日历对象。
 * boolean book(int startTime, int endTime) 如果可以将日程安排成功添加到日历中而不会导致重复预订，返回 true
 * 。否则，返回 false 并且不要将该日程安排添加到日历中。
 *
 *
 *
 *
 * 示例：
 *
 *
 * 输入：
 * ["MyCalendar", "book", "book", "book"]
 * [[], [10, 20], [15, 25], [20, 30]]
 * 输出：
 * [null, true, false, true]
 *
 * 解释：
 * MyCalendar myCalendar = new MyCalendar();
 * myCalendar.book(10, 20); // return True
 * myCalendar.book(15, 25); // return False ，这个日程安排不能添加到日历中，因为时间 15
 * 已经被另一个日程安排预订了。
 * myCalendar.book(20, 30); // return True ，这个日程安排可以添加到日历中，因为第一个日程安排预订的每个时间都小于
 * 20 ，且不包含时间 20 。
 *
 *
 *
 * 提示：
 *
 *
 * 0 <= start < end <= 10^9
 * 每个测试用例，调用 book 方法的次数最多不超过 1000 次。
 *
 *
 */

// @lc code=start

/**
 * 解法一：暴力法 - 数组存储（最直观）
 *
 * 核心思路：
 * 1. 用数组存储所有已预订的日程 [start, end)
 * 2. 每次预订时，遍历所有已存在的日程，检查是否有冲突
 * 3. 如果没有冲突，将新日程添加到数组
 *
 * 区间冲突判断（重要！）：
 * 两个区间 [start1, end1) 和 [start2, end2) 有冲突的条件：
 *   max(start1, start2) < min(end1, end2)
 *
 * 或者用更直观的方式：
 *   !(end1 <= start2 || end2 <= start1)  // 不满足"完全不重叠"
 *
 * 不重叠的条件（满足任意一个即可）：
 *   - end1 <= start2  （区间1在区间2左侧）
 *   - end2 <= start1  （区间2在区间1左侧）
 *
 * 时间复杂度：
 *   - book: O(n)，n 为已预订的日程数量
 * 空间复杂度：O(n)
 */
class MyCalendar {
  private events: [number, number][]; // 存储所有已预订的日程 [start, end)

  constructor() {
    this.events = [];
  }

  book(startTime: number, endTime: number): boolean {
    // 遍历所有已预订的日程，检查是否有冲突
    for (const [start, end] of this.events) {
      // 判断是否有重叠：max(start1, start2) < min(end1, end2)
      if (Math.max(startTime, start) < Math.min(endTime, end)) {
        return false; // 有冲突，预订失败
      }

      // 或者用另一种写法（更直观）：
      // if (!(endTime <= start || end <= startTime)) {
      //   return false; // 不满足"完全不重叠"，说明有冲突
      // }
    }

    // 没有冲突，添加新日程
    this.events.push([startTime, endTime]);
    return true;
  }
}

/**
 * 解法二：有序数组 + 二分查找（优化查找）
 *
 * 核心思路：
 * 1. 维护一个按开始时间排序的数组
 * 2. 使用二分查找找到插入位置
 * 3. 只需要检查前后两个区间是否冲突
 *
 * 优化点：
 * - 不需要遍历所有区间，只检查相邻区间
 * - 查找用二分，插入用 splice
 *
 * 时间复杂度：
 *   - book: O(n)，二分查找 O(log n)，插入 O(n)
 * 空间复杂度：O(n)
 */
class MyCalendar_v2 {
  private events: [number, number][];

  constructor() {
    this.events = [];
  }

  book(startTime: number, endTime: number): boolean {
    // 使用二分查找找到插入位置
    let left = 0;
    let right = this.events.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.events[mid][0] < startTime) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    // left 是插入位置
    // 检查前一个区间（如果存在）
    if (left > 0) {
      const [prevStart, prevEnd] = this.events[left - 1];
      if (prevEnd > startTime) {
        return false; // 与前一个区间冲突
      }
    }

    // 检查后一个区间（如果存在）
    if (left < this.events.length) {
      const [nextStart, nextEnd] = this.events[left];
      if (endTime > nextStart) {
        return false; // 与后一个区间冲突
      }
    }

    // 没有冲突，插入新区间
    this.events.splice(left, 0, [startTime, endTime]);
    return true;
  }
}

/**
 * 解法三：TreeMap 模拟（最优解 - 如果有 TreeMap）
 *
 * 核心思路：
 * 1. 使用 Map 存储日程（虽然 JS 的 Map 不是有序的，但可以手动维护）
 * 2. 利用有序性快速找到可能冲突的区间
 *
 * 注意：JavaScript 的 Map 保持插入顺序，不是按 key 排序的
 * 这里我们使用数组模拟有序的特性
 *
 * 时间复杂度：O(log n) + O(1) = O(log n) （如果有真正的 TreeMap）
 * 空间复杂度：O(n)
 */
class MyCalendar_v3 {
  private calendar: Map<number, number>; // key: startTime, value: endTime
  private sortedStarts: number[]; // 维护排序的开始时间

  constructor() {
    this.calendar = new Map();
    this.sortedStarts = [];
  }

  book(startTime: number, endTime: number): boolean {
    // 二分查找插入位置
    const idx = this.binarySearch(startTime);

    // 检查前一个区间
    if (idx > 0) {
      const prevStart = this.sortedStarts[idx - 1];
      const prevEnd = this.calendar.get(prevStart)!;
      if (prevEnd > startTime) {
        return false;
      }
    }

    // 检查后一个区间
    if (idx < this.sortedStarts.length) {
      const nextStart = this.sortedStarts[idx];
      if (endTime > nextStart) {
        return false;
      }
    }

    // 插入新区间
    this.sortedStarts.splice(idx, 0, startTime);
    this.calendar.set(startTime, endTime);
    return true;
  }

  private binarySearch(target: number): number {
    let left = 0;
    let right = this.sortedStarts.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.sortedStarts[mid] < target) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }
}

/**
 * Your MyCalendar object will be instantiated and called as such:
 * var obj = new MyCalendar()
 * var param_1 = obj.book(startTime,endTime)
 */
// @lc code=end

/* 
测试用例详解：

示例 1：
["MyCalendar", "book", "book", "book"]
[[], [10, 20], [15, 25], [20, 30]]

执行过程：
1. new MyCalendar()
   events = []

2. book(10, 20)
   - events 为空，直接添加
   - events = [[10, 20]]
   - 返回 true

3. book(15, 25)
   - 检查 [10, 20] 和 [15, 25] 是否冲突
   - max(10, 15) = 15 < min(20, 25) = 20 ✅ 有冲突
   - 返回 false
   - events 不变 = [[10, 20]]

4. book(20, 30)
   - 检查 [10, 20] 和 [20, 30] 是否冲突
   - max(10, 20) = 20 < min(20, 30) = 20 ❌ 不成立（20 不小于 20）
   - 没有冲突，添加
   - events = [[10, 20], [20, 30]]
   - 返回 true

---

区间冲突判断图解：

情况1：完全不重叠（左侧）
[----A----)
             [----B----)
end_A <= start_B  ✅ 不冲突

情况2：完全不重叠（右侧）
             [----A----)
[----B----)
end_B <= start_A  ✅ 不冲突

情况3：部分重叠
[----A----)
     [----B----)
max(start_A, start_B) < min(end_A, end_B)  ❌ 冲突

情况4：完全包含
[----A---------)
   [--B--)
max(start_A, start_B) < min(end_A, end_B)  ❌ 冲突

情况5：边界相接（半开区间）
[----A----)
          [----B----)
end_A == start_B  ✅ 不冲突（因为是半开区间 [start, end)）

---

关键点总结：

1. **半开区间**：[start, end) 不包含 end
   - [10, 20) 和 [20, 30) 不冲突
   - [10, 20) 和 [15, 25) 冲突

2. **冲突判断公式**：
   - 方法1: max(start1, start2) < min(end1, end2)
   - 方法2: !(end1 <= start2 || end2 <= start1)

3. **解法选择**：
   - 简单场景：用解法一（暴力法）
   - 大量预订：用解法二或三（有序数组 + 二分）
   - 实际项目：可以用数据库索引或专门的区间树

4. **时间复杂度对比**：
   - 解法一：O(n) 查询
   - 解法二/三：O(log n) 查找 + O(n) 插入 = O(n)
   - 理论最优：O(log n) （需要平衡树）

5. **边界情况**：
   - 空日程表：直接返回 true
   - 单个预订：直接返回 true
   - 边界相接：不算冲突（半开区间的特性）
*/
