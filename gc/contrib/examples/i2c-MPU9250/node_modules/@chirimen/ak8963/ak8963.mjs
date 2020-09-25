// Ported from https://github.com/tuupola/micropython-mpu9250/blob/master/ak8963.py
// by Satoru Takagi

/** @param {number} ms Delay for a number of milliseconds. */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

var AK8963 = function(i2cPort,slaveAddress){
	this.devConst={
		_WIA : (0x00),
		_HXL : (0x03),
		_HXH : (0x04),
		_HYL : (0x05),
		_HYH : (0x06),
		_HZL : (0x07),
		_HZH : (0x08),
		_ST2 : (0x09),
		_CNTL1 : (0x0a),
		_ASAX : (0x10),
		_ASAY : (0x11),
		_ASAZ : (0x12),
		_MODE_POWER_DOWN : 0b00000000,
		MODE_SINGLE_MEASURE : 0b00000001,
		MODE_CONTINOUS_MEASURE_1 : 0b00000010, // 8Hz
		MODE_CONTINOUS_MEASURE_2 : 0b00000110, // 100Hz
		MODE_EXTERNAL_TRIGGER_MEASURE : 0b00000100,
		_MODE_SELF_TEST : 0b00001000,
		_MODE_FUSE_ROM_ACCESS : 0b00001111,
		OUTPUT_14_BIT : 0b00000000,
		OUTPUT_16_BIT : 0b00010000,
		_SO_14BIT : 0.6, // μT per digit when 14bit mode
		_SO_16BIT : 0.15 // μT per digit when 16bit mode
	}

	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	if ( slaveAddress ){
		this.slaveAddress = slaveAddress;
	} else {
		this.slaveAddress =  0x0c;
	}
};

AK8963.prototype = {
	init: async function(mode,output,offset,scale){
		var cs = this.devConst;
		if  ( !mode){
			mode=cs.MODE_CONTINOUS_MEASURE_1;
		}
		if ( !output){
			output=cs.OUTPUT_16_BIT;
		}
		if ( !offset ){
			offset=[0, 0, 0];
		}
		if ( !scale){
			scale=[1, 1, 1];
		}

		this._offset = offset;
		this._scale = scale;

		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
		var whoamiVal = await this.i2cSlave.read8(cs._WIA);
		if (whoamiVal !== 0x48) {
			console.error("This device is NOT Supported...");
			return null;
		}

		// Sensitivity adjustement values
		await this.i2cSlave.write8(cs._CNTL1, cs._MODE_FUSE_ROM_ACCESS);
		var asax = await this.i2cSlave.read8(cs._ASAX);
		var asay = await this.i2cSlave.read8(cs._ASAY);
		var asaz = await this.i2cSlave.read8(cs._ASAZ);
		await this.i2cSlave.write8(cs._CNTL1, cs._MODE_POWER_DOWN);

		// Should wait atleast 100us before next mode
		this._adjustement = [
			(0.5 * (asax - 128)) / 128 + 1,
			(0.5 * (asay - 128)) / 128 + 1,
			(0.5 * (asaz - 128)) / 128 + 1
		];

		// Power on
		await this.i2cSlave.write8(cs._CNTL1, (mode | output));

		if (output  == cs.OUTPUT_16_BIT){
			this._so = cs._SO_16BIT;
		} else {
			this._so = cs._SO_14BIT;
		}
	},
	readData: async function(){
		var cs = this.devConst;
		// X, Y, Z axis micro-Tesla (uT) as floats.
		var mx = this.getVal(await this.i2cSlave.read16(cs._HXL)); // read16 is little endian
		var my = this.getVal(await this.i2cSlave.read16(cs._HYL));
		var mz = this.getVal(await this.i2cSlave.read16(cs._HZL));
		await this.i2cSlave.read8(cs._ST2) // Enable updating readings again

		//Apply factory axial sensitivy adjustements
		mx *= this._adjustement[0];
		my *= this._adjustement[1];
		mz *= this._adjustement[2];

		// Apply output scale determined in constructor
		var so = this._so;
		mx *= so;
		my *= so;
		mz *= so;

		// Apply hard iron ie. offset bias from calibration
		mx -= this._offset[0];
		my -= this._offset[1];
		mz -= this._offset[2];

		// Apply soft iron ie. scale bias from calibration
		mx *= this._scale[0];
		my *= this._scale[1];
		mz *= this._scale[2];

		return {
			x: mx,
			y: my,
			z: mz
		}
	},
	getVal: function (val) {
		return new Int16Array([val])[0];
	},
	calibrate: async function (count, delay){
		if (!count) {
			count = 128;
		}
		if (!delay) {
			delay = 100;
		}

		this._offset = [0, 0, 0];
		this._scale = [1, 1, 1];

		var reading = await this.readData();
		var minx = reading.x;
		var miny = reading.y;
		var minz = reading.z;
		var maxx = minx;
		var maxy = miny;
		var maxz = minz;

		while (count>0){
			await sleep(delay);
			reading = await this.readData();
			minx = Math.min(minx, reading.x);
			maxx = Math.max(maxx, reading.x);
			miny = Math.min(miny, reading.y);
			maxy = Math.max(maxy, reading.y);
			minz = Math.min(minz, reading.z);
			maxz = Math.max(maxz, reading.z);
			count -= 1;
		}

		// Hard iron correction
		var offset_x = (maxx + minx) / 2;
		var offset_y = (maxy + miny) / 2;
		var offset_z = (maxz + minz) / 2;

		this._offset = [offset_x, offset_y, offset_z];

		// Soft iron correction
		var avg_delta_x = (maxx - minx) / 2;
		var avg_delta_y = (maxy - miny) / 2;
		var avg_delta_z = (maxz - minz) / 2;

		var avg_delta = (avg_delta_x + avg_delta_y + avg_delta_z) / 3;

		var scale_x = avg_delta / avg_delta_x;
		var scale_y = avg_delta / avg_delta_y;
		var scale_z = avg_delta / avg_delta_z;

		this._scale = [scale_x, scale_y, scale_z];
	}
};

export default AK8963;
