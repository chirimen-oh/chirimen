var S11059 = function(i2cPort,slaveAddress) {
  this.i2cPort = i2cPort;
  this.i2cSlave = null;
  this.slaveAddress = slaveAddress;
}

S11059.prototype = {
  sleep: function(ms){
    return new Promise((resolve)=>{setTimeout(resolve,ms);});
  },
  init: function() {
    return new Promise((resolve, reject)=>{
      this.i2cPort.open(this.slaveAddress).then(async (i2cSlave)=>{
        this.i2cSlave = i2cSlave;
        await this.i2cSlave.write8(0x00, 0x89);
        await this.i2cSlave.write8(0x00, 0x09);
        await this.sleep(10);
        resolve();
      }).catch((reason)=>{
        reject(reason);
      });
    });
  },
  compose: function(high, low) {
    var val = ((high << 8) + low) >> 4;
    return val;
  },
  read: function() {
    return new Promise(async (resolve, reject)=>{
      if(this.i2cSlave == null){
        reject("i2cSlave Address does'nt yet open!");
      }else{
        await this.i2cSlave.write8(0x00, 0x89);
        await this.i2cSlave.write8(0x00, 0x09);
        await this.sleep(10);
        await this.i2cSlave.write8(0x00, 0x0A);
        await this.sleep(100);

        await this.i2cSlave.writeByte(0x03);
        this.i2cSlave.readBytes(6).then((v)=>{
//          console.log("RH:"+v[0]+" RL:"+v[1]+" GH:"+v[2]+" GL:"+v[3]+" BH:"+v[4]+" GL:"+v[5]);
          var red = this.compose(v[0], v[1]);
          var green = this.compose(v[2], v[3]);
          var blue = this.compose(v[4], v[5]);
//          console.log("read ok!");
          resolve([red, green, blue]);

        },(err)=>{
          reject(err);

        });

      }
    });
  }
}
