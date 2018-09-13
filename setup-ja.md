last update : 2018.9.10

# CHIRIMEN for Raspberry Pi 3 セットアップ

CHIRIMEN for Raspberry Pi 3のセットアップ方法(OSイメージの作成方法)について書きます。

なお、CHIRIMEN for Raspberry Pi 3 の[ セットアップ済みSDイメージを使う場合](https://gist.github.com/tadfmac/527b31a463df0c9de8c30a598872344d)、このドキュメントの手順は不要です。

1. 用意するもの
2. Raspberry Pi 3 環境設定
3. CHIRIMEN for Raspberry Pi 3 設定
4. 追加設定 (Option)

# 1. 用意するもの

- Raspberry Pi 3 Model B × 1
- micro SDカード (16Gbyte)
- 720P以上の解像度でHDMI接続可能なモニタ
- モニタとRaspberry Piに適合するHDMIケーブル
- 5V/2.5A以上の供給能力を持つUSB micro B端子を持つACアダプタ
- USB接続キーボード
- マウス
- WIFIあるいはイーサネット経由でインターネット接続可能な環境
- CHIRIMEN for Raspberry Pi 3 ソフトウエア一式(zipファイル)

# 2. Raspberry Pi 3 環境設定

## 2-1. Raspbian OSダウンロード


* http://qiita.com/ttyokoyama/items/7afe6404fd8d3e910d09
* https://deviceplus.jp/hobby/raspberrypi_entry_057/

などを参考に、以下実施 

*なお、本ドキュメントでは2018.9.12時点での最新版(2018-06-27-raspbian-stretch.img)で確認しています。また、with Desktop(デスクトップ環境入り)を使います。*

## 2-2. SDカードへimageのコピー

[Etcher](https://etcher.io/) で焼くと速い。

## 2-3. ディスプレイ解像度

Preference > Raspberry Pi Configuration 起動
System タブの Resolution の項をから
1080P→「DMT mode 82 1920x1080 60Hz 16:9」を選ぶ。
720Pにするには、SDカードのルートにある `config.txt` から直接設定変更する

```
hdmi_force_hotplug=1
hdmi_group=2
hdmi_mode=85
hdmi_drive=2
```

> とりあえず、一旦720Pで話を進めます。

## 2-4. apt を最新に

```
sudo apt-get update
sudo apt-get upgrade
```

## 2-5. 日本語化

下記記事を参考に日本語環境を整える

https://www.rs-online.com/designspark/raspberry-pi-japanese

### 2-5.1. localの設定

```
sudo raspi-config
```

`4 Localisation Options` > `I1 Change locale` から下記を選択。

```
en_GB.UTF-8 UTF-8 
ja_JP.EUC-JP EUC-JP
ja_JP.UTF-8 UTF-8
```

Localeを ja-jp-utf8にして再起動

### 2-5.2. Fontのインストール

1) debianのフォント

```
sudo apt-get install ttf-kochi-gothic xfonts-intl-japanese xfonts-intl-japanese-big xfonts-kaname
```

2) Google notoフォント

```
sudo apt-get install fonts-noto
```

いずれかお好きな方で。(12/27版のimageではnotoフォントを採用)

### 2-5.3. 日本語IMEのインストール

続けて下記記事を参考に、日本語IMEを入れる。

http://raspi-studio.hatenablog.com/entry/2016/05/14/203420

```
sudo apt-get install uim uim-mozc
sudo reboot
```

これで[半角/全角/漢字]と書いたキーを押すことで日本語入力もできるようになる

## 2-6. キーボードの設定

下記手順は、日本語用キーボードの場合。

```
sudo raspi-config
```

で設定画面起動後、

> 4. Localisation Options

を選んで `<Select>` を選択後、リターンキーを押して次の画面へ

> I3 Change Keyboard Layout

を選んで `<Select>` を選択後、リターンキーを押して次の画面へ

> 標準 105キー（国際）PC

を選んで `<了解` を選択後、リターンキーを押して次の画面へ

> 日本語

を選んで `<了解` を選択後、リターンキーを押して次の画面へ

> キーボード配置のデフォルト

を選んで `<了解` を選択後、リターンキーを押して次の画面へ

> コンポーズキーなし

を選んで `<了解` を選択後、リターンキーを押して次の画面へ

> <いいえ>

を選んで終了。

