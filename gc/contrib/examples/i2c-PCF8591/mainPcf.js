window.addEventListener("load", mainFunction, false);

var pcfPromise;

async function mainFunction() {
  try {
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var pcf = new PCF8591(port);
    await pcf.init();
    pcfPromise = pcf;
    while (1) {
      var adv0 = await pcf.readADC(0);
      var adv1 = await pcf.readADC(1);
      var adv2 = await pcf.readADC(2);
      var adv3 = await pcf.readADC(3);
      adc0.innerHTML = adv0.toFixed(2) + "V";
      adc1.innerHTML = adv1.toFixed(2) + "V";
      adc2.innerHTML = adv2.toFixed(2) + "V";
      adc3.innerHTML = adv3.toFixed(2) + "V";
      await sleep(200);
    }
  } catch (error) {
    console.error("error", error);
  }
}

async function dac(v) {
  var pcf = await pcfPromise;
  await pcf.setDAC(v);
}
