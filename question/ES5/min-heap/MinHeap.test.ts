/**
 * 最小堆测试文件
 * 演示各种使用场景
 */

import MinHeap, { HeapNode } from './MinHeap';

// ============================================================================
// 示例 1: React Scheduler 场景 - 任务调度
// ============================================================================
console.log('\n📦 示例 1: React Scheduler 任务调度\n');
console.log('='.repeat(60));

interface SchedulerTask extends HeapNode {
  id: number;
  sortIndex: number;
  callback: () => void;
  priorityLevel: 'Immediate' | 'UserBlocking' | 'Normal' | 'Low' | 'Idle';
  expirationTime: number;
}

const taskQueue = new MinHeap<SchedulerTask>();
const currentTime = Date.now();

// 添加不同优先级的任务
const tasks: Omit<SchedulerTask, 'sortIndex'>[] = [
  {
    id: 1,
    callback: () => console.log('执行：渲染列表'),
    priorityLevel: 'Normal',
    expirationTime: currentTime + 5000,
  },
  {
    id: 2,
    callback: () => console.log('执行：处理用户点击'),
    priorityLevel: 'UserBlocking',
    expirationTime: currentTime + 250,
  },
  {
    id: 3,
    callback: () => console.log('执行：发送统计数据'),
    priorityLevel: 'Idle',
    expirationTime: currentTime + 1000000,
  },
  {
    id: 4,
    callback: () => console.log('执行：更新输入框'),
    priorityLevel: 'Immediate',
    expirationTime: currentTime - 1, // 已过期
  },
];

// 将任务按过期时间排序（sortIndex = expirationTime）
tasks.forEach(task => {
  taskQueue.push({
    ...task,
    sortIndex: task.expirationTime,
  });
});

console.log('📋 任务队列状态:');
taskQueue.print();

console.log('⚡ 按优先级执行任务:');
let taskNum = 1;
while (!taskQueue.isEmpty) {
  const task = taskQueue.pop();
  if (task) {
    console.log(`  ${taskNum++}. [${task.priorityLevel}] id=${task.id}, 过期时间=${task.expirationTime - currentTime}ms`);
  }
}

// ============================================================================
// 示例 2: Dijkstra 最短路径算法
// ============================================================================
console.log('\n\n📦 示例 2: Dijkstra 最短路径算法\n');
console.log('='.repeat(60));

interface GraphNode extends HeapNode {
  id: number;
  sortIndex: number; // 距离
  vertex: string;
  distance: number;
}

function dijkstra(
  graph: Map<string, Map<string, number>>,
  start: string,
  end: string
): number {
  const pq = new MinHeap<GraphNode>();
  const distances = new Map<string, number>();
  const visited = new Set<string>();

  // 初始化
  for (const vertex of graph.keys()) {
    distances.set(vertex, vertex === start ? 0 : Infinity);
  }

  let nodeId = 0;
  pq.push({
    id: nodeId++,
    sortIndex: 0,
    vertex: start,
    distance: 0,
  });

  console.log('🗺️  图结构:');
  graph.forEach((edges, vertex) => {
    console.log(`  ${vertex} → ${Array.from(edges.entries()).map(([v, d]) => `${v}(${d})`).join(', ')}`);
  });

  console.log('\n🔍 搜索过程:');
  while (!pq.isEmpty) {
    const current = pq.pop();
    if (!current) break;

    console.log(`  访问节点: ${current.vertex}, 当前距离: ${current.distance}`);

    if (visited.has(current.vertex)) continue;
    visited.add(current.vertex);

    if (current.vertex === end) {
      console.log(`\n✅ 找到最短路径，距离: ${current.distance}`);
      return current.distance;
    }

    const neighbors = graph.get(current.vertex);
    if (neighbors) {
      for (const [neighbor, weight] of neighbors) {
        if (!visited.has(neighbor)) {
          const newDistance = current.distance + weight;
          const oldDistance = distances.get(neighbor) || Infinity;

          if (newDistance < oldDistance) {
            distances.set(neighbor, newDistance);
            pq.push({
              id: nodeId++,
              sortIndex: newDistance,
              vertex: neighbor,
              distance: newDistance,
            });
          }
        }
      }
    }
  }

  return Infinity;
}

// 创建图
const graph = new Map<string, Map<string, number>>();
graph.set('A', new Map([['B', 4], ['C', 2]]));
graph.set('B', new Map([['C', 1], ['D', 5]]));
graph.set('C', new Map([['B', 1], ['D', 8], ['E', 10]]));
graph.set('D', new Map([['E', 2]]));
graph.set('E', new Map());

const shortestPath = dijkstra(graph, 'A', 'E');
console.log(`\n🎯 从 A 到 E 的最短距离: ${shortestPath}`);

// ============================================================================
// 示例 3: Top K 问题 - 找出最大/最小的 K 个元素
// ============================================================================
console.log('\n\n📦 示例 3: Top K 问题\n');
console.log('='.repeat(60));

interface ScoreNode extends HeapNode {
  id: number;
  sortIndex: number;
  name: string;
  score: number;
}

function topKHighScores(scores: { name: string; score: number }[], k: number): ScoreNode[] {
  const heap = new MinHeap<ScoreNode>();

  scores.forEach((item, index) => {
    const node: ScoreNode = {
      id: index,
      sortIndex: item.score,
      name: item.name,
      score: item.score,
    };

    if (heap.size < k) {
      // 堆未满，直接插入
      heap.push(node);
    } else {
      // 堆已满，如果当前元素比堆顶大，则替换堆顶
      const min = heap.peek();
      if (min && item.score > min.score) {
        heap.pop();
        heap.push(node);
      }
    }
  });

  // 弹出所有元素并反转（因为是最小堆，弹出顺序是从小到大）
  const result: ScoreNode[] = [];
  while (!heap.isEmpty) {
    const node = heap.pop();
    if (node) result.push(node);
  }

  return result.reverse();
}

