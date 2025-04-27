// 打印出 1 - 10000 之间的所有对称数
// 例如：121、1331 等

function isPalindrome(num) {
  const str = num.toString();
  let left = 0,
    right = str.length - 1;

  while (left <= right) {
    if (str[left] === str[right]) {
      left++;
      right--;
    } else {
      return false;
    }
  }

  return true;
}

function consoleNum(start, end) {
  for (let i = start; i <= end; i++) {
    if (isPalindrome(i)) {
      console.log(i + " ");
    }
  }
}

consoleNum(1, 10000);
