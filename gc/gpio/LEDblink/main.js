main();

async function main() {
  var gpioAccess = await navigator.requestGPIOAccess(); // GPIO を操作する
  var port = gpioAccess.ports.get(26); // 26 番ポートを操作する
  var v = 0;

  await port.export("out"); // ポートを出力モードに設定
  for (;;) {
    v = v === 0 ? 1 : 0; // ポートの出力値を 0/1 交互に変更
    port.write(v); // LED を ON/OFF する
    await sleep(1000); // 繰り返し毎に 1000ms 待機
  }
}
