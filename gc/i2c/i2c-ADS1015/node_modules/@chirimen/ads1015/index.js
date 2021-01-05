(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ADS1015 = factory());
}(this, (function () { 'use strict';

  // @ts-check

  /** @param {number} ms Delay for a number of milliseconds. */
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  var ADS1015 = function (i2cPort, slaveAddress) {
    this.i2cPort = i2cPort;
    this.slaveAddress = slaveAddress;
    this.i2cSlave = null;
  };

  ADS1015.prototype = {
    init: async function () {
      this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    },
    read: async function (channel) {
      if (this.i2cSlave == null) {
        throw new Error("i2cSlave is not open yet.");
      }

      if ((channel < 0) || (3 < channel)) {
        throw new Error("ADS1015.read: channel error" + channel);
      }

      var config = 0x4000 + (channel * 0x1000); // ADC channel
      config |= 0x8000; // Set 'start single-conversion' bit
      config |= 0x0003; // Disable the comparator (default val)
      config |= 0x0080; // 1600 samples per second (default)
      config |= 0x0100; // Power-down single-shot mode (default)
      config |= 0x0200; // +/-4.096V range = Gain 1
      var confL = config >> 8;
      var confH = config & 0x00ff;
      var data = confH | confL;
      await this.i2cSlave.write16(0x01, data);
      await sleep(10);
      var v = await this.i2cSlave.read16(0);
      var vH = (v & 0x00ff) << 8;
      var vL = (v >> 8) & 0x00ffff;
      var value = (vH | vL) >> 4;
      return value;
    }
  };

  return ADS1015;

})));
