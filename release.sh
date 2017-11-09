rm -rf ./release
mkdir release

rm -f ./release/version.txt
rm -f ./_gc/version.txt
rm -f ./gc/version.txt
date +"CHIRIMEN for Raspberry Pi 3 emv.version : %y/%m/%d:%H:%M:%S" >./release/version.txt
cp ./release/version.txt ./_gc/version.txt
cp ./release/version.txt ./gc/version.txt

rm -rf ./release/env
mkdir ./release/env

zip -r ./release/env/gc.zip ./gc/
zip -r ./release/env/_gc.zip ./_gc/

zip --delete ./release/env/gc.zip "*__MACOSX*"
zip --delete ./release/env/_gc.zip "*__MACOSX*"
zip --delete ./release/env/gc.zip "*.DS_Store"
zip --delete ./release/env/_gc.zip "*.DS_Store"

rm -rf ./release/cdn
mkdir ./release/cdn



cp ./gc/drivers/*.* ./release/cdn/
cp ./gc/polyfill/*.* ./release/cdn/