const studentScores = [
  { name: 'Alice', score: 95 },
  { name: 'Bob', score: 87 },
  { name: 'Charlie', score: 92 },
  { name: 'David', score: 78 },
  { name: 'Eve', score: 88 },
  { name: 'Frank', score: 91 },
  { name: 'Grace', score: 85 },
  { name: 'Henry', score: 96 },
];

console.log('📊 学生成绩:');
studentScores.forEach(s => console.log(`  ${s.name}: ${s.score}`));

const top3 = topKHighScores(studentScores, 3);
console.log('\n🏆 前 3 名:');
top3.forEach((student, index) => {
  console.log(`  ${index + 1}. ${student.name}: ${student.score}`);
});

// ============================================================================
// 示例 4: 事件调度系统
// ============================================================================
console.log('\n\n📦 示例 4: 事件调度系统\n');
console.log('='.repeat(60));

interface ScheduledEvent extends HeapNode {
  id: number;
  sortIndex: number; // 执行时间戳
  name: string;
  timestamp: number;
  handler: () => void;
}

class EventScheduler {
  private eventQueue = new MinHeap<ScheduledEvent>();
  private eventIdCounter = 0;
  private currentTime = 0;

  /**
   * 调度事件
   */
  schedule(name: string, delay: number, handler: () => void): number {
    const eventId = this.eventIdCounter++;
    const timestamp = this.currentTime + delay;

    this.eventQueue.push({
      id: eventId,
      sortIndex: timestamp,
      name,
      timestamp,
      handler,
    });

    console.log(`  ⏰ 调度事件: ${name} (延迟 ${delay}ms, 时间戳 ${timestamp})`);
    return eventId;
  }

  /**
   * 推进时间并执行到期的事件
   */
  tick(deltaTime: number): void {
    this.currentTime += deltaTime;
    console.log(`\n⏱️  时间推进到: ${this.currentTime}ms`);

    while (!this.eventQueue.isEmpty) {
      const event = this.eventQueue.peek();
      if (!event || event.timestamp > this.currentTime) {
        // 下一个事件还没到时间
        break;
      }

      // 执行事件
      this.eventQueue.pop();
      console.log(`  🔔 执行事件: ${event.name} (${event.timestamp}ms)`);
      event.handler();
    }
  }

  /**
   * 获取下一个事件的等待时间
   */
  getNextEventDelay(): number | null {
    const next = this.eventQueue.peek();
    return next ? Math.max(0, next.timestamp - this.currentTime) : null;
  }
}

const scheduler = new EventScheduler();

console.log('📅 调度事件:');
scheduler.schedule('打开动画', 100, () => console.log('    → 动画开始'));
scheduler.schedule('加载数据', 50, () => console.log('    → 数据已加载'));
scheduler.schedule('显示提示', 200, () => console.log('    → 显示提示框'));
scheduler.schedule('关闭动画', 300, () => console.log('    → 动画结束'));

console.log('\n🎬 模拟时间流逝:');
scheduler.tick(60);  // 0 → 60ms
scheduler.tick(50);  // 60 → 110ms
scheduler.tick(100); // 110 → 210ms
scheduler.tick(100); // 210 → 310ms

const nextDelay = scheduler.getNextEventDelay();
console.log(`\n⏭️  下一个事件: ${nextDelay !== null ? `${nextDelay}ms 后` : '无'}`);

// ============================================================================
// 示例 5: 性能对比测试
// ============================================================================
console.log('\n\n📦 示例 5: 性能对比\n');
console.log('='.repeat(60));

interface PerfNode extends HeapNode {
  id: number;
  sortIndex: number;
}

function performanceTest(count: number) {
  console.log(`\n⚡ 测试规模: ${count.toLocaleString()} 个元素\n`);

  // 测试最小堆
  const heap = new MinHeap<PerfNode>();
  
  console.time('  ├─ 堆插入时间');
  for (let i = 0; i < count; i++) {
    heap.push({
      id: i,
      sortIndex: Math.floor(Math.random() * count),
    });
  }
  console.timeEnd('  ├─ 堆插入时间');

  console.time('  ├─ 堆弹出时间');
  const heapResults: number[] = [];
  while (!heap.isEmpty) {
    const node = heap.pop();
    if (node) heapResults.push(node.sortIndex);
  }
  console.timeEnd('  ├─ 堆弹出时间');

  // 对比：数组 + 排序
  const array: PerfNode[] = [];
  
  console.time('  ├─ 数组插入时间');
  for (let i = 0; i < count; i++) {
    array.push({
      id: i,
      sortIndex: Math.floor(Math.random() * count),
    });
  }
  console.timeEnd('  ├─ 数组插入时间');

  console.time('  └─ 数组排序时间');
  const arrayResults = array
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .map(n => n.sortIndex);
  console.timeEnd('  └─ 数组排序时间');

  // 验证结果一致性
  const isCorrect = heapResults.every((val, idx) => val === arrayResults[idx]);
  console.log(`\n  ✅ 结果验证: ${isCorrect ? '通过' : '失败'}`);
}

performanceTest(10000);
performanceTest(50000);

console.log('\n\n🎉 所有示例运行完成!\n');

