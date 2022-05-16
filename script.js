//canvas setup
let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");

let THRESHHOLDLIMIT = 0.5;
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
document.getElementById('button').addEventListener('click', function() {
	let files = document.getElementById('file').files;
	if (files.length > 0){
		getBase64(files[0]);
	}
});
puppy.onload = function(){
	canvas.width = puppy.width;
	canvas.height = puppy.height;
	
	frame();
}
let modifierType = 0;
window.addEventListener('keydown', e => {
	const keyname = e.code;
	if(keyname === 'Digit1'){
		modifierType = 1;
	}
	else if(keyname === 'Digit2'){
		modifierType = 2;
	}
	else if(keyname === 'Digit3'){
		modifierType = 3;
	}
	else if(keyname === 'Digit4'){
		modifierType = 4;
	}
	else if(keyname === 'Digit0'){
		modifierType = 0;
	}
	else if(keyname === 'ArrowUp'){
		if(modifierType == 1){
			THRESHHOLDLIMIT += 0.01;
			if(THRESHHOLDLIMIT > 1){
				THRESHHOLDLIMIT = 1;
			}
		}
		else if(modifierType == 2 || modifierType == 3){
			NUMOFBITS++;
			if(NUMOFBITS > 8){
				NUMOFBITS = 8;
			}
		}
	}
	else if(keyname === 'ArrowDown'){
		if(modifierType == 1){
			THRESHHOLDLIMIT -= 0.01;
			if(THRESHHOLDLIMIT < 0){
				THRESHHOLDLIMIT = 0;
			}
		}
		else if(modifierType == 2 || modifierType == 3){
			NUMOFBITS--;
			if(NUMOFBITS < 1){
				NUMOFBITS = 1;
			}
		}
	}
});

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
	ctx.drawImage(puppy,0,0);
	let imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
	
	if(modifierType == 0){
		//do nothing
	}
	else if(modifierType == 1){
		threshhold(imageData.data);
	}
	else if(modifierType == 2){
		quanitze(imageData.data);
	}
	else if(modifierType == 3){
		dither(imageData.data);
	}
	else if(modifierType == 4){
		greyscale(imageData.data);
	}
	
	//draw new image
	ctx.putImageData(imageData,0,0);
}
function greyscale(imageData){
	for(let i=0;i<imageData.length;i+=4){
		let avgPixels = (0.2162*imageData[i])+(0.7152*imageData[i+1])+(0.0722*imageData[i+2]);
		imageData[i] = avgPixels;
		imageData[i+1] = avgPixels;
		imageData[i+2] = avgPixels;
	}
}
function threshhold(imageData){
	for(let i=0;i<imageData.length;i+=4){
		let avgPixels = ((0.2162*imageData[i])+(0.7152*imageData[i+1])+(0.0722*imageData[i+2]))/255;
		if(avgPixels <= THRESHHOLDLIMIT){
			imageData[i] = 0;
			imageData[i+1] = 0;
			imageData[i+2] = 0;
		}
		else{
			imageData[i] = 255;
			imageData[i+1] = 255;
			imageData[i+2] = 255;
		}
	}
}
function quanitze(imageData){
	let fLevels = (1 << NUMOFBITS) - 1;
	function adjData(pixel){
		imageData[pixel] = Math.floor(imageData[pixel] / 255 * fLevels) / fLevels * 255;
	}
	for(let i=0;i<imageData.length;i+=4){
		adjData(i);
		adjData(i+1);
		adjData(i+2);
	}
	return imageData;
}
/*
	to traverse a 1D array like a 2D array we need to know how many pixles are in one line
	puppy.width is that
	if we do width * 4 it should be how many pixels there are
	we can traverse that many pixels per line
	to get the pixel above another, we subtract it by the width
	
	width = 6
	height = 3
	* * X X * *   0  - 5
	* * X O * *   6  - 11
	* * * * * *   12 - 17
	
	to get pixel 1,3 in 1D its 9
	above it is 9-6=3
	to simplify currentIndex - width = above
*/
function dither(imageData){
	let imageDataBackup = [...imageData];
	quanitze(imageData);
	for(let i=0;i<imageDataBackup.length;i+=4){
		adjData(i);
		adjData(i+1);
		adjData(i+2);
	}
	function adjData(pixel){
		let qError = imageDataBackup[pixel] - imageData[pixel];
		
		imageData[pixel+4] += qError * (7/16);
		imageData[pixel+canvas.width-1] += qError * (3/16);
		imageData[pixel+canvas.width] += qError * (5/16);
		imageData[pixel+canvas.width+1] += qError * (1/16);
	}
}