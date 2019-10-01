var rawData = [];
var voltage = [];

for (var i = 0; i < 2; i++) {
  rawData[i] = document.getElementById("rawData" + i);
  voltage[i] = document.getElementById("voltage" + i);
}
console.log("init0:", rawData, voltage);

main();

async function main() {
  // Initialize WebI2C
  var i2cAccess = await navigator.requestI2CAccess();
  try {
    var port = i2cAccess.ports.get(1);
    var ads1115 = new ADS1x15(port, 0x48);
    await ads1115.init(true,7); // High Gain
    console.log("new");
    var firstTime=true;
    var tare;
    while (1) {
      try {
      	
        var difA = await ads1115.read("0,1");  // p0-p1 differential mode
        rawData[0].innerHTML = "dif chA(0-1):" + difA.toString(16);
        voltage[0].innerHTML = ads1115.getVoltage(difA).toFixed(6) + "V";
      	if ( firstTime){
      		tare = difA;
      		firstTime = false;
      	}
      	
      	weight = difA - tare; 
        rawData[1].innerHTML = "rawData - Tare:" + weight.toString(16);
        voltage[1].innerHTML = ads1115.getVoltage(weight).toFixed(6) + "V";
      	/**
        var difB = await ads1115.read("2,3");
        rawData[1].innerHTML = "dif chB(2-3):" + difB.toString(16);
        voltage[1].innerHTML = ads1115.getVoltage(difB).toFixed(6) + "V";
      	**/
      } catch (error) {
        console.log(error);
      }
      await sleep(100);
    }
  } catch (error) {
    console.log("ADS1115.init error" + error);
  }
}
