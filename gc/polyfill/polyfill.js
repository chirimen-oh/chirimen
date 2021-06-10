(function () {
  var serverURL = "wss://localhost:33330/";

  /**
   * ログ情報出力
   * @param str 出力文字列
   */
  function infoLog(str) {
    // console.log("info: "+str);
  }

  /**
   * エラーログログ情報出力
   * @param error エラー情報
   */
  function errLog(error) {
    console.error(error);
  }

  var bone = (() => {
    /**
     * router コンストラクターの関数, class 定義
     */
    function router() {}
    router.prototype = {
      wss: null,
      send: null,
      queue: null, // function queue
      onevents: null, // onevent queue
      waitQueue: null,
      status: 0, // 0: init 1: wait connection 2: connected
      session: 0,

      /**
       * @function
       * GPIO 初期化処理
       * @param serverURL WebSocket サーバーURL
       */
      init: function (serverURL) {
        infoLog("bone.init()");
        this.waitQueue = new Array();
        this.queue = new Map();
        this.onevents = new Map();
        this.wss = new WebSocket(serverURL);
        this.wss.binaryType = "arraybuffer";
        this.status = 1;
        this.wss.onopen = () => {
          infoLog("onopen");
          for (var cnt = 0; cnt < this.waitQueue.length; cnt++) {
            if (typeof this.waitQueue[cnt] === "function") {
              this.waitQueue[cnt](true);
            }
          }
          this.status = 2;
          this.waitQueue = [];
        };
        this.wss.onerror = (error) => {
          errLog(error);
          errLog(
            [
              "Node.jsプロセスとの接続に失敗しました。",
              "CHIRIMEN for Raspberry Piやその互換環境でのみ実行可能です。",
              "https://r.chirimen.org/tutorial",
            ].join("\n")
          );
          var length = this.waitQueue ? this.waitQueue.length : 0;
          for (var cnt = 0; cnt < length; cnt++) {
            if (typeof this.waitQueue[cnt] === "function") {
              this.waitQueue[cnt](false);
            }
          }
          this.status = 0;
          this.waitQueue = [];
        };
        this.wss.onmessage = (mes) => {
          var buffer = new Uint8Array(mes.data);
          infoLog("on message:" + buffer);
          if (buffer[0] == 1) {
            this.receive(buffer);
          } else if (buffer[0] == 2) {
            this.onEvent(buffer);
          }
        };
      },

      /**
       * @function
       * GPIO データ送信処理
       * @param func 送信先アドレス
       * @param data 送信処理
       */
      send: function (func, data) {
        return new Promise((resolve, reject) => {
          if (!(data instanceof Uint8Array)) {
            reject("type error: Please using with Uint8Array buffer.");
            return;
          }
          var length = data.length + 4;
          var buf = new Uint8Array(length);

          buf[0] = 1; // 1: API Request
          buf[1] = this.session & 0x00ff; // session LSB
          buf[2] = this.session >> 8; // session MSB
          buf[3] = func;

          for (var cnt = 0; cnt < data.length; cnt++) {
            buf[4 + cnt] = data[cnt];
          }
          infoLog("send message:" + buf);
          this.queue.set(this.session, (data) => {
            resolve(data);
          });
          this.wss.send(buf);
          buf = null;
          this.session++;
          if (this.session > 0xffff) {
            this.session = 0;
          }
        });
      },

      /**
       * @function
       * GPIO データ受信処理
       * @param mes 受信メッセージ
       */
      receive: function (mes) {
        if (!(mes instanceof Uint8Array)) {
          errLog(new TypeError("Please using with Uint8Array buffer."));
          errLog(
            new TypeError(
              [
                "Uint8Array以外を受信しました。",
                "Node.jsのプロセスに何らかの内部的な問題が生じている可能性があります。",
              ].join("")
            )
          );
          return;
        }
        var session = (mes[1] & 0x00ff) | (mes[2] << 8);
        var func = this.queue.get(session);
        if (typeof func === "function") {
          infoLog("result");
          var data = new Array();
          for (var cnt = 0; cnt < mes.length - 4; cnt++) {
            data.push(mes[4 + cnt]);
          }
          func(data);
          this.queue.delete(session);
        } else {
          errLog(new TypeError("session=" + session + " func=" + func));
          errLog(
            new TypeError(
              [
                "受信処理中に問題が発生しました。",
                "他のウィンドウ/タブなど別のプロセスと競合していないことを確認してください。",
              ].join("")
            )
          );
        }
      },

      /**
       * @function
       * GPIO イベント登録処理
       * @param f 登録アドレス
       * @param port ポート番号
       * @param func 登録バッファ
       */
      registerEvent: function (f, port, func) {
        var key = (f << 8) | port;
        this.onevents.set(key, func);
      },

      /**
       * @function
       * GPIO イベント削除処理
       * @param f 登録アドレス
       * @param port ポート番号
       */
      removeEvent: function (f, port) {
        var key = (f << 8) | port;
        this.onevents.delete(key);
      },

      /**
       * GPIO イベント発生時処理
       * @param data データ
       */
      onEvent: function (data) {
        if (!(data instanceof Uint8Array)) {
          errLog(new TypeError("Please using with Uint8Array buffer."));
          errLog(
            new TypeError(
              [
                "Uint8Array以外を受信しました。",
                "Node.jsのプロセスに何らかの内部的な問題が生じている可能性があります。",
              ].join("")
            )
          );
          return;
        }

        // [0] Change Callback (2)
        // [1] session id LSB (0)
        // [2] session id MSB (0)
        // [3] function id (0x14)
        // [4] Port Number
        // [5] Value (0:LOW 1:HIGH)
        var key = data[3];
        key = (key << 8) | data[4];

        var func = this.onevents.get(key);
        if (typeof func === "function") {
          infoLog("onevent");
          func(data);
        }
      },

      /**
       * @function
       * GPIO接続待ち処理
       */
      waitConnection: function () {
        return new Promise((resolve, reject) => {
          if (this.status == 2) {
            resolve();
          } else if (this.status == 0) {
            reject();
          } else {
            this.waitQueue.push((result) => {
              if (result == true) {
                resolve();
              } else {
                reject();
              }
            });
          }
        });
      },
    };

    var rt = new router();
    rt.init(serverURL);
    return rt;
  })();

  /** 
   * GPIOAccess
   * Raspberry Pi GPIO Port Number
   * 
   * TODO: add portName and pinName
   * */
  var gpioPorts = [
    4,
    17,
    18,
    27,
    22,
    23,
    24,
    25,
    5,
    6,
    12,
    13,
    19,
    16,
    26,
    20,
    21,
  ];

  /**
   * @function
   * GPIOAccess コンストラクターの関数の定義
   */
  var GPIOAccess = function () {
    this.init();
  };

  /**
   * GPIOAccess class 定義
   */
  GPIOAccess.prototype = {
    /**
     * @function
     * GPIOAccess 初期化処理
     * ポート情報マッピング
     */
    init: function () {
      this.ports = new Map();
      for (var cnt = 0; cnt < gpioPorts.length; cnt++) {
        this.ports.set(gpioPorts[cnt], new GPIOPort(gpioPorts[cnt]));
      }
    },
    ports: new Map(),
    unexportAll: null,
    onchange: null,
  };

  /**
   * @function
   * GPIOPort 定義
   * @param portNumber ポート番号
   * ポート番号定義
   */
  var GPIOPort = function (portNumber) {
    infoLog("GPIOPort:" + portNumber);
    this.init(portNumber);
  };

  /**
   * GPIOPort 関数継承
   * ポート番号初期化
   */
  GPIOPort.prototype = {
    /**
     * @function
     * GPIO 初期化処理
     * @param portNumber ポート番号
     * ポート情報マッピング
     */
    init: function (portNumber) {
      this.portNumber = portNumber;
      this.portName = "";
      this.pinName = "";
      this.direction = "";
      this.exported = false;
      this.value = null;
      this.onchange = null;
    },

    /**
     * @function
     * GPIOポート接続処理
     * @param direction 入出力方向情報
     */
     export: function (direction) {
      return new Promise((resolve, reject) => {
        var dir = -1;
        if (direction === "out") {
          dir = 0;
          bone.removeEvent(0x14, this.portNumber);
        } else if (direction === "in") {
          dir = 1;
          //        console.dir(bone);
          bone.registerEvent(0x14, this.portNumber, (buf) => {
            if (typeof this.onchange === "function") {
              infoLog("onchange");
              this.onchange(buf[5]);
            }
          });
        } else {
          reject("export:direction not valid! [" + direction + "]");
        }
        infoLog("export: Port:" + this.portNumber + " direction=" + direction);
        var data = new Uint8Array([this.portNumber, dir]);
        bone.send(0x10, data).then(
          (result) => {
            if (result[0] == 0) {
              errLog(
                [
                  `GPIO${this.portNumber}への接続に失敗しました。`,
                  "他のウィンドウ/タブなど別のプロセスが既に同じピン番号を使用している可能性があります。",
                ].join("")
              );
              reject("GPIOPort(" + this.portNumber + ").export() error");
            } else {
              resolve();
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    },

    /**
     * @function
     * GPIO 読み取り処理
     */
     read: function () {
      return new Promise((resolve, reject) => {
        infoLog("read: Port:" + this.portNumber);
        var data = new Uint8Array([this.portNumber]);
        bone.send(0x12, data).then(
          (result) => {
            if (result[0] == 0) {
              errLog(`GPIO${this.portNumber}から値の取得に失敗しました。`);
              reject("GPIOPort(" + this.portNumber + ").read() error");
            } else {
              resolve(result[1]);
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    },

    /**
     * @function
     * GPIO 書き込み処理
     * @param value 書き込みデータ
     */
     write: function (value) {
      return new Promise((resolve, reject) => {
        infoLog("write: Port:" + this.portNumber + " value=" + value);
        var data = new Uint8Array([this.portNumber, value]);
        bone.send(0x11, data).then(
          (result) => {
            if (result[0] == 0) {
              errLog(`GPIO${this.portNumber}に値の設定に失敗しました。`);
              reject("GPIOPort(" + this.portNumber + ").write() error");
            } else {
              resolve();
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    },

    /**
     * @function
     * GPIO 状態変化処理
     */
    onchange: null,


    /**
     * @function
     * GPIOポート開放処理
     */
     unexport: function () {
      return new Promise((resolve, reject) => {
        infoLog("unexport: Port:" + this.portNumber);
        var data = new Uint8Array([this.portNumber, value]);
        bone.send(0x13, data).then(
          (result) => {
            if (result[0] == 0) {
              errLog(`GPIO${this.portNumber}の開放に失敗しました。`);
              reject("GPIOPort(" + this.portNumber + ").unexport() error");
            } else {
              resolve();
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    },
  };

  //////////////////////////////////////////////////////////////////////////
  // I2CAccess

  var i2cPorts = [1];

  /**
   * @function
   *　I2C 読み込みエラー処理
   * @param portNumber ポート番号
   * @param slaveAddress スレーブアドレス
   * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
   */
  function printReadError(portNumber, slaveAddress) {
    errLog(
      [
        `i2c-${portNumber}(アドレス: 0x${slaveAddress.toString(16)})`,
        "からの値の取得に失敗しました。",
        "デバイスが正しく認識されており、アドレスに誤りがないことを確認してください。",
      ].join("")
    );
  }

  /**
   * @function
   *　I2C 書き込みエラー処理
   * @param portNumber ポート番号
   * @param slaveAddress スレーブアドレス
   * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
   */
  function printWriteError(portNumber, slaveAddress) {
    errLog(
      [
        `I2C-${portNumber}`,
        `(アドレス: 0x${slaveAddress.toString(16)})`,
        "への値の書き込みに失敗しました。",
        "デバイスが正しく認識されており、アドレスに誤りがないことを確認してください。",
      ].join(" ")
    );
  }

  /**
   * @function
   * I2CAccess コンストラクターの関数の定義
   */
  var I2CAccess = function () {
    this.init();
  };

  /**
   * @function
   * I2CAccess class 定義
   */
  I2CAccess.prototype = {
    /**
     * @function
     * I2CAccess 初期化処理
     * ポート情報マッピング
     */
    init: function () {
      this.ports = new Map();
      for (var cnt = 0; cnt < i2cPorts.length; cnt++) {
        this.ports.set(i2cPorts[cnt], new I2CPort(i2cPorts[cnt]));
      }
    },
    ports: new Map(),
  };

  /**
   * @function
   * I2CPort 定義
   * @param portNumber ポート番号定義
   * ポート番号定義
   */
  function I2CPort(portNumber) {
    this.init(portNumber);
  }

  /**
   * I2CPort 関数継承
   * ポート番号初期化
   */
   I2CPort.prototype = {
    /**
     * @function
     * I2C 初期化処理
     * @param portNumber ポート番号
     * ポート情報マッピング
     */
    init: function (portNumber) {
      this.portNumber = portNumber;
    },

    portNumber: 0,

    /**
     * @function
     * I2C ポート open 処理
     * @param slaveAddress スレーブアドレス
     */
    open: function (slaveAddress) {
      return new Promise((resolve, reject) => {
        new I2CSlaveDevice(this.portNumber, slaveAddress).then(
          (i2cslave) => {
            resolve(i2cslave);
          },
          (err) => {
            reject(err);
          }
        );
      });
    },
  };

  /**
   * @function
   *　I2CSlaveDevice コンストラクターの関数の定義
   * @param portNumber ポート番号
   * @param slaveAddress スレーブアドレス
   * @return ポート、デバイス初期化結果
   * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
   */
  function I2CSlaveDevice(portNumber, slaveAddress) {
    return new Promise((resolve, reject) => {
      this.init(portNumber, slaveAddress).then(
        () => {
          resolve(this);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * @function
   * I2CSlaveDevice class 定義
   * @param portNumber ポート番号
   * @param slaveAddress スレーブアドレス
   * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
   */
  I2CSlaveDevice.prototype = {
    portNumber: null,
    slaveAddress: null,
    slaveDevice: null,

    /**
     * @function
     *　I2C スレーブデバイス初期化処理
     * @param portNumber ポート番号
     * @param slaveAddress スレーブアドレス
     * @return ポート、デバイス初期化結果
     * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
     */
    init: function (portNumber, slaveAddress) {
      return new Promise((resolve, reject) => {
        this.portNumber = portNumber;
        this.slaveAddress = slaveAddress;
        var data = new Uint8Array([this.slaveAddress, 1]);
        bone.send(0x20, data).then(
          (result) => {
            if (result[0] != 0) {
              infoLog("I2CSlaveDevice.init() result OK");
              resolve(this);
            } else {
              errLog(`I2C-${this.portNumber}への接続に失敗しました。`);
              errLog("I2CSlaveDevice.init() result NG");
              reject("I2CSlaveDevice.init() result NG:");
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    },

    /**
     * @function
     *　I2C 8bit 読み込み処理
     * @param registerNumber 読み込み番号
     * @return 読み込み結果
     * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
     */
    read8: function (registerNumber) {
      return new Promise((resolve, reject) => {
        var data = new Uint8Array([this.slaveAddress, registerNumber, 1]);
        bone.send(0x23, data).then(
          (result) => {
            infoLog("I2CSlaveDevice.read8() result value=" + result);
            var readSize = result[0];
            if (readSize == 1) {
              resolve(result[1]);
            } else {
              printReadError(this.portNumber, this.slaveAddress);
              reject("read8() readSize unmatch : " + readSize);
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    },

    /**
     * @function
     *　I2C 16bit 読み込み処理
     * @param registerNumber 読み込み番号
     * @return 読み込み結果
     * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
     */
    read16: function (registerNumber) {
      return new Promise((resolve, reject) => {
        infoLog("I2CSlaveDevice.read16() registerNumber=" + registerNumber);
        var data = new Uint8Array([this.slaveAddress, registerNumber, 2]);
        bone.send(0x23, data).then(
          (result) => {
            infoLog("I2CSlaveDevice.write8() result value=" + result);
            var readSize = result[0];
            if (readSize == 2) {
              var res_l = result[1];
              var res_h = result[2];
              var res = res_l + (res_h << 8);
              resolve(res);
            } else {
              printReadError(this.portNumber, this.slaveAddress);
              reject("read16() readSize unmatch : " + readSize);
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    },

    /**
     * @function
     *　I2C 8bit 書き込み処理
     * @param registerNumber 書き込み番号
     * @param value 書き込み値
     * @return 書き込み結果
     * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
     */
    write8: function (registerNumber, value) {
      return new Promise((resolve, reject) => {
        infoLog(
          "I2CSlaveDevice.write8() registerNumber=" + registerNumber,
          " value=" + value
        );
        var size = 2;
        var data = new Uint8Array([
          this.slaveAddress,
          size,
          registerNumber,
          value,
        ]);
        bone.send(0x21, data).then(
          (result) => {
            infoLog("I2CSlaveDevice.write8() result value=" + result);
            if (result[0] != size) {
              printWriteError(this.portNumber, this.slaveAddress);
              reject(
                "I2CSlaveAddress(" + this.slaveAddress + ").write8():error"
              );
            } else {
              resolve();
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    },

    /**
     * @function
     *　I2C 16bit 書き込み処理
     * @param registerNumber 書き込み番号
     * @param value 書き込み値
     * @return 書き込み結果
     * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
     */
    write16: function (registerNumber, value) {
      return new Promise((resolve, reject) => {
        infoLog(
          "I2CSlaveDevice.write16() registerNumber=" + registerNumber,
          " value=" + value
        );
        var value_L = value & 0x00ff;
        var value_H = (value >> 8) & 0x00ff;
        var size = 3;
        var data = new Uint8Array([
          this.slaveAddress,
          size,
          registerNumber,
          value_L,
          value_H,
        ]);
        bone.send(0x21, data).then(
          (result) => {
            infoLog("I2CSlaveDevice.write16() result value=" + result);
            if (result[0] != size) {
              printWriteError(this.portNumber, this.slaveAddress);
              reject(
                "I2CSlaveAddress(" + this.slaveAddress + ").write16():error"
              );
            } else {
              resolve();
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    },

    /**
     * @function
     *　I2C 1byte 読み込み処理
     * @return 読み込み結果
     * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
     */
    readByte: function () {
      return new Promise((resolve, reject) => {
        var data = new Uint8Array([this.slaveAddress, 1]);
        bone.send(0x22, data).then(
          (result) => {
            infoLog("I2CSlaveDevice.readByte() result value=" + result);
            var readSize = result[0];
            if (readSize == 1) {
              resolve(result[1]);
            } else {
              printReadError(this.portNumber, this.slaveAddress);
              reject("readByte() readSize unmatch : " + readSize);
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    },

    /**
     * @function
     *　I2C n byte 読み込み処理
     * @param length 読み込みバイト長
     * @return 読み込み結果
     * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
     */
    readBytes: function (length) {
      return new Promise((resolve, reject) => {
        if (typeof length !== "number" || length > 127) {
          reject("readBytes() readSize error : " + length);
        }
        var data = new Uint8Array([this.slaveAddress, length]);
        bone.send(0x22, data).then(
          (result) => {
            infoLog("I2CSlaveDevice.readBytes() result value=" + result);
            var readSize = result[0];
            if (readSize == length) {
              var buffer = result;
              buffer.shift(); // readSizeを削除
              resolve(buffer);
            } else {
              printReadError(this.portNumber, this.slaveAddress);
              reject("readBytes() readSize unmatch : " + readSize);
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    },

    /**
     * @function
     *　I2C 1byte 書き込み処理
     * @param value 書き込み値
     * @return 書き込み結果
     * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
     */
    writeByte: function (value) {
      return new Promise((resolve, reject) => {
        infoLog("I2CSlaveDevice.writeByte() value=" + value);
        var size = 1;
        var data = new Uint8Array([this.slaveAddress, size, value]);
        bone.send(0x21, data).then(
          (result) => {
            infoLog("I2CSlaveDevice.writeByte() result" + result);
            if (result[0] != size) {
              printWriteError(this.portNumber, this.slaveAddress);
              reject(
                "I2CSlaveAddress(" + this.slaveAddress + ").writeByte():error"
              );
            } else {
              resolve();
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    },

    /**
     * @function
     *　I2C n byte 書き込み処理
     * @param buffer 書き込み値
     * @return 書き込み結果
     * TODO: master-slave => main-sub になっているので、いずれ変えるべき？
     */
    writeBytes: function (buffer) {
      return new Promise((resolve, reject) => {
        if (buffer.length == null) {
          reject("readBytes() parameter error : " + buffer);
        }
        var arr = [this.slaveAddress, buffer.length];
        for (var cnt = 0; cnt < buffer.length; cnt++) {
          arr.push(buffer[cnt]);
        }
        var data = new Uint8Array(arr);
        bone.send(0x21, data).then(
          (result) => {
            infoLog("I2CSlaveDevice.writeBytes() result value=" + result);
            if (result[0] == buffer.length) {
              var resbuffer = result;
              resbuffer.shift(); // readSizeを削除
              resolve(resbuffer);
            } else {
              printWriteError(this.portNumber, this.slaveAddress);
              reject("writeBytes() writeSize unmatch : " + result[0]);
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    },
  };

  //////////////////////////////////////////////////////////////////////////
  // navigator

  if (!navigator.requestI2CAccess) {
    /**
     * @function
     *　navigator requestI2CAccess 割当処理
     * @return 割当結果
     */
    navigator.requestI2CAccess = function () {
      return new Promise(function (resolve, reject) {
        //      console.dir(bone);
        bone
          .waitConnection()
          .then(() => {
            var i2cAccess = new I2CAccess();
            infoLog("I2CAccess.resolve");
            resolve(i2cAccess);
          })
          .catch((e) => {
            reject(e);
          });
      });
    };
  }

  if (!navigator.requestGPIOAccess) {
    /**
     * @function
     *　navigator requestGPIOAccess 割当処理
     * @return 割当結果
     */
     navigator.requestGPIOAccess = function () {
      return new Promise(function (resolve, reject) {
        //      console.dir(bone);
        bone
          .waitConnection()
          .then(() => {
            var gpioAccess = new GPIOAccess();
            infoLog("gpioAccess.resolve");
            resolve(gpioAccess);
          })
          .catch((e) => {
            reject(e);
          });
      });
    };
  }
})();

//////////////////////////////////////////////////////////////////////////
// common utility functions

/**
 * Utility function for async/await code.
 * @param {number} ms - milliseconds to wait
 * @return {Promise} A promise to be resolved after ms milliseconds later.
 */
function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}
