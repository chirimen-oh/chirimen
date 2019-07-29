#!/usr/bin/env bash

HOME_DIR=/opt/buildhome/
REPO_DIR=`git rev-parse --show-toplevel`
BASE_DIR=`pwd`

PUBLISH_DIR=${BASE_DIR}/public

rm -rf ${PUBLISH_DIR}
mkdir -p ${PUBLISH_DIR}

rm -f ./_gc/version.txt
rm -f ./gc/version.txt
date +"CHIRIMEN for Raspberry Pi 3 env.version : %y/%m/%d:%H:%M:%S" > ${PUBLISH_DIR}/version.txt
cp ${PUBLISH_DIR}/version.txt ./_gc/version.txt
cp ${PUBLISH_DIR}/version.txt ./gc/version.txt

zip -r ${PUBLISH_DIR}/gc.zip ./gc/
zip -r ${PUBLISH_DIR}/_gc.zip ./_gc/

zip --delete ${PUBLISH_DIR}/gc.zip "*__MACOSX*"
zip --delete ${PUBLISH_DIR}/_gc.zip "*__MACOSX*"
zip --delete ${PUBLISH_DIR}/gc.zip "*.DS_Store"
zip --delete ${PUBLISH_DIR}/_gc.zip "*.DS_Store"

# polyfill/drivers should be handled by other deployment
#rm -rf ./release/cdn
#mkdir ./release/cdn
#
#cp ./gc/drivers/*.* ./release/cdn/
#cp ./gc/polyfill/*.* ./release/cdn/
