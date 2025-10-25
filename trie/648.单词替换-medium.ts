/*
 * @lc app=leetcode.cn id=648 lang=typescript
 *
 * [648] 单词替换
 *
 * https://leetcode.cn/problems/replace-words/description/
 *
 * algorithms
 * Medium (63.84%)
 * Likes:    343
 * Dislikes: 0
 * Total Accepted:    86.6K
 * Total Submissions: 135.7K
 * Testcase Example:  '["cat","bat","rat"]\n"the cattle was rattled by the battery"'
 *
 * 在英语中，我们有一个叫做 词根(root) 的概念，可以词根 后面 添加其他一些词组成另一个较长的单词——我们称这个词为 衍生词
 * (derivative)。例如，词根 help，跟随着 继承词 "ful"，可以形成新的单词 "helpful"。
 *
 * 现在，给定一个由许多 词根 组成的词典 dictionary 和一个用空格分隔单词形成的句子 sentence。你需要将句子中的所有 衍生词 用 词根
 * 替换掉。如果 衍生词 有许多可以形成它的 词根，则用 最短 的 词根 替换它。
 *
 * 你需要输出替换之后的句子。
 *
 *
 *
 * 示例 1：
 *
 *
 * 输入：dictionary = ["cat","bat","rat"], sentence = "the cattle was rattled by
 * the battery"
 * 输出："the cat was rat by the bat"
 *
 *
 * 示例 2：
 *
 *
 * 输入：dictionary = ["a","b","c"], sentence = "aadsfasf absbs bbab cadsfafs"
 * 输出："a a b c"
 *
 *
 *
 *
 * 提示：
 *
 *
 * 1 <= dictionary.length <= 1000
 * 1 <= dictionary[i].length <= 100
 * dictionary[i] 仅由小写字母组成。
 * 1 <= sentence.length <= 10^6
 * sentence 仅由小写字母和空格组成。
 * sentence 中单词的总量在范围 [1, 1000] 内。
 * sentence 中每个单词的长度在范围 [1, 1000] 内。
 * sentence 中单词之间由一个空格隔开。
 * sentence 没有前导或尾随空格。
 *
 *
 *
 *
 */

// @lc code=start

/**
 * Trie（字典树）节点类
 * 用于存储词根字典，快速查找最短匹配的词根
 */
class Tire684 {
  // 子节点映射：key 为字符，value 为对应的子节点
  children: Map<string, Tire684>;

  // 存储完整的词根
  // 如果当前节点是某个词根的结尾，word 存储该词根；否则为 null
  word: string | null;

  constructor() {
    this.children = new Map();
    this.word = null;
  }
}

/**
 * 单词替换
 *
 * 核心思路：使用 Trie（字典树）快速查找最短词根
 *
 * 算法步骤：
 * 1. 将所有词根插入 Trie 树
 * 2. 遍历句子中的每个单词，在 Trie 中查找匹配的词根
 * 3. 找到第一个匹配的词根就立即替换（贪心：保证最短）
 * 4. 如果找不到词根，保持原单词不变
 *
 * 时间复杂度：O(D×L_d + W×L_w)
 *   D 为词根数量，L_d 为词根平均长度
 *   W 为单词数量，L_w 为单词平均长度
 * 空间复杂度：O(D×L_d)，Trie 树的空间
 */
function replaceWords(dictionary: string[], sentence: string): string {
  // 创建 Trie 树的根节点
  const root = new Tire684();

  // 将句子分割成单词数组
  const words = sentence.split(" ");

  // ========== 第一步：构建 Trie 树 ==========
  // 将词根字典中的所有词根插入到 Trie 中
  for (const word of dictionary) {
    // 从根节点开始
    let node = root;

    // 逐字符插入词根
    for (const char of word) {
      // 如果当前字符对应的子节点不存在，创建新节点
      if (!node.children.has(char)) {
        node.children.set(char, new Tire684());
      }
      // 移动到子节点
      node = node.children.get(char)!;
    }

    // 在词根的最后一个字符对应的节点上，存储完整的词根
    node.word = word;
  }

  // ========== 第二步：查找并替换单词 ==========
  // 遍历句子中的每个单词
  for (let i = 0; i < words.length; i++) {
    // 从根节点开始查找当前单词
    let node = root;

    // 逐字符在 Trie 中匹配
    for (const char of words[i]) {
      // 检查当前字符是否在 Trie 中
      if (node.children.has(char)) {
        // 移动到下一个节点
        node = node.children.get(char)!;

        // 关键判断：如果当前节点存储了词根（word !== null）
        // 说明找到了一个匹配的词根
        if (node.word !== null) {
          // 用找到的词根替换原单词
          words[i] = node.word;

          // 立即跳出循环（贪心策略）
          // 因为我们是从前往后匹配的，第一个找到的词根一定是最短的
          // 例如：词根 "cat"，单词 "cattle"
          //      匹配到 c-a-t 时就找到了，不会继续匹配到 c-a-t-t-l-e
          break;
        }
      } else {
        // 如果当前字符不在 Trie 中，说明没有匹配的词根
        // 跳出循环，保持原单词不变
        break;
      }
    }
  }

  // ========== 第三步：重新组合句子 ==========
  // 将处理后的单词数组用空格连接成句子
  return words.join(" ");
}
// @lc code=end
