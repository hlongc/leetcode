/**
 * B卷200分 - 最长的顺子（Java & JS & Python）
 *
 * 题目描述：
 * 斗地主起源于湖北十堰房县，据说是一位叫吴修全的年轻人根据当地流行的扑克玩法"跑得快"改编的。
 * 如今已风靡全中国，并流行于互联网上。
 *
 * 牌型：单顺，又称顺子，最少5张牌，最多12张牌(3...A)不能有2，也不能有大小王，不计花色。
 *
 * 例如：3-4-5-6-7-8，7-8-9-10-J-Q，3-4-5-6-7-8-9-10-J-Q-K-A
 *
 * 可用的牌 3<4<5<6<7<8<9<10<J<Q<K<A<2<B(小王)<C(大王)，每种牌除大小王外有四种花色
 * (共有13x4+2张牌)
 *
 * 输入：
 * 1. 手上有的牌
 * 2. 已经出过的牌(包括对手出的和自己出的牌)
 *
 * 输出：
 * - 对手可能构成的最长的顺子(如果有相同长度的顺子，输出牌面最大的那一个)
 * - 如果无法构成顺子，则输出 NO-CHAIN
 *
 * 输入描述：
 * 输入的第一行为当前手中的牌
 * 输入的第二行为已经出过的牌
 *
 * 输出描述：
 * 最长的顺子
 */

/**
 * 解题思路：贪心 + 模拟
 *
 * 核心思想：
 * 1. 统计对手可能有的牌（总牌 - 手中的牌 - 已出的牌）
 * 2. 从最大的牌开始，尝试构建最长的顺子
 * 3. 顺子要求：连续的牌，最少5张，最多12张，不能有2和大小王
 *
 * 算法流程：
 * 1. 初始化：每种牌有4张（3到A，共13种）
 * 2. 减去手中的牌和已出的牌，得到对手可能有的牌
 * 3. 从A开始往下找，尝试构建最长的顺子
 * 4. 找到第一个长度>=5的顺子就是答案（因为从大到小找）
 *
 * 时间复杂度：O(n)，n为牌的种类数
 * 空间复杂度：O(1)，固定大小的数组
 */

/**
 * 主函数：找最长的顺子
 * @param handCards 手中的牌
 * @param playedCards 已经出过的牌
 * @returns 最长的顺子字符串，或 "NO-CHAIN"
 */
function findLongestChain(handCards: string, playedCards: string): string {
  // 定义牌的顺序（不包括2和大小王，因为它们不能组成顺子）
  const cardOrder = [
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];

  // 初始化：每种牌有4张
  const opponentCards: Map<string, number> = new Map();
  for (const card of cardOrder) {
    opponentCards.set(card, 4);
  }

  // 减去手中的牌
  const handCardList = handCards.split("-");
  for (const card of handCardList) {
    if (opponentCards.has(card)) {
      opponentCards.set(card, opponentCards.get(card)! - 1);
    }
  }

  // 减去已经出过的牌
  const playedCardList = playedCards.split("-");
  for (const card of playedCardList) {
    if (opponentCards.has(card)) {
      opponentCards.set(card, opponentCards.get(card)! - 1);
    }
  }

  // 从最大的牌开始，尝试构建最长的顺子
  let maxLength = 0;
  let maxChain: string[] = [];

  // 遍历每个可能的起始位置
  for (let start = cardOrder.length - 1; start >= 0; start--) {
    // 如果这个位置的牌对手没有，跳过
    if (opponentCards.get(cardOrder[start])! <= 0) {
      continue;
    }

    // 尝试从这个位置开始构建顺子
    const chain: string[] = [];
    let pos = start;

    // 向下连续找牌
    while (pos >= 0 && opponentCards.get(cardOrder[pos])! > 0) {
      chain.push(cardOrder[pos]);
      pos--;
    }

    // 如果这个顺子长度>=5，且比之前找到的更长，更新答案
    if (chain.length >= 5 && chain.length > maxLength) {
      maxLength = chain.length;
      maxChain = chain;
    }
  }

  // 如果找到了顺子，返回；否则返回 NO-CHAIN
  if (maxLength >= 5) {
    return maxChain.join("-");
  } else {
    return "NO-CHAIN";
  }
}

