// 原始 list 如下
let list = [
  { id: 1, name: "部门A", parentId: 0 },
  { id: 2, name: "部门B", parentId: 0 },
  { id: 3, name: "部门C", parentId: 1 },
  { id: 4, name: "部门D", parentId: 1 },
  { id: 5, name: "部门E", parentId: 2 },
  { id: 6, name: "部门F", parentId: 3 },
  { id: 7, name: "部门G", parentId: 2 },
  { id: 8, name: "部门H", parentId: 4 },
];

function convert(list) {
  const ret = [];
  const map = new Map();
  const parentIds = list.map((item) => item.parentId);
  const ids = list.map((item) => item.id);
  const roots = parentIds.filter((id) => !ids.includes(id));

  for (const item of list) {
    map.set(item.id, item);
  }

  for (const item of list) {
    if (roots.includes(item.parentId)) {
      ret.push(item);
    } else {
      const parent = map.get(item.parentId);
      parent.children = parent.children ?? [];
      parent.children.push(item);
    }
  }

  return ret;
}

console.dir(convert(list), { depth: Infinity });
