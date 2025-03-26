/*
 * @lc app=leetcode.cn id=51 lang=typescript
 *
 * [51] N 皇后
 */

// @lc code=start
function solveNQueens1(n: number): string[][] {
  const ret: string[][] = [];
  // 初始化棋盘
  const board: string[][] = Array.from({ length: n }).map(() =>
    Array(n).fill(".")
  );

  const isValid = (row: number, col: number) => {
    for (let i = 0; i < row; i++) {
      for (let j = 0; j < n; j++) {
        if (
          board[i][j] === "Q" &&
          (j == col || i + j === row + col || i - j === row - col)
        ) {
          // 不能再同一列，正对角线，反对角线
          return false;
        }
      }
    }

    return true;
  };

  const helper = (row: number) => {
    if (row === n) {
      const clone = board.slice();
      clone.forEach((item, index, arr) => {
        (arr[index] as any) = item.join("");
      });
      ret.push(clone as any);
      return;
    }

    for (let col = 0; col < n; col++) {
      if (isValid(row, col)) {
        board[row][col] = "Q";
        helper(row + 1);
        board[row][col] = ".";
      }
    }
  };

  helper(0);
  return ret;
}

function solveNQueens(n: number): string[][] {
  const ret: string[][] = [];
  // 初始化棋盘
  const board: string[][] = Array.from({ length: n }).map(() =>
    Array(n).fill(".")
  );
  const colSet = new Set();
  const diag1 = new Set(); // 正对角线
  const diag2 = new Set(); // 反对角线

  const helper = (row: number) => {
    if (row === n) {
      const clone = board.slice();
      clone.forEach((item, index, arr) => {
        (arr[index] as any) = item.join("");
      });
      ret.push(clone as any);
      return;
    }

    for (let col = 0; col < n; col++) {
      if (!colSet.has(col) && !diag1.has(row + col) && !diag2.has(row - col)) {
        board[row][col] = "Q";
        colSet.add(col);
        diag1.add(row + col);
        diag2.add(row - col);
        helper(row + 1);
        board[row][col] = ".";
        colSet.delete(col);
        diag1.delete(row + col);
        diag2.delete(row - col);
      }
    }
  };

  helper(0);
  return ret;
}
// @lc code=end
