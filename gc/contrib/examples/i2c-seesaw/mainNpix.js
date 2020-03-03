main();

var pixels = 64;
var portA = 14;
var portB = 15;

var pat0 = [0,1,2,3,4,5,6,7,8,16,24,32,40,48,56,57,58,59,60,61,62,63,55,47,39,31,23,15];
var pat1 = [
0,0,0,1,1,0,0,0,
0,0,1,0,0,1,0,0,
0,1,0,0,0,0,1,0,
1,0,0,1,1,0,0,1,
1,0,0,1,1,0,0,1,
0,1,0,0,0,0,1,0,
0,0,1,0,0,1,0,0,
0,0,0,1,1,0,0,0
];

async function main() {
  try {
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var ss = new seesaw(port);
  	await ss.init();
  	
  	// initNeopixelを呼んだ後はそのポートに切り替わる
  	await ss.initNeopixel(portA,pixels,false); // portAを選択
  	await ss.fillPixels(10,10,10); // 指定色で塗りつぶす。(リセット直後は0,0,0)
  	await ss.showPixels();
  	
	await sleep(500);
  	
  	// setPixel()で、1ピクセルずつ設定する例
  	for ( var i = 0 ; i < pat0.length ; i++ ){
	  	await ss.setPixel(pat0[i],0,0,32);
  	}
  	await ss.showPixels();
  	
  	await ss.initNeopixel(portB,pixels,false); // ここでportBを選択
  	// 別ポートに同じパターンを出したいなら、切り替え前のsetPixel(s)の状態が継承できる
  	await ss.showPixels();
	await sleep(2000);
  	
  	await ss.fillPixels(10,0,0);
  	await ss.showPixels();
  	
	await sleep(500);
  	
  	
  	var pattern;
  	var startHue=0;
    while (1) {
	  	await ss.initNeopixel(portA,pixels,false); // portAを選択
	  	pattern = getRainbowPattern(startHue);
	  	await ss.setPixels(0,pattern);
	  	await ss.showPixels();
    	
	  	await ss.initNeopixel(portB,pixels,false);
	  	pattern = getFixedPattern(startHue);
	  	await ss.setPixels(0,pattern);
	  	await ss.showPixels();
    	await sleep(500);
    	
    	startHue += 30;
    }
  } catch (error) {
    console.error("error", error);
  }
}

var s = 1;
var v = 0.07;
function getRainbowPattern(startHue){
	if (!startHue){
		startHue = 0;
	}
	var pat = [];
	for ( var i = 0 ; i < pixels ; i++ ){
		var h = (Math.floor(360 * (i / pixels)) + startHue) % 360 ;
		var color = hsvToRgb(h, s , v);
		pat.push(color);
	}
	return ( pat );
}

function getFixedPattern(hue){
	var pat = [];
	var color;
	for ( var i = 0 ; i < pat1.length ; i++ ){
		if ( pat1[i]==1 ){
			color = hsvToRgb(hue+180, s , v);
			pat.push(color);
		} else {
			color = hsvToRgb(hue, s , v);
			pat.push(color);
		}
	}
	return ( pat );
}

// from https://qiita.com/hachisukansw/items/633d1bf6baf008e82847
function hsvToRgb(H, S, V) {
  //https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV

  H = H % 360;

  var C = V * S;
  var Hp = H / 60;
  var X = C * (1 - Math.abs((Hp % 2) - 1));

  var R, G, B;
  if (0 <= Hp && Hp < 1) {
    [R, G, B] = [C, X, 0];
  }
  if (1 <= Hp && Hp < 2) {
    [R, G, B] = [X, C, 0];
  }
  if (2 <= Hp && Hp < 3) {
    [R, G, B] = [0, C, X];
  }
  if (3 <= Hp && Hp < 4) {
    [R, G, B] = [0, X, C];
  }
  if (4 <= Hp && Hp < 5) {
    [R, G, B] = [X, 0, C];
  }
  if (5 <= Hp && Hp < 6) {
    [R, G, B] = [C, 0, X];
  }

  var m = V - C;
  [R, G, B] = [R + m, G + m, B + m];

  R = Math.floor(R * 255);
  G = Math.floor(G * 255);
  B = Math.floor(B * 255);

  return [R, G, B];
}