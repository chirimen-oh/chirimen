main();

async function main() {
  try {
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var ss = new seesaw(port);
  	await ss.init();
  	await ss.pin_mode(10, ss.OUTPUT);
  	await ss.pin_mode(11, ss.OUTPUT);
  	await ss.pin_mode(14, ss.OUTPUT);
  	await ss.pin_mode(15, ss.OUTPUT);
  	await ss.pin_mode( 9, ss.INPUT_PULLUP);
  	await ss.pin_mode(24, ss.INPUT_PULLUP);
  	await ss.pin_mode(25, ss.INPUT_PULLUP);
  	var dr9,dr24,dr25;
  	var dw10=true, dw11=false, dw14=true, dw15=false;
  	var pw = 32;
    while (1) {
    	var adc = await ss.analog_read(5);
    	console.log("adc5:",adc);
    	await ss.digital_write(10, dw10);
    	await ss.digital_write(11, dw11);
    	await ss.digital_write(14, dw14);
    	await ss.digital_write(15, dw15);
    	dr9 = await ss.digital_read(9);
    	dr24 = await ss.digital_read(24);
    	dr25 = await ss.digital_read(25);
    	console.log("pw:",pw);
    	await ss.analog_write(6, pw);
    	
    	tdP10.innerText=dw10;
    	tdP11.innerText=dw11;
    	tdP14.innerText=dw14;
    	tdP15.innerText=dw15;
    	tdP9.innerText =dr9;
    	tdP24.innerText=dr24;
    	tdP25.innerText=dr25;
    	tdP5.innerText=adc;
    	tdP6.innerText=pw;
    	
    	dw15=!dw15;
    	dw14=!dw14;
    	dw11=!dw11;
    	dw10=!dw10;
    	pw+=32;
    	if ( pw > 224 ){
    		pw = 32;
    	}
    	await sleep(500);
    }
  } catch (error) {
    console.error("error", error);
  }
}

