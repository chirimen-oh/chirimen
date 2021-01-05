// @ts-check
// MPU 6500 driver
// Ported from
// https://raw.githubusercontent.com/tuupola/micropython-mpu9250/master/mpu6500.py
// https://github.com/tuupola/micropython-mpu9250/blob/master/mpu6500.py
// https://www.invensense.com/wp-content/uploads/2015/02/MPU-6000-Register-Map1.pdf
// https://github.com/MomsFriendlyRobotCompany/mpu9250/blob/master/mpu9250/mpu9250.py
// By Satoru Takagi

// Note: MPU9250 ( or MPU9255(almost equal to 9250))  is a chip in which MPU 6500 and AK8963 are integrated.
// When initializing the MPU6500 first, AK8963 with address 0x0C appears on the I2C bus.

var MPU6500 = function(i2cPort,slaveAddress){
	this.devConst={
		_GYRO_CONFIG : 0x1b,
		_ACCEL_CONFIG : 0x1c,
		_ACCEL_CONFIG2 : 0x1d,
		_INT_PIN_CFG : 0x37,
		_ACCEL_XOUT_H : 0x3b,
		_ACCEL_XOUT_L : 0x3c,
		_ACCEL_YOUT_H : 0x3d,
		_ACCEL_YOUT_L : 0x3e,
		_ACCEL_ZOUT_H : 0x3f,
		_ACCEL_ZOUT_L: 0x40,
		_TEMP_OUT_H : 0x41,
		_TEMP_OUT_L : 0x42,
		_GYRO_XOUT_H : 0x43,
		_GYRO_XOUT_L : 0x44,
		_GYRO_YOUT_H : 0x45,
		_GYRO_YOUT_L : 0x46,
		_GYRO_ZOUT_H : 0x47,
		_GYRO_ZOUT_L : 0x48,
		_WHO_AM_I : 0x75,

	//	#_ACCEL_FS_MASK : 0b00011000,
		ACCEL_FS_SEL_2G : 0b00000000,
		ACCEL_FS_SEL_4G : 0b00001000,
		ACCEL_FS_SEL_8G : 0b00010000,
		ACCEL_FS_SEL_16G : 0b00011000,

		_ACCEL_SO_2G : 16384, // 1 / 16384 ie. 0.061 mg / digit
		_ACCEL_SO_4G : 8192, // 1 / 8192 ie. 0.122 mg / digit
		_ACCEL_SO_8G : 4096, // 1 / 4096 ie. 0.244 mg / digit
		_ACCEL_SO_16G : 2048, // 1 / 2048 ie. 0.488 mg / digit

	//	#_GYRO_FS_MASK : 0b00011000,
		GYRO_FS_SEL_250DPS : 0b00000000,
		GYRO_FS_SEL_500DPS : 0b00001000,
		GYRO_FS_SEL_1000DPS : 0b00010000,
		GYRO_FS_SEL_2000DPS : 0b00011000,

		_GYRO_SO_250DPS : 131,
		_GYRO_SO_500DPS : 62.5,
		_GYRO_SO_1000DPS : 32.8,
		_GYRO_SO_2000DPS : 16.4,

		_TEMP_SO : 333.87,
		_TEMP_OFFSET : 21,

	//	# Used for enablind and disabling the i2c bypass access
		_I2C_BYPASS_MASK : 0b00000010,
		_I2C_BYPASS_EN : 0b00000010,
		_I2C_BYPASS_DIS : 0b00000000,

		SF_G : 1,
		SF_M_S2 : 9.80665,// # 1 g : 9.80665 m/s2 ie. standard gravity
		SF_DEG_S : 1,
		SF_RAD_S : 57.295779578552// # 1 rad/s is 57.295779578552 deg/s
	}

	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	if ( slaveAddress ){
		this.slaveAddress = slaveAddress;
	} else {
		this.slaveAddress =  0x68;
	}
};

