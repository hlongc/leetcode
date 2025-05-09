/*
 * @lc app=leetcode.cn id=647 lang=typescript
 *
 * [647] 回文子串
 *
 * 题目描述：
 * 给你一个字符串 s ，请你统计并返回这个字符串中回文子串的数目。
 * 回文字符串 是正着读和倒过来读一样的字符串。
 * 子字符串 是字符串中的由连续字符组成的一个序列。
 */

// @lc code=start

/**
 * 方法一：优化后的暴力解法
 * 时间复杂度：O(n^3)，空间复杂度：O(1)
 *
 * @param s 输入字符串
 * @returns 回文子串的数量
 */
function countSubstrings1(s: string): number {
  if (!s || s.length === 0) return 0;

  let count = 0;
  const size = s.length;

  // 优化1：避免使用递归，直接使用双层循环
  for (let i = 0; i < size; i++) {
    // 优化2：只需要枚举子串的结束位置，无需再枚举长度
    for (let j = i; j < size; j++) {
      // 判断子串s[i...j]是否是回文
      if (isPalindrome(s, i, j)) {
        count++;
      }
    }
  }

  return count;
}

/**
 * 判断字符串s从start到end的子串是否是回文
 * 优化：直接在原字符串上判断，避免创建新字符串
 *
 * @param s 原字符串
 * @param start 起始索引
 * @param end 结束索引
 * @returns 是否为回文
 */
function isPalindrome(s: string, start: number, end: number): boolean {
  while (start < end) {
    if (s[start] !== s[end]) {
      return false;
    }
    start++;
    end--;
  }
  return true;
}

/**
 * 方法二：分开处理奇数和偶数长度的回文（更容易理解的中心扩展法）
 * 时间复杂度：O(n^2)，空间复杂度：O(1)
 *
 * 思路：分别处理两种回文情况：
 * 1. 奇数长度回文：以每个字符为中心点扩展
 * 2. 偶数长度回文：以每两个相邻字符之间为中心点扩展
 *
 * @param s 输入字符串
 * @returns 回文子串的数量
 */
function countSubstrings(s: string): number {
  if (!s || s.length === 0) return 0;

  let count = 0;
  const n = s.length;

  // 处理奇数长度的回文（以字符为中心）
  for (let center = 0; center < n; center++) {
    // 从中心向两边扩展
    count += expandAroundCenter(s, center, center);
  }

  // 处理偶数长度的回文（以两个字符之间为中心）
  for (let center = 0; center < n - 1; center++) {
    // 从相邻两个字符开始向两边扩展
    count += expandAroundCenter(s, center, center + 1);
  }

  return count;
}

/**
 * 从给定的左右位置向两边扩展，计算回文子串的数量
 * @param s 字符串
 * @param left 左指针起始位置
 * @param right 右指针起始位置
 * @returns 从该位置能扩展出的回文子串数量
 */
function expandAroundCenter(s: string, left: number, right: number): number {
  let count = 0;

  // 只要左右字符相等，就继续向两边扩展
  while (left >= 0 && right < s.length && s[left] === s[right]) {
    // 找到一个回文子串
    count++;
    // 向两边扩展
    left--;
    right++;
  }

  return count;
}

/**
 * 方法三：中心扩展法（统一处理奇偶回文）
 * 时间复杂度：O(n^2)，空间复杂度：O(1)
 *
 * 思路：以字符串中的每个字符（或两个字符之间的空隙）为中心，
 * 向两边扩展，统计能形成的回文子串数量。
 *
 * @param s 输入字符串
 * @returns 回文子串的数量
 */
function countSubstringsCompact(s: string): number {
  if (!s || s.length === 0) return 0;

  let count = 0;
  const n = s.length;

  // 遍历每个可能的回文中心
  for (let center = 0; center < 2 * n - 1; center++) {
    // 确定左右指针的初始位置
    // 对于偶数center，left和right指向同一个字符（奇数长度回文）
    // 对于奇数center，left和right指向相邻的两个字符（偶数长度回文）
    let left = Math.floor(center / 2);
    let right = left + (center % 2);

    // 从中心向两边扩展，寻找回文
    while (left >= 0 && right < n && s[left] === s[right]) {
      // 找到一个回文子串
      count++;
      // 继续向两边扩展
      left--;
      right++;
    }
  }

  return count;
}

