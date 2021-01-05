var GP2Y0E03 = function(i2cPort,slaveAddress) {
  this.i2cPort = i2cPort;
  this.i2cSlave = null;
  this.slaveAddress = slaveAddress;
}

GP2Y0E03.prototype = {
  sleep: function(ms){
    return new Promise((resolve)=>{setTimeout(resolve,ms);});
  },
  init: function() {
    return new Promise((resolve, reject)=>{
      this.i2cPort.open(this.slaveAddress).then(async (i2cSlave)=>{
        this.i2cSlave = i2cSlave;
        await this.i2cSlave.write8(0xee,0x06); // Software Reset
        await this.sleep(10);
        resolve();
      }).catch((reason)=>{
        reject(reason);
      });
    });
  },
  compose: function(shift,dist_h,dist_l) {
    var val = null;
    if ((dist_l >= 0) && (dist_l < 16) && (dist_h != 255)) {
      switch(shift) {
      case 1:
        val = ((dist_h << 4) + dist_l) /128;
        break;
      case 2:
        val = ((dist_h << 4) + dist_l) /64;
      break;
      default:
        break;
      }
    }
    return val;
  },

  // read  data
  read: async function () {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    var shift = await this.i2cSlave.read8(0x35);  // Shift Bit
    var dist_h = await this.i2cSlave.read8(0x5e); // Distance[11:4]
    var dist_l = await this.i2cSlave.read8(0x5f); // Distance[3:0]
    var distance = this.compose(shift, dist_h, dist_l);
    return distance;
  }
}

export default GP2Y0E03;
