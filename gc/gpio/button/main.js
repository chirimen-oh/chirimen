main();

async function main() {
  var gpioAccess = await navigator.requestGPIOAccess();
  var ledPort = gpioAccess.ports.get(26); // LEDの付いているポート
  await ledPort.export("out");
  var switchPort = gpioAccess.ports.get(5); // タクトスイッチの付いているポート
  await switchPort.export("in");
  switchPort.onchange = function(val) {
    // スイッチはPullupで離すと1なので反転させる
    ledPort.write(val === 0 ? 1 : 0);
  };
}
