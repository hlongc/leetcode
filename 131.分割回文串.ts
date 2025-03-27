/*
 * @lc app=leetcode.cn id=131 lang=typescript
 *
 * [131] 分割回文串
 */

// @lc code=start
/**
 * 方法一：使用深度优先搜索（DFS）和缓存来解决分割回文串问题
 * @param s 输入字符串
 * @returns 所有可能的分割方案，每个方案是回文子串的数组
 */
function partition1(s: string): string[][] {
  // 存储最终结果
  const ret: string[][] = [];
  // 获取字符串长度
  const len = s.length;
  // 使用Map缓存已经判断过的子串是否为回文串，避免重复计算
  const cache = new Map<string, boolean>();

  /**
   * 判断字符串是否为回文串
   * @param str 需要判断的字符串
   * @returns 是否为回文串
   */
  const isPali = (str: string) => {
    // 如果缓存中已有结果，直接返回
    if (cache.has(str)) return cache.get(str)!;

    // 双指针法判断回文
    let l = 0,
      r = str.length - 1;
    let ret: boolean = true;

    while (l < r) {
      // 如果对应位置字符不相等，则不是回文串
      if (str[l] !== str[r]) {
        ret = false;
        break;
      }
      l++;
      r--;
    }

    // 将结果存入缓存
    cache.set(str, ret);
    return ret;
  };

  /**
   * 深度优先搜索函数
   * @param start 当前处理的起始索引
   * @param tmp 当前已经收集的回文子串数组
   */
  const dfs = (start: number, tmp: string[]) => {
    // 如果已经处理到字符串末尾，说明找到了一个有效的分割方案
    if (start === len) {
      // 将当前方案加入结果集（需要复制一份，避免引用问题）
      ret.push(tmp.slice());
      return;
    }

    // 尝试从start开始的每个可能的子串
    for (let i = start; i < len; i++) {
      // 截取从start到i的子串
      const str = s.slice(start, i + 1);

      // 如果子串是回文串，则将其加入当前方案，并继续搜索
      if (isPali(str)) {
        tmp.push(str);
        // 递归处理剩余部分
        dfs(i + 1, tmp);
        // 回溯，移除最后添加的子串，尝试其他可能
        tmp.pop();
      }
    }
  };

  // 从索引0开始搜索，初始方案为空数组
  dfs(0, []);

  return ret;
}

/**
 * 方法二：使用动态规划预处理回文信息，再结合DFS解决分割回文串问题
 * @param s 输入字符串
 * @returns 所有可能的分割方案，每个方案是回文子串的数组
 */
function partition(s: string): string[][] {
  // 存储最终结果
  const ret: string[][] = [];
  // 获取字符串长度
  const len = s.length;

  // 创建动态规划数组，dp[i][j]表示字符串s从索引i到j是否为回文串
  // 初始化所有值为true（单个字符必定是回文）
  const dp: boolean[][] = new Array(len)
    .fill(0)
    .map(() => new Array(len).fill(true));

  // 动态规划填充dp数组
  // 动态规划的递推公式是：dp[i][j] = s[i] === s[j] && dp[i + 1][j - 1]
  // 因为需要 i+1 的状态才能推出 i 的状态，所以外层循环要从尾部开始计算
  // 里层j = i + 1，是因为dp[a][b]计算a-b的串是不是回文串，所以b>a
  for (let i = len - 1; i >= 0; i--) {
    for (let j = i + 1; j < len; j++) {
      // 当前子串是回文的条件：首尾字符相同，且去掉首尾后的子串也是回文
      dp[i][j] = s[i] === s[j] && dp[i + 1][j - 1];
    }
  }

  // 临时存储当前方案
  const tmp: string[] = [];

  /**
   * 深度优先搜索函数
   * @param i 当前处理的起始索引
   */
  const dfs = (i: number) => {
    // 如果已经处理到字符串末尾，说明找到了一个有效的分割方案
    if (i === len) {
      // 将当前方案加入结果集（需要复制一份，避免引用问题）
      ret.push(tmp.slice());
      return;
    }

    // 尝试从i开始的每个可能的子串
    for (let j = i; j < len; j++) {
      // 如果从i到j的子串是回文串（通过预计算的dp数组直接判断）
      if (dp[i][j]) {
        // 将该回文子串加入当前方案
        tmp.push(s.slice(i, j + 1));
        // 递归处理剩余部分
        dfs(j + 1);
        // 回溯，移除最后添加的子串，尝试其他可能
        tmp.pop();
      }
    }
  };

  // 从索引0开始搜索
  dfs(0);

  return ret;
}

// @lc code=end
