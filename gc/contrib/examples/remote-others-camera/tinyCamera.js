// tinyCamera.js
// カメラで画像を撮影し、解像度落としてdatauri化する機能
// Programmed by Satoru Takagi
// Copyright 2020 by Satoru Takagi @ KDDI All Rights Reserved
//
// usage:
// id="cameraUI"のdiv要素にUIを構築する
// tinyCamera.capture()　で写真撮影実行
// API:
//   tinyCamera.capture(画像サイズ,プレビュー画面サイズ,img要素のIDもしくはdatauriをコールバックする関数) : 写真撮影する
//     パラメータ：画像サイズ,プレビュー画面サイズ,img要素のIDもしくはdatauriをコールバックする関数　これらは全てオプション
//   tinyCamera.getImageURI() datauriを得る（撮影済みならば・・)
//
// タギングだけでの使い方の例：
// <div id="cameraUI"></div>
// <input type="button" value="カメラで撮影" onclick="tinyCamera.capture(1000,300,'rslt')"/>
// <img id="rslt" src="">
//
// History
//  2020/06/04 : 1st working implementation
//
// Issues
//  ボタンのスタイリング・レイアウティングがなんもできてない
//
// https://ja.stackoverflow.com/questions/11378/カメラで撮影した画像をリサイズしてアップロードしたい
// https://blog.katsubemakito.net/html5/camera1
// https://kimizuka.hatenablog.com/entry/2017/11/06/140337  (autoplay playsinlineがポイント = ios safari)
// https://support.skyway.io/hc/ja/community/posts/360000916108-Safari%E3%81%A7%E3%81%AEgetUserMedia%E3%81%A716-9%E3%81%AE%E8%A7%A3%E5%83%8F%E5%BA%A6%E3%82%92%E8%A8%AD%E5%AE%9A%E3%81%99%E3%82%8B%E6%96%B9%E6%B3%95%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6 アスペクトについて
// https://marmooo.blogspot.com/2020/03/getusermedia.html

