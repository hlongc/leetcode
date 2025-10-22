/*
 * @lc app=leetcode.cn id=777 lang=typescript
 *
 * [777] 在 LR 字符串中交换相邻字符
 *
 * https://leetcode.cn/problems/swap-adjacent-in-lr-string/description/
 *
 * algorithms
 * Medium (39.39%)
 * Likes:    302
 * Dislikes: 0
 * Total Accepted:    31.9K
 * Total Submissions: 80.9K
 * Testcase Example:  '"RXXLRXRXL"\n"XRLXXRRLX"'
 *
 * 在一个由 'L' , 'R' 和 'X' 三个字符组成的字符串（例如"RXXLRXRXL"）中进行移动操作。一次移动操作指用一个 "LX" 替换一个
 * "XL"，或者用一个 "XR" 替换一个 "RX"。现给定起始字符串 start 和结束字符串 result，请编写代码，当且仅当存在一系列移动操作使得
 * start 可以转换成 result 时， 返回 True。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：start = "RXXLRXRXL", result = "XRLXXRRLX"
 * 输出：true
 * 解释：通过以下步骤我们可以将 start 转化为 result：
 * RXXLRXRXL ->
 * XRXLRXRXL ->
 * XRLXRXRXL ->
 * XRLXXRRXL ->
 * XRLXXRRLX
 *
 *
 * 示例 2：
 *
 *
 * 输入：start = "X", result = "L"
 * 输出：false
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= start.length <= 10^4
 * start.length == result.length
 * start 和 result 都只包含 'L', 'R' 或 'X'。
 *
 *
 */

// @lc code=start
/**
 * 【详细解题思路】
 *
 * 1. 问题分析：
 *    题目允许的操作：
 *    - "XL" -> "LX"：将 L 向左移动（L 遇到左边的 X 可以交换）
 *    - "RX" -> "XR"：将 R 向右移动（R 遇到右边的 X 可以交换）
 *
 *    这意味着：
 *    - L 字符只能通过与左侧的 X 交换来向左移动，不能向右移动
 *    - R 字符只能通过与右侧的 X 交换来向右移动，不能向左移动
 *    - L 和 R 之间不能直接交换，它们不能相互穿越
 *
 * 2. 核心观察（必要条件）：
 *    如果 start 可以转换为 result，必须满足：
 *
 *    ① 字符组成必须相同
 *       去掉所有 X 后，两个字符串剩余的 L 和 R 序列必须完全相同
 *       例如：start = "RXXLRXRXL" -> "RLRRL"
 *            result = "XRLXXRRLX" -> "RLRRL"
 *       如果序列不同，说明 L 和 R 的相对顺序改变了，这是不可能的
 *
 *    ② L 的位置约束
 *       对于 start 中的每个 L，它在 result 中的位置必须 <= 它在 start 中的位置
 *       因为 L 只能向左移动（或保持不动）
 *       例如：start[5] = 'L'，那么这个 L 在 result 中只能出现在索引 0~5 的位置
 *
 *    ③ R 的位置约束
 *       对于 start 中的每个 R，它在 result 中的位置必须 >= 它在 start 中的位置
 *       因为 R 只能向右移动（或保持不动）
 *       例如：start[2] = 'R'，那么这个 R 在 result 中只能出现在索引 2~n-1 的位置
 *
 * 3. 算法实现（双指针）：
 *    使用两个指针 i 和 j 分别遍历 start 和 result：
 *
 *    步骤1：跳过 X
 *    - 因为 X 只是占位符，真正决定能否转换的是 L 和 R 的位置关系
 *    - 让 i 跳过 start 中的所有 X，找到下一个 L 或 R
 *    - 让 j 跳过 result 中的所有 X，找到下一个 L 或 R
 *
 *    步骤2：检查字符是否匹配
 *    - 如果 start[i] != result[j]，说明去掉 X 后的序列不同，直接返回 false
 *
 *    步骤3：检查位置约束
 *    - 如果当前字符是 'L'：
 *      由于 L 只能向左移，start 中的 L 必须在 result 中对应 L 的右侧或同一位置
 *      即：i >= j（start 的位置 >= result 的位置）
 *      如果 i < j，说明 L 需要向右移动，这是不可能的
 *
 *    - 如果当前字符是 'R'：
 *      由于 R 只能向右移，start 中的 R 必须在 result 中对应 R 的左侧或同一位置
 *      即：i <= j（start 的位置 <= result 的位置）
 *      如果 i > j，说明 R 需要向左移动，这是不可能的
 *
 * 4. 举例说明：
 *    start  = "RXXLRXRXL"
 *    result = "XRLXXRRLX"
 *
 *    去掉 X：
 *    start  去 X -> "RLRRL"
 *    result 去 X -> "RLRRL"  ✓ 序列相同
 *
 *    检查每个字符的位置：
 *    - 第1个 R: start[0] -> result[1]，0 <= 1 ✓（R 向右移）
 *    - 第1个 L: start[3] -> result[2]，3 >= 2 ✓（L 向左移）
 *    - 第2个 R: start[4] -> result[5]，4 <= 5 ✓（R 向右移）
 *    - 第3个 R: start[6] -> result[6]，6 <= 6 ✓（R 不动）
 *    - 第2个 L: start[8] -> result[7]，8 >= 7 ✓（L 向左移）
 *
 * 5. 时间复杂度：O(n)
 *    每个字符最多被访问一次
 *
 * 6. 空间复杂度：O(1)
 *    只使用了两个指针变量
 */
