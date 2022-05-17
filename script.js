//canvas setup
let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");

let currentImage = [];

let sourceX = 0;
let sourceY = 0;

let prevX = 0;
let prevY = 0;
let zoomScale = 1;

let holdingMouse = false;
canvas.addEventListener('mousemove', e => {
	if(holdingMouse){
		sourceX += e.offsetX - prevX;
		sourceY += e.offsetY - prevY;
		prevX = e.offsetX;
		prevY = e.offsetY;
	}
});
canvas.addEventListener('mousedown', e => {
	holdingMouse = true;
	prevX = e.offsetX;
	prevY = e.offsetY;
});
canvas.addEventListener('mouseup', e => {
	holdingMouse = false;
});
canvas.addEventListener('wheel', e => {
	if(e.wheelDeltaY < 0){
		zoomScale -= 0.05;
		if(zoomScale < 0){
			zoomScale = 0;
		}
	}
	else if(e.wheelDeltaY > 0){
		zoomScale += 0.05;
		if(zoomScale > 10){
			zoomScale = 10;
		}
	}
});
let THRESHHOLDLIMIT = 0.50;
let NUMOFBITS = 2;

let puppy = new Image();

function getBase64(file){
	let reader = new FileReader();
	reader.readAsDataURL(file);
	reader.onload = function(){
		puppy.src = reader.result;
	};
	reader.onerror = function(error){
		console.log('Error: ', error);
	};
}
window.onload = function(){
	document.getElementById('button').addEventListener('click', function() {
		let files = document.getElementById('file').files;
		if (files.length > 0){
			getBase64(files[0]);
		}
	});
	document.getElementById('rimg').addEventListener('click', function() {
		sourceX = 0;
		sourceY = 0;
		zoomScale = 1;
	});
}
puppy.onload = function(){
	canvas.width = puppy.width;
	canvas.height = puppy.height;
	
	recreateImages();
	
	frame();
}
let modifierType = 0;
let types = ['Normal','Threshhold','Quantize Color','Dither Color','Greyscale','Quantize Greyscale','Dither Greyscale'];

