const a = {
  value: 1,
  [Symbol.toPrimitive]: function () {
    return this.value++;
  },
};
if (a == 1 && a == 2 && a == 3) {
  console.log(666);
}
