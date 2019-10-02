////////////////////////////////////////////////////////////
//
// green-chirimen/srv.js
//
////////////////////////////////////////////////////////////

// logout
function logout(str) {
  console.log([new Date().toLocaleString(), str].join(" : "));
}

// version
const fs = require("fs");
var versionStr = fs.readFileSync("../version.txt");
logout(versionStr);

////////////////////////////////////////////////////////////
// https server
const https = require("https");
const port = 33330;

const server = https.createServer({
  cert: fs.readFileSync("./crt/server.crt"),
  key: fs.readFileSync("./crt/server.key")
});

server.listen(port, () => {
  logout("https server started.");
});

////////////////////////////////////////////////////////////
// WebSocket server

/* --------------------------------------------------------
  connections: map

  現在接続されているクライアントの情報を登録しておくmap。
  key: client uid

  obj.ws           : websocket connection
  obj.uid          : client uid (keyと同じなので必要ないような)

-------------------------------------------------------- */
var connections = new Map();

/* --------------------------------------------------------

  pollingPorts: map

  ポーリング処理対象ポートを登録しておくmap。
  key: portNumber (Web GPIO)

  value         : client uid
-------------------------------------------------------- */
// gpioライブラリ 側のcallback利用するので不要
// var pollingPorts = new Map;

/* --------------------------------------------------------

  lockGPIO: map

  GPIO Portの状態を登録しておくmap。
  リソースロック状態のPortのみ登録される。

  key: portNumber (Web GPIO)

  obj.uid         : client uid
  obj.direction   : direction out=0 in=1
  obj.value       : GPIO value is LOW=0 or HIGH=1 or initializing=-1

-------------------------------------------------------- */
var lockGPIO = new Map();

/* --------------------------------------------------------

  tempGPIO: map

  GPIO Portの処理中セッションを一時記録しておくmap。
  処理中セッションが存在するPortのみ登録される。

  key: portNumber (Web GPIO)

  obj.uid         : client uid
  obj.session     : session id

-------------------------------------------------------- */
var tempGPIO = new Map();

/* --------------------------------------------------------

  tempI2C: map

  I2C の処理中セッションを記録しておくmap。
  処理中セッションが存在するI2C Addressのみ登録される。

  key: slaveAddress (Web I2C)

  obj.uid         : client uid
  obj.session     : session id

-------------------------------------------------------- */

var tempI2C = new Map();

/* --------------------------------------------------------

  processQueue: array

  message処理待ちQueue(FIFO)

  obj.connection   : connection object
  obj.u8mes        : message object (Uint8Array)

-------------------------------------------------------- */
var processQueue = [];

/* --------------------------------------------------------
  main
-------------------------------------------------------- */

const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });

process.on("unhandledRejection", console.dir);

wss.on("connection", ws => {
  var conn = {};
  conn.ws = ws;
  conn.uid = ws._socket._handle.fd;
  conn.exportedPorts = new Map();
  conn.usingSlaveAddrs = new Set();
  connections.set(conn.uid, conn);
  logout(
    "[new connection]uid:" +
      conn.uid +
      " clients are: " +
      (connections.size - 1)
  );

  conn.ws.on("message", message => {
    var u8mes = new Uint8Array(message);
    processMessage(conn, u8mes);
  });

  conn.ws.on("close", () => {
    unlockAllResources(conn);
    connections.delete(conn.uid);
    logout(
      "[connection closed]uid:" + conn.uid + " clients are: " + connections.size
    );
    /*
    // gpioライブラリ 側のcallback利用するので不要
    pollingPorts.forEach(function (value, key) {
      if(value == conn.uid){
        pollingPorts.delete(key);
      }
    });
*/
  });

  conn.ws.on("error", error => {
    logout("[connection error]uid:" + conn.uid);
    conn.ws.terminate();
  });
});

function unlockAllResources({ exportedPorts, usingSlaveAddrs }) {
  exportedPorts.forEach((obj, key) => {
    logout("unlockAllResources-gpio:port=" + key);
    obj.unexport();
    tempGPIO.delete(key);
    lockGPIO.delete(key);
  });
  usingSlaveAddrs.forEach(addr => {
    logout("unlockAllResources-i2c:addr=" + addr);
    tempI2C.delete(addr);
  });
}

