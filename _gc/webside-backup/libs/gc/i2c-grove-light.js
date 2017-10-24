var GROVELIGHT = function(i2cPort,slaveAddress){
  this.i2cPort = i2cPort;
  this.slaveAddress = slaveAddress;
  this.ch1=null;
  this.ch2=null;
};

GROVELIGHT.prototype = {
  sleep: function(ms, generator){
    setTimeout(function(){generator.next()}, ms);
  },
  init: function(){
    var self = this;
    return new Promise(function(resolve, reject){
      self.i2cPort.open(self.slaveAddress)
      .then(function(i2cSlave){
        var thread = (function* () {

          i2cSlave.write8(0x80,0x03);
          yield self.sleep(10, thread);
          i2cSlave.write8(0x81,0x00);
          yield self.sleep(14, thread);
          i2cSlave.write8(0x86,0x00);
          yield self.sleep(10, thread);
          i2cSlave.write8(0x80,0x00);
          yield self.sleep(10, thread);

          resolve();
        })();

        thread.next();

      });
    });
  },
  calculateLux: function(iGain,tInt,iType){
    var chScale = 0x7517 << 4;
    var LUX_SCALE = 14;
    var CH_SCALE = 10;
    var RATIO_SCALE = 9; 

    var K1T = 0x0040;   // 0.125 * 2^RATIO_SCALE
    var B1T = 0x01f2;   // 0.0304 * 2^LUX_SCALE
    var M1T = 0x01be;   // 0.0272 * 2^LUX_SCALE
    var K2T = 0x0080;   // 0.250 * 2^RATIO_SCA
    var B2T = 0x0214;   // 0.0325 * 2^LUX_SCALE
    var M2T = 0x02d1;   // 0.0440 * 2^LUX_SCALE
    var K3T = 0x00c0;   // 0.375 * 2^RATIO_SCALE
    var B3T = 0x023f;   // 0.0351 * 2^LUX_SCALE
    var M3T = 0x037b;   // 0.0544 * 2^LUX_SCALE
    var K4T = 0x0100;   // 0.50 * 2^RATIO_SCALE
    var B4T = 0x0270;   // 0.0381 * 2^LUX_SCALE
    var M4T = 0x03fe;   // 0.0624 * 2^LUX_SCALE
    var K5T = 0x0138;   // 0.61 * 2^RATIO_SCALE
    var B5T = 0x016f;   // 0.0224 * 2^LUX_SCALE
    var M5T = 0x01fc;   // 0.0310 * 2^LUX_SCALE
    var K6T = 0x019a;   // 0.80 * 2^RATIO_SCALE
    var B6T = 0x00d2;   // 0.0128 * 2^LUX_SCALE
    var M6T = 0x00fb;   // 0.0153 * 2^LUX_SCALE
    var K7T = 0x029a;   // 1.3 * 2^RATIO_SCALE
    var B7T = 0x0018;   // 0.00146 * 2^LUX_SCALE
    var M7T = 0x0012;   // 0.00112 * 2^LUX_SCALE
    var K8T = 0x029a;   // 1.3 * 2^RATIO_SCALE
    var B8T = 0x0000;   // 0.000 * 2^LUX_SCALE
    var M8T = 0x0000;   // 0.000 * 2^LUX_SCALE

    var channel0 = (this.ch0 * chScale) >> CH_SCALE;
    var channel1 = (this.ch1 * chScale) >> CH_SCALE;

    var ratio1 = 0;
    if (channel0!= 0) ratio1 = (channel1 << (RATIO_SCALE+1))/channel0;
    var ratio = (ratio1 + 1) >> 1;

    if ((ratio >= 0) && (ratio <= K1T)){b=B1T; m=M1T;
    }else if (ratio <= K2T){b=B2T; m=M2T;
    }else if (ratio <= K3T){b=B3T; m=M3T;
    }else if (ratio <= K4T){b=B4T; m=M4T;
    }else if (ratio <= K5T){b=B5T; m=M5T;
    }else if (ratio <= K6T){b=B6T; m=M6T;
    }else if (ratio <= K7T){b=B7T; m=M7T;
    }else if (ratio > K8T){b=B8T; m=M8T;}

    var temp=((channel0*b)-(channel1*m));
    if(temp<0) temp=0;
    temp+=(1<<(LUX_SCALE-1));
    var lux=temp>>LUX_SCALE;
    return lux;

  },
  read: function(){
    var self = this;
    return new Promise(function(resolve, reject){
      self.i2cPort.open(self.slaveAddress)
      .then(function(i2cSlave){
        var thread = (function* () {

          i2cSlave.write8(0x80,0x03);
          yield self.sleep(14, thread);

          // get light value
          Promise.all([
            i2cSlave.read8(0x8d,true),
            i2cSlave.read8(0x8c,true),
            i2cSlave.read8(0x8f,true),
            i2cSlave.read8(0x8e,true)
          ]).then(function(v){
            self.ch0 = ((v[0] << 8) | v[1]);
            self.ch1 = ((v[2] << 8) | v[3]);
            if(self.ch0 /self.ch1 < 2 && self.ch0 > 4900){
              reject();
            }
            value = self.calculateLux(0,0,0)
            console.log(self.ch0,self.ch1,value);
            i2cSlave.write8(0x80,0x00).then(function(){
              resolve(value);
            });
          }).catch(reject);
        })();

        thread.next();
      });
    });  
  }
};