window.addEventListener("load", mainFunction, false);

async function mainFunction() {
  var head = document.getElementById("head");
  var i2cAccess = await navigator.requestI2CAccess();
  try {
    var port = i2cAccess.ports.get(1);
    var pca9685 = new PCA9685(port, 0x40);
    var angle = 0;
    // console.log("angle"+angle);
    // servo setting for sg90
    // Servo PWM pulse: min=0.0011[sec], max=0.0019[sec] angle=+-60[deg]
    await pca9685.init(0.001, 0.002, 30);
    while (1) {
      angle = angle <= -30 ? 30 : -30;
      // console.log("angle"+angle);
      await pca9685.setServo(0, angle);
      // console.log('value:', angle);
      head.innerHTML = angle;
      await sleep(1000);
    }
  } catch (e) {
    console.error("error", e);
  }
}
