This directory stores test software for testing CHIRIMEN.

However, many test parts are examples itselfs. In addition, the circuit for testing, as described at https://github.com/chirimen-oh/chirimen-raspi3/issues/24 , is required.

Meanwhile, the implementations added under this directory are mainly modified examples to avoid collision of I2C addres.

The list of addresses of I2C devices are as follows.

|Device|NativeAddr|ChangedAddr|
|---|---|---|
|ADS1015|	0x48| |
|ADT7410|	0x48|	=>test brd:0x49|
|GP2Y0E03|	0x40| |
|PCA9685|	0x40|	=>test brd:0x41|
|S11059|	0x2a| |
|VEML6070|	0x38, 0x39| |
|grove-accelerometer|	0x53| |
|grove-gesture|	0x73| |
|grove-light|	0x29| |
|grove-touch|	0x5a| |
|grove-oledDisplay|	0x3c| |