最後にここで `sudo reboot` で再起動しておく。

## 2-7. pi ユーザーのパスワード設定

`sudo raspi-config` から `Change User Password` で変える。

> 展開しているimageのパスワードは { rasp } になっています。

## 2-8. node.js のインストール

http://qiita.com/setouchi/items/437e4b62e4210871496f

を参考に 8.10.0 を入れる。

```
sudo apt-get install -y nodejs npm
sudo npm cache clean
sudo npm install n -g
sudo n 8.10.0
```

これで、

- node.js v8.10.0
- npm     v5.6.0

が入る。

## 2-9. I2C/カメラの有効化

```
sudo raspi-config
```

から `5 Interfacing Options` > `P1 Camera` と `P5 I2C` をenableにする。

再起動後、Pi Cameraをブラウザから利用可能にするために、追加で下記設定を行う。

https://reprage.com/post/pi-camera-module-in-the-browser

を参考に、下記コマンドを入力後再起動する。

```
echo 'options bcm2835-v4l2 gst_v4l2src_is_broken=1' | sudo tee -a /etc/modprobe.d/bcm2835-v4l2.conf
echo 'bcm2835-v4l2' | sudo tee -a /etc/modules-load.d/modules.conf
```

これにより、

http://akizukidenshi.com/catalog/g/gM-10518/
http://akizukidenshi.com/catalog/g/gM-10476/

を利用してブラウザから `getUserMedia()` によるビデオストリームの取得が可能になる。

# 3. CHIRIMEN for Raspberry Pi 3 環境設定

## 3-1. 構成

CHIRIMEN for Raspberry Pi 環境ファイルは下記ファイルで構成される

### 3-1-1. gc.zip  : ~/Desktop/gc/ に配置するファイルのアーカイブ。(プログラミング学習者が閲覧するファイル)

アーカイブには下記フォルダが含まれる

- gpio : Web GPIO API のexample集。回路図とサンプルコードのセット
- i2c  : Web I2C API のexample集。回路図とサンプルコードのセット
- polyfill : Web GPIO API / Web I2C API の polyfill
- drivers : i2cフォルダ配下のexampleから利用される各I2Cモジュールのドライバライブラリ 
- top : CHIRIMEN for Raspberry Pi 3の自動起動ローカルサイト

### 3-1-2. _gc.zip : ~/_gc/ に配置するファイルのアーカイブ。(プログラミング学習者が閲覧する必要のないファイル)

アーカイブには下記フォルダが含まれる

- bookmark : CHIRIMEN for Raspberry Pi 3 のexampleやチュートリアルなどへのブックマーク集
- srv : Bridge Server ファイル群
- wallpaper : 壁紙
- webside-backup : オンラインexampleのバックアップファイル

## 3-2. ~/_gc/ の設定手順


### 3-2-1. _gc.zip ダウンロード (URLは暫定)

```
cd ~
wget https://rawgit.com/chirimen-oh/chirimen-raspi3/master/release/env/_gc.zip
unzip ./_gc.zip
```

※URLは暫定です。

### 3-2-2. Serverへ関連モジュールインストール

```
cd ~/_gc/srv
npm i
```

これでサーバーの起動に必要なモジュールがインストールされます。

### 3-2-3. Serverの自動起動設定

forever を入れる。

```
sudo npm i forever -g
```

次に crontabを設定。

```
crontab -e
```

下記を追加する。

```
@reboot sudo -u pi /home/pi/_gc/srv/startup.sh
```

上記記載後、保存する。
保存後再起動すると、サーバが自動起動する。

### 3-2-4. Server再起動スクリプトのシンボリックリンクをdesktopに

```
ln -s ~/_gc/srv/reset.sh ~/Desktop/reset.sh
```

### 3-2-5. 壁紙の導入

デスクトップ上で右クリックしてコンテキストメニューを開き、
「デスクトップの設定」を選ぶ。
「picture」から `~/_gc/wallpaper/wallpaper-720p.png` を選択する。

### 3-2-6. Bookmarkの導入

`~/_gc/bookmark/Bookmarks` を `/home/pi/.config/chromium/Default/Bookmarks` へコピーする。

## 3-3. ~/Desktop/gc/ の設定 

### 3-3-1. gc.zip ダウンロード (URLは暫定) と配置

