var canzasi = function(i2cPort){
  this.i2cPort = i2cPort;
  this.slaveAddress = 0x30;
  this.i2cSlave = null;
};

canzasi.prototype = {
  init: function(){
    return new Promise((resolve, reject) => {
      this.i2cPort.open(this.slaveAddress).then((i2cSlave) => {
        this.i2cSlave = i2cSlave;
        console.log("i2cPort.open");
        resolve();
      });
    });
  },
  set : function(value){
    return new Promise((resolve, reject) => {
      if(this.i2cSlave){
        this.i2cSlave.writeByte(value).then(() => {
          resolve();
        },(error) => {
          console.log("error"+error);
        }).catch(reject);
      }else{
        console.log("i2cSlave is gone.....");
      }
    });
  }
};
