// AMG8833 driver for CHIRIMEN WebI2C
// ported from https://github.com/SWITCHSCIENCE/samplecodes/blob/master/AMG88_breakout/Arduino/AMG88_Arduino/AMG88_Arduino.ino
// by Satoru Takagi

var AMG8833 = function(i2cPort,slaveAddress){
	this.digT = [];
	this.digP = [];
	this.digH = [];
	this.t_fine = 0;
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	if (slaveAddress){
		this.slaveAddress = slaveAddress;
	} else {
		this.slaveAddress = 0x68;
	}
};

AMG8833.prototype = {
	init: async function(){
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
		await this.setup();
	},
	getSVal: function (val) {
		return new Int16Array([val])[0];
	},
	setup: async function(){

		await this.i2cSlave.write8(0x02,0x00);
		await this.i2cSlave.write8(0x03,0x00);

		// movingAverageEnable
		await this.i2cSlave.write8(0x1F,0x50);
		await this.i2cSlave.write8(0x1F,0x45);
		await this.i2cSlave.write8(0x1F,0x57);

		await this.i2cSlave.write8(0x07,0x20);

		await this.i2cSlave.write8(0x1F,0x00);

		// get sensorTemperature
		await this.i2cSlave.read16(0x0E);
	},
	readData: async function(){
		var tdata = [];
		for (let i = 0; i < 4; i++){
			await this.i2cSlave.writeBytes([0x80+i*0x20]);
			var bdata = await this.i2cSlave.readBytes(32);
			for (let j = 0; j < 16; j++){
				var tVal = bdata[j*2] +  bdata[j*2+1]*256;
				var temperature;
				if ( tVal > 0x200){
					temperature = (-tVal +  0xfff) * -0.25;
				}else{
					temperature = tVal * 0.25;
				}
				tdata.push(temperature);
			}
		}

		var ans =[];
		for (let i = 0; i < 8; i++){
			var msg="";
			var ansR =[];
			for (let j = 0; j < 8; j++){
				msg = msg +","+tdata[i*8+j].toFixed(2);
				ansR.push(tdata[i*8+j]);
			}
			ans.push(ansR);
		}

		return ( ans );
	}
};

export default AMG8833;
