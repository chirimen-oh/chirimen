main();

async function main() {
  //var gpioAccess = await navigator.requestGPIOAccess();
  var sensorElement = document.getElementById("sensor1");
  var i2cAccess = await navigator.requestI2CAccess();
  var port = i2cAccess.ports.get(1);
  var vl = new VL53L0X(port, 0x29);
  await vl.init();

  for (;;) {
    var distance = await vl.getRange();

    await sleep(200);
    if (distance < 6000) {
      sensorElement.classList.add("on");
    } else {
      sensorElement.classList.remove("on");
    }
  }
}
document.getElementById("come_time").innerHTML = getComeTime();

function getComeTime() {
  var now = new Date();
  var mon = now.getMonth() + 1;
  var day = now.getDate();
  var hour = now.getHours();
  var min = now.getMinutes();
  var sec = now.getSeconds();
  var s = mon + "月" + day + "日" + hour + "時" + min + "分" + sec + "秒";
  return s;
}

timerID = setInterval("clock()", 500); //0.5秒毎にclock()を実行

function clock() {
  document.getElementById("now_time").innerHTML = getNow();
  document.getElementById("spent_time").innerHTML = getSpentTime(
    getNow,
    getComeTime
  );
}

function getNow() {
  var now = new Date();
  var mon = now.getMonth() + 1; //１を足すこと
  var day = now.getDate();
  var hour = now.getHours();
  var min = now.getMinutes();
  var sec = now.getSeconds();

  //出力用
  var s = mon + "月" + day + "日" + hour + "時" + min + "分" + sec + "秒";
  return s;
}

document.getElemantById("spent_time").innerHTML = getSpentTime();
function getSpentTime(getNow, getComeTime) {
  var spentmon = getNow.mon - getComeTime.mon;
  var spentday = getNow.day - getComeTime.day;
  var spenthour = getNow.hour - getComeTime.hour;
  var spentmin = getNow.min - getComeTime.min;
  var spentsec = getNow.sec - getComeTime.sec;

  //出力用
  var s =
    spentmon +
    "ヶ月" +
    spentday +
    "日" +
    spenthour +
    "時間" +
    spentmin +
    "分" +
    spentsec +
    "秒";
  return s;
}
