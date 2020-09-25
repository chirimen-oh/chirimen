var GROVEACCELEROMETER = function(i2cPort,slaveAddress){
  this.i2cPort = i2cPort;
  this.i2cSlave = null;
  this.slaveAddress = slaveAddress;
};

GROVEACCELEROMETER.prototype = {
  EARTH_GRAVITY_MS2:9.80665,
  SCALE_MULTIPLIER:0.0039,
  init: function(){
    return new Promise((resolve, reject)=>{
      this.i2cPort.open(this.slaveAddress).then(async (i2cSlave)=>{
        await i2cSlave.write8(0x2d,0x00); // stop sample
        await i2cSlave.write8(0x31,0x08); // FULL_RES , +/-2g
        await i2cSlave.write8(0x2d,0x08); // start 8Hz sample
        this.i2cSlave = i2cSlave;
        resolve();
      },(err)=>{
        reject(err);
      });
    });
  },
  read: async function () {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    await this.i2cSlave.writeByte(0x32);
    var v = await this.i2cSlave.readBytes(6);
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

    x = Math.round(x * 10000) / 10000;
    y = Math.round(y * 10000) / 10000;
    z = Math.round(z * 10000) / 10000;

    var values = {"x": x, "y": y, "z": z};
    return values;
  }
};

export default GROVEACCELEROMETER;
