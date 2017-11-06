var ADS1015 = function(i2cPort,slaveAddress){
  this.i2cPort = i2cPort;
  this.slaveAddress = slaveAddress;
  this.i2cSlave = null;
};

ADS1015.prototype = {
  init: function(){
    return new Promise((resolve, reject) => {
      this.i2cPort.open(this.slaveAddress).then((i2cSlave) => {
        console.log("ADS1015.init OK");
        this.i2cSlave = i2cSlave;
        resolve();
      },(err) => {
        console.log("ADS1015.init() Error: "+error.message);
        reject(err);
      });
    });
  },
  read: function(channel){
    return new Promise((resolve, reject)=>{
      if(this.i2cSlave){
        if((channel > 3)||(channel < 0)){
          console.log("ADS1015.read: channel error"+channel);
          err.code = 5;
          reject(err.message);
        }
        var config = 0x4000 + (channel * 0x1000); // ADC channel 
        config |= 0x8000; // Set 'start single-conversion' bit
        config |= 0x0003; // Disable the comparator (default val)
        config |= 0x0080; // 1600 samples per second (default)
        config |= 0x0100; // Power-down single-shot mode (default)
        config |= 0x0200; // +/-4.096V range = Gain 1
        var confL = config >> 8;
        var confH = config & 0x00ff;
        var data = confH | confL;
        this.i2cSlave.write16(0x01, data).then((v) => {
          setTimeout(()=>{
            this.i2cSlave.read16(0).then((v) =>{
              var vH = (v & 0x00ff) << 8;
              var vL = (v >> 8)& 0x00ffff;
              var value = (vH | vL) >> 4;
              resolve(value);
            },(err) => {
              console.log("ADS1015.read: read16(0) error"+err.message);
              err.code = 3;
              reject(err.message);
            });
          },10);
        }, (err) => {
          console.log("ADS1015.read: write16(0,config) error"+err.message);
          err.code = 2;
          reject(err.message);
        });
      }else{
        console.log("i2cSlave is gone.....");
        err.code = 1;
        reject(err.message);
      }
    });
  }
};