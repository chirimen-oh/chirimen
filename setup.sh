#!/bin/bash
#
# cd /home/pi/
# wget -O setup.sh https://raw.githubusercontent.com/chirimen-oh/chirimen/master/setup.sh
# chmod 777 setup.sh
# ./setup.sh
#
# 一時的にスリープを無効
sudo xset s off
sudo xset -dpms
sudo xset s noblank
# スリープを無効
grep 'consoleblank=0' /boot/cmdline.txt
if [ $? -ge 1 ]; then
    sudo sed '1s/$/ consoleblank=0/' /boot/cmdline.txt |\
        sudo tee /tmp/cmdline && sudo cat /tmp/cmdline |\
        sudo tee /boot/cmdline.txt && sudo rm -f /tmp/cmdline
fi

if [ ! -f /etc/xdg/lxsession/LXDE-pi/autostart.orig ]; then
    sudo cp /etc/xdg/lxsession/LXDE-pi/autostart /etc/xdg/lxsession/LXDE-pi/autostart.orig
fi
sudo sh -c "cat << EOF > /etc/xdg/lxsession/LXDE-pi/autostart
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash
@xset s off
@xset -dpms
@xset s noblank
@/usr/bin/chromium-browser https://localhost/top
EOF"

# aptをmirrorで指定
sudo sh -c "cat << EOF > /etc/apt/mirrors.txt
http://ftp.jaist.ac.jp/raspbian/
http://ftp.tsukuba.wide.ad.jp/Linux/raspbian/raspbian/
http://ftp.yz.yamagata-u.ac.jp/pub/linux/raspbian/raspbian/
http://raspbian.raspberrypi.org/raspbian/
EOF"
if [ ! -f /etc/apt/sources.list.orig ]; then
    sudo cp /etc/apt/sources.list /etc/apt/sources.list.orig
fi
sudo sh -c "cat << EOF > /etc/apt/sources.list
deb mirror+file:/etc/apt/mirrors.txt buster main contrib non-free rpi
EOF"
sudo apt-get update

# 必要な項目をインストール
sudo apt-get install at-spi2-core

# update
sudo apt-get -y update
sudo apt-get -y upgrade

# raspiはupgrade失敗しやすいので念の為2回
sudo apt-get -y update
sudo apt-get -y upgrade

# 各種ツールをインストール
curl -sL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get -y install fonts-noto-cjk uim uim-mozc nodejs apache2 arduino code vim emacs libnss3-tools
# インストール失敗しやすいので2回
sudo apt-get -y install fonts-noto-cjk uim uim-mozc nodejs apache2 arduino code vim emacs libnss3-tools
sudo apt-get -y autoremove


# 日本語設定
# デフォルトの設定が en_GB.UTF-8 になっている
sudo sed 's/#\sen_GB\.UTF-8\sUTF-8/en_GB\.UTF-8 UTF-8/g' /etc/locale.gen |\
    sudo tee /tmp/locale && sudo cat /tmp/locale |\
    sudo tee /etc/locale.gen && sudo rm -f /tmp/locale
sudo sed 's/#\sja_JP\.EUC-JP\sEUC-JP/ja_JP\.EUC-JP EUC-JP/g' /etc/locale.gen  |\
    sudo tee /tmp/locale && sudo cat /tmp/locale |\
    sudo tee /etc/locale.gen && sudo rm -f /tmp/locale
sudo sed 's/#\sja_JP\.UTF-8\sUTF-8/ja_JP\.UTF-8 UTF-8/g' /etc/locale.gen  |\
    sudo tee /tmp/locale && sudo cat /tmp/locale |\
    sudo tee /etc/locale.gen && sudo rm -f /tmp/locale
sudo locale-gen ja_JP.UTF-8
sudo update-locale LANG=ja_JP.UTF-8

# 時間設定
sudo raspi-config nonint do_change_timezone Asia/Tokyo

# キーボード設定
sudo raspi-config nonint do_configure_keyboard jp

# Wi-Fi設定
sudo raspi-config nonint do_wifi_country JP

# VSCode extension
sudo npm i eslint prettier -g
code --install-extension MS-CEINTL.vscode-language-pack-ja
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode

