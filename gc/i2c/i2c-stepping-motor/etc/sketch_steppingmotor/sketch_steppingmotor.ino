// Stepping Motor Driver with I2C Slave Interface for Arduino
//
// This software runs arudino as an i2c slave device.
// It works by sending commands from i2c host device connected to arduino
//   * Supposed to use with "EasyDriver" or some other DIR/CLK type driver chip.
//   * Single axis stepping motor driver.
//   * Trapezoidal acceleration / deceleration are available.
//   * Default I2C address is 0x12. defined by I2CADDR.
//   * Arduino to DriverChip connection :
//     D 8  => CLK (microstep clock)
//     D 9  => DIR (motor direction)
//     D10  => RST (enable stepper LOW:disable HIGH:enable)
// 
// I2C commands
// all i2c write commands have 2 bytes parameter (little endian)
//   Write:
//   |   commands         | param1   | param2   |  description                                            |
//   |--------------------|----------|----------|---------------------------------------------------------|
//   | 0x00 | ParamInit   | dummy    | dummy    | Set motor profile to default value                      |
//   | 0x01 | Forward     | steps(L) | steps(H) | Move forward a specified number of steps                |
//   |      |             |          |          |  if number is 0xffff move forward infinity steps        |
//   | 0x02 | Reverse     | steps(L) | steps(H) | Move backward a specified number of steps               |
//   |      |             |          |          |  if number is 0xffff move backward infinity steps       |
//   | 0x03 | Abort       | dummy    | dummy    | Cancel the currently running move                       |
//   | 0x04 | SetSpeed    | speed(L) | speed(H) | Set motor speed (micro steps per sec) default is 3200   |
//   | 0x05 | SetMinSpeed | speed(L) | speed(H) | Set min speed (micro steps per sec) default is 800      |
//   | 0x06 | SetAccelRate| rate(L)  | rate(H)  | Accel/DeAccel rate. Hz / msec. default is 20            |
//   | 0x07 | Enable      | 0/1      | dummy    | enable / disable stepper                                |
//
//   Read:
//     Any read access return 1 byte motor status 0x00:stopped 0x01:moving
//
//----
// Test code for Raspberry Pi Python
//
// import smbus
// i2c = smbus.SMBus(1)
// # move forward 3200 (=0xc80) steps
// i2c.write_i2c_block_data(0x12, 1, [0x80, 0x0c])
// 

#include <Wire.h>

// for Debug
#define CMD_DEBUG 0

// I2C address
#define I2CADDR 0x12

// Arduino pins
#define CLK 8
#define DIR 9
#define ENA 10

// stepping motor profiles (8 micro step)
#define MAX_SPEED  (3200)           // default motor speed. microsteps per sec
#define MIN_SPEED  (800)            // default min speed. microsteps per sec
#define ACCEL_RATE (50)             // default accel rate. inc/dec ratio of Hz/msec

long max_speed;
long min_speed;
long accel_rate;
long target_speed = 0;
long current_speed = 0;
long cycle_wait;
int deaccel_phase = 0;

char rcv_buf[256];
int rcv_len;
int motor_run = 0;

unsigned long run_step = 0;
unsigned long target_step = 0;

#if CMD_DEBUG==1
#define DebugPrint(...) Serial.print(__VA_ARGS__)
#define DebugPrintln(...) Serial.println(__VA_ARGS__)
#else
#define DebugPrint(...)
#define DebugPrintln(...)
#endif

void paramInit(){
  max_speed = MAX_SPEED;
  min_speed = MIN_SPEED;
  accel_rate = ACCEL_RATE;
}

void setup() {
  paramInit();
  pinMode(CLK, OUTPUT); 
  pinMode(DIR, OUTPUT); 
  pinMode(ENA, OUTPUT);
  digitalWrite(CLK, LOW); 
  digitalWrite(DIR, LOW); 
  digitalWrite(ENA, HIGH);
  Wire.begin(I2CADDR);            // join i2c bus
  Wire.onReceive(receiveEvent);   // I2C write
  Wire.onRequest(requestEvent);   // I2C read
  
#if CMD_DEBUG==1
  Serial.begin(115200);          // start serial for output
  Serial.println("start");       // print the character
#endif

}