/**
 * 方法四：动态规划解法
 * 时间复杂度：O(n^2)，空间复杂度：O(n^2)
 *
 * 思路：使用dp[i][j]表示s[i...j]是否为回文子串
 * 状态转移方程：
 * - 如果s[i] !== s[j]，则dp[i][j] = false
 * - 如果s[i] === s[j]：
 *   - 如果j - i <= 2，则dp[i][j] = true（单字符、两个相同字符或三个字符的情况）
 *   - 否则，dp[i][j] = dp[i+1][j-1]（取决于内部子串是否是回文）
 *
 * @param s 输入字符串
 * @returns 回文子串的数量
 */
function countSubstringsDP(s: string): number {
  if (!s || s.length === 0) return 0;

  const n = s.length;
  let count = 0;

  // 创建动态规划表，dp[i][j] = true表示s[i...j]是回文
  const dp: boolean[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(false));

  // 从短到长遍历所有子串
  // 注意遍历顺序：必须先填充短的子串，再基于它们判断长的子串
  for (let len = 1; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1; // 子串结束位置

      // 判断s[i...j]是否为回文
      if (s[i] === s[j]) {
        // 情况1：长度为1的子串（单个字符），一定是回文
        // 情况2：长度为2的子串，两个字符相同则是回文
        // 情况3：长度大于2，需要判断内部子串是否是回文
        dp[i][j] = len <= 2 || dp[i + 1][j - 1];
      } else {
        dp[i][j] = false;
      }

      // 如果是回文，计数加1
      if (dp[i][j]) {
        count++;
      }
    }
  }

  return count;
}
/*
 * 方法比较与直观解释：
 *
 * 中心扩展法详解：
 *
 * 1. 最直观的理解（方法二）
 *    - 将回文分为两种情况：奇数长度和偶数长度
 *    - 奇数长度回文：中心是一个字符，例如"aba"中的'b'
 *    - 偶数长度回文：中心是两个字符之间，例如"abba"中的两个'b'之间
 *    - 我们分别处理这两种情况，使用两个循环：
 *      a. 第一个循环：以每个字符为中心扩展（找奇数长度回文）
 *      b. 第二个循环：以每两个相邻字符之间为中心扩展（找偶数长度回文）
 *    - 这种实现方式直观易懂，但代码稍长
 *
 * 2. 数学技巧优化（方法三）
 *    - 方法二的两个循环其实可以合并为一个
 *    - 对于长度为n的字符串，共有2n-1个可能的中心位置
 *    - 我们可以用一个统一的公式来映射这些中心位置到字符索引：
 *      a. 当center为偶数时（0,2,4,...）：对应奇数长度回文的中心
 *      b. 当center为奇数时（1,3,5,...）：对应偶数长度回文的中心
 *    - 映射公式：
 *      * left = center / 2 向下取整
 *      * right = left + (center % 2)
 *    - 这样可以更紧凑地实现相同的算法
 *
 * 示例演示（字符串"abc"）：
 *
 * 方法二的处理方式：
 * 1. 奇数长度回文中心：'a', 'b', 'c'（3个字符，3个中心点）
 * 2. 偶数长度回文中心：'a和b之间', 'b和c之间'（3个字符，2个中心点）
 *
 * 方法三的处理方式：
 * 对应的center值和映射：
 * - center=0: left=0, right=0 ('a'为中心)
 * - center=1: left=0, right=1 ('a'和'b'之间为中心)
 * - center=2: left=1, right=1 ('b'为中心)
 * - center=3: left=1, right=2 ('b'和'c'之间为中心)
 * - center=4: left=2, right=2 ('c'为中心)
 *
 * 总结：
 * - 方法二更直观，适合初学者理解
 * - 方法三更紧凑，但需要理解数学映射
 * - 两种方法的时间和空间复杂度相同，实质上是同一种算法的不同实现方式
 */
// @lc code=end
