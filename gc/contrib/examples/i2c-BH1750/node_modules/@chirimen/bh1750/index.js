(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.BH1750 = factory());
}(this, (function () { 'use strict';

	// BH1750 driver for CHIRIMEN WebI2C
	// ported from https://gist.github.com/oskar456/95c66d564c58361ecf9f
	// by Satoru Takagi

	/** @param {number} ms Delay for a number of milliseconds. */
	const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

	var BH1750 = function (i2cPort, slaveAddress) {
		this.digP = [];
		this.i2cPort = i2cPort;
		this.i2cSlave = null;
		if (slaveAddress){
			this.slaveAddress = slaveAddress;
		} else {
			this.slaveAddress = 0x23;
		}

		this.POWER_DOWN = 0x00; // No active state
		this.POWER_ON   = 0x01; // Power on
		this.RESET      = 0x07; // Reset data register value
		this.CONTINUOUS_LOW_RES_MODE = 0x13;
		this.CONTINUOUS_HIGH_RES_MODE_1 = 0x10;
		this.CONTINUOUS_HIGH_RES_MODE_2 = 0x11;
		this.ONE_TIME_HIGH_RES_MODE_1 = 0x20;
		this.ONE_TIME_HIGH_RES_MODE_2 = 0x21;
		this.ONE_TIME_LOW_RES_MODE = 0x23;

	};

	BH1750.prototype = {
		init: async function(){
			this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
			await this.power_down();
			await this.set_sensitivity();
		},
		_set_mode: async function(mode){
			this.mode = mode;
			this.i2cSlave.writeByte(mode);
		},
	    power_down: async function(){
	        await this._set_mode(this.POWER_DOWN);
	    },
	    power_on: async function(){
	        await this._set_mode(this.POWER_ON);
	    },
	    reset: async function(){
	        await this.power_on();
	        await this._set_mode(this.RESET);
	    },
	    cont_low_res: async function(){
	        await this._set_mode(this.CONTINUOUS_LOW_RES_MODE);
	    },
	    cont_high_res: async function(){
	        await this._set_mode(this.CONTINUOUS_HIGH_RES_MODE_1);
	    },
	    cont_high_res2: async function(){
	        await this._set_mode(this.CONTINUOUS_HIGH_RES_MODE_2);
	    },
	    oneshot_low_res: async function(){
	        await this._set_mode(this.ONE_TIME_LOW_RES_MODE);
	    },
	    oneshot_high_res: async function(){
	        await this._set_mode(this.ONE_TIME_HIGH_RES_MODE_1);
	    },
	    oneshot_high_res2: async function(){
	        await this._set_mode(this.ONE_TIME_HIGH_RES_MODE_2);
	    },
		set_sensitivity: async function(sensitivity){
			//Set the sensor sensitivity.
			//Valid values are 31 (lowest) to 254 (highest), default is 69.
			if ( !sensitivity ){sensitivity=69;}
			if (sensitivity < 31){
	            this.mtreg = 31;
			} else if(sensitivity > 254){
	            this.mtreg = 254;
			}else {
	            this.mtreg = sensitivity;
			}
	        await this.power_on();
	        await this._set_mode(0x40 | (this.mtreg >> 5));
	        await this._set_mode(0x60 | (this.mtreg & 0x1f));
	        await this.power_down();
		},
		get_result: async function () {
			// Return current measurement result in lx.
			var data = await this.i2cSlave.readBytes(2);
			var count = data[1] | data[0] << 8;
			var mode2coeff =  1;
			if (this.mode == this.ONE_TIME_HIGH_RES_MODE_2 || this.mode == this.CONTINUOUS_HIGH_RES_MODE_2) {
				mode2coeff = 2;
			}
			var ratio = 1 / (1.2 * (this.mtreg / 69.0) * mode2coeff);
			return (ratio * count);
		},
		wait_for_result: async function(additional){
			if ( !additional ){
				additional=0;
			}
	//        var basetime = 0.128;
	        var basetime = 0.14;
			if ((this.mode & 0x03) == 0x03){
	//			basetime= 0.018;
				basetime= 0.03;
			}

	        await sleep(1000*(basetime * (this.mtreg/69.0) + additional));
		},
		do_measurement: async function(mode, additional_delay){
	        /**
	        Perform complete measurement using command
	        specified by parameter mode with additional
	        delay specified in parameter additional_delay.
	        Return output value in Lx.
	        **/
			if ( !additional_delay){
				additional_delay=0;
			}

	        await this.reset();
	        await this._set_mode(mode);
	        await this.wait_for_result(additional_delay);
			return (await this.get_result());
		},
		measure_low_res: async function(additional_delay){
			return (await this.do_measurement(this.ONE_TIME_LOW_RES_MODE, additional_delay));
		},
		measure_high_res: async function(additional_delay){
	        return (await this.do_measurement(this.ONE_TIME_HIGH_RES_MODE_1, additional_delay));
		},
		measure_high_res2: async function(additional_delay){
	        return (await this.do_measurement(this.ONE_TIME_HIGH_RES_MODE_2, additional_delay));
		}
	};

	return BH1750;

})));
