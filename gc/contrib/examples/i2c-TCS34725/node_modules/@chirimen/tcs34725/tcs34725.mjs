// TCS34725 driver for CHIRIMEN raspberry pi3
// Temperature and Humidity I2C Sensor
// based on https://github.com/adafruit/micropython-adafruit-tcs34725/blob/master/tcs34725.py
// Programmed by Satoru Takagi

/** @param {number} ms Delay for a number of milliseconds. */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

var TCS34725 = function(i2cPort,slaveAddress){
	if (!slaveAddress){
		slaveAddress = 0x29;
	}
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	this.slaveAddress = slaveAddress;



	this._COMMAND_BIT = (0x80);
	this._REGISTER_ENABLE = (0x00);
	this._REGISTER_ATIME = (0x01);
	this._REGISTER_AILT = (0x04);
	this._REGISTER_AIHT = (0x06);
	this._REGISTER_ID = (0x12);
	this._REGISTER_APERS = (0x0c);
	this._REGISTER_CONTROL = (0x0f);
	this._REGISTER_SENSORID = (0x12);
	this._REGISTER_STATUS = (0x13);
	this._REGISTER_CDATA = (0x14);
	this._REGISTER_RDATA = (0x16);
	this._REGISTER_GDATA = (0x18);
	this._REGISTER_BDATA = (0x1a);
	this._ENABLE_AIEN = (0x10);
	this._ENABLE_WEN = (0x08);
	this._ENABLE_AEN = (0x02);
	this._ENABLE_PON = (0x01);
	this._GAINS = [1, 4, 16, 60];
	this._CYCLES = [0, 1, 2, 3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

}

// 工事中・・・

TCS34725.prototype = {
	init: async function () {
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
		this._active = false;
		this.integration_time(2.4);
	},

	active: async function(value){
		if (value == undefined ){
			return this._active;
		}
		if (this._active == value){
			return;
		}
		this._active = value;
		var enable = await this.i2cSlave.read8(this._REGISTER_ENABLE | this._COMMAND_BIT);
		if (value){
			await this.i2cSlave.write8(this._REGISTER_ENABLE | this._COMMAND_BIT, enable | this._ENABLE_PON);
			sleep(3);
			await this.i2cSlave.write8(this._REGISTER_ENABLE | this._COMMAND_BIT, enable | this._ENABLE_PON | this._ENABLE_AEN);
		} else{
			await this.i2cSlave.write8(this._REGISTER_ENABLE | this._COMMAND_BIT, enable & ~(this._ENABLE_PON | this._ENABLE_AEN));
		}
	},
	sensor_id: async function(){
		return ( await this.i2cSlave.read8(this._REGISTER_SENSORID | this._COMMAND_BIT) );
	},
	integration_time: async function(value){
		if (!value){
			return this._integration_time;
		}
		if ( value >= 614.4 ){
			value = 614.4;
		} else if ( value <= 2.4 ){
			value = 2.4;
		}
		var cycles = Math.floor(value / 2.4);
		this._integration_time = cycles * 2.4;
		this.i2cSlave.write8(this._REGISTER_ATIME | this._COMMAND_BIT, 256 - cycles);
	},
	gain: async function(value){
		if (!value){
			return (this._GAINS[await this.i2cSlave.read8(this._REGISTER_CONTROL | this._COMMAND_BIT)]);
		}

		var index= -1;
		for ( var i = 0 ; i < this._GAINS.length ; i++ ){
			if ( value == this._GAINS[i] ){
				index = i;
				break;
			}
		}
		if (index == -1) {
			console.error("gain must be 1, 4, 16 or 60");
			return false;
		}
    await this.i2cSlave.write8(this._REGISTER_CONTROL | this._COMMAND_BIT, index);
	},
	_valid: async function(){
		var v = await this.i2cSlave.read8(this._REGISTER_STATUS | this._COMMAND_BIT);
        return ( v & 0x01);
	},
	read: async function(t_lux){
		var was_active = await this.active();
		await this.active(true);
		while (await this._valid()==0){
			sleep(Math.floor(this._integration_time + 0.9));
		}
		var r = await this.i2cSlave.read16(this._REGISTER_RDATA | this._COMMAND_BIT);
		var g = await this.i2cSlave.read16(this._REGISTER_GDATA | this._COMMAND_BIT);
		var b = await this.i2cSlave.read16(this._REGISTER_BDATA | this._COMMAND_BIT);
		var c = await this.i2cSlave.read16(this._REGISTER_CDATA | this._COMMAND_BIT);
		await this.active(was_active);
		if (!t_lux){
			return { r, g, b, c };
		} else {
			return this._temperature_and_lux(r, g, b, c);
		}
	},
	_temperature_and_lux: function (r, g, b) {
		var x = -0.14282 * r + 1.54924 * g + -0.95641 * b;
		var y = -0.32466 * r + 1.57837 * g + -0.73191 * b;
		var z = -0.68202 * r + 0.77073 * g +  0.56332 * b;
		var d = x + y + z;
		var n = (x / d - 0.3320) / (0.1858 - y / d);
		var cct = 449.0 * n**3 + 3525.0 * n**2 + 6823.3 * n + 5520.33;
		return {
			temperature:cct,
			lux: y
		};
	},
};

export default TCS34725;
