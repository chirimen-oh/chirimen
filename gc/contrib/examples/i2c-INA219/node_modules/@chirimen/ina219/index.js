(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.INA219 = factory());
}(this, (function () { 'use strict';

  // INA219 driver for CHIRIMEN raspberry pi3
  // DC Current Sensor (ADC)
  // Ported from https://github.com/chrisb2/pi_ina219
  // Programmed by Satoru Takagi

  /** @param {number} ms Delay for a number of milliseconds. */
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  var INA219 = function(i2cPort, slaveAddress) {
    if (!slaveAddress) {
      slaveAddress = 0x40;
    }
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;

    // const
    this.RANGE_16V = 0; // Range 0-16 volts
    this.RANGE_32V = 1; // Range 0-32 volts

    this.GAIN_1_40MV = 0; // Maximum shunt voltage 40mV
    this.GAIN_2_80MV = 1; // Maximum shunt voltage 80mV
    this.GAIN_4_160MV = 2; // Maximum shunt voltage 160mV
    this.GAIN_8_320MV = 3; // Maximum shunt voltage 320mV
    this.GAIN_AUTO = -1; // Determine gain automatically

    this.ADC_9BIT = 0; // 9-bit conversion time  84us.
    this.ADC_10BIT = 1; // 10-bit conversion time 148us.
    this.ADC_11BIT = 2; // 11-bit conversion time 2766us.
    this.ADC_12BIT = 3; // 12-bit conversion time 532us.
    this.ADC_2SAMP = 9; // 2 samples at 12-bit, conversion time 1.06ms.
    this.ADC_4SAMP = 10; // 4 samples at 12-bit, conversion time 2.13ms.
    this.ADC_8SAMP = 11; // 8 samples at 12-bit, conversion time 4.26ms.
    this.ADC_16SAMP = 12; // 16 samples at 12-bit,conversion time 8.51ms
    this.ADC_32SAMP = 13; // 32 samples at 12-bit, conversion time 17.02ms.
    this.ADC_64SAMP = 14; // 64 samples at 12-bit, conversion time 34.05ms.
    this.ADC_128SAMP = 15; // 128 samples at 12-bit, conversion time 68.10ms.

    this.__REG_CONFIG = 0x00;
    this.__REG_SHUNTVOLTAGE = 0x01;
    this.__REG_BUSVOLTAGE = 0x02;
    this.__REG_POWER = 0x03;
    this.__REG_CURRENT = 0x04;
    this.__REG_CALIBRATION = 0x05;

    this.__RST = 15;
    this.__BRNG = 13;
    this.__PG1 = 12;
    this.__PG0 = 11;
    this.__BADC4 = 10;
    this.__BADC3 = 9;
    this.__BADC2 = 8;
    this.__BADC1 = 7;
    this.__SADC4 = 6;
    this.__SADC3 = 5;
    this.__SADC2 = 4;
    this.__SADC1 = 3;
    this.__MODE3 = 2;
    this.__MODE2 = 1;
    this.__MODE1 = 0;

    this.__OVF = 1;
    this.__CNVR = 2;

    this.__BUS_RANGE = [16, 32];
    this.__GAIN_VOLTS = [0.04, 0.08, 0.16, 0.32];

    this.__CONT_SH_BUS = 7;

    this.__AMP_ERR_MSG = "Expected current is greater than max possible current ";
    this.__RNG_ERR_MSG =
      "Expected amps , out of range, use a lower value shunt resistor";
    this.__VOLT_ERR_MSG =
      "Invalid voltage range, must be one of: RANGE_16V, RANGE_32V";

    //	this.__LOG_FORMAT = '%(asctime)s - %(levelname)s - INA219 %(message)s';
    this.__LOG_MSG_1 =
      "shunt ohms: , bus max volts: , shunt volts max: , bus ADC: , shunt ADC: ";
    this.__LOG_MSG_2 =
      "calibrate called with: bus max volts: , max shunt volts, max_expected_amps: ";
    this.__LOG_MSG_3 = "Current overflow detected - attempting to increase gain";

    this.__SHUNT_MILLIVOLTS_LSB = 0.01; // 10uV
    this.__BUS_MILLIVOLTS_LSB = 4; // 4mV
    this.__CALIBRATION_FACTOR = 0.04096;
    this.__MAX_CALIBRATION_VALUE = 0xfffe; // Max value supported (65534 decimal)
    this.__CURRENT_LSB_FACTOR = 32800;

    this.__shunt_ohms = 0.1;
  };

  INA219.prototype = {
    init: async function(shunt_ohms, max_expected_amps) {
      this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
      if (shunt_ohms) {
        this._shunt_ohms = shunt_ohms;
      } else {
        this._shunt_ohms = this.__shunt_ohms;
      }
      if (max_expected_amps) {
        this._max_expected_amps = max_expected_amps;
      }
      this._min_device_current_lsb = this._calculate_min_current_lsb();
      this._gain = null;
      this._auto_gain_enabled = false;
    },
    configure: async function(voltage_range, gain, bus_adc, shunt_adc) {
      if (voltage_range == undefined || voltage_range == null) {
        voltage_range = this.RANGE_32V;
      }
      if (gain == undefined || gain == null) {
        gain = this.GAIN_AUTO;
      }
      if (bus_adc == undefined || bus_adc == null) {
        bus_adc = this.ADC_12BIT;
      }
      if (shunt_adc == undefined || shunt_adc == null) {
        shunt_adc = this.ADC_12BIT;
      }

      this.__validate_voltage_range(voltage_range);
      this._voltage_range = voltage_range;

      if (this._max_expected_amps) {
        if (gain == this.GAIN_AUTO) {
          this._auto_gain_enabled = true;
          this._gain = this._determine_gain(this._max_expected_amps);
        } else {
          this._gain = gain;
        }
      } else {
        if (gain != this.GAIN_AUTO) {
          this._gain = gain;
        } else {
          this._auto_gain_enabled = true;
          this._gain = this.GAIN_1_40MV;
        }
      }

      await this._calibrate(
        this.__BUS_RANGE[voltage_range],
        this.__GAIN_VOLTS[this._gain],
        this._max_expected_amps
      );
      await this._configure(voltage_range, this._gain, bus_adc, shunt_adc);
    },
    voltage: async function() {
      var value = await this._voltage_register();
      return (value * this.__BUS_MILLIVOLTS_LSB) / 1000;
    },
    supply_voltage: async function() {
      return (await this.voltage()) + (await this.shunt_voltage()) / 1000;
    },
    current: async function() {
      await this._handle_current_overflow();
      return (await this._current_register()) * this._current_lsb * 1000;
    },
    power: async function() {
      await this._handle_current_overflow();
      return (await this._power_register()) * this._power_lsb * 1000;
    },
    shunt_voltage: async function() {
      await this._handle_current_overflow();
      return (await this._shunt_voltage_register()) * this.__SHUNT_MILLIVOLTS_LSB;
    },
    sleep: async function() {
      var configuration = await this._read_configuration();
      await this._configuration_register(configuration & 0xfff8);
    },
    wake: async function() {
      var configuration = await this._read_configuration();
      await this._configuration_register(configuration | 0x0007);
      await sleep(1);
    },
    current_overflow: async function() {
      return await this._has_current_overflow();
    },
    reset: async function() {
      await this._configuration_register(1 << this.__RST);
    },

    // internal funcs
    _handle_current_overflow: async function() {
      if (this._auto_gain_enabled) {
        while (await this._has_current_overflow()) {
          await this._increase_gain();
        }
      } else {
        if (await this._has_current_overflow()) {
          throw " DeviceRangeError: " + this.__GAIN_VOLTS[this._gain];
        }
      }
    },
    _determine_gain: function(max_expected_amps) {
      var shunt_v = max_expected_amps * this._shunt_ohms;
      if (shunt_v > this.__GAIN_VOLTS[3]) {
        throw " ValueError: " + this.__RNG_ERR_MSG + "," + max_expected_amps;
      }
      var gainIndex = this.__GAIN_VOLTS.length - 1;
      while (this.__GAIN_VOLTS[gainIndex] > shunt_v) {
        --gainIndex;
      }
      return gainIndex + 1; // 多分これで良いと思うんだけど・・・
    },
    _increase_gain: async function() {
      var gain = await this._read_gain();
      if (gain < this.__GAIN_VOLTS.length - 1) {
        gain = gain + 1;
        await this._calibrate(
          this.__BUS_RANGE[this._voltage_range],
          this.__GAIN_VOLTS[gain]
        );
        await this._configure_gain(gain);
        await sleep(1);
      } else {
        throw new Error("DeviceRangeError: " + this.__GAIN_VOLTS[gain]);
      }
    },
    _configure: async function(voltage_range, gain, bus_adc, shunt_adc) {
      var configuration =
        (voltage_range << this.__BRNG) |
        (gain << this.__PG0) |
        (bus_adc << this.__BADC1) |
        (shunt_adc << this.__SADC1) |
        this.__CONT_SH_BUS;
      await this._configuration_register(configuration);
    },
    _calibrate: async function(
      bus_volts_max,
      shunt_volts_max,
      max_expected_amps
    ) {
      var max_possible_amps = shunt_volts_max / this._shunt_ohms;

      this._current_lsb = this._determine_current_lsb(
        max_expected_amps,
        max_possible_amps
      );

      this._power_lsb = this._current_lsb * 20;

      var calibration = Math.trunc(
        this.__CALIBRATION_FACTOR / (this._current_lsb * this._shunt_ohms)
      );
      await this._calibration_register(calibration);
    },
    _determine_current_lsb: function(max_expected_amps, max_possible_amps) {
      var current_lsb;
      if (max_expected_amps) {
        if (max_expected_amps > max_possible_amps) {
          throw new Error("ValueError: " +
            this.__AMP_ERR_MSG +
            " : " +
            max_expected_amps +
            " : " +
            max_possible_amps);
        }
        if (max_expected_amps < max_possible_amps) {
          current_lsb = max_expected_amps / this.__CURRENT_LSB_FACTOR;
        } else {
          current_lsb = max_possible_amps / this.__CURRENT_LSB_FACTOR;
        }
      } else {
        current_lsb = max_possible_amps / this.__CURRENT_LSB_FACTOR;
      }

      if (current_lsb < this._min_device_current_lsb) {
        current_lsb = this._min_device_current_lsb;
      }
      return current_lsb;
    },
    _configuration_register: async function(register_value) {
      await this.__write_register(this.__REG_CONFIG, register_value);
    },
    _read_configuration: async function() {
      return await this.__read_register(this.__REG_CONFIG);
    },
    _calculate_min_current_lsb: function() {
      return (
        this.__CALIBRATION_FACTOR /
        (this._shunt_ohms * this.__MAX_CALIBRATION_VALUE)
      );
    },
    _read_gain: async function() {
      var configuration = await this._read_configuration();
      var gain = (configuration & 0x1800) >> this.__PG0;
      return gain;
    },
    _configure_gain: async function(gain) {
      var configuration = await this._read_configuration();
      configuration = configuration & 0xe7ff;
      await this._configuration_register(configuration | (gain << this.__PG0));
      this._gain = gain;
    },
    _calibration_register: async function(register_value) {
      await this.__write_register(this.__REG_CALIBRATION, register_value);
    },
    _has_current_overflow: async function() {
      var ovf = (await this._read_voltage_register()) & this.__OVF;
      return ovf == 1;
    },
    _voltage_register: async function() {
      var register_value = await this._read_voltage_register();
      return register_value >> 3;
    },
    _read_voltage_register: async function() {
      return await this.__read_register(this.__REG_BUSVOLTAGE);
    },
    _current_register: async function() {
      return await this.__read_register(this.__REG_CURRENT, true);
    },
    _shunt_voltage_register: async function() {
      return await this.__read_register(this.__REG_SHUNTVOLTAGE, true);
    },
    _power_register: async function() {
      return await this.__read_register(this.__REG_POWER);
    },
    __validate_voltage_range: function(voltage_range) {
      if (voltage_range > this.__BUS_RANGE.length - 1) {
        throw "ValueError: " + this.__VOLT_ERR_MSG;
      }
    },
    __write_register: async function(register, register_value) {
      // write16 is little endian
      var bl = register_value & 0xff;
      var bh = register_value >>> 8;
      var rdata = (bl << 8) | bh;
      await this.i2cSlave.write16(register, rdata);
    },
    __read_register: async function(register, negative_value_supported) {
      // read16 is little endian too
      var rdata = await this.i2cSlave.read16(register);
      var bl = rdata >>> 8;
      var bh = rdata & 0xff;
      var register_value = ((bh & 0xff) << 8) | (bl & 0xff);

      if (negative_value_supported) {
        var sign = bh & (1 << 7);
        if (sign) {
          register_value = 0xffff0000 | register_value;
        }
      }
      return register_value;
    },
    __to_bytes: function(register_value) {
      return [(register_value >> 8) & 0xff, register_value & 0xff];
    }
  };

  return INA219;

})));
