/*
 * @lc app=leetcode.cn id=421 lang=typescript
 *
 * [421] 数组中两个数的最大异或值
 *
 * https://leetcode.cn/problems/maximum-xor-of-two-numbers-in-an-array/description/
 *
 * algorithms
 * Medium (59.14%)
 * Likes:    731
 * Dislikes: 0
 * Total Accepted:    71.2K
 * Total Submissions: 120.4K
 * Testcase Example:  '[3,10,5,25,2,8]'
 *
 * 给你一个整数数组 nums ，返回 nums[i] XOR nums[j] 的最大运算结果，其中 0 ≤ i ≤ j < n 。
 *
 *
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：nums = [3,10,5,25,2,8]
 * 输出：28
 * 解释：最大运算结果是 5 XOR 25 = 28.
 *
 * 示例 2：
 *
 *
 * 输入：nums = [14,70,53,83,49,91,36,80,92,51,66,70]
 * 输出：127
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= nums.length <= 2 * 10^5
 * 0 <= nums[i] <= 2^31 - 1
 *
 *
 *
 *
 */

// @lc code=start

/**
 * 二进制字典树（Binary Trie）节点类
 *
 * 与普通 Trie 不同，二进制 Trie 每个节点只有两个子节点：0 和 1
 * 用于存储数字的二进制表示
 */
class BinaryTrieNode {
  // 子节点：只有两个可能 - left 表示 0，right 表示 1
  left: BinaryTrieNode | null = null; // 0 分支
  right: BinaryTrieNode | null = null; // 1 分支
}

/**
 * 二进制字典树类
 *
 * 用于高效存储和查询整数的二进制表示
 * 特别适合解决异或相关的问题
 */
class BinaryTrie {
  private root: BinaryTrieNode;
  // 最高位数（32位整数，从第30位开始到第0位，共31位，因为题目最大是2^31-1）
  private readonly HIGH_BIT = 30;

  constructor() {
    this.root = new BinaryTrieNode();
  }

  /**
   * 将一个数字插入到二进制 Trie 中
   * @param num 要插入的数字
   *
   * 算法流程：
   * 1. 从最高位（第30位）到最低位（第0位）逐位处理
   * 2. 如果当前位是0，走左子树；如果是1，走右子树
   * 3. 如果对应子节点不存在，创建新节点
   */
  insert(num: number): void {
    let node = this.root;

    // 从高位到低位遍历（第30位到第0位）
    for (let i = this.HIGH_BIT; i >= 0; i--) {
      // 获取第 i 位的值（0 或 1）
      // 右移 i 位后与 1 进行与运算，得到该位的值
      const bit = (num >> i) & 1;

      if (bit === 0) {
        // 当前位是 0，走左子树
        if (!node.left) {
          node.left = new BinaryTrieNode();
        }
        node = node.left;
      } else {
        // 当前位是 1，走右子树
        if (!node.right) {
          node.right = new BinaryTrieNode();
        }
        node = node.right;
      }
    }
  }

  /**
   * 查找与给定数字异或结果最大的数字
   * @param num 给定的数字
   * @returns 能获得的最大异或值
   *
   * 核心思想（贪心策略）：
   * 1. 从高位到低位，尽量选择与当前位不同的路径
   * 2. 如果当前位是0，尽量走1（right）；如果是1，尽量走0（left）
   * 3. 这样异或后该位为1，使得结果尽可能大
   * 4. 如果理想路径不存在，只能走现有的路径
   */
  getMaxXor(num: number): number {
    let node = this.root;
    let xorResult = 0;

    // 从高位到低位遍历
    for (let i = this.HIGH_BIT; i >= 0; i--) {
      // 获取第 i 位的值
      const bit = (num >> i) & 1;

      // 贪心策略：尽量选择与当前位相反的路径
      if (bit === 0) {
        // 当前位是0，优先走右子树（1），这样异或后该位为1
        if (node.right) {
          // 找到了相反的位，异或后该位为1
          xorResult = (xorResult << 1) | 1; // 左移一位，末位置1
          node = node.right;
        } else {
          // 没有相反的位，只能走相同的位，异或后该位为0
          xorResult = xorResult << 1; // 左移一位，末位为0
          node = node.left!; // 必然存在，因为至少插入了一个数
        }
      } else {
        // 当前位是1，优先走左子树（0），这样异或后该位为1
        if (node.left) {
          xorResult = (xorResult << 1) | 1;
          node = node.left;
        } else {
          xorResult = xorResult << 1;
          node = node.right!;
        }
      }
    }

    return xorResult;
  }
}

/**
 * 数组中两个数的最大异或值
 *
 * 核心思路：使用二进制字典树（Binary Trie）
 *
 * 算法步骤：
 * 1. 将所有数字的二进制形式插入到 Trie 中
 * 2. 对每个数字，在 Trie 中贪心查找能产生最大异或值的路径
 * 3. 从高位到低位，尽量选择相反的位，使异或结果尽可能大
 *
 * 为什么用 Trie？
 * - 暴力法：O(n²) 两两比较，对于 2*10^5 的数据会超时
 * - Trie 法：O(n*31) 每个数只需遍历一次，每次查询31位
 * - Trie 允许我们高效地进行"贪心"选择，从高位开始尽量选择相反的位
 *
 * 异或性质：
 * - 相同为0，不同为1
 * - 高位的1比低位所有1加起来都大
 * - 因此贪心策略有效：优先保证高位为1
 *
 * 示例：nums = [3, 10, 5, 25, 2, 8]
 * - 3:  00011
 * - 10: 01010
 * - 5:  00101
 * - 25: 11001
 * - 2:  00010
 * - 8:  01000
 *
 * 最大异或：5 XOR 25 = 00101 XOR 11001 = 11100 = 28
 *
 * 时间复杂度：O(n * 31) = O(n)，n 为数组长度，31 为二进制位数
 * 空间复杂度：O(n * 31) = O(n)，Trie 树的空间
 */
function findMaximumXOR(nums: number[]): number {
  // 创建二进制 Trie
  const trie = new BinaryTrie();

  // 第一步：将所有数字插入到 Trie 中
  // 构建完整的二进制 Trie 树
  for (const num of nums) {
    trie.insert(num);
  }

  // 第二步：对每个数字，查找能产生的最大异或值
  let maxXor = 0;
  for (const num of nums) {
    // 在 Trie 中贪心查找与 num 异或结果最大的数
    const currentXor = trie.getMaxXor(num);
    // 更新最大值
    maxXor = Math.max(maxXor, currentXor);
  }

  return maxXor;
}
// @lc code=end
