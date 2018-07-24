'use strict';

window.addEventListener('load', async ()=>{
  function sleep(msec) {
    return new Promise((resolv)=>{
        setTimeout(resolv,msec);
    });
  }
  let step = 1600;
  const head = document.querySelector('#head');
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const steppingMotor = new SteppingMotor(port,0x12);
  await steppingMotor.init();
  for(;;){
    await sleep(1000);
    head.innerHTML = "MOVE";
    await steppingMotor.move(step);
    head.innerHTML = "STOP";
    step = -step;
  }
}, false);
