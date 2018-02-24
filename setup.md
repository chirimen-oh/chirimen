last update : 2017.12.26

# How to setup CHIRIMEN for Raspberry Pi 3

I will write about how to setup CHIRIMEN for Raspberry Pi 3 (old name：green CHIRIMEN).

1. What to Prepare
2. Raspberry Pi 3 environment settings
3. CHIRIMEN for Raspberry Pi 3 environment settings
4. Extra settings (Option)

# 1. What to Prepare

- Raspberry Pi 3 Model B × 1
- Micro SD card (16Gbyte)
- Monitor that can connect for HDMI and a resolution of 720P or higher
- HDMI cable which fit monitor and Raspberry Pi
- AC adapter with USB micro B connector with supply capability of 5V/2.5A or higher
- USB connection keyboard
- Mouse
- An environment that can be connected to the Internet via WIFI or Ethernet
- CHIRIMEN for Raspberry Pi 3 Software suite(zip file)

# 2. Raspberry Pi 3 environment settings

## 2-1. Download OS

The latest version at 2017.12.26
Install 2017-11-29-raspbian-stretch.img


http://qiita.com/ttyokoyama/items/7afe6404fd8d3e910d09

Refer to the following, etc

## 2-2. SD card format

Quick at baking images with [Etcher](https://etcher.io/) .

## 2-3. Display Resolution

Preference > Launch Raspberry Pi Configuration
From the Resolution section of the System tab,
select 1080P → "DMT mode 82 1920x1080 60Hz 16:9".
When you change to 720P, edit setting `config.txt` from SD card's root.

hdmi_force_hotplug=1
hdmi_group=2
hdmi_mode=85
hdmi_drive=2

> Tentatively, use 720P.

## 2-4. Upgrade apt

> $ sudo apt-get update
> $ sudo apt-get upgrade

## 2-5. Japanese setting

The Japanese environment is prepared according to the following article.

https://www.rs-online.com/designspark/raspberry-pi-japanese


### 2-5.1. local settings

> sudo raspi-config

`4 Localisation Options` > `I1 Change locale` and select following

en_GB.UTF-8 UTF-8 
ja_JP.EUC-JP EUC-JP
ja_JP.UTF-8 UTF-8

change Locale to ja-jp-utf8, and reboot.

### 2-5.2. Install Font

1) debian of font

> sudo apt-get install ttf-kochi-gothic xfonts-intl-japanese xfonts-intl-japanese-big xfonts-kaname

2) Google of noto font 

> sudo apt-get install fonts-noto

At your liking (12/27 version is noto font)

### 2-5.3. Install Japanese IME

Please refer to the following article and install Japanese IME.

http://raspi-studio.hatenablog.com/entry/2016/05/14/203420

> $ sudo apt-get install uim uim-mozc
> $ sudo reboot

This can use Japanese input by press [半角/全角/漢字] key.

## 2-6. keybord settings

The following procedure is for the Japanese keyboard.

> $ sudo raspi-config

Start-up Settings. Select

> 4. Localisation Options

and select `<Select>` and Press Enter. Select

> I3 Change Keyboard Layout

and select `<Select>` and Press Enter. Select

> 標準 105キー（国際）PC

and select `<了解` and Press Enter. Select

> 日本語

and select `<了解` and Press Enter. Select

> キーボード配置のデフォルト

and select `<了解` and Press Enter. Select

> コンポーズキーなし

and select `<了解` and Press Enter. Select

> <いいえ>

This is all.

> $ sudo reboot 

Tentatively, reboot.

## 2-7. pi user's password setting

type to sudo rasp-config and Change User Password.

> This image default password is { rasp } .

## 2-9. Install node.js

http://qiita.com/setouchi/items/437e4b62e4210871496f

Refer to this and install 6.12.2.

> $ sudo apt-get install -y nodejs npm
> $ sudo npm cache clean
> $ sudo npm install n -g
> $ sudo n 6.12.2

This install version

- node.js v6.12.2
- npm     v3.10.10


## 2-9. enable I2C/camera

From

> sudo raspi-config


`5 Interfacing Options` > `P1 Camera` and `P5 I2C` change enable.

After reboot, in order to make Pi Camera available from the browser, make the following additional setting.

https://reprage.com/post/pi-camera-module-in-the-browser

Refer to this and enter the following command and reboot.

> echo 'options bcm2835-v4l2 gst_v4l2src_is_broken=1' | sudo tee -a /etc/modprobe.d/bcm2835-v4l2.conf
> echo 'bcm2835-v4l2' | sudo tee -a /etc/modules-load.d/modules.conf

After settings 

http://akizukidenshi.com/catalog/g/gM-10518/
http://akizukidenshi.com/catalog/g/gM-10476/

Using this, it is possible to get the video stream by `getUserMedia()` from the browser.

# 3. CHIRIMEN for Raspberry Pi 3 environment settings

## 3-1. composition

CHIRIMEN for Raspberry Pi environment file consists of the following files.

### 3-1-1. gc.zip  : archive that deploy to ~/Desktop/gc/ (Files that programming learners view)

The following folder is included in the archive

