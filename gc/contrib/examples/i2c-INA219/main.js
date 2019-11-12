main();

async function main() {
  try {
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var ina = new INA219(port);
    await ina.init(null);
//    await ina.configure(ina.RANGE_32V,ina.GAIN_8_320MV);
    await ina.configure();
    while (1) {
      var c = await ina.current();
      var p = await ina.power();
      var sh = await ina.shunt_voltage();
      var v = await ina.voltage();
      var sv = await ina.supply_voltage();
      document.getElementById("current").innerHTML = c.toFixed(3);
      document.getElementById("power").innerHTML = p.toFixed(3);
      document.getElementById("shunt").innerHTML = sh.toFixed(3);
      document.getElementById("voltage").innerHTML = v.toFixed(3);
      document.getElementById("supply_voltage").innerHTML = sv.toFixed(3);
      await sleep(200);
    }
  } catch (error) {
    console.error("error", error);
  }
}