/**
 * 算法图解：
 *
 * 示例1：
 * 手中的牌：3-3-3-3-4-4-5-5-6-7-8-9-10-J-Q-K-A
 * 已出的牌：4-5-6-7-8-8-8
 *
 * 步骤1：统计对手可能有的牌
 * 初始：每种牌4张
 * 3: 4-4=0 (手中有4张3)
 * 4: 4-2-1=1 (手中2张，已出1张)
 * 5: 4-2-1=1
 * 6: 4-1-1=2
 * 7: 4-1-1=2
 * 8: 4-1-3=0
 * 9: 4-1=3
 * 10: 4-1=3
 * J: 4-1=3
 * Q: 4-1=3
 * K: 4-1=3
 * A: 4-1=3
 *
 * 步骤2：从A开始往下找顺子
 * A有牌(3张) → Q有牌(3张) → K有牌(3张) → J有牌(3张) → 10有牌(3张) → 9有牌(3张) → 8没牌 停止
 * 找到顺子：A-K-Q-J-10-9，长度6
 *
 * 继续从9开始找：
 * 9有牌 → 8没牌 停止，长度1，不满足
 *
 * 继续从7开始找：
 * 7有牌 → 6有牌 → 5有牌 → 4有牌 → 3没牌 停止，长度4，不满足
 *
 * 最终答案：9-10-J-Q-K-A（长度6，牌面最大）
 *
 *
 * 示例2：
 * 手中的牌：3-3-3-3-8-8-8-8
 * 已出的牌：K-K-K-K
 *
 * 对手可能有的牌：
 * 3: 0, 4: 4, 5: 4, 6: 4, 7: 4, 8: 0, 9: 4, 10: 4, J: 4, Q: 4, K: 0, A: 4
 *
 * 从A开始找：A有 → K没有 停止，长度1
 * 从Q开始找：Q有 → J有 → 10有 → 9有 → 8没有 停止，长度4
 * 从7开始找：7有 → 6有 → 5有 → 4有 → 3没有 停止，长度4
 *
 * 没有长度>=5的顺子，输出：NO-CHAIN
 */

function findLongestChain1(handCard: string, playedCard: string): string {
  const cards = [
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
    "2",
  ];

  const map: Map<string, number> = new Map();

  for (const card of cards) {
    map.set(card, 4);
  }

  const handCards = handCard.split("-");
  for (const card of handCards) {
    if (map.has(card)) {
      map.set(card, map.get(card)! - 1);
    }
  }

  const playedCards = playedCard.split("-");
  for (const card of playedCards) {
    if (map.has(card)) {
      map.set(card, map.get(card)! - 1);
    }
  }

  let maxLen = 0;
  let ret = "NO-CHAIN";

  for (let start = cards.length - 1; start >= 0; start--) {
    const card = cards[start];
    if (!map.has(card) || map.get(card)! <= 0) continue;
    let pos = start;
    let len = 0;
    const tmp: string[] = [];
    while (pos >= 0 && (map.get(cards[pos]) ?? 0) > 0) {
      pos--;
      len++;
      tmp.push(cards[pos]);
    }

    if (len > maxLen) {
      maxLen = len;
      ret = tmp.join("-");
    }
  }
  console.log("这里");
  return maxLen >= 5 ? ret : "NO-CHAIN";
}

// 测试用例
function test() {
  console.log("=== 测试开始 ===\n");

  // 示例1
  const hand1 = "3-3-3-3-4-4-5-5-6-7-8-9-10-J-Q-K-A";
  const played1 = "4-5-6-7-8-8-8";
  console.log("示例1:");
  console.log("手中的牌:", hand1);
  console.log("已出的牌:", played1);
  console.log("结果:", findLongestChain1(hand1, played1));
  console.log("");

  // 示例2
  const hand2 = "3-3-3-3-8-8-8-8";
  const played2 = "K-K-K-K";
  console.log("示例2:");
  console.log("手中的牌:", hand2);
  console.log("已出的牌:", played2);
  console.log("结果:", findLongestChain1(hand2, played2));
  console.log("");

  console.log("=== 测试结束 ===");
}

// 主函数：处理输入输出
function main() {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const lines: string[] = [];

  rl.on("line", (line: string) => {
    lines.push(line.trim());

    if (lines.length === 2) {
      const handCards = lines[0];
      const playedCards = lines[1];

      const result = findLongestChain(handCards, playedCards);
      console.log(result);

      rl.close();
    }
  });
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  test();
  // main();
}

export { findLongestChain };
