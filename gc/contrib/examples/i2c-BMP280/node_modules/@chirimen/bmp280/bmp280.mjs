// @ts-check
// BMP280 driver for CHIRIMEN WebI2C
// ported from https://github.com/SWITCHSCIENCE/BME280/blob/master/Python27/bme280_sample.py
// Note: BMP280 is backward compatible with BME 280 except atmospheric pressure
// by Satoru Takagi

var BMP280 = function(i2cPort,slaveAddress){
	this.digT = [];
	this.digP = [];
	this.t_fine = 0;
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	if (slaveAddress){
		this.slaveAddress = slaveAddress;
	} else {
		this.slaveAddress = 0x76;
	}
};

BMP280.prototype = {
	init: async function(){
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
		await this.setup();
		await this.getCalibParam();
	},
	read: async function(){
		if ( this.i2cSlave  == null ){
			throw Error("i2cSlave Address does'nt yet open!");
		}
		var MSB = await this.i2cSlave.read8(0x00);
		var LSB = await this.i2cSlave.read8(0x01);
		var data = ((MSB << 8) + LSB)/128.0;
		return(data);
	},
	getCalibParam: async function(){
		var calib = [];
		var dat;
		for ( var ra = 0x88 ; ra <= 0x88+24 ; ra++ ){
			dat = await this.i2cSlave.read8(ra);
			calib.push(dat);
		}
		var digT = this.digT;
		var digP = this.digP;
		var getSVal = this.getSVal;
		digT.push((calib[1] << 8) | calib[0]); // uint
		digT.push(getSVal((calib[3] << 8) | calib[2]));
		digT.push(getSVal((calib[5] << 8) | calib[4]));
		digP.push((calib[7] << 8) | calib[6]); // uint
		digP.push(getSVal((calib[9] << 8) | calib[8]));
		digP.push(getSVal((calib[11]<< 8) | calib[10]));
		digP.push(getSVal((calib[13]<< 8) | calib[12]));
		digP.push(getSVal((calib[15]<< 8) | calib[14]));
		digP.push(getSVal((calib[17]<< 8) | calib[16]));
		digP.push(getSVal((calib[19]<< 8) | calib[18]));
		digP.push(getSVal((calib[21]<< 8) | calib[20]));
		digP.push(getSVal((calib[23]<< 8) | calib[22]));
	},
	getSVal: function (val) {
		return new Int16Array([val])[0];
	},
	setup: async function(){
		var osrs_t = 1; //Temperature oversampling x 1
		var osrs_p = 1; //Pressure oversampling x 1
		var mode   = 3; //Normal mode
		var t_sb   = 5; //Tstandby 1000ms
		var filter = 0; //Filter off
		var spi3w_en = 0; //3-wire SPI Disable

		var ctrl_meas_reg = (osrs_t << 5) | (osrs_p << 2) | mode;
		var config_reg    = (t_sb << 5) | (filter << 2) | spi3w_en;

		await this.i2cSlave.write8(0xF4,ctrl_meas_reg);
		await this.i2cSlave.write8(0xF5,config_reg);
	},
	compensate_P: function(adc_P){
		var t_fine = this.t_fine;
		var digP = this.digP;

		var v1 = (t_fine / 2.0) - 64000.0;
		var v2 = (((v1 / 4.0) * (v1 / 4.0)) / 2048) * digP[5];
		v2 = v2 + ((v1 * digP[4]) * 2.0);
		v2 = (v2 / 4.0) + (digP[3] * 65536.0);
		v1 = (((digP[2] * (((v1 / 4.0) * (v1 / 4.0)) / 8192)) / 8)  + ((digP[1] * v1) / 2.0)) / 262144;
		v1 = ((32768 + v1) * digP[0]) / 32768;

		if (v1 == 0){
			return (0);
		}
		var pressure = ((1048576 - adc_P) - (v2 / 4096)) * 3125;
		if (pressure < 0x80000000){
			pressure = (pressure * 2.0) / v1;
		} else {
			pressure = (pressure / v1) * 2;
		}
		v1 = (digP[8] * (((pressure / 8.0) * (pressure / 8.0)) / 8192.0)) / 4096;
		v2 = ((pressure / 4.0) * digP[7]) / 8192.0;
		pressure = pressure + ((v1 + v2 + digP[6]) / 16.0)  ;

		return (pressure);
	},
	compensate_T: function(adc_T){
		var digT = this.digT;
		var v1 = (adc_T / 16384.0 - digT[0] / 1024.0) * digT[1];
		var v2 = (adc_T / 131072.0 - digT[0] / 8192.0) * (adc_T / 131072.0 - digT[0] / 8192.0) * digT[2];
		this.t_fine = v1 + v2;
		var temperature = this.t_fine / 5120.0;
		return temperature;
	},
	readData: async function(){
		var data = [];
		var dat;
		for ( var ra =0xF7 ; ra<= 0xF7+6; ra++){
			dat = await this.i2cSlave.read8(ra);
			data.push(dat);
		}
		var pres_raw = (data[0] << 12) | (data[1] << 4) | (data[2] >> 4);
		var temp_raw = (data[3] << 12) | (data[4] << 4) | (data[5] >> 4);
		var temperature = this.compensate_T(temp_raw);
		var pressure = this.compensate_P(pres_raw);
		return {
			temperature: temperature,
			pressure: pressure/100,
		}
	}
};

export default BMP280;
