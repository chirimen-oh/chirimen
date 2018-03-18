'use strict';

window.addEventListener('load', async ()=>{
  function sleep(msec) {
    return new Promise((resolv)=>{
        setTimeout(resolv,msec);
    });
  }
  let step = 16000;
  const head = document.querySelector('#head');
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const steppingMotor = new SteppingMotor(port,0x12);
  await steppingMotor.init();
//  await steppingMotor.setAccelRate(20);
//  await steppingMotor.setMinSpeed(160);
  await steppingMotor.setSpeed(Math.random()*2000|0);
  for(;;){
    await sleep(1000);
    let step = Math.random()*1600*5;
    if(Math.random()<0.5)
      step=-step;
    await steppingMotor.setSpeed(Math.random()*20000+200);
    head.innerHTML = "MOVE";
    await steppingMotor.move(step);
    head.innerHTML = "STOP";
//    step = -step;
  }
}, false);
