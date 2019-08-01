main();

async function main() {
  var head = document.getElementById("head");
  var i2cAccess = await navigator.requestI2CAccess(); // i2cAccessを非同期で取得
  var port = i2cAccess.ports.get(1); // I2C I/Fの1番ポートを取得
  var adt7410 = new ADT7410(port, 0x48); // 取得したポートの0x48アドレスをADT7410ドライバで受信する
  await adt7410.init();
  for (;;) {
    // 無限ループ
    var value = await adt7410.read();
    head.innerHTML = value ? `${value} degree` : "Measurement failure";
    await sleep(1000);
  }
}
