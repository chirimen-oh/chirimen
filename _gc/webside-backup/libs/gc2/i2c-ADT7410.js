var ADT7410 = function(i2cPort,slaveAddress){
  this.i2cPort = i2cPort;
  this.i2cSlave = null;
  this.slaveAddress = slaveAddress;
};

ADT7410.prototype = {
  init: function(){
    return new Promise((resolve, reject)=>{
      this.i2cPort.open(this.slaveAddress).then((i2cSlave)=>{
        this.i2cSlave = i2cSlave;
        console.log("init ok:"+this.i2cSlave);
        resolve();
      },(err)=>{
        reject(err);
      });
    });
  },
  read: function(){
    return new Promise(async (resolve, reject)=>{
      if(this.i2cSlave == null){
        reject("i2cSlave Address does'nt yet open!");
      }else{
         var MSB = await this.i2cSlave.read8(0x00);
         var LSB = await this.i2cSlave.read8(0x01);
         var data = ((MSB << 8) + LSB)/128.0;
         resolve(data);
      }
    });  
  }
};