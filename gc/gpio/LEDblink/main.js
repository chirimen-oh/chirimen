main(); // 定義したasync関数を実行します（このプログラムのエントリーポイントになっています）

async function main() {
  // プログラムの本体となる関数、非同期処理のためプログラム全体をasync関数で包みます。
  var gpioAccess = await navigator.requestGPIOAccess(); // thenの前の関数をawait接頭辞をつけて呼び出します。
  var port = gpioAccess.ports.get(26);
  await port.export("out");
  var v = 0;
  while (true) {
    // 無限ループ
    await sleep(1000); // 1000ms待機する
    v ^= 1; // v = v ^ 1 (XOR 演算)の意。　vが1の場合はvが0に、0の場合は1に変化する。1でLED点灯、0で消灯するので、1秒間隔でLEDがON OFFする。
    port.write(v);
  }
}
