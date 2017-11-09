last update : 2017.10.27

# CHIRIMEN for Raspberry Pi 3 セットアップ

CHIRIMEN for Raspberry Pi 3 (旧称：green CHIRIMEN) のセットアップ方法について書きます。

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

## 2-1. OSダウンロード

2017.09.07時点での最新版
2017-09-07-raspbian-stretch.img
をインストールする

http://qiita.com/ttyokoyama/items/7afe6404fd8d3e910d09

などを参考に、以下実施

## 2-2. SDカードフォーマット

「ディスクユーティリティ」などでFAT32にフォーマット。

## 2-3. SDカードへのコピー

$ sudo dd bs=1m if=./2017-09-07-raspbian-stretch.img of=/dev/disk2

でやると、遅い。

Macの人は、[Etcher](https://etcher.io/)
で焼くと速い。

## 2-4. ディスプレイ解像度

Preference > Raspberry Pi Configuration 起動
System タブの Resolution の項をから
1080P→「DMT mode 82 1920x1080 60Hz 16:9」を選ぶ。
720Pにするには、SDカードのルートにある `config.txt` から直接設定変更する

hdmi_force_hotplug=1
hdmi_group=2
hdmi_mode=85

> とりあえず、一旦720Pで話を進めます。

## 2-5. apt を最新に

> $ sudo apt-get update
> $ sudo apt-get upgrade

## 2-6. 日本語化

下記記事を参考に日本語環境を整える

https://www.rs-online.com/designspark/raspberry-pi-japanese

fontを入れて
Localeを ja-jp-utf8にして再起動

続けて下記記事を参考に、日本語IMEを入れる。

http://raspi-studio.hatenablog.com/entry/2016/05/14/203420

> $ sudo apt-get install uim uim-mozc
> $ sudo reboot

これで[半角/全角/漢字]と書いたキーを押すことで日本語入力もできるようになる

## 2-7. キーボードの設定

下記手順は、日本語用キーボードの場合。

> $ sudo raspi-config

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

> $ sudo reboot 

で再起動しとく。

## 2-8. pi ユーザーのパスワード設定

sudo rasp-config から Change User Password で変える。

> 展開しているimageのパスワードは { rasp } になっています。

## 2-9. node.js のインストール

http://qiita.com/setouchi/items/437e4b62e4210871496f

を参考に 6.11.3 を入れる。
(安定板で最終まで行ってるので)

> $ sudo apt-get install -y nodejs npm
> $ sudo npm cache clean
> $ sudo npm install n -g
> $ sudo n 6.11.3

これで、

- node.js v6.11.3
- npm     v3.10.10

が入る。

# 3. CHIRIMEN for Raspberry Pi 3 環境設定

## 3-1. 構成

CHIRIMEN for Raspberry Pi 環境ファイルは下記ファイルで構成される

### gc.zip  : ~/Desktop/gc/ に配置するファイルのアーカイブ。(プログラミング学習者が閲覧するファイル)

アーカイブには下記フォルダが含まれる

- gpio : Web GPIO API のexample集。回路図とサンプルコードのセット
- i2c  : Web I2C API のexample集。回路図とサンプルコードのセット
- polyfill : Web GPIO API / Web I2C API の polyfill
- drivers : i2cフォルダ配下のexampleから利用される各I2Cモジュールのドライバライブラリ 

### _gc.zip : ~/_gc/ に配置するファイルのアーカイブ。(プログラミング学習者が閲覧する必要のないファイル)

アーカイブには下記フォルダが含まれる

- bookmark : CHIRIMEN for Raspberry Pi 3 のexampleやチュートリアルなどへのブックマーク集
- srv : Bridge Server ファイル群
- wallpaper : 壁紙
- webside-backup : オンラインexampleのバックアップファイル


## 3-2. ~/_gc/ の設定手順


### _gc.zip ダウンロード (URLは暫定)

> cd ~
> $ wget https://mz4u.net/libs/gc2/env/_gc.zip
> $ unzip ./_gc.zip

※URLは暫定です。

### Serverへ関連モジュールインストール

> $ cd ~/_gc/srv
> $ npm i

これでサーバーの起動に必要なモジュールがインストールされます。

### Serverの自動起動設定

forever を入れる。

> $　sudo npm i forever -g

次に crontabを設定。

> $ crontab -e

下記を追加する。

@reboot sudo -u pi /home/pi/_gc/srv/startup.sh

上記記載後、保存する。
保存後再起動すると、サーバが自動起動する。

### Server再起動スクリプトのシンボリックリンクをdesktopに

ln -s ~/_gc/srv/reset.sh ~/Desktop/reset.sh

### 壁紙の導入

デスクトップ上で右クリックしてコンテキストメニューを開き、
「デスクトップの設定」を選ぶ。
「picture」から `~/_gc/wallpaper/wallpaper-720p.png` を選択する。

### Bookmarkの導入

Chromeのブックマークマネージャから、下記ファイルをインポートする。
`~/_gc/bookmark/bookmarks_2017_09_22.html`

## ~/Desktop/gc/ の設定 

### gc.zip ダウンロード (URLは暫定)

> cd ~
> $ wget https://mz4u.net/libs/gc2/env/gc.zip
> $ unzip ./gc.zip -d ~/Desktop

※URLは暫定です。

# 4. 追加設定 (Option)

以下はOptionです。

## imageサイズの圧縮

imageサイズの圧縮のため、下記サイトを参考に不要なアプリを削除する。

10/17版では下記を実施してある

> $ sudo apt-get purge wolfram-engine
> $ sudo apt-get remove --purge libreoffice*
> $ sudo apt-get clean
> $ sudo apt-get autoremove

## 不要プロセスの停止

パフォーマンス向上のため、下記サイトを不要なプロセスを停止する。

> $ sudo apt-get install chkconfig

chkconfigで、下記を停止

- dphys-swapfile
- lightdm
- triggerhappy
- avahi-daemon

以上




