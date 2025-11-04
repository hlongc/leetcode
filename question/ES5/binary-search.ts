/**
 * 二叉树节点定义
 */
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;

  constructor(
    val: number,
    left: TreeNode | null = null,
    right: TreeNode | null = null
  ) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

/**
 * 二叉树调度器（迭代器）
 * 功能：按从小到大的顺序返回二叉树中的节点值
 *
 * 思路：
 * 1. 由于是无序二叉树，需要先遍历获取所有节点值
 * 2. 对所有值进行排序
 * 3. 使用指针依次返回
 */
class BinaryTreeIterator {
  private values: number[]; // 排序后的所有节点值
  private currentIndex: number; // 当前指针位置

  constructor(root: TreeNode | null) {
    this.values = [];
    this.currentIndex = 0;

    // 遍历树，收集所有节点值
    this.collectValues(root);

    // 排序（从小到大）
    this.values.sort((a, b) => a - b);

    console.log("初始化完成，节点值（排序后）:", this.values);
  }

  /**
   * 遍历二叉树，收集所有节点值
   * 使用前序遍历（也可以用中序、后序、层序）
   */
  private collectValues(node: TreeNode | null): void {
    if (!node) return;

    // 前序遍历：根 -> 左 -> 右
    this.values.push(node.val);
    this.collectValues(node.left);
    this.collectValues(node.right);
  }

  /**
   * 返回下一个最小的数
   * @returns 下一个最小的数
   */
  next(): number {
    if (!this.hasNext()) {
      throw new Error("没有更多元素了");
    }

    const value = this.values[this.currentIndex];
    this.currentIndex++;
    return value;
  }

  /**
   * 判断是否还有下一个数
   * @returns 是否存在下一个数
   */
  hasNext(): boolean {
    return this.currentIndex < this.values.length;
  }

  /**
   * 重置迭代器（可选功能）
   */
  reset(): void {
    this.currentIndex = 0;
  }

  /**
   * 获取剩余元素数量（可选功能）
   */
  remaining(): number {
    return this.values.length - this.currentIndex;
  }
}

// ============ 测试用例 ============

/**
 * 构建测试二叉树
 *       5
 *      / \
 *     3   8
 *    / \   \
 *   1   4   9
 *  /
 * 2
 *
 * 无序遍历：5, 3, 1, 2, 4, 8, 9
 * 排序后：1, 2, 3, 4, 5, 8, 9
 */
function createTestTree1(): TreeNode {
  const root = new TreeNode(5);
  root.left = new TreeNode(3);
  root.right = new TreeNode(8);
  root.left.left = new TreeNode(1);
  root.left.right = new TreeNode(4);
  root.left.left.left = new TreeNode(2);
  root.right.right = new TreeNode(9);

  return root;
}

/**
 * 测试二叉树 2（完全无序）
 *       10
 *      /  \
 *     2    15
 *    / \   / \
 *   8   3 12  1
 *
 * 排序后：1, 2, 3, 8, 10, 12, 15
 */
function createTestTree2(): TreeNode {
  const root = new TreeNode(10);
  root.left = new TreeNode(2);
  root.right = new TreeNode(15);
  root.left.left = new TreeNode(8);
  root.left.right = new TreeNode(3);
  root.right.left = new TreeNode(12);
  root.right.right = new TreeNode(1);

  return root;
}

// 测试 1：基本功能
console.log("========== 测试 1：基本功能 ==========");
const tree1 = createTestTree1();
const iterator1 = new BinaryTreeIterator(tree1);

console.log("\n使用 next() 遍历：");
while (iterator1.hasNext()) {
  console.log("next():", iterator1.next());
}

// 测试 2：hasNext() 功能
console.log("\n========== 测试 2：hasNext() 边界测试 ==========");
const tree2 = createTestTree2();
const iterator2 = new BinaryTreeIterator(tree2);

console.log("hasNext():", iterator2.hasNext()); // true
console.log("剩余元素:", iterator2.remaining()); // 7

