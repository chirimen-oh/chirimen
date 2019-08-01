var portAddrs = [4,5,6,12,13,16,17,18,19,20,21,22,23,24,25,26,27]; // prettier-ignore

main(); // 定義したasync関数を実行します（このプログラムのエントリーポイントになっています）

async function main() {
  var gpioAccess = await navigator.requestGPIOAccess();
  //        console.log("GPIO ready!");
  var ports = [];
  for (var i = 0; i < portAddrs.length; i++) {
    ports[i] = gpioAccess.ports.get(portAddrs[i]);
    await ports[i].export("in");
    ports[i].onchange = (function(prt) {
      return function(v) {
        console.log(
          "Catch event : button:",
          prt,
          " addr:",
          portAddrs[prt],
          " val:",
          v
        );
        document.getElementById("statusDisp").innerHTML =
          "Catch event : button:" +
          prt +
          "  addr:" +
          portAddrs[prt] +
          " val:" +
          v;
        /**
				setTimeout(function(){
					document.getElementById("statusDisp").innerHTML="--";
					},500);
				**/
      };
    })(i);
  }
}