MPU6500.prototype = {
	init: async function(accel_fs,gyro_fs,accel_sf,gyro_sf){
		var cs = this.devConst;
		if  ( !accel_fs){
			accel_fs=cs.ACCEL_FS_SEL_2G;
		}
		if ( !gyro_fs){
			gyro_fs=cs.GYRO_FS_SEL_250DPS;
		}
		if ( !accel_sf ){
			accel_sf=cs.SF_M_S2;
		}
		if ( !gyro_sf){
			gyro_sf=cs.SF_RAD_S;
		}

		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
		var whoamiVal = await this.i2cSlave.read8(cs._WHO_AM_I);
		if (whoamiVal == 0x70) {
			// This device is MPU6500
		} else if (whoamiVal == 0x71) {
			// This device is MPU9250
		} else if (whoamiVal == 0x73) {
			// https://github.com/kriswiner/MPU9250/issues/47
			// This device is MPU9255
		} else {
			console.error("This device is NOT Supported...");
			return null;
		}

		cs._accel_so = await this._accel_fs(accel_fs);
		cs._gyro_so = await this._gyro_fs(gyro_fs);
		cs._accel_sf = accel_sf;
		cs._gyro_sf = gyro_sf;

		// # Enable I2C bypass to access for MPU9250 magnetometer access.
		var chr = await this.i2cSlave.read8(cs._INT_PIN_CFG);
		chr &= ~cs._I2C_BYPASS_MASK; //# clear I2C bits
		chr |= cs._I2C_BYPASS_EN;
		await this.i2cSlave.write8(cs._INT_PIN_CFG, chr);
	},

	_accel_fs: async function(value){
		var cs = this.devConst;
		await this.i2cSlave.write8(cs._ACCEL_CONFIG, value);
		//# Return the sensitivity divider
		if (cs.ACCEL_FS_SEL_2G == value){
			return cs._ACCEL_SO_2G;
		} else if (cs.ACCEL_FS_SEL_4G == value){
			return cs._ACCEL_SO_4G;
		} else if (cs.ACCEL_FS_SEL_8G == value){
			return cs._ACCEL_SO_8G;
		} else if (cs.ACCEL_FS_SEL_16G == value){
			return cs._ACCEL_SO_16G;
		}
	},

	_gyro_fs: async function( value){
		var cs = this.devConst;
		await this.i2cSlave.write8(cs._GYRO_CONFIG, value);

		//# Return the sensitivity divider
		if (cs.GYRO_FS_SEL_250DPS == value){
			return cs._GYRO_SO_250DPS;
		} else if (cs.GYRO_FS_SEL_500DPS == value){
			return cs._GYRO_SO_500DPS;
		} else if (cs.GYRO_FS_SEL_1000DPS == value){
			return cs._GYRO_SO_1000DPS;
		} else if (cs.GYRO_FS_SEL_2000DPS == value){
			return cs._GYRO_SO_2000DPS;
		}
	},

	getAcceleration: async function () {
		/**
		Acceleration measured by the sensor. By default will return a
		3-tuple of X, Y, Z axis acceleration values in m/s^2 as floats. Will
		return values in g if constructor was provided `accel_sf=SF_M_S2`
		parameter.
		**/
		var cs = this.devConst;
		var so = cs._accel_so;
		var sf = cs._accel_sf;

		var x = this.getVal(await this.i2cSlave.read16(cs._ACCEL_XOUT_H));
		var y = this.getVal(await this.i2cSlave.read16(cs._ACCEL_YOUT_H));
		var z = this.getVal(await this.i2cSlave.read16(cs._ACCEL_ZOUT_H));
		return {
			x: x / so * sf,
			y: y / so * sf,
			z: z / so * sf
		}
	},

	getGyro: async function () {
		/**
		X, Y, Z radians per second as floats.
		**/
		var cs = this.devConst;
		var so = cs._gyro_so;
		var sf = cs._gyro_sf;

		var x = this.getVal(await this.i2cSlave.read16(cs._GYRO_XOUT_H));
		var y = this.getVal(await this.i2cSlave.read16(cs._GYRO_YOUT_H));
		var z = this.getVal(await this.i2cSlave.read16(cs._GYRO_ZOUT_H));
		return {
			x: x / so * sf,
			y: y / so * sf,
			z: z / so * sf
		}
	},

	getTemperature: async function () {
		// temperature in celcius as a float.
		var cs = this.devConst;
		var temp = this.getVal(await this.i2cSlave.read16(cs._TEMP_OUT_H));
		temp = ((temp - cs._TEMP_OFFSET) / cs._TEMP_SO) + cs._TEMP_OFFSET;
		return ( temp );
	},

	getVal: function (w) {
		var l = w >>> 8;
		var b = w & 0xff;
		var v = l + ( b << 8 );
		return new Int16Array([v])[0];
	}
};

export default MPU6500;