window.addEventListener('keydown', e => {
	const keyname = e.code;
	if(keyname === 'Digit1'){
		modifierType--;
		if(modifierType < 0){
			modifierType = types.length - 1;
		}
		if(modifierType == 1)
			recreateThreshhold();
		else
			recreateQuantize();
	}
	else if(keyname === 'Digit2'){
		modifierType++;
		if(modifierType > types.length - 1){
			modifierType = 0;
		}
		if(modifierType == 1)
			recreateThreshhold();
		else
			recreateQuantize();
	}
	else if(keyname === 'ArrowUp'){
		if(modifierType == 1){
			THRESHHOLDLIMIT += 0.01;
			THRESHHOLDLIMIT = Number.parseFloat(THRESHHOLDLIMIT.toFixed(2));
			if(THRESHHOLDLIMIT > 1){
				THRESHHOLDLIMIT = 1;
			}
			recreateThreshhold();
		}
		else if(modifierType == 2 || modifierType == 3 || modifierType == 5 || modifierType == 6){
			NUMOFBITS++;
			if(NUMOFBITS > 8){
				NUMOFBITS = 8;
			}
			recreateQuantize();
		}
	}
	else if(keyname === 'ArrowDown'){
		if(modifierType == 1){
			THRESHHOLDLIMIT -= 0.01;
			THRESHHOLDLIMIT = Number.parseFloat(THRESHHOLDLIMIT.toFixed(2));
			if(THRESHHOLDLIMIT < 0){
				THRESHHOLDLIMIT = 0;
			}
			recreateThreshhold();
		}
		else if(modifierType == 2 || modifierType == 3 || modifierType == 5 || modifierType == 6){
			NUMOFBITS--;
			if(NUMOFBITS < 1){
				NUMOFBITS = 1;
			}
			recreateQuantize();
		}
	}
	document.getElementById('modType').innerHTML = `Modifier Type: ${types[modifierType]}`;
	document.getElementById('threshValue').innerHTML = `Threshhold Value: ${THRESHHOLDLIMIT}`;
	document.getElementById('numBits').innerHTML = `Number of Bits: ${NUMOFBITS}`;
});
function recreateImages(){
	ctx.drawImage(puppy,0,0,canvas.width,canvas.height);
	let imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
	currentImage[0] = imageData;
	imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
	threshhold(imageData);
	currentImage[1] = imageData;
	imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
	quanitze(imageData);
	currentImage[2] = imageData;
	imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
	colorDither(imageData);
	currentImage[3] = imageData;
	imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
	greyscale(imageData);
	currentImage[4] = imageData;
	imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
	quantizeGrey(imageData);
	currentImage[5] = imageData;
	imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
	greyDither(imageData);
	currentImage[6] = imageData;
}
function recreateThreshhold(){
	ctx.drawImage(puppy,0,0,canvas.width,canvas.height);
	let imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
	threshhold(imageData);
	currentImage[1] = imageData;
}
function recreateQuantize(){
	ctx.drawImage(puppy,0,0,canvas.width,canvas.height);
	let imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
	
	if(modifierType == 2)
		quanitze(imageData);
	else if(modifierType == 3)
		colorDither(imageData);
	else if(modifierType == 4)
		greyscale(imageData);
	else if(modifierType == 5)
		quantizeGrey(imageData);
	else if(modifierType == 6)
		greyDither(imageData);
	
	currentImage[modifierType] = imageData;
}
//called on page load
function init(){
	//called only once
}
//called every 1/60 of a second
function frame(){
	
	//draws main screen
	draw();
	window.requestAnimationFrame(frame);
}
function draw(){
	ctx.fillStyle = 'white';
	ctx.fillRect(0,0,canvas.width,canvas.height);
	
	//draw new image
	let newCanvas = document.createElement('canvas');
	newCanvas.width = canvas.width;
	newCanvas.height = canvas.height;
	newCanvas.getContext("2d").putImageData(currentImage[modifierType], 0, 0);
	
	ctx.drawImage(newCanvas,sourceX,sourceY,canvas.width*zoomScale,canvas.height*zoomScale);
}
function greyscale(imageData){
	for(let i=0;i<imageData.data.length;i+=4){
		let avgPixels = (0.2162*imageData.data[i])+(0.7152*imageData.data[i+1])+(0.0722*imageData.data[i+2]);
		imageData.data[i] = avgPixels;
		imageData.data[i+1] = avgPixels;
		imageData.data[i+2] = avgPixels;
	}
}
function threshhold(imageData){
	for(let i=0;i<imageData.data.length;i+=4){
		let avgPixels = ((0.2162*imageData.data[i])+(0.7152*imageData.data[i+1])+(0.0722*imageData.data[i+2]))/255;
		if(avgPixels <= THRESHHOLDLIMIT){
			imageData.data[i] = 0;
			imageData.data[i+1] = 0;
			imageData.data[i+2] = 0;
		}
		else{
			imageData.data[i] = 255;
			imageData.data[i+1] = 255;
			imageData.data[i+2] = 255;
		}
	}
}
function quanitze(imageData){
	let fLevels = (1 << NUMOFBITS) - 1;
	function adjData(pixel){
		imageData.data[pixel] = Math.round(imageData.data[pixel] / 255 * fLevels) / fLevels * 255;
	}
	for(let i=0;i<imageData.data.length;i+=4){
		adjData(i);
		adjData(i+1);
		adjData(i+2);
	}
}
function colorDither(imageData){
	let imageDataBackup = JSON.parse(JSON.stringify(imageData));
	let fLevels = (1 << NUMOFBITS) - 1;
	for(let i=0;i<imageData.data.length;i+=4){
		adjData(i);
		adjData(i+1);
		adjData(i+2);
	}
	function adjData(pixel){
		imageData.data[pixel] = Math.round(imageData.data[pixel] / 255 * fLevels) / fLevels * 255;
		
		let qError = imageDataBackup.data[pixel] - imageData.data[pixel];
		
		imageData.data[pixel+4] += qError * (7/16);
		imageData.data[pixel+(canvas.width * 4)-4] += qError * (3/16);
		imageData.data[pixel+(canvas.width * 4)] += qError * (5/16);
		imageData.data[pixel+(canvas.width * 4)+4] += qError * (1/16);
	}
}
function quantizeGrey(imageData){
	let fLevels = (1 << NUMOFBITS) - 1;
	greyscale(imageData);
	function adjData(pixel){
		let newValue = Math.round(imageData.data[pixel] / 255 * fLevels) / fLevels * 255;
		imageData.data[pixel] = newValue;
		imageData.data[pixel+1] = newValue;
		imageData.data[pixel+2] = newValue;
	}
	for(let i=0;i<imageData.data.length;i+=4){
		adjData(i);
	}
}
function greyDither(imageData){
	let imageDataBackup = JSON.parse(JSON.stringify(imageData));
	greyscale(imageDataBackup);
	let fLevels = (1 << NUMOFBITS) - 1;
	for(let i=0;i<imageData.data.length;i+=4){
		adjData(i);
	}
	function adjData(pixel){
		let newValue = Math.round(imageData.data[pixel] / 255 * fLevels) / fLevels * 255;
		imageData.data[pixel] = newValue;
		imageData.data[pixel+1] = newValue;
		imageData.data[pixel+2] = newValue;
		
		let qError = imageDataBackup.data[pixel] - imageData.data[pixel];
		
		for(let i=0;i<3;i++){
			imageData.data[i+pixel+4] += qError * (7/16);
			imageData.data[i+pixel+(canvas.width * 4)-4] += qError * (3/16);
			imageData.data[i+pixel+(canvas.width * 4)] += qError * (5/16);
			imageData.data[i+pixel+(canvas.width * 4)+4] += qError * (1/16);
		}
	}
}