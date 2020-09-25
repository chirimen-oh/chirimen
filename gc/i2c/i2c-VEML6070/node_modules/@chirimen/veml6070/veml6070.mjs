// @ts-check

var VEML6070 = function (i2cPort) {
  this.i2cPort = i2cPort;
  this.slaveAddressLSB = 0x38;
  this.slaveAddressMSB = 0x39;
  this.i2cSlaveLSB = null;
  this.i2cSlaveMSB = null;
};

VEML6070.prototype = {
  init:function(){
    return new Promise((resolve) => {
      this.i2cPort.open(this.slaveAddressLSB).then((i2cSlaveLSB)=>{
        this.i2cSlaveLSB = i2cSlaveLSB;
        this.i2cPort.open(this.slaveAddressMSB).then((i2cSlaveMSB)=>{
          this.i2cSlaveMSB = i2cSlaveMSB;
          this.i2cSlaveLSB.writeByte(0x06).then(()=>{
            resolve();
          });
        });
      });
    });
  },
  read:function(){
    return new Promise((resolve, reject)=>{
      Promise.all([
        this.i2cSlaveLSB.readByte(),
        this.i2cSlaveMSB.readByte(),
      ]).then((v)=>{
        var value = ((v[1] << 8) + v[0]);
        resolve(value);
      }).catch(reject);
    });
  }
};

export default VEML6070;