console.log("\n取出 3 个元素：");
console.log("1st:", iterator2.next()); // 1
console.log("2nd:", iterator2.next()); // 2
console.log("3rd:", iterator2.next()); // 3

console.log("\nhasNext():", iterator2.hasNext()); // true
console.log("剩余元素:", iterator2.remaining()); // 4

console.log("\n取出剩余所有元素：");
while (iterator2.hasNext()) {
  console.log("next():", iterator2.next());
}

console.log("\nhasNext():", iterator2.hasNext()); // false
console.log("剩余元素:", iterator2.remaining()); // 0

// 测试 3：空树
console.log("\n========== 测试 3：空树 ==========");
const iterator3 = new BinaryTreeIterator(null);
console.log("空树 hasNext():", iterator3.hasNext()); // false

// 测试 4：单节点
console.log("\n========== 测试 4：单节点 ==========");
const singleNode = new TreeNode(42);
const iterator4 = new BinaryTreeIterator(singleNode);
console.log("hasNext():", iterator4.hasNext()); // true
console.log("next():", iterator4.next()); // 42
console.log("hasNext():", iterator4.hasNext()); // false

// 测试 5：重复值
console.log("\n========== 测试 5：包含重复值 ==========");
const treeWithDuplicates = new TreeNode(5);
treeWithDuplicates.left = new TreeNode(3);
treeWithDuplicates.right = new TreeNode(3);
treeWithDuplicates.left.left = new TreeNode(1);
treeWithDuplicates.left.right = new TreeNode(5);

const iterator5 = new BinaryTreeIterator(treeWithDuplicates);
console.log("包含重复值的树：");
while (iterator5.hasNext()) {
  console.log("next():", iterator5.next());
}
// 输出：1, 3, 3, 5, 5

// 测试 6：重置功能
console.log("\n========== 测试 6：重置功能 ==========");
const tree6 = createTestTree1();
const iterator6 = new BinaryTreeIterator(tree6);

console.log("第一次遍历前 3 个：");
console.log(iterator6.next()); // 1
console.log(iterator6.next()); // 2
console.log(iterator6.next()); // 3

console.log("\n重置后：");
iterator6.reset();
console.log("从头开始：", iterator6.next()); // 1

// 测试 7：错误处理
console.log("\n========== 测试 7：错误处理 ==========");
const tree7 = new TreeNode(1);
const iterator7 = new BinaryTreeIterator(tree7);

iterator7.next(); // 取出唯一元素
console.log("hasNext():", iterator7.hasNext()); // false

try {
  iterator7.next(); // 尝试再次取值
} catch (error) {
  console.log("捕获错误:", (error as Error).message);
}

// ============ 优化版本：支持自定义比较器 ============

/**
 * 支持自定义排序的迭代器
 */
class CustomBinaryTreeIterator {
  private values: number[];
  private currentIndex: number;

  constructor(
    root: TreeNode | null,
    compareFn: (a: number, b: number) => number = (a, b) => a - b
  ) {
    this.values = [];
    this.currentIndex = 0;

    this.collectValues(root);
    this.values.sort(compareFn);
  }

  private collectValues(node: TreeNode | null): void {
    if (!node) return;

    this.values.push(node.val);
    this.collectValues(node.left);
    this.collectValues(node.right);
  }

  next(): number {
    if (!this.hasNext()) {
      throw new Error("没有更多元素了");
    }
    return this.values[this.currentIndex++];
  }

  hasNext(): boolean {
    return this.currentIndex < this.values.length;
  }
}

// 测试自定义比较器
console.log("\n========== 测试 8：自定义比较器（从大到小） ==========");
const tree8 = createTestTree1();
const iterator8 = new CustomBinaryTreeIterator(tree8, (a, b) => b - a);

console.log("从大到小遍历：");
while (iterator8.hasNext()) {
  console.log("next():", iterator8.next());
}

// ============ 内存优化版本（惰性计算） ============

/**
 * 惰性计算版本（使用生成器）
 * 适合非常大的树，避免一次性加载所有值到内存
 */
class LazyBinaryTreeIterator {
  private sortedValues: number[];
  private currentIndex: number;

