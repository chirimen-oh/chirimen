[データシート]: https://www.analog.com/media/jp/technical-documentation/data-sheets/ADXL345_jp.pdf

# Grove 3 軸加速度センサー

ADXL345 を使用した 3 軸加速度センサーモジュールです

## センサー仕様

- 測定可能加速度
  - ±16 G (重力加速度)
- 加速度解像度
  - 3.9mg
- I2C スレーブアドレス
  - 0x53

詳細な仕様は[データシート][]を参照してください。（ANALOG DEVICES 社のサイトにリンクします。）

## ドライバー

### 初期化

```javascript
const groveaccelerometer = new GROVEACCELEROMETER(i2cPort, slaveAddress);
await groveaccelerometer.init();
```

I2C ポートの取得とセンサーの初期化をします。
センサーを使う前に必ず 1 回実行してください。
|引数|型|説明|
|:---|:---|:---|
|i2cPort|I2CSlaveDevice|使用する I2C ポートの port オブジェクトです。|
|slaveAddress|Number|センサーの I2C スレーブアドレスです。[センサー仕様](#センサー仕様)を参照してください。|

### 加速度の読み取り read()

```js
await groveaccelerometer.read();
```

加速度を測定します。
返り値は 1 軸毎の値が格納されたオブジェクトです
|返り値|型|説明|
|:---|:---|:---|
|acceleration.x|Number|x 軸方向の加速度です。単位は G（重力加速度）です。|
|acceleration.y|Number|y 軸方向の加速度です。単位は G（重力加速度）です。|
|acceleration.z|Number|z 軸方向の加速度です。単位は G（重力加速度）です。|

## 参考リンク

- [ADXL345 データシート（日本語）（ANALOG DEVICES 社）][データシート]
- [ADXL345 データシート（英語）（ANALOG DEVICES 社）](https://www.analog.com/media/en/technical-documentation/data-sheets/ADXL345.pdf)
- [GROVE - I2C 3 軸加速度センサ ADXL345 搭載（SWITCH SCIENCE 社）](https://www.switch-science.com/catalog/972/)
- [製造元資料](http://wiki.seeedstudio.com/Grove-3-Axis_Digital_Accelerometer-16g/)
