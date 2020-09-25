// VL53L0X driver for CHIRIMEN WebI2C
// 2018/11/21
// Ported from
// https://github.com/adafruit/Adafruit_CircuitPython_VL53L0X/blob/master/adafruit_vl53l0x.py
// and https://github.com/bitbank2/VL53L0X/blob/master/tof.c (has longRangeModeBug?)
// by Satoru Takagi

var VL53L0X = function(i2cPort, slaveAddress, io_timeout_s) {
  this.devConst = {
    _SYSRANGE_START: 0x00,
    _SYSTEM_THRESH_HIGH: 0x0c,
    _SYSTEM_THRESH_LOW: 0x0e,
    _SYSTEM_SEQUENCE_CONFIG: 0x01,
    _SYSTEM_RANGE_CONFIG: 0x09,
    _SYSTEM_INTERMEASUREMENT_PERIOD: 0x04,
    _SYSTEM_INTERRUPT_CONFIG_GPIO: 0x0a,
    _GPIO_HV_MUX_ACTIVE_HIGH: 0x84,
    _SYSTEM_INTERRUPT_CLEAR: 0x0b,
    _RESULT_INTERRUPT_STATUS: 0x13,
    _RESULT_RANGE_STATUS: 0x14,
    _RESULT_CORE_AMBIENT_WINDOW_EVENTS_RTN: 0xbc,
    _RESULT_CORE_RANGING_TOTAL_EVENTS_RTN: 0xc0,
    _RESULT_CORE_AMBIENT_WINDOW_EVENTS_REF: 0xd0,
    _RESULT_CORE_RANGING_TOTAL_EVENTS_REF: 0xd4,
    _RESULT_PEAK_SIGNAL_RATE_REF: 0xb6,
    _ALGO_PART_TO_PART_RANGE_OFFSET_MM: 0x28,
    _I2C_SLAVE_DEVICE_ADDRESS: 0x8a,
    _MSRC_CONFIG_CONTROL: 0x60,
    _PRE_RANGE_CONFIG_MIN_SNR: 0x27,
    _PRE_RANGE_CONFIG_VALID_PHASE_LOW: 0x56,
    _PRE_RANGE_CONFIG_VALID_PHASE_HIGH: 0x57,
    _PRE_RANGE_MIN_COUNT_RATE_RTN_LIMIT: 0x64,
    _FINAL_RANGE_CONFIG_MIN_SNR: 0x67,
    _FINAL_RANGE_CONFIG_VALID_PHASE_LOW: 0x47,
    _FINAL_RANGE_CONFIG_VALID_PHASE_HIGH: 0x48,
    _FINAL_RANGE_CONFIG_MIN_COUNT_RATE_RTN_LIMIT: 0x44,
    _PRE_RANGE_CONFIG_SIGMA_THRESH_HI: 0x61,
    _PRE_RANGE_CONFIG_SIGMA_THRESH_LO: 0x62,
    _PRE_RANGE_CONFIG_VCSEL_PERIOD: 0x50,
    _PRE_RANGE_CONFIG_TIMEOUT_MACROP_HI: 0x51,
    _PRE_RANGE_CONFIG_TIMEOUT_MACROP_LO: 0x52,
    _SYSTEM_HISTOGRAM_BIN: 0x81,
    _HISTOGRAM_CONFIG_INITIAL_PHASE_SELECT: 0x33,
    _HISTOGRAM_CONFIG_READOUT_CTRL: 0x55,
    _FINAL_RANGE_CONFIG_VCSEL_PERIOD: 0x70,
    _FINAL_RANGE_CONFIG_TIMEOUT_MACROP_HI: 0x71,
    _FINAL_RANGE_CONFIG_TIMEOUT_MACROP_LO: 0x72,
    _CROSSTALK_COMPENSATION_PEAK_RATE_MCPS: 0x20,
    _MSRC_CONFIG_TIMEOUT_MACROP: 0x46,
    _SOFT_RESET_GO2_SOFT_RESET_N: 0xbf,
    _IDENTIFICATION_MODEL_ID: 0xc0,
    _IDENTIFICATION_REVISION_ID: 0xc2,
    _OSC_CALIBRATE_VAL: 0xf8,
    _GLOBAL_CONFIG_VCSEL_WIDTH: 0x32,
    _GLOBAL_CONFIG_SPAD_ENABLES_REF_0: 0xb0,
    _GLOBAL_CONFIG_SPAD_ENABLES_REF_1: 0xb1,
    _GLOBAL_CONFIG_SPAD_ENABLES_REF_2: 0xb2,
    _GLOBAL_CONFIG_SPAD_ENABLES_REF_3: 0xb3,
    _GLOBAL_CONFIG_SPAD_ENABLES_REF_4: 0xb4,
    _GLOBAL_CONFIG_SPAD_ENABLES_REF_5: 0xb5,
    _GLOBAL_CONFIG_REF_EN_START_SELECT: 0xb6,
    _DYNAMIC_SPAD_NUM_REQUESTED_REF_SPAD: 0x4e,
    _DYNAMIC_SPAD_REF_EN_START_OFFSET: 0x4f,
    _POWER_MANAGEMENT_GO1_POWER_FORCE: 0x80,
    _VHV_CONFIG_PAD_SCL_SDA__EXTSUP_HV: 0x89,
    _ALGO_PHASECAL_LIM: 0x30,
    _ALGO_PHASECAL_CONFIG_TIMEOUT: 0x30,
    _VCSEL_PERIOD_PRE_RANGE: 0,
    _VCSEL_PERIOD_FINAL_RANGE: 1
  };
  this.i2cPort = i2cPort;
  this.i2cSlave = null;
  if (slaveAddress) {
    this.slaveAddress = slaveAddress;
  } else {
    this.slaveAddress = 0x29;
  }
  if (io_timeout_s) {
    this.io_timeout_s = io_timeout_s;
  } else {
    this.io_timeout_s = 0;
  }
};

