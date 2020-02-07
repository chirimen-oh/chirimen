main();

async function main() {
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var apds = new APDS9960(port);
    await apds.init();
    await apds.enableGestureSensor();
    var mot,moa;
    while (1)
    {
        moa = await apds.isGestureAvailable(); 
        mot = await apds.readGesture();
        document.getElementById("Gesture").innerHTML =  mot;
        await sleep(200);
    }
}
