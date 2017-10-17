var GROVEACCELEROMETER = function(i2cPort,slaveAddress){
  this.i2cPort = i2cPort;
  this.i2cSlave = null;
  this.slaveAddress = slaveAddress;
};

GROVEACCELEROMETER.prototype = {
  EARTH_GRAVITY_MS2:9.80665,
  SCALE_MULTIPLIER:0.004,
  init: function(){
    return new Promise((resolve, reject)=>{
      this.i2cPort.open(this.slaveAddress).then(async (i2cSlave)=>{
        await i2cSlave.write8(0x2d,0x00);
        await i2cSlave.write8(0x2d,0x16);
        await i2cSlave.write8(0x2d,0x08);
        this.i2cSlave = i2cSlave;
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
        var v = new Array();
        v.push(await this.i2cSlave.read8(0x32));
        v.push(await this.i2cSlave.read8(0x33));
        v.push(await this.i2cSlave.read8(0x34));
        v.push(await this.i2cSlave.read8(0x35));
        v.push(await this.i2cSlave.read8(0x36));
        v.push(await this.i2cSlave.read8(0x37));
        var x = v[0] + (v[1] << 8);
        if(x & (1 << 16 - 1)){x = x - (1<<16);}
        var y = v[2] + (v[3] << 8);
        if(y & (1 << 16 - 1)){y = y - (1<<16);}
        var z = v[4] + (v[5] << 8);
        if(z & (1 << 16 - 1)){z = z - (1<<16);}
            
        x = x*this.SCALE_MULTIPLIER;
        y = y*this.SCALE_MULTIPLIER;
        z = z*this.SCALE_MULTIPLIER;
        x = x*this.EARTH_GRAVITY_MS2;
        y = y*this.EARTH_GRAVITY_MS2;
        z = z*this.EARTH_GRAVITY_MS2;
            
        x=Math.round(x*10000)/10000;
        y=Math.round(y*10000)/10000;
        z=Math.round(z*10000)/10000;
        
        var values = {"x": x, "y": y, "z": z};
        resolve(values);
      }
    });  
  }
};