VL53L0X.prototype = {
  _decode_timeout: function(val) {
    return (val & 0xff) * Math.pow(2.0, (val & 0xff00) >> 8) + 1;
  },
  _encode_timeout: function(mclks) {
    var timeout_mclks = mclks & 0xffff;
    var ls_byte = 0;
    var ms_byte = 0;
    if (timeout_mclks > 0) {
      ls_byte = timeout_mclks - 1;
      while (ls_byte > 255) {
        ls_byte = ls_byte >> 1;
        ms_byte += 1;
      }
      return ((ms_byte << 8) | (ls_byte & 0xff)) & 0xffff;
    } else {
      return 0;
    }
  },
  init: async function(longRangeMode) {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    var dc = this.devConst;
    var init1 = [
      [0xff, 0x01],
      [0x00, 0x00],
      [0xff, 0x00],
      [0x09, 0x00],
      [0x10, 0x00],
      [0x11, 0x00],
      [0x24, 0x01],
      [0x25, 0xff],
      [0x75, 0x00],
      [0xff, 0x01],
      [0x4e, 0x2c],
      [0x48, 0x00],
      [0x30, 0x20],
      [0xff, 0x00],
      [0x30, 0x09],
      [0x54, 0x00],
      [0x31, 0x04],
      [0x32, 0x03],
      [0x40, 0x83],
      [0x46, 0x25],
      [0x60, 0x00],
      [0x27, 0x00],
      [0x50, 0x06],
      [0x51, 0x00],
      [0x52, 0x96],
      [0x56, 0x08],
      [0x57, 0x30],
      [0x61, 0x00],
      [0x62, 0x00],
      [0x64, 0x00],
      [0x65, 0x00],
      [0x66, 0xa0],
      [0xff, 0x01],
      [0x22, 0x32],
      [0x47, 0x14],
      [0x49, 0xff],
      [0x4a, 0x00],
      [0xff, 0x00],
      [0x7a, 0x0a],
      [0x7b, 0x00],
      [0x78, 0x21],
      [0xff, 0x01],
      [0x23, 0x34],
      [0x42, 0x00],
      [0x44, 0xff],
      [0x45, 0x26],
      [0x46, 0x05],
      [0x40, 0x40],
      [0x0e, 0x06],
      [0x20, 0x1a],
      [0x43, 0x40],
      [0xff, 0x00],
      [0x34, 0x03],
      [0x35, 0x44],
      [0xff, 0x01],
      [0x31, 0x04],
      [0x4b, 0x09],
      [0x4c, 0x05],
      [0x4d, 0x04],
      [0xff, 0x00],
      [0x44, 0x00],
      [0x45, 0x20],
      [0x47, 0x08],
      [0x48, 0x28],
      [0x67, 0x00],
      [0x70, 0x04],
      [0x71, 0x01],
      [0x72, 0xfe],
      [0x76, 0x00],
      [0x77, 0x00],
      [0xff, 0x01],
      [0x0d, 0x01],
      [0xff, 0x00],
      [0x80, 0x01],
      [0x01, 0xf8],
      [0xff, 0x01],
      [0x8e, 0x01],
      [0x00, 0x01],
      [0xff, 0x00],
      [0x80, 0x00]
    ];
    // await this.i2cSlave.read8(ra);
    // await this.i2cSlave.write8(wa,wd);
    // Check identification registers for expected values.
    // From section 3.2 of the datasheet.
    await this.sleep(50);
    if (
      (await this.i2cSlave.read8(0xc0)) != 0xee ||
      (await this.i2cSlave.read8(0xc1)) != 0xaa ||
      (await this.i2cSlave.read8(0xc2)) != 0x10
    ) {
      //			raise RuntimeError('Failed to find expected ID register values. Check wiring!');
    }
    // Initialize access to the sensor.  This is based on the logic from:
    // https://github.com/pololu/vl53l0x-arduino/blob/master/VL53L0X.cpp
    // Set I2C standard mode.
    await this.i2cSlave.write8(0x88, 0x00);
    await this.i2cSlave.write8(0x80, 0x01);
    await this.i2cSlave.write8(0xff, 0x01);
    await this.i2cSlave.write8(0x00, 0x00);
    this._stop_variable = await this.i2cSlave.read8(0x91);
    await this.i2cSlave.write8(0x00, 0x01);
    await this.i2cSlave.write8(0xff, 0x00);
    await this.i2cSlave.write8(0x80, 0x00);
    // disable SIGNAL_RATE_MSRC (bit 1) and SIGNAL_RATE_PRE_RANGE (bit 4)
    // limit checks
    var config_control =
      (await this.i2cSlave.read8(dc._MSRC_CONFIG_CONTROL)) | 0x12;
    await this.i2cSlave.write8(dc._MSRC_CONFIG_CONTROL, config_control);
    // set final range signal rate limit to 0.25 MCPS (million counts per second)
    await this.set_signal_rate_limit(0.25);
    await this.i2cSlave.write8(dc._SYSTEM_SEQUENCE_CONFIG, 0xff);
    var si = await this._get_spad_info(); // .spad_count, .spad_is_aperture
    var spad_count = si.spad_count;
    var spad_is_aperture = si.spad_is_aperture;
    // The SPAD map (RefGoodSpadMap) is read by
    // VL53L0X_get_info_from_device() in the API, but the same data seems to
    // be more easily readable from GLOBAL_CONFIG_SPAD_ENABLES_REF_0 through
    // _6, so read it from there.
    var ref_spad_map = Array(7);
    ref_spad_map[0] = dc._GLOBAL_CONFIG_SPAD_ENABLES_REF_0;
    for (let i = 0; i < 6; i++) {
      ref_spad_map[i + 1] = await this.i2cSlave.read8(
        dc._GLOBAL_CONFIG_SPAD_ENABLES_REF_0 + i
      );
    }
    await this.i2cSlave.write8(0xff, 0x01);
    await this.i2cSlave.write8(dc._DYNAMIC_SPAD_REF_EN_START_OFFSET, 0x00);
    await this.i2cSlave.write8(dc._DYNAMIC_SPAD_NUM_REQUESTED_REF_SPAD, 0x2c);
    await this.i2cSlave.write8(0xff, 0x00);
    await this.i2cSlave.write8(dc._GLOBAL_CONFIG_REF_EN_START_SELECT, 0xb4);

    var first_spad_to_enable = 12;
    if (!spad_is_aperture) {
      first_spad_to_enable = 0;
    }
    var spads_enabled = 0;

    for (let i = 0; i < 48; i++) {
      if (i < first_spad_to_enable || spads_enabled == spad_count) {
        // This bit is lower than the first one that should be enabled,
        // or (reference_spad_count) bits have already been enabled, so
        // zero this bit.
        ref_spad_map[1 + Math.floor(i / 8)] &= ~(1 << i % 8);
      } else if (((ref_spad_map[1 + Math.floor(i / 8)] >> i % 8) & 0x01) > 0) {
        spads_enabled += 1;
      }
    }

    for (let i = 1; i < 7; i++) {
      await this.i2cSlave.write8(ref_spad_map[0], ref_spad_map[i]);
    }
    for (let i = 0; i < init1.length; i++) {
      await this.i2cSlave.write8(init1[i][0], init1[i][1]);
    }

    await this.i2cSlave.write8(dc._SYSTEM_INTERRUPT_CONFIG_GPIO, 0x04);
    var gpio_hv_mux_active_high = await this.i2cSlave.read8(
      dc._GPIO_HV_MUX_ACTIVE_HIGH
    );
    await this.i2cSlave.write8(
      dc._GPIO_HV_MUX_ACTIVE_HIGH,
      gpio_hv_mux_active_high & ~0x10
    ); // active low
    await this.i2cSlave.write8(dc._SYSTEM_INTERRUPT_CLEAR, 0x01);
    this._measurement_timing_budget_us = await this.get_measurement_timing_budget();
    await this.i2cSlave.write8(dc._SYSTEM_SEQUENCE_CONFIG, 0xe8);
    await this.set_measurement_timing_budget(
      this._measurement_timing_budget_us
    );
    await this.i2cSlave.write8(dc._SYSTEM_SEQUENCE_CONFIG, 0x01);
    await this._perform_single_ref_calibration(0x40);
    await this.i2cSlave.write8(dc._SYSTEM_SEQUENCE_CONFIG, 0x02);
    await this._perform_single_ref_calibration(0x00);
    // "restore the previous Sequence Config"
    await this.i2cSlave.write8(dc._SYSTEM_SEQUENCE_CONFIG, 0xe8);

    if (longRangeMode) {
      // based on https://github.com/bitbank2/VL53L0X/blob/master/tof.c
      await this.set_signal_rate_limit(0.1);
      await this.setVcselPulsePeriod("VcselPeriodPreRange", 18);
      await this.setVcselPulsePeriod("VcselPeriodFinalRange", 14);
    }

  },
  getRange: async function() {
    // Perform a single reading of the range for an object in front of
    // the sensor and return the distance in millimeters.

    // Adapted from readRangeSingleMillimeters &
    // readRangeContinuousMillimeters in pololu code at:
    //  https://github.com/pololu/vl53l0x-arduino/blob/master/VL53L0X.cpp
    var dc = this.devConst;

    await this.i2cSlave.write8(0x80, 0x01);
    await this.i2cSlave.write8(0xff, 0x01);
    await this.i2cSlave.write8(0x00, 0x00);
    await this.i2cSlave.write8(0x91, this._stop_variable);
    await this.i2cSlave.write8(0x00, 0x01);
    await this.i2cSlave.write8(0xff, 0x00);
    await this.i2cSlave.write8(0x80, 0x00);
    await this.i2cSlave.write8(dc._SYSRANGE_START, 0x01);
    var ss = await this.i2cSlave.read8(dc._SYSRANGE_START);
    while ((ss & 0x01) > 0) {
      await this.sleep(30);
      ss = await this.i2cSlave.read8(dc._SYSRANGE_START);
    }
    var ris = await this.i2cSlave.read8(dc._RESULT_INTERRUPT_STATUS);
    while ((ris & 0x07) == 0) {
      await this.sleep(30);
      ris = await this.i2cSlave.read8(dc._RESULT_INTERRUPT_STATUS);
    }
    // assumptions: Linearity Corrective Gain is 1000 (default)
    // fractional ranging is not enabled
    var range_mm = await this._read_u16(dc._RESULT_RANGE_STATUS + 10);
    await this.i2cSlave.write8(dc._SYSTEM_INTERRUPT_CLEAR, 0x01);
    return range_mm;
  },
  _perform_single_ref_calibration: async function(vhv_init_byte) {
    // based on VL53L0X_perform_single_ref_calibration() from ST API.
    var dc = this.devConst;
    await this.i2cSlave.write8(
      dc._SYSRANGE_START,
      0x01 | (vhv_init_byte & 0xff)
    );
    var ris = (await this.i2cSlave.read8(dc._RESULT_INTERRUPT_STATUS)) & 0x07;
    while (ris == 0x00) {
      await this.sleep(30);
      ris = (await this.i2cSlave.read8(dc._RESULT_INTERRUPT_STATUS)) & 0x07;
    }
    await this.i2cSlave.write8(dc._SYSTEM_INTERRUPT_CLEAR, 0x01);
    await this.i2cSlave.write8(dc._SYSRANGE_START, 0x00);
  },
  get_measurement_timing_budget: async function() {
    // The measurement timing budget in microseconds.
    var budget_us = 1910 + 960; // Start overhead + end overhead.
    var sse = await this._get_sequence_step_enables(); // tcc, dss, msrc, pre_range, final_range
    var st = await this._get_sequence_step_timeouts(sse.pre_range);
    // msrc_dss_tcc_us, pre_range_us, final_range_us, _, _ = step_timeouts;
    if (sse.tcc) {
      budget_us += st.msrc_dss_tcc_us + 590;
    }
    if (sse.dss) {
      budget_us += 2 * (st.msrc_dss_tcc_us + 690);
    } else if (sse.msrc) {
      budget_us += st.msrc_dss_tcc_us + 660;
    }
    if (sse.pre_range) {
      budget_us += st.pre_range_us + 660;
    }
    if (sse.final_range) {
      budget_us += st.final_range_us + 550;
    }
    this._measurement_timing_budget_us = budget_us;
    return budget_us;
  },
  set_measurement_timing_budget: async function(budget_us) {
    var dc = this.devConst;
    if (budget_us < 20000) {
      console.error("ERROR :", budget_us);
      return;
    }
    var used_budget_us = 1320 + 960; // Start (diff from get) + end overhead
    var sse = await this._get_sequence_step_enables(); // tcc, dss, msrc, pre_range, final_range
    // tcc,dss,msrc,pre_range,final_range
    var st = await this._get_sequence_step_timeouts(sse.pre_range);
    // msrc_dss_tcc_us, pre_range_us, final_range_us, final_range_vcsel_period_pclks, pre_range_mclks
    if (sse.tcc) {
      used_budget_us += st.msrc_dss_tcc_us + 590;
    }
    if (sse.dss) {
      used_budget_us += 2 * (st.msrc_dss_tcc_us + 690);
    } else if (sse.msrc) {
      used_budget_us += st.msrc_dss_tcc_us + 660;
    }
    if (sse.pre_range) {
      used_budget_us += st.pre_range_us + 660;
    }
    if (sse.final_range) {
      used_budget_us += 550;
      // "Note that the final range timeout is determined by the timing
      // budget and the sum of all other timeouts within the sequence.
      // If there is no room for the final range timeout, then an error
      // will be set. Otherwise the remaining time will be applied to
      // the final range."
      if (used_budget_us > budget_us) {
        console.error("Requested timeout too big.");
        return;
      }
      var final_range_timeout_us = budget_us - used_budget_us;
      var final_range_timeout_mclks = this._timeout_microseconds_to_mclks(
        final_range_timeout_us,
        st.final_range_vcsel_period_pclks
      );
      if (sse.pre_range) {
        final_range_timeout_mclks += st.pre_range_mclks;
      }
      await this._write_u16(
        dc._FINAL_RANGE_CONFIG_TIMEOUT_MACROP_HI,
        this._encode_timeout(final_range_timeout_mclks)
      );
      this._measurement_timing_budget_us = budget_us;
    }
  },
  get_signal_rate_limit: async function() {
    //The signal rate limit in mega counts per second.
    var dc = this.devConst;
    var val = await this._read_u16(
      dc._FINAL_RANGE_CONFIG_MIN_COUNT_RATE_RTN_LIMIT
    );
    // Return value converted from 16-bit 9.7 fixed point to float.
    return val / (1 << 7);
  },
  set_signal_rate_limit: async function(val) {
    var dc = this.devConst;
    if (0.0 <= val && val <= 511.99) {
      // OK
    } else {
      console.error("ERROR set_signal_rate_limit:", val);
      return;
    }
    // Convert to 16-bit 9.7 fixed point value from a float.
    val = Math.floor(val * (1 << 7));
    await this._write_u16(dc._FINAL_RANGE_CONFIG_MIN_COUNT_RATE_RTN_LIMIT, val);
  },
  _get_sequence_step_enables: async function() {
    // based on VL53L0X_GetSequenceStepEnables() from ST API
    var dc = this.devConst;
    var sequence_config = await this.i2cSlave.read8(dc._SYSTEM_SEQUENCE_CONFIG);
    var tcc = (sequence_config >> 4) & 0x01;
    var dss = (sequence_config >> 3) & 0x01;
    var msrc = (sequence_config >> 2) & 0x01;
    var pre_range = (sequence_config >> 6) & 0x01;
    var final_range = (sequence_config >> 7) & 0x01;
    return {
      tcc: tcc,
      dss: dss,
      msrc: msrc,
      pre_range: pre_range,
      final_range: final_range
    };
  },
  _get_sequence_step_timeouts: async function(pre_range) {
    // based on get_sequence_step_timeout() from ST API but modified by
    // pololu here:
    //   https://github.com/pololu/vl53l0x-arduino/blob/master/VL53L0X.cpp
    var dc = this.devConst;
    var pre_range_vcsel_period_pclks = await this._get_vcsel_pulse_period(
      dc._VCSEL_PERIOD_PRE_RANGE
    );
    var msrc_dss_tcc_mclks =
      ((await this.i2cSlave.read8(dc._MSRC_CONFIG_TIMEOUT_MACROP)) + 1) & 0xff;
    var msrc_dss_tcc_us = this._timeout_mclks_to_microseconds(
      msrc_dss_tcc_mclks,
      pre_range_vcsel_period_pclks
    );
    var pre_range_mclks = this._decode_timeout(
      await this._read_u16(dc._PRE_RANGE_CONFIG_TIMEOUT_MACROP_HI)
    );
    var pre_range_us = this._timeout_mclks_to_microseconds(
      pre_range_mclks,
      pre_range_vcsel_period_pclks
    );
    var final_range_vcsel_period_pclks = await this._get_vcsel_pulse_period(
      dc._VCSEL_PERIOD_FINAL_RANGE
    );
    var final_range_mclks = this._decode_timeout(
      await this._read_u16(dc._FINAL_RANGE_CONFIG_TIMEOUT_MACROP_HI)
    );
    if (pre_range) {
      final_range_mclks -= pre_range_mclks;
    }
    var final_range_us = this._timeout_mclks_to_microseconds(
      final_range_mclks,
      final_range_vcsel_period_pclks
    );
    return {
      msrc_dss_tcc_us: msrc_dss_tcc_us,
      pre_range_us: pre_range_us,
      final_range_us: final_range_us,
      final_range_vcsel_period_pclks: final_range_vcsel_period_pclks,
      pre_range_mclks: pre_range_mclks
    };
  },
  _get_vcsel_pulse_period: async function(vcsel_period_type) {
    // Disable should be removed when refactor can be tested
    var dc = this.devConst;
    var val;
    if (vcsel_period_type == dc._VCSEL_PERIOD_PRE_RANGE) {
      val = await this.i2cSlave.read8(dc._PRE_RANGE_CONFIG_VCSEL_PERIOD);
      return ((val + 1) & 0xff) << 1;
    } else if (vcsel_period_type == dc._VCSEL_PERIOD_FINAL_RANGE) {
      val = await this.i2cSlave.read8(dc._FINAL_RANGE_CONFIG_VCSEL_PERIOD);
      return ((val + 1) & 0xff) << 1;
    }
    return 255;
  },
  _timeout_mclks_to_microseconds: function(
    timeout_period_mclks,
    vcsel_period_pclks
  ) {
    var macro_period_ns = Math.floor(
      (2304 * vcsel_period_pclks * 1655 + 500) / 1000
    );
    return Math.floor(
      (timeout_period_mclks * macro_period_ns +
        Math.floor(macro_period_ns / 2)) /
        1000
    );
  },
  _timeout_microseconds_to_mclks: function(
    timeout_period_us,
    vcsel_period_pclks
  ) {
    var macro_period_ns = Math.floor(
      (2304 * vcsel_period_pclks * 1655 + 500) / 1000
    );
    return (
      Math.floor(timeout_period_us * 1000 + Math.floor(macro_period_ns / 2)) /
      macro_period_ns
    );
  },
  _get_spad_info: async function() {
    // # Get reference SPAD count and type, returned as a 2-tuple of
    // # count and boolean is_aperture.  Based on code from:
    // #   https://github.com/pololu/vl53l0x-arduino/blob/master/VL53L0X.cpp
    await this.i2cSlave.write8(0x80, 0x01);
    await this.i2cSlave.write8(0xff, 0x01);
    await this.i2cSlave.write8(0x00, 0x00);
    await this.i2cSlave.write8(0xff, 0x06);

    await this.i2cSlave.write8(0x83, (await this.i2cSlave.read8(0x83)) | 0x04);

    await this.i2cSlave.write8(0xff, 0x07);
    await this.i2cSlave.write8(0x81, 0x01);
    await this.i2cSlave.write8(0x80, 0x01);
    await this.i2cSlave.write8(0x94, 0x6b);
    await this.i2cSlave.write8(0x83, 0x00);

    var ox83 = await this.i2cSlave.read8(0x83);
    while (ox83 == 0x00) {
      await this.sleep(30);
      ox83 = await this.i2cSlave.read8(0x83);
    }
    await this.i2cSlave.write8(0x83, 0x01);
    var tmp = await this.i2cSlave.read8(0x92);
    var count = tmp & 0x7f;
    var is_aperture = ((tmp >> 7) & 0x01) == 1;
    await this.i2cSlave.write8(0x81, 0x00);
    await this.i2cSlave.write8(0xff, 0x06);
    await this.i2cSlave.write8(0x83, await this.i2cSlave.read8(0x83 & ~0x04));

    await this.i2cSlave.write8(0xff, 0x01);
    await this.i2cSlave.write8(0x00, 0x01);
    await this.i2cSlave.write8(0xff, 0x00);
    await this.i2cSlave.write8(0x80, 0x00);

    return { spad_count: count, spad_is_aperture: is_aperture };
  },
  _read_u16: async function(address) {
    // Read a 16-bit BE unsigned value from the specified 8-bit address.
    return (
      ((await this.i2cSlave.read8(address)) << 8) |
      (await this.i2cSlave.read8(address + 1))
    );
  },
  _write_u16: async function(address, val) {
    // Write a 16-bit BE unsigned value to the specified 8-bit address.
    await this.i2cSlave.write8(address, (val >> 8) & 0xff);
    await this.i2cSlave.write8(address + 1, val & 0xff);
  },
  read: async function() {
    if (this.i2cSlave == null) {
      throw Error("i2cSlave Address does'nt yet open!");
    }
    var MSB = await this.i2cSlave.read8(0x00);
    var LSB = await this.i2cSlave.read8(0x01);
    var data = ((MSB << 8) + LSB) / 128.0;
    return data;
  },
  getSVal: function (val) {
    return new Int16Array([val])[0];
  },
  setVcselPulsePeriod: async function(vcselPeriodType, period_pclks) {
    // for longRangeMode init()
    // ported from https://github.com/bitbank2/VL53L0X/blob/master/tof.c
    //
    // Set the VCSEL (vertical cavity surface emitting laser) pulse period for the
    // given period type (pre-range or final range) to the given value in PCLKs.
    // Longer periods seem to increase the potential range of the sensor.
    // Valid values are (even numbers only):
    //  pre:  12 to 18 (initialized default: 14)
    //  final: 8 to 14 (initialized default: 10)
    // based on VL53L0X_set_vcsel_pulse_period()
    var dc = this.devConst;

    var vcsel_period_reg = (period_pclks >> 1) - 1;

    var enables = await this.i2cSlave.read8(dc._SYSTEM_SEQUENCE_CONFIG);
    var sse = await this._get_sequence_step_enables(); // tcc, dss, msrc, pre_range, final_range
    var st = await this._get_sequence_step_timeouts(sse.pre_range); // msrc_dss_tcc_us, pre_range_us, final_range_us, final_range_vcsel_period_pclks, pre_range_mclks

    // "Apply specific settings for the requested clock period"
    // "Re-calculate and apply timeouts, in macro periods"

    // "When the VCSEL period for the pre or final range is changed,
    // the corresponding timeout must be read from the device using
    // the current VCSEL period, then the new VCSEL period can be
    // applied. The timeout then must be written back to the device
    // using the new VCSEL period.
    //
    // For the MSRC timeout, the same applies - this timeout being
    // dependant on the pre-range vcsel period."
    if (vcselPeriodType == "VcselPeriodPreRange") {
      // "Set phase check limits"
      switch (period_pclks) {
        case 12:
          await this.i2cSlave.write8(
            dc._PRE_RANGE_CONFIG_VALID_PHASE_HIGH,
            0x18
          );
          break;
        case 14:
          await this.i2cSlave.write8(
            dc._PRE_RANGE_CONFIG_VALID_PHASE_HIGH,
            0x30
          );
          break;
        case 16:
          await this.i2cSlave.write8(
            dc._PRE_RANGE_CONFIG_VALID_PHASE_HIGH,
            0x40
          );
          break;
        case 18:
          await this.i2cSlave.write8(
            dc._PRE_RANGE_CONFIG_VALID_PHASE_HIGH,
            0x50
          );
          break;
        default:
          // invalid period
          return false;
      }
      await this.i2cSlave.write8(dc._PRE_RANGE_CONFIG_VALID_PHASE_LOW, 0x08);
      // apply new VCSEL period
      await this.i2cSlave.write8(
        dc._PRE_RANGE_CONFIG_VCSEL_PERIOD,
        vcsel_period_reg
      );
      // update timeouts
      // set_sequence_step_timeout() begin
      // (SequenceStepId == VL53L0X_SEQUENCESTEP_PRE_RANGE)
      var new_pre_range_timeout_mclks = this._timeout_microseconds_to_mclks(
        st.pre_range_us,
        period_pclks
      );
      await this._write_u16(
        dc._PRE_RANGE_CONFIG_TIMEOUT_MACROP_HI,
        this._encode_timeout(new_pre_range_timeout_mclks)
      );
      // set_sequence_step_timeout() end
      // set_sequence_step_timeout() begin
      // (SequenceStepId == VL53L0X_SEQUENCESTEP_MSRC)
      var new_msrc_timeout_mclks = this._timeout_microseconds_to_mclks(
        st.msrc_dss_tcc_us,
        period_pclks
      );
      await this.i2cSlave.write8(
        dc._MSRC_CONFIG_TIMEOUT_MACROP,
        new_msrc_timeout_mclks > 256 ? 255 : new_msrc_timeout_mclks - 1
      );

      // set_sequence_step_timeout() end
    } else if (vcselPeriodType == "VcselPeriodFinalRange") {
      switch (period_pclks) {
        case 8:
          await this.i2cSlave.write8(
            dc._FINAL_RANGE_CONFIG_VALID_PHASE_HIGH,
            0x10
          );
          await this.i2cSlave.write8(
            dc._FINAL_RANGE_CONFIG_VALID_PHASE_LOW,
            0x08
          );
          await this.i2cSlave.write8(dc._GLOBAL_CONFIG_VCSEL_WIDTH, 0x02);
          await this.i2cSlave.write8(dc._ALGO_PHASECAL_CONFIG_TIMEOUT, 0x0c);
          await this.i2cSlave.write8(0xff, 0x01);
          await this.i2cSlave.write8(dc._ALGO_PHASECAL_LIM, 0x30);
          await this.i2cSlave.write8(0xff, 0x00);
          break;
        case 10:
          await this.i2cSlave.write8(
            dc._FINAL_RANGE_CONFIG_VALID_PHASE_HIGH,
            0x28
          );
          await this.i2cSlave.write8(
            dc._FINAL_RANGE_CONFIG_VALID_PHASE_LOW,
            0x08
          );
          await this.i2cSlave.write8(dc._GLOBAL_CONFIG_VCSEL_WIDTH, 0x03);
          await this.i2cSlave.write8(dc._ALGO_PHASECAL_CONFIG_TIMEOUT, 0x09);
          await this.i2cSlave.write8(0xff, 0x01);
          await this.i2cSlave.write8(dc._ALGO_PHASECAL_LIM, 0x20);
          await this.i2cSlave.write8(0xff, 0x00);
          break;
        case 12:
          await this.i2cSlave.write8(
            dc._FINAL_RANGE_CONFIG_VALID_PHASE_HIGH,
            0x38
          );
          await this.i2cSlave.write8(
            dc._FINAL_RANGE_CONFIG_VALID_PHASE_LOW,
            0x08
          );
          await this.i2cSlave.write8(dc._GLOBAL_CONFIG_VCSEL_WIDTH, 0x03);
          await this.i2cSlave.write8(dc._ALGO_PHASECAL_CONFIG_TIMEOUT, 0x08);
          await this.i2cSlave.write8(0xff, 0x01);
          await this.i2cSlave.write8(dc._ALGO_PHASECAL_LIM, 0x20);
          await this.i2cSlave.write8(0xff, 0x00);
          break;
        case 14:
          await this.i2cSlave.write8(
            dc._FINAL_RANGE_CONFIG_VALID_PHASE_HIGH,
            0x48
          );
          await this.i2cSlave.write8(
            dc._FINAL_RANGE_CONFIG_VALID_PHASE_LOW,
            0x08
          );
          await this.i2cSlave.write8(dc._GLOBAL_CONFIG_VCSEL_WIDTH, 0x03);
          await this.i2cSlave.write8(dc._ALGO_PHASECAL_CONFIG_TIMEOUT, 0x07);
          await this.i2cSlave.write8(0xff, 0x01);
          await this.i2cSlave.write8(dc._ALGO_PHASECAL_LIM, 0x20);
          await this.i2cSlave.write8(0xff, 0x00);
          break;
        default:
          // invalid period
          return false;
      }
      // apply new VCSEL period
      await this.i2cSlave.write8(
        dc._FINAL_RANGE_CONFIG_VCSEL_PERIOD,
        vcsel_period_reg
      );
      // update timeouts
      // set_sequence_step_timeout() begin
      // (SequenceStepId == VL53L0X_SEQUENCESTEP_FINAL_RANGE)
      // "For the final range timeout, the pre-range timeout
      //  must be added. To do this both final and pre-range
      //  timeouts must be expressed in macro periods MClks
      //  because they have different vcsel periods."
      var new_final_range_timeout_mclks = this._timeout_microseconds_to_mclks(
        st.final_range_us,
        period_pclks
      );
      if (enables & dc._SEQUENCE_ENABLE_PRE_RANGE) {
        new_final_range_timeout_mclks += st.pre_range_mclks;
      }
      await this._write_u16(
        dc._FINAL_RANGE_CONFIG_TIMEOUT_MACROP_HI,
        this._encode_timeout(new_final_range_timeout_mclks)
      );
      // set_sequence_step_timeout end
    } else {
      // invalid vcselPeriodType
      return false;
    }

    // "Finally, the timing budget must be re-applied"
    await this.set_measurement_timing_budget(
      this._measurement_timing_budget_us
    );

    // "Perform the phase calibration. This is needed after changing on vcsel period."
    // VL53L0X_perform_phase_calibration() begin

    var sequence_config = await this.i2cSlave.read8(dc._SYSTEM_SEQUENCE_CONFIG);
    await this.i2cSlave.write8(dc._SYSTEM_SEQUENCE_CONFIG, 0x02);
    await this._perform_single_ref_calibration(0x00);
    await this.i2cSlave.write8(dc._SYSTEM_SEQUENCE_CONFIG, sequence_config);

    // VL53L0X_perform_phase_calibration() end

    return true;
  },
  sleep: function(ms) {
    return new Promise(function(resolve) {
      setTimeout(resolve, ms);
    });
  }
};

export default VL53L0X;