function canTransform(start: string, result: string): boolean {
  const n = start.length;

  // 双指针分别指向 start 和 result
  let i = 0; // start 的指针，用于遍历 start 字符串
  let j = 0; // result 的指针，用于遍历 result 字符串

  // 当任一指针未到达末尾时继续循环
  while (i < n || j < n) {
    // 【步骤1】跳过 start 中所有的 'X'
    // X 只是占位符，我们只关心 L 和 R 的位置
    while (i < n && start[i] === "X") {
      i++;
    }

    // 【步骤2】跳过 result 中所有的 'X'
    // 同样跳过 result 中的 X，找到下一个 L 或 R
    while (j < n && result[j] === "X") {
      j++;
    }

    // 【步骤3】检查是否都到达末尾
    // 如果一个到达末尾，另一个也必须到达末尾
    // 否则说明去掉 X 后的字符数量不同
    if (i === n || j === n) {
      return i === n && j === n;
    }

    // 【步骤4】检查字符是否匹配
    // 当前位置的字符必须相同（去掉 X 后的 L、R 序列必须完全一致）
    // 如果不同，说明 L 和 R 的相对顺序发生了变化，这是不可能的
    if (start[i] !== result[j]) {
      return false;
    }

    // 【步骤5】检查 'L' 的位置约束
    // 如果当前字符是 'L'：
    // - L 只能向左移动（通过 "XL" -> "LX"）
    // - 所以 start 中 L 的位置必须 >= result 中 L 的位置
    // - 即 start[i] 向左移动到 result[j]，需要满足 i >= j
    // - 如果 i < j，说明 L 需要向右移动，违反规则
    if (start[i] === "L" && i < j) {
      return false;
    }

    // 【步骤6】检查 'R' 的位置约束
    // 如果当前字符是 'R'：
    // - R 只能向右移动（通过 "RX" -> "XR"）
    // - 所以 start 中 R 的位置必须 <= result 中 R 的位置
    // - 即 start[i] 向右移动到 result[j]，需要满足 i <= j
    // - 如果 i > j，说明 R 需要向左移动，违反规则
    if (start[i] === "R" && i > j) {
      return false;
    }

    // 【步骤7】同时移动两个指针
    // 当前这对 L 或 R 检查通过，继续检查下一对
    i++;
    j++;
  }

  // 所有检查都通过，说明 start 可以转换为 result
  return true;
}
// @lc code=end