```
cd ~
wget https://rawgit.com/chirimen-oh/chirimen-raspi3/master/release/env/gc.zip
unzip ./gc.zip -d ~/Desktop
```

※URLは暫定です。

### 3-3-2. 自動起動ローカルサイトの設定

#### 3-3-2-1. Apache設定

##### 3-3-2-1-1. インストール

```
sudo apt-get install apache2
```

で apacheをインストールする。

##### 3-3-2-1-2. ドキュメントルートの変更

インストール後、

```
sudo nano /etc/apache2/sites-available/000-default.conf
```

で、`DocumentRoot` を `/home/pi/Desktop/gc` に変更する。

```
sudo nano /etc/apache2/apache2.conf
```

`<Directory /var/www/>` を、 `<Directory /home/pi/Desktop/gc/>`

に変更する。

##### 3-3-2-1-3. SSLの設定

```
sudo apt-get install libapache2-mod-ssl

cd /etc/apache2/sites-available
cp default-ssl.conf vhost-ssl.conf  
sudo nano vhost-ssl.conf
```

vhost-ssl.conf には次の 2 行を追加する:

```
SSLCertificateFile /home/pi/_gc/srv/crt/server.crt
SSLCertificateKeyFile /home/pi/_gc/srv/crt/server.key
```

```
sudo a2ensite vhost-ssl
sudo a2enmod ssl
sudo systemctl restart apache2
```

で apache を再起動する。(まだ証明書を入れてないので意味はない)

#### 3-3-2-2. 自動起動設定

```
nano ~/.config/lxsession/LXDE-pi/autostart
```

で開いた設定ファイルの最後の行に下記を追加

```
@/usr/bin/chromium-browser https://localhost/top
```

#### 3-3-2-3. ブラウザへ証明書をインポート

localhost用の証明書をブラウザへインポートすることでセキュリティエラーを抑止する。

1. chromium-browserを起動し、`設定` > `詳細設定` > `プライバシーとセキュリティ` を開く
2. `証明書の管理` を開く
3. `認証局`　タブから `インポート`
4. ファイルから、`~/_gc/srv/crt/ca.crt` を選択
5. 認証局ダイアログが表示されるので、信頼の設定全てにチェックを入入りれて `OK`をクリック。

これで、`org-TripArts`がインポートされる。

# 4. 追加設定 (Option)

以下の手順はOptionです。

## 4-1. imageサイズの圧縮

imageサイズの圧縮のため、下記サイトを参考に不要なアプリを削除する。

10/17版では下記を実施してある

```
$ sudo apt-get purge wolfram-engine
$ sudo apt-get remove --purge libreoffice*
$ sudo apt-get clean
$ sudo apt-get autoremove
```

## 4-2. 不要プロセスの停止

パフォーマンス向上のため、下記サイトを不要なプロセスを停止する。

```
sudo apt-get install chkconfig
```

`chkconfig` で、下記を停止

- lightdm
- triggerhappy
- avahi-daemon

## 4-3. ブラウザのハードウエアアクセラレーションの停止

現時点のRaspberry Pi + Chromium BrowserではWebGLが正常に動作しないため、ハードウエアアクセラレーションOFFにしておきます。
これによりPixi.js等の描画系ライブラリでcanvasでの描画にフォールバック動作できるようになります。

chromium-browser を起動し、`設定` > `詳細設定` > `システム` の `ハードウエアアクセラレーションが使用可能な場合は使用する` を`OFF` にします。

ブラウザを再起動します。

## 4-4. USBマイクの有効化

USBマイクを利用する場合、下記を参考に有効化してください。

http://kyochika-labo.hatenablog.com/entry/RaspberryPi_record_voice

※USBマイクによっては利用できない可能性があります。

## 4-5. Web Bluetooth APIの有効化

Web Bluetooth APIを利用する場合、下記手順で設定してください。

1. chromium-browserを起動し、`chrome://flags` にアクセスする
2. "Experimental Web Platform features" という項目を探し、 [有効] に切り替えてブラウザを再起動

### 4-5-1. Web Bluetooth API有効無効の確認方法

1. ブラウザを起動後、F12キーを押してコンソールを起動します。
2. コンソールに `navigator.bluetooth`と入力します。
3. 入力の結果、"▶ Bluetooth {}" が返ってくればWeb Bluetooth APIは有効になっています。一方で "undefined" になる場合は無効です。


以上




