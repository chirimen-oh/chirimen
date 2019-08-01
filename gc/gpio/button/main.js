var ledPort, switchPort; // LEDとスイッチの付いているポート

main(); // 定義したasync関数を実行します（このプログラムのエントリーポイントになっています）

function ledOnOff(v) {
  if (v === 0) {
    ledPort.write(0);
  } else {
    ledPort.write(1);
  }
}

async function main() {
  var gpioAccess = await navigator.requestGPIOAccess();
  ledPort = gpioAccess.ports.get(26); // LEDのPort
  await ledPort.export("out");
  switchPort = gpioAccess.ports.get(5); // タクトスイッチのPort
  await switchPort.export("in");
  switchPort.onchange = function(val) {
    // Port 5の状態を読み込む
    val ^= 1; // switchはPullupなのでOFFで1。LEDはOFFで0なので反転させる
    ledOnOff(val);
  };
}