- gpio : Web GPIO API of example collection. A set of circuit diagram and sample code.
- i2c  : Web I2C API of example collection. A set of circuit diagram and sample code.
- polyfill : polyfill of Web GPIO API / Web I2C API.
- drivers : Driver library of I2C module used from example under i2c folder.
- top : Local web site which auto start of CHIRIMEN for Raspberry Pi 3.

### 3-1-2. _gc.zip : archive that deploy to ~/_gc/ (Files that programming learners need not to view)

The following folder is included in the archive

- bookmark : Bookmark collections that examples and tutorial of CHIRIMEN for Raspberry Pi 3.
- srv : Bridge Server files.
- wallpaper : Wallpaper.
- webside-backup : Backup files of online example.


## 3-2. ~/_gc/ Settings


### 3-2-1. Download _gc.zip file (temporary URL)

> cd ~
> $ wget https://mz4u.net/libs/gc2/env/_gc.zip
> $ unzip ./_gc.zip

※Temporary URL

### 3-2-2. Install modules to Server

> $ cd ~/_gc/srv
> $ npm i

This Install modules to need server to start-up

### 3-2-3. Auto start server setting

Install forever.

> $　sudo npm i forever -g

Next, setting crontab.

> $ crontab -e

Add the following.

@reboot sudo -u pi /home/pi/_gc/srv/startup.sh

And save.
reboot after saving, auto start server.

### 3-2-4. Server restart script symbolic link to desktop

ln -s ~/_gc/srv/reset.sh ~/Desktop/reset.sh

### 3-2-5. Put wallpaper

Right-click on the desktop to open the context menu, and
Select "デスクトップの設定".
Select `~/_gc/wallpaper/wallpaper-720p.png` from "picture".

### 3-2-6. Import Bookmark

Import the following file from Chrome's bookmark manager.
`~/_gc/bookmark/bookmarks_2017_09_22.html`

## 3-3. ~/Desktop/gc/ Setting

### 3-3-1. Download gc.zip (temporary URL)

> cd ~
> $ wget https://mz4u.net/libs/gc2/env/gc.zip
> $ unzip ./gc.zip -d ~/Desktop

※Temporary URL

### 3-3-2. Settings of local web site which auto start 

#### 3-3-2-1. Apache settings

##### 3-3-2-1-1. Install

> sudo apt-get install apache2

Install apache.

##### 3-3-2-1-2. Change document root

After install, type

> sudo nano /etc/apache2/sites-available/000-default.conf

and change `DocumentRoot` is `/home/pi/Desktop/gc`.

> sudo nano /etc/apache2/apache2.conf

change to `<Directory /var/www/>` to `<Directory /home/pi/Desktop/gc/>`



##### 3-3-2-1-3. SSL settings

> sudo apt-get install libapache2-mod-ssl

> cd /etc/apache2/sites-available
> cp default-ssl.conf vhost-ssl.conf  
> sudo nano vhost-ssl.conf

SSLCertificateFile /home/pi/_gc/srv/crt/server.crt
SSLCertificateKeyFile /home/pi/_gc/srv/crt/server.key

add and save.

> sudo a2ensite vhost-ssl
> sudo a2enmod ssl
> sudo systemctl restart apache2

restart apache. (It has no meaning, Still doesn't put SSL certificate)

#### 3-3-2-2. Auto start settings

> nano ~/.config/lxsession/LXDE-pi/autostart

Add the following

@/usr/bin/chromium-browser https://localhost/top

#### 3-3-2-3. Import certificate to browser

Suppress the security error by importing the certificate for localhost into the browser.

1. Start chromium-browser and open `設定` > `詳細設定` > `プライバシーとセキュリティ`
2. Open `証明書の管理`
3. `認証局` tabs `インポート`
4. Files select `~/_gc/srv/crt/ca.crt`
5. Since the Certificate Authority dialog is displayed, please check all settings of trust and click `OK`.

This is imprort `org-TripArts`.

# 4. Extra settings (Option)

The following is Option.

## 4-1. Compression of image size

For image size reduction, remove unnecessary applications referring to the following site.

10/17 version is reflected

> $ sudo apt-get purge wolfram-engine
> $ sudo apt-get remove --purge libreoffice*
> $ sudo apt-get clean
> $ sudo apt-get autoremove

## 4-2. Stop unnecessary processes

To improve performance, stop unnecessary processes.

> $ sudo apt-get install chkconfig

Stop from chkconfig

- dphys-swapfile
- lightdm
- triggerhappy
- avahi-daemon

## 4-3. Stop browser hardware acceleration

Now, Raspberry Pi + Chromium Browser doesn't work WebGL. Stop hardware acceleration.
This makes it possible to fall back to drawing with canvas with drawing library such as Pixi.js.

Start chromium-browser `設定` > `詳細設定` > `システム` to `ハードウエアアクセラレーションが使用可能な場合は使用する` is `OFF`.

restart browser.

## 4-4. Enable USB mike

When using a USB mike, please activate it with reference to the following.

http://kyochika-labo.hatenablog.com/entry/RaspberryPi_record_voice

※There is a possibility that it can not be used depending on the USB mike.

That's all.




