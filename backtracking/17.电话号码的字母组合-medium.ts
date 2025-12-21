/*
 * @lc app=leetcode.cn id=17 lang=typescript
 *
 * [17] 电话号码的字母组合
 *
 * https://leetcode.cn/problems/letter-combinations-of-a-phone-number/description/
 *
 * algorithms
 * Medium (62.96%)
 * Likes:    3163
 * Dislikes: 0
 * Total Accepted:    1.2M
 * Total Submissions: 2M
 * Testcase Example:  '"23"'
 *
 * 给定一个仅包含数字 2-9 的字符串，返回所有它能表示的字母组合。答案可以按 任意顺序 返回。
 *
 * 给出数字到字母的映射如下（与电话按键相同）。注意 1 不对应任何字母。
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：digits = "23"
 * 输出：["ad","ae","af","bd","be","bf","cd","ce","cf"]
 *
 *
 * 示例 2：
 *
 *
 * 输入：digits = "2"
 * 输出：["a","b","c"]
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= digits.length <= 4
 * digits[i] 是范围 ['2', '9'] 的一个数字。
 *
 *
 */

/**
 * 电话号码的字母组合 - 回溯算法（DFS深度优先搜索）
 *
 * 核心思路：
 * 这是一道经典的回溯算法题，类似于多叉树的DFS遍历
 * 1. 建立数字到字母的映射关系
 * 2. 使用回溯法递归构建所有可能的组合
 * 3. 每次选择当前数字对应的一个字母，继续递归下一个数字
 * 4. 当组合长度等于输入长度时，找到一个完整的组合
 *
 * 【回溯算法三要素】
 * 1. 路径：已经做出的选择（当前字符串combination）
 * 2. 选择列表：当前可以做的选择（当前数字对应的字母）
 * 3. 结束条件：到达决策树底层（index === digits.length）
 *
 * 【图解示例】
 *
 * 输入: digits = "23"
 *
 * 数字映射：
 * 2 → "abc"
 * 3 → "def"
 *
 * 决策树（回溯过程）：
 *                    ""
 *          /         |        \
 *         a          b         c      ← 第1层：选择2对应的字母
 *       / | \      / | \     / | \
 *      d  e  f    d  e  f   d  e  f   ← 第2层：选择3对应的字母
 *      ↓  ↓  ↓    ↓  ↓  ↓   ↓  ↓  ↓
 *     ad ae af   bd be bf  cd ce cf   ← 叶子节点：完整组合
 *
 * 回溯过程详解：
 * 1. 选择'a' → combination = "a"
 *    1.1 选择'd' → combination = "ad" ✓ 加入结果
 *    1.2 回溯，撤销'd' → combination = "a"
 *    1.3 选择'e' → combination = "ae" ✓ 加入结果
 *    1.4 回溯，撤销'e' → combination = "a"
 *    1.5 选择'f' → combination = "af" ✓ 加入结果
 *    1.6 回溯，撤销'f' → combination = "a"
 * 2. 回溯，撤销'a' → combination = ""
 * 3. 选择'b' → combination = "b"
 *    ... 重复上述过程
 *
 * 时间复杂度：O(3^m × 4^n)，m是对应3个字母的数字个数，n是对应4个字母的数字个数
 * 空间复杂度：O(m + n)，递归调用栈的深度
 */
function letterCombinations(digits: string): string[] {
  // 边界情况：空字符串返回空数组
  if (digits.length === 0) return [];

  // 数字到字母的映射表（模拟电话键盘）
  const phoneMap: Map<string, string> = new Map([
    ["2", "abc"],
    ["3", "def"],
    ["4", "ghi"],
    ["5", "jkl"],
    ["6", "mno"],
    ["7", "pqrs"],
    ["8", "tuv"],
    ["9", "wxyz"],
  ]);

  // 存储所有结果
  const result: string[] = [];

  /**
   * 回溯函数（DFS）
   * @param index 当前处理到第几个数字（决策树的深度）
   * @param combination 当前已经组合的字符串（路径）
   */
  function backtrack(index: number, combination: string): void {
    // 递归终止条件：已经处理完所有数字
    if (index === digits.length) {
      result.push(combination);
      return;
    }

    // 获取当前数字
    const digit = digits[index];
    // 获取当前数字对应的所有字母（选择列表）
    const letters = phoneMap.get(digit)!;

    // 遍历所有可能的字母（做选择）
    for (const letter of letters) {
      // 做选择：将当前字母加入组合
      // 递归：处理下一个数字
      backtrack(index + 1, combination + letter);
      // 撤销选择：这里不需要显式撤销，因为没有修改共享状态
      // （每次递归都传入新的字符串）
    }
  }

  // 从第0个数字开始，初始组合为空字符串
  backtrack(0, "");

  return result;
}

