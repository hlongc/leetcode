/**
 * 在二维平面坐标系中，小红初始位置为 (0,0)。她可以向四个方向移动，移动的步数由四个正整数 a、b、c、d 定义，分别表示小红向上、向下、向左和向右移动一次的步数。
∙ 向上移动一次，走 a 步：(0,0)→(0,a)；
∙ 向下移动一次，走 b 步：(0,0)→(0,−b)；
∙ 向左移动一次，走 c 步：(0,0)→(−c,0)；
∙ 向右移动一次，走 d 步：(0,0)→(d,0)。
小红最终想要到达的目标位置为 (x,y)。请判断小红是否可以通过上述步数到达目标位置。
输入描述：
每个测试文件均包含多组测试数据。第一行输入一个整数 T(1≦T≦10^4) 代表数据组数，每组测试数据描述如下：
在一行上输入六个整数 x,y,a,b,c,d(1≦x,y,a,b,c,d≦10^9) 代表目标位置所在坐标、向上下左右四个方向单次移动的步数。
输出描述：
对于每一组测试数据，新起一行。如果小红可以到达目标位置，输出 YES；否则，直接输出 NO。
 * @param x 
 * @param y 
 * @param top 
 * @param bottom 
 * @param left 
 * @param right 
 */
function walkGrid(
  x: number,
  y: number,
  top: number,
  bottom: number,
  left: number,
  right: number
) {
  /**
   * 欧几里得算法求最大公约数。
   * 这里的含义：若在同一轴上能向正向移动 forward 步、向负向移动 backward 步，
   * 那么所有可能抵达的位置坐标的差值一定是 gcd(forward, backward) 的整数倍。
   */
  const gcd = (a: number, b: number): number => {
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  };

  /**
   * canReach 判断 target 是否能通过“正方向 forward 步 + 反方向 backward 步”的线性组合得到。
   * 例：右移 10 步、左移 6 步 ⇒ 能抵达的 x 坐标差值都满足是 gcd(10, 6)=2 的整数倍。
   * 因此 target 只要是 2 的倍数即可。target=0 代表本就位于原点，无需移动。
   */
  const canReach = (target: number, forward: number, backward: number) => {
    if (target === 0) {
      return true;
    }
    const stepGcd = gcd(forward, backward);
    return target % stepGcd === 0;
  };

  // x、y 轴互相独立，分别判断是否能用左右/上下的步长组合出来。
  const reachableX = canReach(x, right, left);
  const reachableY = canReach(y, top, bottom);

  // 两个轴都可达时输出 YES，否则 NO。
  console.log(reachableX && reachableY ? "YES" : "NO");
}

// walkGrid(3, 3, 1, 1, 1, 1);
walkGrid(176, 375, 150, 75, 132, 110);
walkGrid(534, 36, 36, 126, 801, 712);
walkGrid(20, 196, 252, 224, 14, 14);
walkGrid(18, 639, 426, 497, 18, 60);
walkGrid(620, 7826, 10, 100, 455, 728);
