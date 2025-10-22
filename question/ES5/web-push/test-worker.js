/// <reference lib="webworker" />

/** @type {ServiceWorkerGlobalScope} */
// @ts-ignore - 忽略 self 的类型检查
const sw = self;
const CACHE_NAME = "test-worker";

const cachesUrls = ["./sky.jpeg"];
console.log("service worker在运行");
sw.addEventListener("install", (event) => {
  console.log("service worker installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("opened cache");

        return Promise.allSettled(
          cachesUrls.map((url) => {
            return cache.add(url).catch((error) => {
              console.warn("缓存失败：" + url, error);
              return null;
            });
          })
        );
      })
      .then(() => {
        console.log("缓存安装完成");
        return sw.skipWaiting();
      })
  );
});

sw.addEventListener("fetch", (event) => {
  console.log(
    "拦截到请求：" +
      event.request.method +
      " " +
      event.request.url +
      " " +
      event.request.destination
  );

  // 检查是否是对 cat111.jpg 的请求
  if (event.request.url.includes("cat111.jpg")) {
    console.log("拦截 cat111.jpg 请求，返回 sky.jpeg");
    event.respondWith(
      caches.match("./sky.jpeg").then((response) => {
        if (response) {
          console.log("从缓存返回 sky.jpeg");
          return response;
        }
        // 如果缓存中没有，尝试直接获取 sky.jpeg
        console.log("缓存中没有 sky.jpeg，尝试直接获取");
        return fetch("./sky.jpeg");
      })
    );
  }
});
