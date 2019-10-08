main();

async function main() {
  try {
    var light = document.getElementById("light");
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var bh1750 = new BH1750(port);
    await bh1750.init();
    await bh1750.set_sensitivity(128);
  	
    while (1) {
//      var val = await bh1750.measure_high_res2();
      var val = await bh1750.measure_high_res();
//      var val = await bh1750.measure_low_res();
      light.innerHTML = val;
      await sleep(300);
    }
  } catch (error) {
    console.error("error", error);
  }
}
