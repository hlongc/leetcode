/**
 * 发布订阅模式与观察者模式的区别
 *
 * 这两种模式都是用于对象间的一对多依赖关系，但它们在实现机制上有本质区别。
 * 本文通过代码示例详细对比两种模式的实现方式和应用场景。
 */

/**
 * 一、两种模式的核心区别
 *
 * 1. 观察者模式：
 *    - 观察者直接订阅主题(Subject)
 *    - 主题状态变化时直接通知所有观察者
 *    - 观察者和主题之间存在耦合
 *
 * 2. 发布订阅模式：
 *    - 发布者和订阅者之间有一个中间层(事件通道/消息代理)
 *    - 发布者发布消息到事件通道，不关心谁接收
 *    - 订阅者从事件通道订阅消息，不关心谁发布
 *    - 发布者和订阅者互相解耦
 */

/**
 * 二、观察者模式实现示例
 */
console.log("=========== 观察者模式 ===========");

// 主题类(Subject)
class WeatherStation {
  constructor() {
    this.temperature = 0;
    this.observers = []; // 直接管理观察者列表
  }

  // 注册观察者
  registerObserver(observer) {
    this.observers.push(observer);
    console.log("气象站：一个新的显示设备已连接");
  }

  // 移除观察者
  removeObserver(observer) {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
      console.log("气象站：一个显示设备已断开连接");
    }
  }

  // 通知所有观察者
  notifyObservers() {
    console.log("气象站：通知所有显示设备更新数据");
    // 主题直接调用观察者的更新方法
    for (const observer of this.observers) {
      observer.update(this.temperature);
    }
  }

  // 温度改变，触发通知
  setTemperature(temp) {
    console.log(`气象站：温度更新为 ${temp}°C`);
    this.temperature = temp;
    this.notifyObservers();
  }
}

// 观察者接口
class WeatherDisplay {
  constructor(name) {
    this.name = name;
  }

  // 收到主题通知时的更新方法
  update(temperature) {
    console.log(`${this.name}：接收到新的温度数据 ${temperature}°C`);
  }
}

// 观察者模式使用示例
const weatherStation = new WeatherStation();

const phoneDisplay = new WeatherDisplay("手机显示器");
const computerDisplay = new WeatherDisplay("电脑显示器");

// 观察者主动注册到主题
weatherStation.registerObserver(phoneDisplay);
weatherStation.registerObserver(computerDisplay);

// 温度变化，主题直接通知观察者
weatherStation.setTemperature(25);

// 移除一个观察者
weatherStation.removeObserver(phoneDisplay);

// 再次更新温度，只有剩下的观察者会收到通知
weatherStation.setTemperature(30);

/**
 * 三、发布订阅模式实现示例
 */
console.log("\n=========== 发布订阅模式 ===========");

// 事件通道/消息代理
class EventBus {
  constructor() {
    this.events = {}; // 事件及其订阅者映射
  }

  // 订阅事件
  subscribe(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    console.log(`事件中心：${callback.name || "匿名函数"}订阅了'${event}'事件`);
    return () => this.unsubscribe(event, callback); // 返回取消订阅的函数
  }

  // 取消订阅
  unsubscribe(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((cb) => cb !== callback);
      console.log(
        `事件中心：${callback.name || "匿名函数"}取消订阅了'${event}'事件`
      );
    }
  }

  // 发布事件
  publish(event, data) {
    console.log(`事件中心：收到'${event}'事件，准备通知订阅者`);
    if (this.events[event]) {
      this.events[event].forEach((callback) => {
        callback(data);
      });
    }
  }
}

// 全局事件中心
const eventBus = new EventBus();

// 发布者：温度传感器
class TemperatureSensor {
  constructor() {
    this.temperature = 0;
  }

  // 模拟温度变化，发布消息到事件总线
  changeTemperature(temp) {
    this.temperature = temp;
    console.log(`温度传感器：检测到温度 ${temp}°C，发布到事件中心`);
    // 发布者只负责发布事件，不关心谁在订阅
    eventBus.publish("temperature-changed", temp);
  }
}

// 订阅者1：手机应用
function mobileAppTemperatureHandler(temperature) {
  console.log(`手机应用：收到温度更新 ${temperature}°C`);
}

// 订阅者2：网站
function websiteTemperatureHandler(temperature) {
  console.log(`网站：收到温度更新 ${temperature}°C`);
}

// 订阅者3：智能家居系统
function smartHomeTemperatureHandler(temperature) {
  console.log(`智能家居：收到温度更新 ${temperature}°C，调整空调温度`);
}

// 发布订阅模式使用示例
const tempSensor = new TemperatureSensor();

// 订阅者通过事件中心订阅事件
eventBus.subscribe("temperature-changed", mobileAppTemperatureHandler);
eventBus.subscribe("temperature-changed", websiteTemperatureHandler);
const unsubscribeSmartHome = eventBus.subscribe(
  "temperature-changed",
  smartHomeTemperatureHandler
);

// 发布者发布事件，不直接和订阅者交互
tempSensor.changeTemperature(26);

// 取消一个订阅
unsubscribeSmartHome();

// 再次发布温度变化事件
tempSensor.changeTemperature(24);

// 新的发布者：备用温度传感器
class BackupTemperatureSensor {
  constructor() {
    this.temperature = 0;
  }

  reportTemperature(temp) {
    this.temperature = temp;
    console.log(`备用温度传感器：检测到温度 ${temp}°C，发布到事件中心`);
    // 也发布到同一个事件通道
    eventBus.publish("temperature-changed", temp);
  }
}

// 新的发布者发布事件
const backupSensor = new BackupTemperatureSensor();
backupSensor.reportTemperature(23);

/**
 * 四、两种模式的主要区别对比
 *
 * 1. 组件关系：
 *    - 观察者模式：主题直接感知观察者的存在
 *    - 发布订阅模式：发布者和订阅者互不感知对方的存在
 *
 * 2. 耦合程度：
 *    - 观察者模式：松耦合，但主题和观察者之间仍有直接依赖
 *    - 发布订阅模式：完全解耦，发布者和订阅者之间没有依赖关系
 *
 * 3. 中间层：
 *    - 观察者模式：无中间层，主题直接通知观察者
 *    - 发布订阅模式：有事件通道/消息代理作为中间层
 *
 * 4. 通信方式：
 *    - 观察者模式：主题主动推送给观察者
 *    - 发布订阅模式：通过事件通道/消息代理进行转发
 *
 * 5. 灵活性：
 *    - 观察者模式：观察者只能订阅特定主题
 *    - 发布订阅模式：可以实现跨模块甚至跨应用的通信
 */

/**
 * 五、实际应用场景
 *
 * 观察者模式适用场景：
 * - DOM事件监听（如点击、滚动等）
 * - MVC架构中视图层监听模型层变化
 * - 组件内部通信和状态同步
 *
 * 发布订阅模式适用场景：
 * - 跨组件通信（如React的全局状态管理Redux）
 * - 微服务架构中的消息队列
 * - 复杂应用的模块解耦
 * - 浏览器中的自定义事件系统
 * - Node.js中的EventEmitter
 */
