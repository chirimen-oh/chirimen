var GROVEACCELEROMETER = function(i2cPort,slaveAddress){
  this.i2cPort = i2cPort;
  this.slaveAddress = slaveAddress;
};

GROVEACCELEROMETER.prototype = {
  EARTH_GRAVITY_MS2:9.80665,
  SCALE_MULTIPLIER:0.004,
  sleep: function(ms, generator){
    setTimeout(function(){generator.next()}, ms);
  },
  init: function(){
    var self = this;
    return new Promise(function(resolve, reject){
      self.i2cPort.open(self.slaveAddress)
      .then(function(i2cSlave){
        var thread = (function* () {
          i2cSlave.write8(0x2d,0x00);
          yield self.sleep(10, thread);
          i2cSlave.write8(0x2d,0x16);
          yield self.sleep(10, thread);
          i2cSlave.write8(0x2d,0x08);
          yield self.sleep(10, thread);

          resolve();
        })();

        thread.next();

      });
    });
  },
  read: function(){
    var self = this;
    return new Promise(function(resolve, reject){
      self.i2cPort.open(self.slaveAddress)
      .then(function(i2cSlave){
        var thread = (function* () {

          // get light value
          Promise.all([
            i2cSlave.read8(0x32,true),
            i2cSlave.read8(0x33,true),
            i2cSlave.read8(0x34,true),
            i2cSlave.read8(0x35,true),
            i2cSlave.read8(0x36,true),
            i2cSlave.read8(0x37,true)
          ]).then(function(v){
            var x = v[0] + (v[1] << 8);
            if(x & (1 << 16 - 1)){x = x - (1<<16);}
            var y = v[2] + (v[3] << 8);
            if(y & (1 << 16 - 1)){y = y - (1<<16);}
            var z = v[4] + (v[5] << 8);
            if(z & (1 << 16 - 1)){z = z - (1<<16);}
            
            x = x*self.SCALE_MULTIPLIER;
            y = y*self.SCALE_MULTIPLIER;
            z = z*self.SCALE_MULTIPLIER;
            
            x = x*self.EARTH_GRAVITY_MS2;
            y = y*self.EARTH_GRAVITY_MS2;
            z = z*self.EARTH_GRAVITY_MS2;
            
            x=Math.round(x*10000)/10000;
            y=Math.round(y*10000)/10000;
            z=Math.round(z*10000)/10000;
            
        
            var values = {"x": x, "y": y, "z": z};
            resolve(values);
            }).catch(reject);
        })();

        thread.next();
      });
    });  
  }
};