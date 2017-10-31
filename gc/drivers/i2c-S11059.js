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
    var val = ((high << 8) + low);
    return val;
  },

  // read Real RGB+Ir data
  read: function() {
    return new Promise(async (resolve, reject)=>{
      if(this.i2cSlave == null){
        reject("i2cSlave Address does'nt yet open!");
      }else{
        await this.i2cSlave.write8(0x00, 0x8a);
        await this.i2cSlave.write8(0x00, 0x0a);
        await this.sleep(100);

        await this.i2cSlave.writeByte(0x03);
        this.i2cSlave.readBytes(8).then((v)=>{
//          console.log("RH:"+v[0]+" RL:"+v[1]+" GH:"+v[2]+" GL:"+v[3]+" BH:"+v[4]+" GL:"+v[5]);
          var red = this.compose(v[0], v[1]);
          var green = this.compose(v[2], v[3]);
          var blue = this.compose(v[4], v[5]);
          var ir = this.compose(v[6], v[7]);
//          console.log("read ok!");
          resolve([red, green, blue,ir]);

        },(err)=>{
          reject(err);

        });

      }
    });
  },

  // read Normalization RGB 8bit data with auto-gain)
  readR8G8B8: function() {
    return new Promise(async (resolve, reject)=>{
      if(this.i2cSlave == null){
        reject("i2cSlave Address does'nt yet open!");
      }else{
        await this.i2cSlave.write8(0x00, 0x8a);
        await this.i2cSlave.write8(0x00, 0x0a);
        await this.sleep(100);

        await this.i2cSlave.writeByte(0x03);
        this.i2cSlave.readBytes(8).then((v)=>{
//          console.log("RH:"+v[0]+" RL:"+v[1]+" GH:"+v[2]+" GL:"+v[3]+" BH:"+v[4]+" GL:"+v[5]);
          var red_org = this.compose(v[0], v[1]);
          var green_org = this.compose(v[2], v[3] * 1.1);
          var blue_org = this.compose(v[4], v[5] * 2.6);
          var gain_level = 0;

         // Auto-gain
          if ((red_org > green_org) && (red_org > blue_org)) {
            gain_level = (red_org /255);
          }
          if ((green_org > red_org) && (green_org > blue_org)) {
            gain_level = (green_org /255);
          }
          if ((blue_org > green_org) && (blue_org > red_org)) {
            gain_level = (blue_org /255);
          }
          if (gain_level < 1) {
             gain_level = 1;
          }
          var red8= (red_org / gain_level) & 0xff;
          var green8 = (green_org / gain_level) & 0xff;
          var blue8 = (blue_org / gain_level) & 0xff;

//          console.log("read ok!");
          resolve([red8, green8, blue8,gain_level]);

        },(err)=>{
          reject(err);

        });

      }
    });
  }
}