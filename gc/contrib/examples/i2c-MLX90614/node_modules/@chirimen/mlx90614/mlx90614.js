(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.MLX90614 = factory());
}(this, (function () { 'use strict';

  // @ts-check
  // MLX90614 pyro termometer driver for CHIRIMEN raspberry pi3
  // Temperature and Humidity I2C Sensor
  // based on https://github.com/CRImier/python-MLX90614/blob/master/mlx90614.py
  // Programmed by Satoru Takagi

  /** @param {number} ms Delay for a number of milliseconds. */
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  var MLX90614 = function(i2cPort, slaveAddress) {
    if (!slaveAddress) {
      slaveAddress = 0x5a;
    }
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;

    // const
    this.MLX90614_RAWIR1 = 0x04;
    this.MLX90614_RAWIR2 = 0x05;
    this.MLX90614_TA = 0x06;
    this.MLX90614_TOBJ1 = 0x07;
    this.MLX90614_TOBJ2 = 0x08;

    this.MLX90614_TOMAX = 0x20;
    this.MLX90614_TOMIN = 0x21;
    this.MLX90614_PWMCTRL = 0x22;
    this.MLX90614_TARANGE = 0x23;
    this.MLX90614_EMISS = 0x24;
    this.MLX90614_CONFIG = 0x25;
    this.MLX90614_ADDR = 0x0e;
    this.MLX90614_ID1 = 0x3c;
    this.MLX90614_ID2 = 0x3d;
    this.MLX90614_ID3 = 0x3e;
    this.MLX90614_ID4 = 0x3f;

    this.comm_retries = 5;
    this.comm_sleep_amount = 100;
  };

  MLX90614.prototype = {
    init: async function() {
      this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    },
    read_reg: async function(reg_addr) {
      for (var i = 0; i < this.comm_retries; i++) {
        try {
          // read16 is little endian too
          var rdata = await this.i2cSlave.read16(reg_addr);
          return rdata;
          //				return this.bus.read_word_data(this.address, reg_addr)
        } catch (e) {
          // "Rate limiting" - sleeping to prevent problems with sensor
          // when requesting data too quickly
          await sleep(this.comm_sleep_amount);
        }
      }
      // By this time, we made a couple requests and the sensor didn't respond
      // (judging by the fact we haven't returned from this function yet)
      // So let's just re-raise the last IOError we got
      throw "READ REG ERROR : " + reg_addr;
    },
    data_to_temp: function(data) {
      var temp = data * 0.02 - 273.15;
      return temp;
    },
    get_amb_temp: async function() {
      var data = await this.read_reg(this.MLX90614_TA);
      return this.data_to_temp(data);
    },
    get_obj_temp: async function() {
      var data = await this.read_reg(this.MLX90614_TOBJ1);
      return this.data_to_temp(data);
    }
  };

  return MLX90614;

})));
