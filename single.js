function Test() {
  if (!(this instanceof Test)) {
    throw new Error("Test must be called with new11");
  }

  this.name = "Test";
}

Test.getInstance = function () {
  if (!Test.instance) {
    Test.instance = new Test();
  }
  return Test.instance;
};
try {
  Test();
} catch (error) {
  console.log(error);
}