//var polling = setInterval(()=>{
//  pollingPorts.forEach(function (value, key) {
//    console.log(key, value);
//  });
//},30);
/*
setInterval(()=>{
  var ramsize = process.memoryUsage().heapUsed;
  logout("[[[[[[memory-usage]]]]]]]:"+ramsize+"byte");
},10000);
*/

function processMessage(connection, u8mes) {
  logout(
    "processMessage called: id[" + connection.uid + "] mes[" + u8mes + "]"
  );

  //
  // ToDo:
  // checkAquirable() で LockだったらRejectする処理の追加。
  // ここに入れるか、doProcessの中でもcheckAquirable()呼んでるのでその判定結果のとことでやるか..
  // Lockだったときは待つ必要がないはずなので、ここでやっちゃった方が効率がいいはずなのだが、
  //

  processQueue.push({ connection: connection, u8mes: u8mes });
  doProcess();
}

/**
 * @returns {(-1|0|1|2|3)} acquire status: -1->REJECT, 0->WAIT, 1->OK, 2->WAIT, 3->OK
 */
function checkAcquirable(connection, u8mes) {
  const portNumberOrSlaveAddress = u8mes[4];
  let acquire = -1;
  switch (u8mes[3] & 0xf0) {
    // Web GPIO API
    case 0x10: {
      const lockdata = lockGPIO.get(portNumberOrSlaveAddress);
      if (lockdata != null && lockdata.uid !== connection.uid) {
        logout(
          [
            "x",
            "lockGPIO:",
            ["your uid", connection.uid].join(":"),
            ["handle by", lockdata.uid].join(":")
          ].join(" ")
        );
        break;
      }

      const status = tempGPIO.get(portNumberOrSlaveAddress);
      if (status != null) {
        const { uid, session } = status;
        logout(
          [
            "△",
            "wait(GPIO):",
            "now processing",
            ["UID", `[${uid}]`].join(":"),
            ["session", `[${session}]`].join(":"),
            ["waiting", u8mes].join(":")
          ].join(" ")
        );
        acquire = 0;
        break;
      }

      logout(["★", "ok(GPIO):", u8mes].join(" "));
      acquire = 1;
      break;
    }

    // Web I2C API
    case 0x20: {
      const status = tempI2C.get(portNumberOrSlaveAddress);
      if (status != null) {
        const { uid, session } = status;
        logout(
          [
            "△",
            "wait(I2C):",
            "now processing",
            ["UID", `[${uid}]`].join(":"),
            ["session"`${session}`].join(":"),
            ["waiting", u8mes].join(":")
          ].join(" ")
        );
        acquire = 2;
        break;
      }

      logout(["★", "ok(I2C):", u8mes].join(" "));
      acquire = 3;
      break;
    }
    default: {
      logout("invalid message: " + u8mes[1]);
      break;
    }
  }

  logout("acquire:" + acquire);
  return acquire;
}

function doProcess() {
  return new Promise((resolve, reject) => {
    if (processQueue.length) {
      var probj = processQueue[0];

      // check Aquirable Resouces
      var acq = checkAcquirable(probj.connection, probj.u8mes);
      if ((acq & ~0x02) == 0) {
        // WAIT (aquiable but now processing)
        logout("WAIT!");
        resolve(null);
      } else if (acq == -1) {
        // LOCK (not aquiable)

        // ToDo :
        // Lockの判定はprocessMessage()でqueueに積む前にやっちゃった方がいい
        // のだが、ここでやんないと入れ違いが発生する可能性が否定できず、条件分岐を
        // 残す必要があるかもしれない。
        // いずれにせよ残すなら probj.connection.ws.send(value); で、
        // 処理失敗を返さないといけないはずなので、方法要検討

        logout("LOCKED!");
        var ans = createAnswer(probj.u8mes, [0]);

        // Queueの処理実行時に入れ違いでWebSocketが閉じられていることがある。
        // 閉じられていた場合、送信しない。
        if (probj.connection.ws.readyState === 1) {
          probj.connection.ws.send(ans);
        }
        processQueue.shift();
        resolve(null);
      } else {
        // OK (aquirable)
        processOne(probj.connection, probj.u8mes).then(value => {
          //          logout("processOne.then() : "+processQueue.length);

          // Queueの処理実行時に入れ違いでWebSocketが閉じられていることがある。
          // 閉じられていた場合、送信しない。
          if (probj.connection.ws.readyState === 1) {
            probj.connection.ws.send(value);
          }
          value = null;
          processQueue.shift();
          resolve(doProcess());
        });
      }
    }
  });
}