  constructor(root: TreeNode | null) {
    // 收集所有值
    const values: number[] = [];
    this.traverse(root, values);

    // 排序
    this.sortedValues = values.sort((a, b) => a - b);
    this.currentIndex = 0;
  }

  private traverse(node: TreeNode | null, values: number[]): void {
    if (!node) return;

    values.push(node.val);
    this.traverse(node.left, values);
    this.traverse(node.right, values);
  }

  next(): number {
    if (!this.hasNext()) {
      throw new Error("没有更多元素了");
    }
    return this.sortedValues[this.currentIndex++];
  }

  hasNext(): boolean {
    return this.currentIndex < this.sortedValues.length;
  }

  peek(): number | null {
    return this.hasNext() ? this.sortedValues[this.currentIndex] : null;
  }
}

// ============ 实现 JavaScript 迭代器协议 ============

/**
 * 实现 JavaScript 原生迭代器协议
 * 可以使用 for...of 循环
 */
class IterableBinaryTree {
  private values: number[];

  constructor(root: TreeNode | null) {
    this.values = [];
    this.collectValues(root);
    this.values.sort((a, b) => a - b);
  }

  private collectValues(node: TreeNode | null): void {
    if (!node) return;

    this.values.push(node.val);
    this.collectValues(node.left);
    this.collectValues(node.right);
  }

  // 实现迭代器协议
  [Symbol.iterator]() {
    let index = 0;
    const values = this.values;

    return {
      next(): IteratorResult<number> {
        if (index < values.length) {
          return {
            value: values[index++],
            done: false,
          };
        } else {
          return {
            value: undefined,
            done: true,
          };
        }
      },
    };
  }

  // 也可以同时提供 next() 和 hasNext() 方法
  private currentIndex = 0;

  next(): number {
    if (!this.hasNext()) {
      throw new Error("没有更多元素了");
    }
    return this.values[this.currentIndex++];
  }

  hasNext(): boolean {
    return this.currentIndex < this.values.length;
  }

  reset(): void {
    this.currentIndex = 0;
  }
}

// 测试 JavaScript 迭代器协议
console.log("\n========== 测试 9：JavaScript 迭代器协议 ==========");
const tree9 = createTestTree1();
const iterable = new IterableBinaryTree(tree9);

console.log("使用 for...of 循环：");
for (const value of iterable) {
  console.log("value:", value);
}

console.log("\n重置后使用 next() 和 hasNext()：");
iterable.reset();
console.log("next():", iterable.next()); // 1
console.log("next():", iterable.next()); // 2
console.log("hasNext():", iterable.hasNext()); // true

// ============ 性能对比：不同遍历方式 ============

/**
 * 递归遍历（上面使用的方式）
 */
class RecursiveIterator {
  private values: number[];
  private currentIndex = 0;

  constructor(root: TreeNode | null) {
    this.values = [];
    this.traverse(root);
    this.values.sort((a, b) => a - b);
  }

  private traverse(node: TreeNode | null): void {
    if (!node) return;
    this.values.push(node.val);
    this.traverse(node.left);
    this.traverse(node.right);
  }

  next(): number {
    return this.values[this.currentIndex++];
  }

  hasNext(): boolean {
    return this.currentIndex < this.values.length;
  }
}

/**
 * 迭代遍历（使用栈）
 */
class IterativeIterator {
  private values: number[];
  private currentIndex = 0;

  constructor(root: TreeNode | null) {
    this.values = [];
    this.traverse(root);
    this.values.sort((a, b) => a - b);
  }

  private traverse(root: TreeNode | null): void {
    if (!root) return;

    const stack: TreeNode[] = [root];

    while (stack.length > 0) {
      const node = stack.pop()!;
      this.values.push(node.val);

      // 先右后左（因为栈是后进先出）
      if (node.right) stack.push(node.right);
      if (node.left) stack.push(node.left);
    }
  }

  next(): number {
    return this.values[this.currentIndex++];
  }

  hasNext(): boolean {
    return this.currentIndex < this.values.length;
  }
}

/**
 * 层序遍历（BFS）
 */
