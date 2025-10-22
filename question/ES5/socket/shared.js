console.log("shared worker启动");

const ports = [];
const map = new Map();
let clientId = 0;
let counter = 0;

self.onconnect = (e) => {
  console.log("客户端连接成功");
  console.log(e);

  const port = e.ports[0];
  map.set(port, clientId);
  ports.push({ clientId, port });

  port.postMessage({ type: "init", counter, message: "连接成功", clientId });

  port.onmessage = (e) => {
    const id = map.get(port);
    console.log(`收到客户端${id}发的消息：`, e);
    const { type } = e.data;
    let msg = "";

    switch (type) {
      case "plus":
        counter++;
        msg = "增加";
        break;
      case "sub":
        counter--;
        msg = "减少";
        break;
      case "reset":
        counter = 0;
        msg = "重置";
        break;
    }

    ports.forEach((o) => {
      try {
        o.port.postMessage({ counter, message: `客户端${id}: ${msg}了计数器` });
      } catch (e) {
        console.error(e);
      }
    });
  };

  clientId++;
};
