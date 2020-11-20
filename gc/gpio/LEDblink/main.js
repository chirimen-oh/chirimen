// プログラムの本体となる関数です。await で扱えるよう全体を async 関数で宣言します。
async function main() {
  // 非同期関数は await を付けて呼び出します。
  const gpioAccess = await navigator.requestGPIOAccess(); // GPIO を操作する
  const port = gpioAccess.ports.get(26); // 26 番ポートを操作する

  await port.export("out"); // ポートを出力モードに設定

  // 無限ループ
  while (true) {
    // 1秒間隔で LED が点滅します。
    await port.write(1); // LED を点灯
    await sleep(1000); // 1000 ms (1秒) 待機
    await port.write(0); // LED を消灯
    await sleep(1000); // 1000 ms (1秒) 待機
  }
}

// await sleep(ms) と呼ぶと、指定 ms (ミリ秒) 待機
// 同じものが polyfill.js でも定義されているため省略可能
function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// 宣言した関数を実行します。このプログラムのエントリーポイントです。
main();
