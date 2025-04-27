/*
 * @lc app=leetcode.cn id=1103 lang=typescript
 *
 * [1103] 分糖果 II
 */

// @lc code=start
/**
 * 按照规则分配糖果给指定数量的小朋友
 * @param candies 糖果的总数量
 * @param num_people 小朋友的数量
 * @return 返回一个数组，表示每个小朋友分到的糖果数量
 */
function distributeCandies(candies: number, num_people: number): number[] {
  // 创建结果数组，初始化每个小朋友的糖果数为0
  const ret: number[] = new Array(num_people).fill(0);

  // index: 当前要分配糖果的小朋友索引
  let index = 0;

  // count: 当前轮次应该分配的糖果数量，从1开始递增
  let count = 1;

  // 当还有糖果可分配时继续循环
  while (candies > 0) {
    // 给当前小朋友分配糖果
    // 如果剩余糖果不足，就把剩余的全部给当前小朋友
    ret[index++] += Math.min(count, candies);

    // 减去已分配的糖果数量
    candies -= count;

    // 下一轮要分配的糖果数量增加1
    count++;

    // 循环分配给所有小朋友，使用取模操作确保索引不越界
    // 当index等于num_people时，重新从0开始
    index = index % num_people;
  }

  // 返回最终每个小朋友获得的糖果数量
  return ret;
}
// @lc code=end
