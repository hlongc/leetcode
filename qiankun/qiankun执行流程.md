
1. registerMicroApps注册子应用：内部调用single-spa的registerApplication注册app，等待用户调用start方法，然后通过loadApp来加载app，并且返回对应的生命周期函数mount、bootstrap、unmount
2. 测试
2. loadApp来加载对应的app
3. 嘿嘿
4. qiankun 劫持 appendChild，将 style 添加到 `<qiankun-head>` 中
5. 如果启用了 scopedCSS，还会改写样式选择器
6. 样式只影响容器内的内容，不会污染主应用