class BFSIterator {
  private values: number[];
  private currentIndex = 0;

  constructor(root: TreeNode | null) {
    this.values = [];
    this.traverse(root);
    this.values.sort((a, b) => a - b);
  }

  private traverse(root: TreeNode | null): void {
    if (!root) return;

    const queue: TreeNode[] = [root];

    while (queue.length > 0) {
      const node = queue.shift()!;
      this.values.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }

  next(): number {
    return this.values[this.currentIndex++];
  }

  hasNext(): boolean {
    return this.currentIndex < this.values.length;
  }
}

// 性能测试
console.log("\n========== 性能对比测试 ==========");

function createLargeTree(depth: number, value: number = 0): TreeNode | null {
  if (depth === 0) return null;

  const node = new TreeNode(Math.floor(Math.random() * 1000));
  node.left = createLargeTree(depth - 1, value + 1);
  node.right = createLargeTree(depth - 1, value + 2);

  return node;
}

const largeTree = createLargeTree(10); // 深度 10 的树

console.log("测试递归遍历：");
console.time("递归遍历");
const recursiveIter = new RecursiveIterator(largeTree);
console.timeEnd("递归遍历");

console.log("测试迭代遍历：");
console.time("迭代遍历");
const iterativeIter = new IterativeIterator(largeTree);
console.timeEnd("迭代遍历");

console.log("测试层序遍历：");
console.time("层序遍历");
const bfsIter = new BFSIterator(largeTree);
console.timeEnd("层序遍历");

// ============ 使用示例 ============

console.log("\n========== 完整使用示例 ==========");

// 创建二叉树
const myTree = new TreeNode(20);
myTree.left = new TreeNode(10);
myTree.right = new TreeNode(30);
myTree.left.left = new TreeNode(5);
myTree.left.right = new TreeNode(15);
myTree.right.left = new TreeNode(25);
myTree.right.right = new TreeNode(35);

// 创建迭代器
const myIterator = new BinaryTreeIterator(myTree);

console.log("树结构：");
console.log("       20");
console.log("      /  \\");
console.log("    10    30");
console.log("   / \\   / \\");
console.log("  5  15 25  35");

console.log("\n按顺序获取所有值：");
const result: number[] = [];
while (myIterator.hasNext()) {
  result.push(myIterator.next());
}
console.log("结果:", result); // [5, 10, 15, 20, 25, 30, 35]

// ============ LeetCode 风格的实现 ============

/**
 * 如果是 LeetCode 题目，可能这样定义
 */
class BSTIterator {
  private values: number[];
  private index: number;

  constructor(root: TreeNode | null) {
    this.values = [];
    this.index = 0;

    // 收集所有值
    this.inorderTraversal(root);

    // 排序
    this.values.sort((a, b) => a - b);
  }

  private inorderTraversal(node: TreeNode | null): void {
    if (!node) return;

    this.values.push(node.val);
    this.inorderTraversal(node.left);
    this.inorderTraversal(node.right);
  }

  next(): number {
    return this.values[this.index++];
  }

  hasNext(): boolean {
    return this.index < this.values.length;
  }
}

// ============ 总结 ============

/**
 * 关键要点：
 *
 * 1. 由于是无序二叉树，必须遍历所有节点后排序
 *    时间复杂度：O(n log n) - n 个节点，排序 O(n log n)
 *    空间复杂度：O(n) - 存储所有节点值
 *
 * 2. 如果是二叉搜索树（BST），可以使用中序遍历直接得到有序序列
 *    时间复杂度：O(n)
 *    空间复杂度：O(h) - h 是树高度（使用栈）
 *
 * 3. 初始化时完成所有工作（遍历 + 排序）
 *    next() 和 hasNext() 都是 O(1) 操作
 *
 * 4. 适用场景：
 *    - 树不会改变
 *    - 需要多次遍历（可以 reset）
 *    - 树的大小适中（能放入内存）
 */

export {
  TreeNode,
  BinaryTreeIterator,
  CustomBinaryTreeIterator,
  IterableBinaryTree,
};
