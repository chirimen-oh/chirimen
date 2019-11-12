main();

async function main() {
  try {
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var mlx = new MLX90614(port);
    await mlx.init();
    while (1) {
      var otemp = await mlx.get_obj_temp();
      var atemp = await mlx.get_amb_temp();
      document.getElementById("obj_temperature").innerHTML = otemp.toFixed(2) + "degree";
      document.getElementById("amb_temperature").innerHTML = atemp.toFixed(2) + "degree";
      await sleep(200);
    }
  } catch (error) {
    console.error("error", error);
  }
}

