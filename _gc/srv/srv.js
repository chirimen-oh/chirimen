////////////////////////////////////////////////////////////
// 
// green-chirimen/srv.js
//
////////////////////////////////////////////////////////////
//  ver. 2017.10.17
////////////////////////////////////////////////////////////

// logout
require('date-utils');

function logout(str){
// /* Log一気に消すときは // 消す。
  var dt = new Date();
  var datetime = dt.toFormat("YYYY-MM-DD HH24:MI:SS");
  console.log(datetime+" : "+str)
  dt=null;
// Log一気に消すときは // 消す。 */
}

// version
const fs = require('fs');
var versionStr = fs.readFileSync('../version.txt');
logout(versionStr);

////////////////////////////////////////////////////////////
// https server
const https = require('https');
const port = 33330;

const server = https.createServer({
  cert: fs.readFileSync('./crt/server.crt'),
  key: fs.readFileSync('./crt/server.key')
});

server.listen(port,()=> {
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
var connections = new Map;

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
var lockGPIO = new Map;

/* --------------------------------------------------------

  lockI2C: map

  I2C slaveAddressの状態を登録しておくmap。
  リソースロック状態のslaveAddressのみ登録される。

  key: slaveAddress (Web I2C)

  obj.uid         : client uid
  
-------------------------------------------------------- */ 
var lockI2C  = new Map;

/* --------------------------------------------------------

  tempGPIO: map

  GPIO Portの処理中セッションを一時記録しておくmap。
  処理中セッションが存在するPortのみ登録される。

  key: portNumber (Web GPIO)

  obj.uid         : client uid
  obj.session     : session id
  
-------------------------------------------------------- */ 
var tempGPIO = new Map;

/* --------------------------------------------------------

  tempI2C: map

  I2C の処理中セッションを一時記録しておくmap。
  処理中セッションが存在するI2C Addressのみ登録される。

  key: slaveAddress (Web I2C)

  obj.uid         : client uid
  obj.session     : session id
  
-------------------------------------------------------- */ 

var tempI2C  = new Map;

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

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

process.on('unhandledRejection', console.dir);

wss.on('connection',(ws)=> {
  var conn = {};
  conn.ws = ws;
  conn.uid = ws._socket._handle.fd;
  conn.exportedPorts = new Map();
  conn.usingSlaveAddrs = new Map();
  connections.set(conn.uid,conn);
  logout("[new connection]uid:"+conn.uid+" clients are: "+(connections.size - 1));

  conn.ws.on('message',(message)=>{
    var u8mes = new Uint8Array(message);
    processMessage(conn,u8mes);
  });

  conn.ws.on('close', ()=> {
    unlockAllResources(conn);
    connections.delete(conn.uid);
    logout("[connection closed]uid:"+conn.uid+" clients are: "+connections.size);
/*
    // gpioライブラリ 側のcallback利用するので不要
    pollingPorts.forEach(function (value, key) {
      if(value == conn.uid){
        pollingPorts.delete(key);
      }
    });
*/
  });

  conn.ws.on('error', (error)=> {
    logout("[connection error]uid:"+conn.uid);
    conn.ws.terminate();
  });


});

function unlockAllResources(connection){
  connection.exportedPorts.forEach((obj,key)=>{
    logout("unlockAllResources-gpio:port="+key);
    obj.unexport();
    tempGPIO.delete(key);
    lockGPIO.delete(key);
  });
  connection.usingSlaveAddrs.forEach((obj,key)=>{
    logout("unlockAllResources-i2c:addr="+key);
    tempI2C.delete(key);
    lockI2C.delete(key);
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

function processMessage(connection,u8mes){
  logout("processMessage called: id["+connection.uid+"] mes["+u8mes+"]");

  //
  // ToDo: 
  // checkAquirable() で LockだったらRejectする処理の追加。
  // ここに入れるか、doProcessの中でもcheckAquirable()呼んでるのでその判定結果のとことでやるか..
  // Lockだったときは待つ必要がないはずなので、ここでやっちゃった方が効率がいいはずなのだが、
  // 

  processQueue.push({connection:connection, u8mes:u8mes});
  doProcess();
} 

function checkAcquirable(connection,u8mes){
//  var lockI2C = neisw Map;
//  var lockGPIO = new Map;
//  var tempI2C = new Map;
//  var tempGPIO = new Map;
//  var processQueue = [];

// result : 1,3 -> OK, 0,2 -> WAIT, -1 -> REJECT

//  console.dir(u8mes);

  var acquire = -1;

  if((u8mes[3] & 0xf0)== 0x10){ // Web GPIO API
    var lockdata = lockGPIO.get(u8mes[4]);
    if((!lockdata)||(lockdata.uid == connection.uid)){
      var status = tempGPIO.get(u8mes[4]);
      if(!status){
        acquire = 1;
        logout("★ ok(GPIO):"+u8mes);
      }else{
        logout("△ wait(GPIO):now processing UID:["+status.uid+"] session:["+status.session+"waiting:"+u8mes);
        acquire = 0;
      }
    }else{
      logout("x lockGPIO: your uid:"+connection.uid+" handle by:"+lockdata.uid);
    }
  }else if((u8mes[3] & 0xf0)== 0x20){ // Web I2C API
    var lockdata = lockI2C.get(u8mes[4]);
    if((!lockdata)||(lockdata.uid == connection.uid)){
      var status = tempI2C.get(u8mes[4]);
      if(!status){
        acquire = 3;
        logout("★ ok(I2C):"+u8mes);
      }else{
        acquire = 2;
        logout("△ wait(I2C):now processing UID:["+status.uid+"] session:["+status.session+"waiting:"+u8mes);
      }
    }else{
      logout("x lockI2C: your uid:"+connection.uid+" handle by:"+lockdata.uid);
    }
  }else{
    logout("invalid message: "+u8mes[1]);
  }
  logout("acquire:"+acquire);
  return acquire;
}

function doProcess(){
  return new Promise((resolve,reject)=>{
    if(processQueue.length){
      var probj = processQueue[0];

      // check Aquirable Resouces
      var acq = checkAcquirable(probj.connection,probj.u8mes);
      if((acq & ~0x02) == 0){ // WAIT (aquiable but now processing)
        logout("WAIT!");
        resolve(null);
      }else if(acq == -1){    // LOCK (not aquiable)

        // ToDo :
        // Lockの判定はprocessMessage()でqueueに積む前にやっちゃった方がいい
        // のだが、ここでやんないと入れ違いが発生する可能性が否定できず、条件分岐を
        // 残す必要があるかもしれない。
        // いずれにせよ残すなら probj.connection.ws.send(value); で、
        // 処理失敗を返さないといけないはずなので、方法要検討

        logout("LOCKED!");
        var ans = createAnswer(probj.u8mes,[0]);

        // Queueの処理実行時に入れ違いでWebSocketが閉じられていることがある。
        // 閉じられていた場合、送信しない。
        if (probj.connection.ws.readyState === 1){
          probj.connection.ws.send(ans);
        }
        processQueue.shift();
        resolve(null);
      }else{                  // OK (aquirable)
        processOne(probj.connection,probj.u8mes).then((value)=>{
//          logout("processOne.then() : "+processQueue.length);

        // Queueの処理実行時に入れ違いでWebSocketが閉じられていることがある。
        // 閉じられていた場合、送信しない。
          if (probj.connection.ws.readyState === 1){
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

var gpio = require("gpio",{interval:50});
//var i2c = require('i2c');

const raspi = require('raspi');
const I2C = require('raspi-i2c').I2C;
var i2c1 = null;
raspi.init(() => {
  i2c1 = new I2C();
});


//var i2c1 = new i2c(0x10,{device: '/dev/i2c-1'});  // 0x10はdummy.気にするな

function createAnswer(header,result){
  var resdata = new Array(4);
  resdata[0] = header[0];
  resdata[1] = header[1];
  resdata[2] = header[2];
  resdata[3] = header[3];

  for(var cnt=0;cnt < result.length;cnt++){
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


function processOne(connection,u8mes){
  return new Promise((resolve,reject)=>{
    var temp;
    var session = (u8mes[1] | (u8mes[2] << 8));
    var func = u8mes[3];
    var portnum = addr = u8mes[4];
    var ans = [];

    if((func & 0xf0)== 0x10){ // Web GPIO API
      temp = tempGPIO;
    }else if((func & 0xf0)== 0x20){ // Web I2C API
      temp = tempI2C;
    }
    temp.set(portnum,{uid:connection.uid, session:session});

    switch(func){

    /////////////////////////////////////////////////////////////////////////
    //      0x1x     : Web GPIO API
    //         0     : export      : [4] Port Number [5] Direction (0:out 1:in)
    case 0x10:
    {
      var direction = u8mes[5];
      logout("0x10:["+session+"]: port="+portnum+" value="+value+" direction="+direction);
      lockGPIO.set(portnum,{uid:connection.uid, direction:direction, value:-1});
      var dirStr;
      if(direction == 1){  // direction:in
        dirStr = 'in';
      }else{
        dirStr = 'out';
      }
      var options = {
        direction: dirStr,
        ready: function(){
          temp.delete(portnum);
          var portdata = lockGPIO.get(portnum);
          portdata.exportobj = exportobj;
          logout(portnum+" dir: "+portdata.direction);
          lockGPIO.set(portnum,portdata);
          logout("export:done: port="+portnum+" direction="+portdata.direction);

          if(portdata.direction == 1){
            portdata.exportobj._get((value)=>{
              portdata.value = value;
              ans = createAnswer(u8mes,[1]);
              resolve(ans);
            });
            portdata.exportobj.on("change",(val)=>{
              // [0] Change Callback (2)
              // [1] session id LSB (0)
              // [2] session id MSB (0)
              // [3] function id (0x14)
              // [4] Port Number 
              // [5] Value (0:LOW 1:HIGH)
              logout("changed:"+portnum+" value:"+val);
              var portdata = lockGPIO.get(portnum);
              portdata.value = val;
              lockGPIO.set(portnum,portdata);
              var mes = new Uint8Array([2,0,0,0x14,portnum,val]);
              var conn = connections.get(portdata.uid);
              conn.ws.send(mes);
              mes = null;
            });
          }else{
            //         0     : export      : [4] result (1:OK, 0:NG)
            ans = createAnswer(u8mes,[1]);
            resolve(ans);
          }
        }
      };
      var exportobj = gpio.export(portnum,options);
      connection.exportedPorts.set(portnum,exportobj);
      break;
    }

    /////////////////////////////////////////////////////////////////////////
    //      0x1x     : Web GPIO API
    //         1     : write       : [4] Port Number [5] Value (0:LOW 1:HIGH)
    case 0x11:
    {
      var portdata = lockGPIO.get(portnum);
      var value = u8mes[5];
      logout("0x11:["+session+"]: port="+portnum+" value="+value);
      if(portdata.direction == 0){ // out
        if(value > 0){
          value = 1;
        }
        portdata.value = value;       // これは本当はresolveでやった方がいいか?
        lockGPIO.set(portnum,portdata);

        logout("setValue() : port"+portnum+" value:"+value);

        // setValue()
        portdata.exportobj.set(value);
        temp.delete(portnum);
        ans = createAnswer(u8mes,[1]);
        resolve(ans);
      }else{
        logout("setValue() Error : port["+portnum+"] is now input port.");
      }
      break;
    }

    /////////////////////////////////////////////////////////////////////////
    //      0x1x     : Web GPIO API
    //         2     : read         : [4] Port Number
    case 0x12:
    {
      logout("0x12:["+session+"]: port="+portnum);
      var portdata = lockGPIO.get(portnum);
      if(portdata.direction == 1){ // in

        // pollingPorts の処理で定期的に読み込んだ値をlockGPIOに保存しておき、
        // getValueは同期で返せるように作る。

        temp.delete(portnum);
        ans = createAnswer(u8mes,[1,portdata.value]);
        resolve(ans);
        logout("getValue() : port"+portnum+" value:"+portdata.value);

      }else{
        temp.delete(portnum);
        logout("getValue() Error : port["+portnum+"] is now output port.");
      }
      break;
    }

    /////////////////////////////////////////////////////////////////////////
    //      0x1x     : Web GPIO API
    //         3     : unexport    : [4] Port Number
    case 0x13:
    {
      logout("0x13:["+session+"]: port="+portnum);
      var portdata = lockGPIO.get(portnum);
      portdata.exportobj.removeAllListeners('change');
      portdata.exportobj.unexport();
      connection.exportedPorts.delete(portnum);
      lockGPIO.delete(portnum);
      temp.delete(portnum);
      ans = createAnswer(u8mes,[1]);
      resolve(ans);
      break;
    }

    /////////////////////////////////////////////////////////////////////////
    //      0x2x     : Web I2C API
    //         0     : resource    : [4] slaveAddress [5] (1:acquire, 0:free)
    case 0x20:
    {
      var method = u8mes[5];
      logout("0x20:["+session+"]: addr="+addr+" method="+method);
      if(method == 1){
        lockI2C.set(addr,{uid:connection.uid});
        connection.usingSlaveAddrs.set(addr,addr);  // valueはみてない
      }else{
        lockI2C.delete(addr);
        connection.usingSlaveAddrs.delete(addr);
      }
      temp.delete(addr);
      ans = createAnswer(u8mes,[1]);
      resolve(ans);
      break;
    }

    /////////////////////////////////////////////////////////////////////////
    //      0x2x     : Web I2C API
    //         1     : writeBytes  : [4] slaveAddress [5] size [6-] data
    case 0x21:
    {
      var size = u8mes[5];
      logout("0x21:["+session+"]: addr="+addr+" size="+size+" buff.len"+(u8mes.length-6));
      if((u8mes.length - 6) != size){
        temp.delete(addr);
        reject("write size is not valid!");
      }
      var buffer = new Buffer(size);
      for(var cnt=0;cnt < size;cnt ++){
        buffer[cnt] = u8mes[6+cnt];
      }
      i2c1.write(addr,buffer,(e)=>{
        logout("0x22:["+session+"]: addr="+addr+" result: e="+e);
        var res = 0;
        if(e == null){
          res = size;
        }
        temp.delete(portnum);
        ans = createAnswer(u8mes,[res]);
        resolve(ans);
      });
      break;
    }

    /////////////////////////////////////////////////////////////////////////
    //      0x2x     : Web I2C API
    //         2     : readBytes   : [4] slaveAddress [5] readSize
    case 0x22:
    {
      var size = u8mes[5];
      logout("0x22:["+session+"]: addr="+addr+" size="+size);
      i2c1.read(addr,size,(e,data)=>{
        var mes = [0];
        if(e == null){
          mes[0]= data.length;
          for(var cnt=0;cnt < data.length;cnt++){
            mes.push(data[cnt]);
          }
        }
        logout("0x22:["+session+"]: addr="+addr+" result: e="+e+" size="+mes[0]);
        temp.delete(portnum);
        ans = createAnswer(u8mes,mes);
        resolve(ans);
      });
      break;
    }

    /////////////////////////////////////////////////////////////////////////
    //      0x2x     : Web I2C API
    //         3     : readRegister: [4] slaveAddress [5] registerNumber [6] readSize
    case 0x23:
    {
      var register = u8mes[5];
      var size = u8mes[6];
      logout("0x23:["+session+"]: addr="+addr+" register="+register+" size="+size);
      i2c1.read(addr,register,size,(e,data)=>{
        var mes = [0];
        if(e == null){
          mes[0]=data.length;
          for(var cnt=0;cnt < data.length;cnt++){
            mes.push(data[cnt]);
          }
        }
        logout("0x23:["+session+"]: addr="+addr+" register="+register+" result: e="+e+" size="+mes[0]);
        temp.delete(portnum);
        ans = createAnswer(u8mes,mes);
        resolve(ans);
      });
      break;
    }
    default:
      reject("invalid API Request: ["+func+"]");
      break;
    } // switch()

  });
}