/**
 * 【回溯算法框架模板】
 *
 * result = []
 *
 * function backtrack(路径, 选择列表):
 *     if 满足结束条件:
 *         result.push(路径)
 *         return
 *
 *     for 选择 in 选择列表:
 *         做选择                    ← 将选择加入路径
 *         backtrack(路径, 选择列表)  ← 递归
 *         撤销选择                  ← 将选择从路径中移除
 *
 * 【关键点】
 * 1. 路径：记录已经做出的选择
 * 2. 选择列表：当前可以做的选择
 * 3. 结束条件：到达决策树底层
 * 4. 做选择 → 递归 → 撤销选择（核心三步）
 */

/**
 * 【另一种写法：使用数组存储路径】
 * 这种写法需要显式撤销选择
 */
function letterCombinationsAlt(digits: string): string[] {
  if (digits.length === 0) return [];

  const phoneMap: { [key: string]: string } = {
    "2": "abc",
    "3": "def",
    "4": "ghi",
    "5": "jkl",
    "6": "mno",
    "7": "pqrs",
    "8": "tuv",
    "9": "wxyz",
  };

  const result: string[] = [];
  const path: string[] = []; // 使用数组存储路径

  function backtrack(index: number): void {
    // 到达决策树底层
    if (index === digits.length) {
      result.push(path.join(""));
      return;
    }

    const letters = phoneMap[digits[index]];

    for (const letter of letters) {
      // 做选择
      path.push(letter);

      // 递归
      backtrack(index + 1);

      // 撤销选择（回溯）
      path.pop();
    }
  }

  backtrack(0);
  return result;
}

/**
 * 【执行过程详解 - digits = "23"】
 *
 * 调用栈可视化：
 *
 * backtrack(0, "")
 * ├─ 选择'a'
 * │  └─ backtrack(1, "a")
 * │     ├─ 选择'd'
 * │     │  └─ backtrack(2, "ad")  → 加入结果["ad"]，返回
 * │     ├─ 选择'e'
 * │     │  └─ backtrack(2, "ae")  → 加入结果["ad","ae"]，返回
 * │     └─ 选择'f'
 * │        └─ backtrack(2, "af")  → 加入结果["ad","ae","af"]，返回
 * ├─ 选择'b'
 * │  └─ backtrack(1, "b")
 * │     ├─ 选择'd'
 * │     │  └─ backtrack(2, "bd")  → 加入结果["ad","ae","af","bd"]
 * │     ├─ 选择'e'
 * │     │  └─ backtrack(2, "be")  → 加入结果[...,"be"]
 * │     └─ 选择'f'
 * │        └─ backtrack(2, "bf")  → 加入结果[...,"bf"]
 * └─ 选择'c'
 *    └─ backtrack(1, "c")
 *       ├─ 选择'd'
 *       │  └─ backtrack(2, "cd")  → 加入结果[...,"cd"]
 *       ├─ 选择'e'
 *       │  └─ backtrack(2, "ce")  → 加入结果[...,"ce"]
 *       └─ 选择'f'
 *          └─ backtrack(2, "cf")  → 加入结果[...,"cf"]
 *
 * 最终结果：["ad","ae","af","bd","be","bf","cd","ce","cf"]
 */

/**
 * 【复杂度分析】
 *
 * 时间复杂度：O(3^m × 4^n)
 * - m: 对应3个字母的数字个数（2,3,4,5,6,8）
 * - n: 对应4个字母的数字个数（7,9）
 * - 最坏情况：digits全是"7"或"9"，复杂度为O(4^k)，k是digits长度
 *
 * 空间复杂度：O(k)
 * - k: digits的长度
 * - 递归调用栈的深度为k
 * - 不计算存储结果的空间
 */

/**
 * 【回溯 vs 递归 vs DFS】
 *
 * 1. 递归：函数调用自己
 * 2. DFS：深度优先搜索，一条路走到黑
 * 3. 回溯：DFS的一种，强调"撤销选择"这个动作
 *
 * 回溯算法的本质：
 * - 在所有可能的解空间中搜索
 * - 通过"做选择-递归-撤销选择"的方式遍历决策树
 * - 剪枝优化：提前判断某些路径不可行
 */

/**
 * 【类似题目】
 *
 * 1. LeetCode 39: 组合总和
 *    - 找出所有相加之和为target的组合
 *
 * 2. LeetCode 46: 全排列
 *    - 生成数组的所有排列
 *
 * 3. LeetCode 78: 子集
 *    - 生成数组的所有子集
 *
 * 4. LeetCode 22: 括号生成
 *    - 生成n对括号的所有合法组合
 *
 * 5. LeetCode 77: 组合
 *    - 从1到n中选k个数的所有组合
 *
 * 这些题目都可以用回溯算法的框架解决！
 */

/**
 * 【测试用例】
 *
 * 输入: digits = "23"
 * 输出: ["ad","ae","af","bd","be","bf","cd","ce","cf"]
 *
 * 输入: digits = "2"
 * 输出: ["a","b","c"]
 *
 * 输入: digits = ""
 * 输出: []
 *
 * 输入: digits = "79"
 * 输出: ["pw","px","py","pz","qw","qx","qy","qz",
 *        "rw","rx","ry","rz","sw","sx","sy","sz"]
 */
// @lc code=end