////////////////////////////////////////////////////////////
// GPIO / I2C wrapper

const gpio = require("gpio", { interval: 50 });
const i2c = require("i2c-bus");

let i2c1 = null;
i2c.openPromisified(1).then(bus => {
  i2c1 = bus;
});

function createAnswer(header, result) {
  var resdata = new Array(4);
  resdata[0] = header[0];
  resdata[1] = header[1];
  resdata[2] = header[2];
  resdata[3] = header[3];

  for (var cnt = 0; cnt < result.length; cnt++) {
    resdata.push(result[cnt]);
  }
  return new Uint8Array(resdata);
}

// -------------------------------------------------------------------------------
// message format (Uint8Array)
// [0]: API Request (1)
// [1]: session id LSB
// [2]: session id MSB
// [3]: function id
//      0x00-0x0F: N/A
//      0x1x     : Web GPIO API
//         0     : export      : [4] Port Number [5] Direction (0:out 1:in)
//         1     : write       : [4] Port Number [5] Value (0:LOW 1:HIGH)
//         2     : read        : [4] Port Number
//         3     : unexport    : [4] Port Number
//      0x2x     : Web I2C API
//         0     : resource    : [4] slaveAddress [5] (1:acquire, 0:free)
//         1     : writeBytes  : [4] slaveAddress [5] size [6-] data
//         2     : readBytes   : [4] slaveAddress [5] readSize
//         3     : readRegister: [4] slaveAddress [5] registerNumber [6] readSize
// -------------------------------------------------------------------------------
// result format
// [0]: API Request (1)
// [1]: session id LSB
// [2]: session id MSB
// [3]: function id
//      0x00-0x0F: N/A
//      0x1x     : Web GPIO API
//         0     : export      : [4] result (1:OK, 0:NG)
//         1     : write       : [4] result (1:OK, 0:NG)
//         2     : read        : [4] result (1:OK, 0:NG) [5] readData (1:HIGH, 0:LOW)
//         3     : unexport    : [4] result (1:OK, 0:NG)
//      0x2x     : Web I2C API
//         0     : resource    : [4] result (1:OK, 0:NG)
//         1     : writeBytes  : [4] writed size (!0:OK, 0:NG)
//         2     : readBytes   : [4] read size (!0:OK, 0:NG) [5-] readData
//         3     : readRegister: [4] read size (!0:OK, 0:NG) [5-] readData
// -------------------------------------------------------------------------------