( function ( window , undefined ) {
	var document = window.document;
	var navigator = window.navigator;
	var location = window.location;

var tinyCamera = ( function(){

var imageURI, targetImgTag, cbf;

var imgSize = 1024;
var finderSize = 300;
var continuous = false;

var cameraImageCanvas;
var shutterSound;
var cameraShutter;
var cameraDecide;
var cameraReshot;
var cameraCancel;
var video;
	
function startCamera(){
	video  = document.getElementById("cameraFinder");
	var vw = video.width;
	var vh = video.height;
	cameraImageCanvas = document.getElementById("cameraImageCanvas");
	shutterSound = document.getElementById("shutterSound");
	cameraShutter = document.getElementById("cameraShutter");
	cameraDecide = document.getElementById("cameraDecide");
	cameraReshot = document.getElementById("cameraReshot");
	cameraCancel = document.getElementById("cameraCancel");
	
	/** カメラ設定 */
	var constraints = {
		audio: false,
		video: {
			width: {min:0,max:2000},
			height: {min:0,max:2000}, // vw????
			aspectRatio:vw/vh,
//			facingMode: "user"   // フロントカメラを利用する (iOS Safariだとフロントになっちゃう・・)
//			facingMode: { exact: "environment" }  // リアカメラを利用する場合 (PCだと動かない)　のでスマホかどうか確認必要
		}
	};
	
	if ( isMobile()){
		constraints.video.facingMode = { exact: "environment" };
	}
	
	/**
	* カメラを<video>と同期
	*/
	navigator.mediaDevices.getUserMedia(constraints)
	.then( (stream) => {
		console.log("stream:",stream);
		video.srcObject = stream;
		video.onloadedmetadata = (e) => {
			video.play();
		};
	})
	.catch( (err) => {
		console.log(err.name + ": " + err.message);
	});
	
	// 決定ボタン
	cameraDecide.addEventListener("click", imageConfirm);
		
	// キャンセルボタン
	cameraCancel.addEventListener("click", function(){
		removeChildren(cameraUI);
	});
	
	// 再撮影ボタン
	cameraReshot.addEventListener("click", function(){
		video.play();
//		video.style.display="";
//		cameraImageCanvas.style.display="none";
		cameraShutter.style.display="";
		cameraDecide.style.display="none";
		cameraReshot.style.display="none";
	});
	/**
	* シャッターボタン
	*/
	cameraShutter.addEventListener("click", shutter);
};

function shutter(){
	var ctx = cameraImageCanvas.getContext("2d");
	
	// 演出的な目的で一度映像を止めてSEを再生する
	video.pause();  // 映像を停止
	shutterSound.play();      // シャッター音
	/**
	setTimeout( () => {
		video.play();    // 0.5秒後にカメラ再開
	}, 500);
	**/
	
	console.log("video:w/h:",video.videoWidth,video.videoHeight);
	var aspect = video.videoHeight / video.videoWidth;
	var cw = imgSize;
	var ch = imgSize;
	console.log("aspect:",aspect," cw:",cw," ch:",ch);
	if ( aspect > 1){
		cw = ch / aspect;
	} else {
		ch = cw * aspect;
	}
	cameraImageCanvas.setAttribute("width" ,cw);
	cameraImageCanvas.setAttribute("height",ch);
	console.log("cam w,h:"+video.videoWidth+","+video.videoHeight + " image w,h:"+cw+","+ch);
	
//		video.style.display="none";
	
	console.log("aspect:",aspect," cw:",cw," ch:",ch);
	// cameraImageCanvasに画像を貼り付ける
	// ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
	ctx.drawImage(video, 0, 0, cw, ch);
//		cameraImageCanvas.style.display="";
//			cameraShutter.value="OK";
	
	cameraShutter.style.display="none";
	cameraDecide.style.display="";
	cameraReshot.style.display="";
}

function imageConfirm(){
	imageURI = cameraImageCanvas.toDataURL( "image/jpeg", 0.8 ) ;
	if (  typeof(cbf) == "function" ){
		cbf(imageURI);
	} else if ( targetImgTag ){
		targetImgTag.src = imageURI;
	}
	//console.log("imageURI:",imageURI);
	if ( continuous ){
		video.play();
		cameraShutter.style.display="";
		cameraDecide.style.display="none";
		cameraReshot.style.display="none";
	} else {
		removeChildren(cameraUI);
	}
	return ( imageURI );
}

function isMobile(){
	var regexp = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
	return (window.navigator.userAgent.search(regexp) !== -1);
}

function initCamUI(noUI){
	var cameraUI = document.getElementById("cameraUI");
	removeChildren(cameraUI);
	var video=document.createElement("video");
	video.setAttribute("width",finderSize);
	video.setAttribute("height",finderSize);
	video.setAttribute("autoplay",true);
	video.setAttribute("playsinline",true);
	video.id="cameraFinder";
//	video.style.transform="scale(0.25)";
	cameraUI.appendChild(video);
	
	var prev=document.createElement("canvas");
	prev.setAttribute("width",imgSize);
	prev.setAttribute("height",imgSize);
	prev.id="cameraImageCanvas";
	prev.style.display="none";
//	prev.style.transform="scale(0.25)";
	cameraUI.appendChild(prev);
	
	var cameraUIB = document.createElement("span");
	cameraUI.appendChild(cameraUIB);
	if ( noUI ){
		cameraUIB.style.display="none";
	}
	
	var btn = document.createElement("input");
	btn.type = "button";
	btn.value="シャッター";
	btn.id="cameraShutter";
	cameraUIB.appendChild(btn);
	
	var btn2 = document.createElement("input");
	btn2.type = "button";
	btn2.value="決定";
	btn2.id="cameraDecide";
	btn2.style.display="none";
	cameraUIB.appendChild(btn2);
	
	var btn3 = document.createElement("input");
	btn3.type = "button";
	btn3.value="再撮影";
	btn3.id="cameraReshot";
	btn3.style.display="none";
	cameraUIB.appendChild(btn3);
	
	var btn4 = document.createElement("input");
	btn4.type = "button";
	btn4.value="キャンセル";
	btn4.id="cameraCancel";
	cameraUIB.appendChild(btn4);
	
	var aud = document.createElement("audio");
	aud.id="shutterSound";
	aud.setAttribute("preload","auto");
	var ss='<source src="camera-shutter1.mp3" type="audio/mp3">';
	aud.innerHTML = ss;
	cameraUI.appendChild(aud);
}

function getImage(){
	shutter();
	var ans = imageConfirm();
	return ( ans );
}

function removeChildren(tgt){
	while (tgt.firstChild) tgt.removeChild(tgt.firstChild);
}

function cameraCapture(imageSize, previewSize, continuousMode, withUI, targetImgTagId_callback){
	var noUI = true;
	if ( withUI ){
		noUI = false;
	}
	if ( continuousMode ){
		continuous = true;
	}
	if ( targetImgTagId_callback ){
		if ( typeof(targetImgTagId_callback) == "function" ){
			cbf = targetImgTagId_callback;
		} else {
			targetImgTag=document.getElementById(targetImgTagId_callback);
		}
	} else {
		targetImgTag = null;
	}
	if ( imageSize ){
		imgSize = imageSize;
	}
	if ( previewSize ) {
		finderSize = previewSize;
	}
	
	console.log("cameraCapture");
	initCamUI(noUI);
	startCamera();
}

function getImageURI(){
	return ( imageURI );
}

return {
	init: cameraCapture,
	getImageURI: getImageURI,
	imageConfirm: imageConfirm,
	shutter: shutter,
	getImage: getImage,
}
})();
	
	window.tinyCamera = tinyCamera;
})( window );


