main();

async function main() {
  try {
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var tcs = new TCS34725(port);
    await tcs.init();
    await tcs.integration_time(50); // default:2.4
    await tcs.gain(4); // gain should be 1|4|16|60
    while (1) {
      var data = await tcs.read();
//      console.log(data);
      document.getElementById("color").innerHTML = "R:"+data.r +" G:"+ data.g +" B:"+ data.b +" C:"+ data.c;
      await sleep(200);
    }
  } catch (error) {
    console.error("error", error);
  }
}