function processOne(connection, u8mes) {
  return new Promise((resolve, reject) => {
    var temp;
    var session = u8mes[1] | (u8mes[2] << 8);
    var func = u8mes[3];
    var portnum = u8mes[4];
    var ans = [];

    switch (func & 0xf0) {
      // Web GPIO API
      case 0x10:
        temp = tempGPIO;
        break;

      // Web I2C API
      case 0x20:
        temp = tempI2C;
        break;
    }
    temp.set(portnum, { uid: connection.uid, session: session });

    switch (func) {
      /////////////////////////////////////////////////////////////////////////
      //      0x1x     : Web GPIO API
      //         0     : export      : [4] Port Number [5] Direction (0:out 1:in)
      case 0x10: {
        var direction = u8mes[5];
        logout(
          "0x10:[" +
            session +
            "]: port=" +
            portnum +
            " value=" +
            value +
            " direction=" +
            direction
        );
        lockGPIO.set(portnum, {
          uid: connection.uid,
          direction: direction,
          value: -1
        });
        var dirStr;
        if (direction == 1) {
          // direction:in
          dirStr = "in";
        } else {
          dirStr = "out";
        }
        var options = {
          direction: dirStr,
          ready: function() {
            temp.delete(portnum);
            var portdata = lockGPIO.get(portnum);
            portdata.exportobj = exportobj;
            logout(portnum + " dir: " + portdata.direction);
            lockGPIO.set(portnum, portdata);
            logout(
              "export:done: port=" +
                portnum +
                " direction=" +
                portdata.direction
            );

            if (portdata.direction == 1) {
              portdata.exportobj.on("change", val => {
                // [0] Change Callback (2)
                // [1] session id LSB (0)
                // [2] session id MSB (0)
                // [3] function id (0x14)
                // [4] Port Number
                // [5] Value (0:LOW 1:HIGH)
                logout("changed:" + portnum + " value:" + val);
                var portdata = lockGPIO.get(portnum);
                portdata.value = val;
                lockGPIO.set(portnum, portdata);
                var mes = new Uint8Array([2, 0, 0, 0x14, portnum, val]);
                var conn = connections.get(portdata.uid);
                conn.ws.send(mes);
                mes = null;
              });
              ans = createAnswer(u8mes, [1]);
              resolve(ans);
            } else {
              //         0     : export      : [4] result (1:OK, 0:NG)
              ans = createAnswer(u8mes, [1]);
              resolve(ans);
            }
          }
        };
        var exportobj = gpio.export(portnum, options);
        connection.exportedPorts.set(portnum, exportobj);
        break;
      }

      /////////////////////////////////////////////////////////////////////////
      //      0x1x     : Web GPIO API
      //         1     : write       : [4] Port Number [5] Value (0:LOW 1:HIGH)
      case 0x11: {
        var portdata = lockGPIO.get(portnum);
        var value = u8mes[5];
        logout("0x11:[" + session + "]: port=" + portnum + " value=" + value);
        if (portdata.direction == 0) {
          // out
          if (value > 0) {
            value = 1;
          }
          portdata.value = value; // これは本当はresolveでやった方がいいか?
          lockGPIO.set(portnum, portdata);

          logout("setValue() : port" + portnum + " value:" + value);

          // setValue()
          portdata.exportobj.set(value);
          temp.delete(portnum);
          ans = createAnswer(u8mes, [1]);
          resolve(ans);
        } else {
          logout("setValue() Error : port[" + portnum + "] is now input port.");
        }
        break;
      }

      /////////////////////////////////////////////////////////////////////////
      //      0x1x     : Web GPIO API
      //         2     : read         : [4] Port Number
      case 0x12: {
        logout("0x12:[" + session + "]: port=" + portnum);
        var portdata = lockGPIO.get(portnum);
        if (portdata.direction == 1) {
          // in

          // pollingPorts の処理で定期的に読み込んだ値をlockGPIOに保存しておき、
          // getValueは同期で返せるように作る。

          temp.delete(portnum);
          ans = createAnswer(u8mes, [1, portdata.value]);
          resolve(ans);
          logout("getValue() : port" + portnum + " value:" + portdata.value);
        } else {
          temp.delete(portnum);
          logout(
            "getValue() Error : port[" + portnum + "] is now output port."
          );
        }
        break;
      }

      /////////////////////////////////////////////////////////////////////////
      //      0x1x     : Web GPIO API
      //         3     : unexport    : [4] Port Number
      case 0x13: {
        logout("0x13:[" + session + "]: port=" + portnum);
        var portdata = lockGPIO.get(portnum);
        portdata.exportobj.removeAllListeners("change");
        portdata.exportobj.unexport();
        connection.exportedPorts.delete(portnum);
        lockGPIO.delete(portnum);
        temp.delete(portnum);
        ans = createAnswer(u8mes, [1]);
        resolve(ans);
        break;
      }

      /////////////////////////////////////////////////////////////////////////
      //      0x2x     : Web I2C API
      //         0     : resource    : [4] slaveAddress [5] (1:acquire, 0:free)
      case 0x20: {
        const slaveAddress = u8mes[4];
        const method = u8mes[5];

        logout(
          [
            `0x20:[${session}]:`,
            `addr=${slaveAddress}`,
            `method=${method}`
          ].join(" ")
        );

        const { usingSlaveAddrs } = connection;
        switch (method) {
          // acquire
          case 1:
            usingSlaveAddrs.add(slaveAddress);
            break;

          // free
          case 0:
            usingSlaveAddrs.delete(slaveAddress);
            break;
        }

        temp.delete(slaveAddress);
        resolve(createAnswer(u8mes, [1]));
        break;
      }

      /////////////////////////////////////////////////////////////////////////
      //      0x2x     : Web I2C API
      //         1     : writeBytes  : [4] slaveAddress [5] size [6-] data
      case 0x21: {
        if (i2c1 == null) {
          reject("i2c-1 bus has not been initialized.");
          break;
        }

        const slaveAddress = u8mes[4];
        const size = u8mes[5];
        const data = u8mes.slice(6);

        logout(
          [
            `0x21:[${session}]:`,
            `addr=${slaveAddress}`,
            `size=${size}`,
            `data.length=${data.length}`
          ].join(" ")
        );

        if (data.length < size) {
          temp.delete(addr);
          processQueue = [];
          reject("write size is not valid!");
          break;
        }

        const buffer = Buffer.from(data.slice(0, size));
        const responseHandler = ({ bytesWritten } = { bytesWritten: 0 }) => {
          logout(
            [
              `0x21:[${session}]:`,
              `addr=${slaveAddress}`,
              `result=${bytesWritten}`
            ].join(" ")
          );
          temp.delete(slaveAddress);
          resolve(createAnswer(u8mes, [bytesWritten]));
        };

        i2c1
          .i2cWrite(slaveAddress, size, buffer)
          .then(responseHandler)
          .catch(() => responseHandler());
        break;
      }

      /////////////////////////////////////////////////////////////////////////
      //      0x2x     : Web I2C API
      //         2     : readBytes   : [4] slaveAddress [5] readSize
      case 0x22: {
        if (i2c1 == null) {
          reject("i2c-1 bus has not been initialized.");
          break;
        }

        const slaveAddress = u8mes[4];
        const readSize = u8mes[5];

        logout(
          [
            `0x22:[${session}]:`,
            `addr=${slaveAddress}`,
            `readSize=${readSize}`
          ].join(" ")
        );

        const responseHandler = ({ bytesRead, buffer } = { bytesRead: 0 }) => {
          const array =
            bytesRead > 0 ? Array.from(buffer.slice(0, bytesRead)) : [];

          logout(
            [
              `0x22:[${session}]:`,
              `addr=${slaveAddress}`,
              `result=${bytesRead}`
            ].join(" ")
          );
          temp.delete(slaveAddress);
          resolve(createAnswer(u8mes, [bytesRead, ...array]));
        };

        i2c1
          .i2cRead(slaveAddress, readSize, new Buffer(readSize))
          .then(responseHandler)
          .catch(() => responseHandler());
        break;
      }

      /////////////////////////////////////////////////////////////////////////
      //      0x2x     : Web I2C API
      //         3     : readRegister: [4] slaveAddress [5] registerNumber [6] readSize
      case 0x23: {
        if (i2c1 == null) {
          reject("i2c-1 bus has not been initialized.");
          break;
        }

        const slaveAddress = u8mes[4];
        const registerNumber = u8mes[5];
        const readSize = u8mes[6];

        logout(
          [
            `0x23:[${session}]:`,
            `addr=${slaveAddress}`,
            `register=${registerNumber}`,
            `readSize=${readSize}`
          ].join(" ")
        );

        const responseHandler = ({ bytesRead, buffer } = { bytesRead: 0 }) => {
          const array =
            bytesRead > 0 ? Array.from(buffer.slice(0, bytesRead)) : [];

          logout(
            [
              `0x23:[${session}]:`,
              `addr=${slaveAddress}`,
              `result=${bytesRead}`
            ].join(" ")
          );
          temp.delete(slaveAddress);
          resolve(createAnswer(u8mes, [bytesRead, ...array]));
        };

        i2c1
          .readI2cBlock(
            slaveAddress,
            registerNumber,
            readSize,
            new Buffer(readSize)
          )
          .then(responseHandler)
          .catch(() => responseHandler());
        break;
      }
      default:
        processQueue = [];
        reject("invalid API Request: [" + func + "]");
        break;
    } // switch()
  });
}
