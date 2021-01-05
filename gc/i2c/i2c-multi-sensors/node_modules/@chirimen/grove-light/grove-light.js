// @ts-check

var GROVELIGHT = function (i2cPort, slaveAddress) {
  this.i2cPort = i2cPort;
  this.i2cSlave = null;
  this.slaveAddress = slaveAddress;
  this.ch0 = null;
  this.ch1 = null;
};

GROVELIGHT.prototype = {
  sleep: function(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  },
  init: function() {
    return new Promise((resolve, reject) => {
      this.i2cPort.open(this.slaveAddress).then(
        async i2cSlave => {
          this.i2cSlave = i2cSlave;
          await this.i2cSlave.write8(0x80, 0x03);
          await this.i2cSlave.write8(0x81, 0x00);
          await this.i2cSlave.write8(0x86, 0x00);
          await this.i2cSlave.write8(0x80, 0x00);
          resolve();
        },
        err => {
          reject(err);
        }
      );
    });
  },
  calculateLux: function() {
    const chScale = 0x7517 << 4;
    const LUX_SCALE = 14;
    const CH_SCALE = 10;
    const RATIO_SCALE = 9;
    const K1T = 0x0040; // 0.125 * 2^RATIO_SCALE
    const B1T = 0x01f2; // 0.0304 * 2^LUX_SCALE
    const M1T = 0x01be; // 0.0272 * 2^LUX_SCALE
    const K2T = 0x0080; // 0.250 * 2^RATIO_SCA
    const B2T = 0x0214; // 0.0325 * 2^LUX_SCALE
    const M2T = 0x02d1; // 0.0440 * 2^LUX_SCALE
    const K3T = 0x00c0; // 0.375 * 2^RATIO_SCALE
    const B3T = 0x023f; // 0.0351 * 2^LUX_SCALE
    const M3T = 0x037b; // 0.0544 * 2^LUX_SCALE
    const K4T = 0x0100; // 0.50 * 2^RATIO_SCALE
    const B4T = 0x0270; // 0.0381 * 2^LUX_SCALE
    const M4T = 0x03fe; // 0.0624 * 2^LUX_SCALE
    const K5T = 0x0138; // 0.61 * 2^RATIO_SCALE
    const B5T = 0x016f; // 0.0224 * 2^LUX_SCALE
    const M5T = 0x01fc; // 0.0310 * 2^LUX_SCALE
    const K6T = 0x019a; // 0.80 * 2^RATIO_SCALE
    const B6T = 0x00d2; // 0.0128 * 2^LUX_SCALE
    const M6T = 0x00fb; // 0.0153 * 2^LUX_SCALE
    const K7T = 0x029a; // 1.3 * 2^RATIO_SCALE
    const B7T = 0x0018; // 0.00146 * 2^LUX_SCALE
    const M7T = 0x0012; // 0.00112 * 2^LUX_SCALE
    const K8T = 0x029a; // 1.3 * 2^RATIO_SCALE
    const B8T = 0x0000; // 0.000 * 2^LUX_SCALE
    const M8T = 0x0000; // 0.000 * 2^LUX_SCALE

    var channel0 = (this.ch0 * chScale) >> CH_SCALE;
    var channel1 = (this.ch1 * chScale) >> CH_SCALE;

    var ratio1 = 0;
    if (channel0 != 0) ratio1 = (channel1 << (RATIO_SCALE + 1)) / channel0;
    var ratio = (ratio1 + 1) >> 1;

    var b, m;
    if (ratio >= 0 && ratio <= K1T) {
      b = B1T;
      m = M1T;
    } else if (ratio <= K2T) {
      b = B2T;
      m = M2T;
    } else if (ratio <= K3T) {
      b = B3T;
      m = M3T;
    } else if (ratio <= K4T) {
      b = B4T;
      m = M4T;
    } else if (ratio <= K5T) {
      b = B5T;
      m = M5T;
    } else if (ratio <= K6T) {
      b = B6T;
      m = M6T;
    } else if (ratio <= K7T) {
      b = B7T;
      m = M7T;
    } else if (ratio > K8T) {
      b = B8T;
      m = M8T;
    }

    var temp = channel0 * b - channel1 * m;
    if (temp < 0) temp = 0;
    temp += 1 << (LUX_SCALE - 1);
    var lux = temp >> LUX_SCALE;
    return lux;
  },
  read: async function () {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    await this.i2cSlave.write8(0x80, 0x03);
    await this.sleep(14);
    this.ch0 = await this.i2cSlave.read16(0xac);
    this.ch1 = await this.i2cSlave.read16(0xae);
    if (this.ch0 / this.ch1 < 2 && this.ch0 > 4900) {
      throw new Error("value range error");
    }
    var value = this.calculateLux();
    await this.i2cSlave.write8(0x80, 0x00);
    return (value);
  }
};

export default GROVELIGHT;
