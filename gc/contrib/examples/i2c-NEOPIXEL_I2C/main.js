// NEOPIXEL_I2Cボードを使ってNEOPIXEL LEDを制御します
var npixPromise;

main();

async function main() {
  try {
    console.log("main");
    var i2cAccess = await navigator.requestI2CAccess();
    var i2cPort = i2cAccess.ports.get(1);
    var npix = new NEOPIXEL_I2C(i2cPort, 0x41);
    await npix.init(128);
    console.log("init end");
    npixPromise = npix;
  } catch (error) {
    console.error("error", error);
  }
}

async function setGlobalColor(red, green, blue) {
  var npix = await npixPromise;
  npix.setGlobal(red, green, blue);
}

async function setPattern0(iH) {
  startH = 0;
  if (iH) {
    startH = iH;
  }
  var npix = await npixPromise;
  var grbArray = [];
  for (var i = 0; i < npix.N_LEDS; i++) {
    var h = startH + (360 * i) / npix.N_LEDS;
    var s = 1;
    var v = 0.1;
    var rgb = hsvToRgb(h, s, v);
    grbArray.push(rgb[1]);
    grbArray.push(rgb[0]);
    grbArray.push(rgb[2]);
    //		await npix.setPixel(i , rgb[0],rgb[1],rgb[2]);
  }
  await npix.setPixels(grbArray);
}

async function setPattern1() {
  for (var startH = 0; startH < 720; startH += 10) {
    await setPattern0(startH);
    await sleep(30);
  }
}

var pattern = [
  0x000000,
  0x000000,
  0x000000,
  0x002020,
  0x002020,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x002020,
  0x000000,
  0x000000,
  0x002020,
  0x000000,
  0x000000,
  0x000000,
  0x002020,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x002020,
  0x000000,
  0x002020,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x002020,
  0x002020,
  0x202000,
  0x202000,
  0x202000,
  0x202000,
  0x202000,
  0x202000,
  0x002020,
  0x002020,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x002020,
  0x002020,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x002020,
  0x002020,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x002020,
  0x200020,
  0x200020,
  0x200020,
  0x200020,
  0x200020,
  0x200020,
  0x200020,
  0x000000,
  0x200020,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x200020,
  0x200020,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x200020,
  0x200020,
  0x200000,
  0x200000,
  0x200000,
  0x200000,
  0x200000,
  0x200000,
  0x000000,
  0x200020,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x200020,
  0x200020,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x200020,
  0x200020,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x000000,
  0x200020,
  0x200020,
  0x200020,
  0x200020,
  0x200020,
  0x200020,
  0x200020,
  0x200020,
  0x000000
];

async function setPattern2(spos) {
  var sp = 0;
  if (spos) {
    sp = spos;
  }
  var npix = await npixPromise;
  var grbArray = [];
  for (var i = 0; i < pattern.length; i++) {
    var si = (i + sp * 8) % pattern.length;
    var r = (pattern[si] >> 16) & 0xff;
    var g = (pattern[si] >> 8) & 0xff;
    var b = pattern[si] & 0xff;
    grbArray.push(g);
    grbArray.push(r);
    grbArray.push(b);
  }
  await npix.setPixels(grbArray);
}

async function setPattern3() {
  for (var sp = 0; sp < 33; sp++) {
    await setPattern2(sp % (pattern.length / 8));
    await sleep(20);
  }
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