void requestEvent() { // I2C read

  DebugPrint("request ");
  DebugPrint(motor_run);         // print the integer
  DebugPrintln("");

  Wire.write(motor_run);
}

void receiveEvent(int howMany) {
  int i = 0;
  int p;
  int busy = rcv_len;
  while (0 < Wire.available()) { // loop through all but the last
    if (busy == 0) {
      rcv_buf[i++] = Wire.read(); // receive byte as a character
    } else {
      int a = Wire.read(); // dummy read
    }
  }
  if (i == 3) {
    rcv_len = i;
  }

  DebugPrint("receive ");
  DebugPrint(i);         // print the integer
  DebugPrintln(" bytes");

}
void loop() {
  if(motor_run == 1){
    if(current_speed)
      cycle_wait = 1000000 / current_speed;
    else
      cycle_wait = 1000000 / min_speed;
    int w = accel_rate * cycle_wait / 1000;
    if(w < 1)
      w = 1;
    int remain = target_step - run_step;
    int rlimit = (long)current_speed*current_speed/(accel_rate*2000);
    if(deaccel_phase || (target_step != 0xffff && remain <= rlimit)){
      deaccel_phase = 1;
      if(remain <= rlimit)
        current_speed-=w;
      if(current_speed<min_speed)
        current_speed = min_speed;
    }
    else {
      if(target_speed > current_speed){
        if((current_speed += w) > target_speed)
          current_speed = target_speed;
      }
      else if(target_speed < current_speed){
        if((current_speed -= w) < target_speed)
          current_speed = target_speed;
      }
    }
    digitalWrite(CLK, HIGH); 
    delayMicroseconds(cycle_wait>>1); 
    digitalWrite(CLK, LOW); 
    delayMicroseconds((cycle_wait+1)>>1); 
    run_step += 1;
    if (target_step != 0xffff && run_step >= target_step) {
      motor_run = 0;
      current_speed = 0;
    }
  }

  if( rcv_len > 0 ) {
    DebugPrint("data[");
    DebugPrint(rcv_buf[0] & 0xff,HEX);
    DebugPrint(",");
    DebugPrint(rcv_buf[1] & 0xff,HEX);
    DebugPrint(",");
    DebugPrint(rcv_buf[2] & 0xff,HEX);
    DebugPrintln("]");   

    unsigned int param = ((rcv_buf[2]&0xff)<<8)+(rcv_buf[1]&0xff);  // little endian 2bytes param
    switch(rcv_buf[0]) {

    case 0: // param init
      DebugPrintln("cmd0: paramInit");
      paramInit();
      break;

    case 1: // forward, steps(2bytes)
      DebugPrintln("cmd1: forward");
      if(motor_run == 0) {
        digitalWrite(DIR, LOW); 
        run_step = 0;
        target_step = param;
        motor_run = 1;
        current_speed = min_speed;
        target_speed = max_speed;
        deaccel_phase = 0;
      } else {
        DebugPrintln("busy");
      }
      break;

    case 2: // reverse, steps(2bytes)
      DebugPrintln("cmd1: reverse");
      if(motor_run == 0) {
        digitalWrite(DIR, HIGH); 
        run_step = 0;
        target_step = param;
        motor_run = 1;
        current_speed = min_speed;
        target_speed = max_speed;
        deaccel_phase = 0;
      } else {
        DebugPrintln("busy");
      }
      break;
      
    case 3: // abort, dummy(2bytes)
      DebugPrintln("cmd3: abort");
      motor_run = 0;
      current_speed = 0;
      target_speed = 0;
      break;
      
    case 4: // setSpeed, speed(2bytes pulse per sec)
      DebugPrintln("cmd4: setSpeed");
      max_speed = param;
      target_speed = max_speed;
      break;

    case 5: // setMinSpeed speed(2bytes pulse per sec)
      DebugPrintln("cmd3: setMinSpeed");
      min_speed = param;
      if(min_speed < 10)
        min_speed = 10;
      break;

    case 6: // setAccelRate rate(2bytes Hz / msec)
      DebugPrintln("cmd3: setAccelRate");
      accel_rate = param;
      break;

    case 7: // enable
      DebugPrintln("cmd3: enable");
      if(param&1)
        digitalWrite(ENA, HIGH);
      else
        digitalWrite(ENA, LOW);
      break;
    }
    rcv_len = 0;
  }
}
