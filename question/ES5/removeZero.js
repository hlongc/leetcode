// 输入: [0,1,0,3,12]
// 输出: [1,3,12,0,0]

function moveZero(list) {
  let slow = 0;
  for (let fast = 0; fast < list.length; fast++) {
    if (list[fast] !== 0) {
      list[slow++] = list[fast];
    }
  }

  while (slow < list.length) {
    list[slow++] = 0;
  }
}
const list = [0, 1, 0, 3, 12];
moveZero(list);

console.log(list);
