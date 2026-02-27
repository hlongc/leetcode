declare global {
  class TreeNode {
    val: number;
    left: TreeNode | null;
    right: TreeNode | null;

    constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null);
  }

  class ListNode {
    val: number;
    next: ListNode | null;
    constructor(val?: number, next?: ListNode | null);
  }

  class _Node {
    val: number;
    prev: _Node | null;
    next: _Node | null;
    child: _Node | null;

    constructor(val?: number, prev?: _Node, next?: _Node, child?: _Node) {
      this.val = val === undefined ? 0 : val;
      this.prev = prev === undefined ? null : prev;
      this.next = next === undefined ? null : next;
      this.child = child === undefined ? null : child;
    }
  }
}

export {};
