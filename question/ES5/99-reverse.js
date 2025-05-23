// 用 JavaScript 写一个函数，输入 int 型，返回整数逆序后的字符串。
// 如：输入整型 1234，返回字符串“4321”。要求必须使用递归函数调用，不能用全局变量，
// 输入函数必须只有一个参数传入，必须返回字符串。

function reverse(num) {
  let ret = "";
  const str = num.toString();

  const helper = (i) => {
    if (i < 0) return;
    ret += str[i];
    helper(i - 1);
  };

  helper(str.length - 1);

  return ret;
}

console.log(reverse(1234));
