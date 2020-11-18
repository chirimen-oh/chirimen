// @ts-check
// SHT30 driver for CHIRIMEN raspberry pi3
// Temperature and Humidity I2C Sensor
// based on https://github.com/ControlEverythingCommunity/SHT30/blob/master/Python/SHT30.py
// Programmed by Satoru Takagi

/** @param {number} ms Delay for a number of milliseconds. */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

var SHT30 = function(i2cPort,slaveAddress){
	if (!slaveAddress){
		slaveAddress = 0x44;
	}
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	this.slaveAddress = slaveAddress;
}

SHT30.prototype = {
	init: async function(){
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
	},
	readData: async function(){
		await this.i2cSlave.write8(0x2C, 0x06); // High repeatability measurement
		await sleep(100); // wait for measurement?
		var mdata = await this.i2cSlave.readBytes(6); // prev data..
		// cTemp MSB, cTemp LSB, cTemp CRC, Humididty MSB, Humidity LSB, Humidity CRC
		var cTemp = ((((mdata[0] * 256.0) + mdata[1]) * 175) / 65535.0) - 45; // celsius
		var humidity = 100 * (mdata[3] * 256 + mdata[4]) / 65535.0;
		return {
			humidity: humidity,
			temperature: cTemp
		}

	}
};

export default SHT30;
