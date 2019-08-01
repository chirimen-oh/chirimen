main();

async function main() {
  let step = 1600;
  const head = document.getElementById("head");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const steppingMotor = new SteppingMotor(port, 0x12);
  await steppingMotor.init();
  for (;;) {
    await sleep(1000);
    head.innerHTML = "MOVE";
    await steppingMotor.move(step);
    head.innerHTML = "STOP";
    step = -step;
  }
}
