# CHIRIMEN for Raspberry Pi 3

`CHIRIMEN for Raspberry Pi 3` is an IoT programing/prototyping environment for bigenners.

![wallpaper](_gc/wallpaper/wallpaper-720P.png)

Always under construction...

# Version

2018/09/30

# How To Setup CHIRIMEN Environment on raspbian
## Setup Automatically
Execute [`./setup.sh`](setup.sh) on Raspbian with Desktop. (**Note: default passwd will be changed to `rasp`**)

## Setup Manually
Refer [setup-ja.md](setup-ja.md), or [setup.md](setup.md).

# View top page content of chirimen environment on github
[Access this page](http://chirimen.org/chirimen-raspi3/gc/top/) via github pages.

# Files and Directories

- _gc/
  - ... need update ...
- gc/
  - ... need update ...
- readme.md
  - this file
- release/
  - release directory contains automatically generated files by release.sh
- release/cdn/
  - this directory contains copy of all `gc/drivers/*.*` and `gc/polyfill/*.*` files. These filess will be hosted on CDN (currently rawgit) to use easily load from jsbin or any other online codes.
- release/env/
  - gip package of `_gc/` and `gc/` directory. This is the release files of this project
- release/version.txt
  - automatically generated version timestamp file
- release.sh
  - script to make release package
- setup-ja.md
  - how to setup CHIRIMEN environment document in Japanese
- setup.md
  - how to setup CHIRIMEN environment document in English
- setup.sh
  - setup script to install CHIRIMEN environment on raspbian

-

# How To Release
Refer https://github.com/chirimen-oh/chirimen-raspi3/wiki/Release

# Licenses

- source codes
  - [MIT License](https://opensource.org/licenses/mit-license.php)
- other files (.png files, document files)
  - [CC by SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