# VSCode設定
mkdir -p /home/pi/.config/Code/User
cat << EOF > /home/pi/.config/Code/User/settings.json
{
  "editor.fontFamily": "'Noto Sans Mono CJK JP', 'Droid Sans Mono', 'monospace', monospace, 'Droid Sans Fallback'",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
EOF
mkdir -p /home/pi/.vscode
cat << EOF > /home/pi/.vscode/argv.json
{
  "locale": "ja"
}
EOF

# JSのデフォルトをVSCodeに
cat << EOF > /home/pi/.config/mimeapps.list
[Added Associations]
application/javascript=code.desktop;

[Default Applications]
application/javascript=code.desktop;
EOF

# カメラを有効化
sudo raspi-config nonint do_camera 0
grep 'bcm2835-v4l2' /etc/modprobe.d/bcm2835-v4l2.conf
if [ $? -ge 1 ]; then
    echo 'options bcm2835-v4l2 gst_v4l2src_is_broken=1' | sudo tee -a /etc/modprobe.d/bcm2835-v4l2.conf
fi
grep 'bcm2835-v4l2' /etc/modules-load.d/modules.conf
if [ $? -ge 1 ]; then
    echo 'bcm2835-v4l2' | sudo tee -a /etc/modules-load.d/modules.conf
fi

# I2Cを有効化
sudo raspi-config nonint do_i2c 0

# _gc設定
cd /home/pi/
if [ ! -f /home/pi/_gc.zip ]; then
    wget https://r.chirimen.org/_gc.zip
fi
if [ ! -d /home/pi/_gc/ ]; then
    unzip ./_gc.zip
fi
cd /home/pi/_gc/srv
npm i
sudo npm i forever -g
cd /home/pi/
crontab -l > /tmp/tmp_crontab
grep '/home/pi/_gc/srv/startup.sh' /tmp/tmp_crontab
if [ $? = 1 ]; then
    echo "@reboot sudo -u pi /home/pi/_gc/srv/startup.sh" | crontab
fi
ln -s /home/pi/_gc/srv/reset.sh /home/pi/Desktop/reset.sh
mkdir /home/pi/.config/chromium/
mkdir /home/pi/.config/chromium/Default/
cp /home/pi/_gc/bookmark/Bookmarks /home/pi/.config/chromium/Default/Bookmarks
pcmanfm --set-wallpaper /home/pi/_gc/wallpaper/wallpaper-720P.png

# Web Bluetooth有効化
cat << EOF > '/home/pi/.config/chromium/Local State'
{"browser":{"enabled_labs_experiments":["enable-experimental-web-platform-features"]}}
EOF

# gc設定
chromium-browser &
cd /home/pi/
if [ ! -f /home/pi/gc.zip ]; then
    wget https://r.chirimen.org/gc.zip
fi
# chromiumの起動待ちダウンロード
if [ ! -d /home/pi/Desktop/gc/ ]; then
    unzip ./gc.zip -d /home/pi/Desktop
fi
# chromiumの起動待ち
sleep 120s

# Apache設定
if [ ! -f /etc/apache2/sites-available/000-default.conf.orig ]; then
    sudo cp /etc/apache2/sites-available/000-default.conf /etc/apache2/sites-available/000-default.conf.orig
fi
sudo sh -c 'cat << EOF > /etc/apache2/sites-available/000-default.conf
<VirtualHost *:80>
        ServerAdmin webmaster@localhost
        DocumentRoot /home/pi/Desktop/gc

        ErrorLog \${APACHE_LOG_DIR}/error.log
        CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
EOF'
if [ ! -f /etc/apache2/apache2.conf.orig ]; then
    sudo cp /etc/apache2/apache2.conf /etc/apache2/apache2.conf.orig
fi
sudo sh -c 'cat << EOF > /etc/apache2/apache2.conf
DefaultRuntimeDir \${APACHE_RUN_DIR}
PidFile \${APACHE_PID_FILE}
Timeout 300
KeepAlive On
MaxKeepAliveRequests 100
KeepAliveTimeout 5

User \${APACHE_RUN_USER}
Group \${APACHE_RUN_GROUP}

HostnameLookups Off

ErrorLog \${APACHE_LOG_DIR}/error.log
LogLevel warn

IncludeOptional mods-enabled/*.load
IncludeOptional mods-enabled/*.conf
Include ports.conf

<Directory />
        Options FollowSymLinks
        AllowOverride None
        Require all denied
</Directory>

<Directory /usr/share>
        AllowOverride None
        Require all granted
</Directory>

<Directory /var/www/>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
</Directory>

<Directory /home/pi/Desktop/gc>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
</Directory>

AccessFileName .htaccess

<FilesMatch "^\.ht">
        Require all denied
</FilesMatch>

LogFormat "%v:%p %h %l %u %t \"%r\" %>s %O \"%{Referer}i\" \"%{User-Agent}i\"" vhost_combined
LogFormat "%h %l %u %t \"%r\" %>s %O \"%{Referer}i\" \"%{User-Agent}i\"" combined
LogFormat "%h %l %u %t \"%r\" %>s %O" common
LogFormat "%{Referer}i -> %U" referer
LogFormat "%{User-agent}i" agent

IncludeOptional conf-enabled/*.conf
IncludeOptional sites-enabled/*.conf
EOF'

sudo sh -c 'cat << EOF > /etc/apache2/sites-available/vhost-ssl.conf
<IfModule mod_ssl.c>
        <VirtualHost _default_:443>
                ServerAdmin webmaster@localhost

                DocumentRoot /home/pi/Desktop/gc

                ErrorLog \${APACHE_LOG_DIR}/error.log
                CustomLog \${APACHE_LOG_DIR}/access.log combined

                SSLEngine on
                SSLCertificateFile        /home/pi/_gc/srv/crt/server.crt
                SSLCertificateKeyFile /home/pi/_gc/srv/crt/server.key

                <FilesMatch "\.(cgi|shtml|phtml|php)$">
                                SSLOptions +StdEnvVars
                </FilesMatch>
                <Directory /usr/lib/cgi-bin>
                                SSLOptions +StdEnvVars
                </Directory>
        </VirtualHost>
</IfModule>
EOF'

sudo a2ensite vhost-ssl
sudo a2enmod ssl
sudo systemctl restart apache2

# 証明書追加
certfile="/home/pi/_gc/srv/crt/ca.crt"
certname="org-TripArts"

for certDB in $(find ~/ -name "cert9.db")
do
    certdir=$(dirname ${certDB});
    certutil -A -n "${certname}" -t "TCu,Cu,Tu" -i ${certfile} -d sql:${certdir}
done

####
# 最後にダイアログをOKにしてrebootして完了
####

sudo reboot
