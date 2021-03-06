/*
 scoreappmodule.js

 this is the javascript that controls the animatepagemodule.ejs page

 it has a lot of hardcoded constants which need to be improved.


*/


//PLAYBACK CODE
console.log("in scoreappmodule.js!");

// We get our piece id and our piece parts from elements in the view
let parts = document.getElementById("saPieceParts").textContent;
let pieceId = document.getElementById("saPieceId").textContent;
let partsSplit = parts.split(",");

animation = {};
boxSize = {};

// Adds string value of 'animationPart' for key part in animation dictionary
// Initializes the box size for each part to 0.12
// TODO: Remove hard coding for box size, possibly look into eliminating lookup
for (let j = 0; j < partsSplit.length; j++) {
  animation[partsSplit[j]] = "animation" + partsSplit[j].charAt(0).toUpperCase() + partsSplit[j].slice(1);
  boxSize[partsSplit[j]] = 0.12;
}

// TODO: Remove hard coding of image sizes
imagesize=
{cantus:{width:2551, height:3450},
 altus:{width:2549, height:3749},
 tenor:{width:2549, height:3751},
 bassus:{width:2548, height:3749},
 score:{width:1073,height:6548}
 };

$('input[type="range"]').rangeslider({
  onInit: function() {
    console.log("init");
  },
  onSlide: function(pos, value) {
    console.log("pos="+pos+" val="+val);
  }
}).on('input', function() {
  console.log("val="+this.value);
  partModel.startTime -= (this.value - partModel.currentTime)
  audio.currentTime = this.value/1000.0;
  //audio.play();
});



startTime = new Date();
startTime = startTime.getTime();
/*
$('#timeSlider2').rangeslider({
  onInit: function() {
    console.log("init");
  },
  onSlide: function(pos, value) {
    console.log("pos="+pos+" val="+val);
  }
});
*/

theSlider = $('#timeSlider');
theSlider2 = $('#timeSlider2');



//notes =  [{"action":"cursor","time":"0","x":323,"y":250,"yoff":-50},{"action":"cursor","time":"1","x":323,"y":250,"yoff":-50},{"action":"cursor","time":"2100","x":344,"y":250,"yoff":-50},{"action":"cursor","time":"3472","x":374,"y":250,"yoff":-50},{"action":"cursor","time":"3976","x":413,"y":250,"yoff":-50},{"action":"cursor","time":"4953","x":441,"y":250,"yoff":-50},{"action":"cursor","time":"5868","x":463,"y":250,"yoff":-50},{"action":"cursor","time":"6448","x":481,"y":250,"yoff":-50},{"action":"cursor","time":"6996","x":511,"y":250,"yoff":-50},{"action":"cursor","time":"7540","x":538,"y":250,"yoff":-50},{"action":"cursor","time":"7992","x":560,"y":250,"yoff":-50},{"action":"cursor","time":"8696","x":590,"y":250,"yoff":-50},{"action":"cursor","time":"9008","x":615,"y":250,"yoff":-50},{"action":"cursor","time":"9480","x":648,"y":250,"yoff":-50},{"action":"cursor","time":"9928","x":666,"y":250,"yoff":-50},{"action":"cursor","time":"10316","x":694,"y":250,"yoff":-50},{"action":"cursor","time":"10760","x":719,"y":250,"yoff":-50},{"action":"cursor","time":"11212","x":745,"y":250,"yoff":-50},{"action":"cursor","time":"11764","x":776,"y":250,"yoff":-50},{"action":"cursor","time":"12720","x":798,"y":250,"yoff":-50}];

thePartCanvas = document.getElementById("thePart");
thePartCanvas.width = window.innerWidth;
thePartCanvas.height = window.innerHeight-50;


initialPartModel = {
  xOffset:0,
  yOffset:0,
  boxWidth:0.015,
  wideBoxWidth:4000,
  boxHeight:0.1,
  boxY:0.2,
  boxX:0,

  notes:[],
  startTime:0, // when the current song started playing
  currentTime:0, //milliseconds since the beginning of the song
  position:0, // the position in the list of notes
  note:{},  // the last note processed
  nextNote:{}, // the next note to process
};
// Notes have the form:
// {"action":"cursor","time":"0","x":355,"y":250,"yoff":92}

partModel = Object.assign({},initialPartModel);
audio = document.getElementsByTagName("audio")[0];




function playIt(){
  partModel.notes = notes;
  partModel.position=0;
  partModel.startTime = (new Date()).getTime();
  audio.play();
  running=true;
  playLoop();
}

function updateModel(){
// update the boxX and yOffset fields of the partModel based on the time
// also increase position if so needed...
  c = (new Date()).getTime() - partModel.startTime;
  //console.log("c="+c);
  //console.log("sliderval="+theSlider.val());
  theSlider.val(c);
  //"sliderval="+theSlider.val());
  //console.log("slidermax="+theSlider.attr("max"))
  p = partModel.position;
  n1 = partModel.notes[p]
  n2 = partModel.notes[p+1]
  //console.log("c="+c+" t="+n1.time);
  while (c > n2.time){ //switch to the next note!
    p=p+1;
    partModel.position = p;
    n1 = partModel.notes[p]
    n2 = partModel.notes[p+1]
    //console.log("SWITCHING TO NEXT NOTE "+JSON.stringify(n1));
  }
  while (c < n1.time & p>1){
    p=p-1;
    partModel.position = p;
    n1 = partModel.notes[p]
    n2 = partModel.notes[p+1]
  }
  if (p==partModel.notes.length-1) {
    running=false;
    return;
  }

  //console.log(JSON.stringify([n1,n2]))

  partModel.currentTime =c;
  t2 = c-n1.time;
  t1 = n2.time-c;
  t = n2.time-n1.time;
  partModel.boxX = (t1*n1.x + t2*n2.x)/t;
  partModel.yOffset = (t1*n1.yoff + t2*n2.yoff)/t;
  //console.log("x1="+n1.x+" x2="+n2.x+ "\nc="+c+
  //            " t1="+t1+" t2="+t2+" t="+t +
  //            " x="+partModel.boxX+" o="+partModel.yOffset);

}
running = true;

function playLoop(){
  if (!running) {return;}
  drawPart();
  updateModel();
  window.requestAnimationFrame(playLoop);
}


// DRAWING THE VIEW USING THE MODEL
function drawNotes(ctx){
  /*
   draw all of the notes on the score or part
   the notes are in the partmodel.notes array
   each element has the form:
   {"action":"cursor",
    "time":"36622",
    "x":0.5967302452316077,
    "y":0.2,
    "yoff":0.11571298819255224},
    So we need to draw a box location x and y+yoffset

    Let's draw the box for the first note!
  */
  console.log('in drawNotes '+partModel.notes.length)
  console.log(JSON.stringify(partModel.notes))
  ctx.fillStyle = "rgba(0,0,0,0.5)";

  for(let i =0; i<partModel.notes.length; i++){

    let n=partModel.notes[i]
    let w = thePartCanvas.width+0.0;
    console.log(`i=${i} n = ${JSON.stringify(n)}` )
    console.log(`ctx.fillRect(${(n.x-partModel.boxWidth/2)*w},${ (n.y+n.yoffset-partModel.boxHeight/2)*w},${      0.015*w},${      partModel.boxHeight*w} );`)
    ctx.fillRect(
      (n.x-partModel.boxWidth/2)*w,
      (n.y+n.yoffset-partModel.boxHeight/2)*w,
      0.015*w,
      partModel.boxHeight*w
    );

  }
}

function drawPart(){
  ctx = thePartCanvas.getContext("2d");
  ctx.fillStyle="blue";

  drawImage(ctx);
  drawNotes(ctx);

  ctx.strokeStyle = 'blue';
  //ctx.fillRect(0,250,40,10);

  backgroundColor = "rgba(112,66,20,0.2)";
  foregroundColor = "rgba(255,215,0,0.2)";
  leftColor = "rgba(255,255,255,0.0)";
  //console.dir(partModel);

    //console.log("bh="+boxHeight+" bw="+boxWidth);
    ctx.fillStyle = leftColor;
    drawHighlightBox(ctx);

    ctx.fillStyle = foregroundColor;
    drawRightBox(ctx);

    ctx.fillStyle = backgroundColor;
    drawLeftBox(ctx);
    drawTopBox(ctx);
    drawBottomBox(ctx);

}

function drawImage(ctx){
  image = document.getElementById("source");
  let w = thePartCanvas.width+0.0;
  let thePart = $("#part").val();
  let aspect = 1.0;
  switch (thePart){
    case "altus":
        aspect = imagesize.altus.height/imagesize.altus.width;
        break;
    case "cantus":
        aspect = imagesize.cantus.height/imagesize.cantus.width;
        break;
    case "tenor":
        aspect = imagesize.tenor.height/imagesize.tenor.width;
        break;
    case "bassus":
        aspect = imagesize.bassus.height/imagesize.bassus.width;
        break;
    case "score":
        aspect = imagesize.score.height/imagesize.score.width;
        break;
    default: console.log("unknown part: "+ thePart);
  }
  ctx.drawImage(image,
    partModel.xOffset*w,
    partModel.yOffset*w,
    window.innerWidth,
    Math.round(window.innerWidth*aspect)
  );
}

function drawHighlightBox(ctx){
  let w = thePartCanvas.width+0.0;
  ctx.fillRect(
    (partModel.boxX-partModel.boxWidth/2)*w,
    (partModel.boxY-partModel.boxHeight/2)*w,
    partModel.wideBoxWidth*w,
    partModel.boxHeight*w);
}

function drawRightBox(ctx){
  let w = thePartCanvas.width+0.0;
  ctx.fillRect(
    (partModel.boxX-partModel.boxWidth/2)*w,
    (partModel.boxY-partModel.boxHeight/2)*w,
    partModel.boxWidth*w,
    partModel.boxHeight*w);
}

function drawBottomBox(ctx){
  let w = thePartCanvas.width+0.0;
  ctx.fillRect(
          (partModel.boxX-partModel.boxWidth/2)*w,
          (partModel.boxY+partModel.boxHeight/2)*w,
          4000,
          window.innerHeight);
}
function drawTopBox(ctx){
  let w = thePartCanvas.width+0.0;
  ctx.fillRect(
      (partModel.boxX-partModel.boxWidth/2)*w,
      0,
      4000,
      (partModel.boxY-partModel.boxHeight/2)*w);
}

function drawLeftBox(ctx){
  let w = thePartCanvas.width+0.0;
  ctx.fillRect(
    0,
    0,
    (partModel.boxX-partModel.boxWidth/2)*w,
    thePartCanvas.height*w);
}


// RECORDING code


// This is the controller code
let paused = false;
let pauseTime = 0;

function keydownListener(event){

  if (event.code=="KeyQ") {
    audio.play();
    startTime = (new Date()).getTime();
    oldnotes = notes;
    notes=[];
    addNote();
    addNote();
    console.dir(event);

  }else if (event.code=="KeyW"){
    //console.log("hit W");
    //console.dir(notes);
    running=false;
    console.log(JSON.stringify(notes));
    audio.pause();
    audio.currentTime=0;
    audio.load();
    audio.playbackRate = parseFloat($("#playbackRate").val());

  } else if (event.code=="KeyZ"){
    addNote()

  } else if (event.code=="KeyX"){
    paused = true;
    audio.pause();
    let now = new Date();
    pauseTime = now.getTime();
    console.log(now);
    console.log(pauseTime);
  } else {
    console.dir(event);
  }
  }

document.addEventListener("keydown",keydownListener);


function addNote(){
  let now = new Date();
  if (paused){
    audio.play()
    pauseDuration = now.getTime() - pauseTime;
    startTime = startTime + pauseDuration;
    paused = false;
  }
  let t = now.getTime()-startTime;
  let w = thePartCanvas.width+0.0;
  let note =
  {action:'cursor',
     time:(t*audio.playbackRate).toFixed(),
        x:lastMouseEvent.offsetX/w,
        y: partModel.boxY,
        yoff: partModel.yOffset
      };
  notes.push(note);
}




lastMouseEvent = null;

document.addEventListener("mousemove",function(event){
  lastMouseEvent = event;
})





partSelect = $("#part");
partSelect.change(function(event){
  thePartCanvas.width = window.innerWidth;
  thePartCanvas.height = window.innerHeight-50;

  $("#boxHeight" ).val(  partModel.boxHeight );
  partModel = Object.assign({},initialPartModel);
  console.dir(this);
  console.log("selecting part");
  let image = document.getElementById("source");
  let pieceId = document.getElementById("saPieceId").textContent;
  image.src= "../userpieces/" + pieceId + "/media/"+(partSelect.val()+".jpg");
  ctx = thePartCanvas.getContext("2d");
  image = document.getElementById("source");
  ctx.drawImage(image,0,0,window.innerWidth,window.innerWidth*4/3);

  drawPart();

  notes = animation[partSelect.val()];
  maxtime = notes[notes.length-1].time;
  attributes = {min:0,max:maxtime,step:1}
  theSlider.attr("max",maxtime).change();
  theSlider2.attr("max",maxtime).change();
  console.log('maxtime='+maxtime);
  console.log("attr-max="+theSlider.attr("max"));

  //let thePartCanvas =  document.getElementById("thePart");
  //let ctx = thePartCanvas.getContext("2d");

  //ctx.drawImage(image,xOffset,yOffsetwindow.innerWidth,window.innerWidth*4/3);
})
saveButton = $("#save");
saveButton.click(function(event){
  console.log("posting to /saveAnimation")
  console.dir({notes,pieceId,part:partSelect.val()})

  $.post( "/animatepage/save",
         {notes:JSON.stringify(notes), pieceId, part:partSelect.val()},
          "json" )
   .then(x=>{console.log("in promise:"); console.dir(x)})
  //console.log(`zz=${zz}`)
  //console.dir(zz)
  return
  zz = localStorage.getItem("archive");
  alert(zz);
  if (zz==null) {
    archive="[]";
    localStorage.setItem("archive",[]);
    zz="[]"
  }
  newArchive = eval(zz);
  newArchive.push(notes);
  localStorage.setItem("archive",JSON.stringify(newArchive));
  localStorage.setItem("animation",JSON.stringify(notes));
  alert("Cut/Paste the following code "+
     "into the appropriate file in the animations folder:\n\n" +
    JSON.stringify(notes));


  let currPart;
  for (let j = 0; j < partsSplit.length; j++) {
    if (partSelect.val() == partsSplit[j]) {
      currPart = partsSplit[j];
    }
  }
  let firstChar = currPart.charAt(0).toUpperCase();
  let capName = firstChar + currPart.slice(1);
  let contents = "animation" + capName + " =" + JSON.stringify(notes) + ";";
  fs.writeFile(path.join(__dirname, '../public/userpieces/' + pieceId + '/animations/') + currPart + "2.js",contents,(err)=>{
    if (err) {
      console.dir(err);
      throw err;
    }
      console.log("made dummy animation file for " + currPart)
      console.log("file made at file path: " + path.join(__dirname, '../public/userpieces/' + pieceId + '/animations/') + currPart + "2.js");
  });
})

initPartButton = $("#initPart");
initPartButton.click(initPart);

function initPart (event){
  //notes = eval(localStorage.getItem("animation"));
  playbackMode=false;
  thePartCanvas.width = window.innerWidth;
  thePartCanvas.height = window.innerHeight-50;
  // read in the fields and use them to set the partModel

  initialPartModel.boxHeight = boxSize[$("#part").val()]
  console.log("boxHeight = "+initialPartModel.boxHeight);

  //parseFloat($("#boxHeight").val());
  audio.playbackRate = parseFloat($("#playbackRate").val());
  console.log("playbackRate is "+audio.playbackRate);
  partModel = Object.assign({},initialPartModel);
  console.log(JSON.stringify(initialPartModel))
  console.log(JSON.stringify(partModel));
  ctx = thePartCanvas.getContext("2d");
  image = document.getElementById("source");
  ctx.drawImage(image,0,0,window.innerWidth,window.innerWidth*4/3);
}

playbackButton = $("#playback");
playbackButton.click(function(event){
  playbackMode = true;
  playIt();
});

// Recording
playbackMode = false;

$("#thePart").mousemove(function(event){
  thePartCanvas.width = window.innerWidth;
  thePartCanvas.height = window.innerHeight-50;
})

$("#thePart").mousemove(function(event){
  if (playbackMode) return;
  let w = thePartCanvas.width+0.0;
  partModel.boxX = event.offsetX/w;
  drawPart()

})


// Recenter the screen if the user clicks the mouse

$("#thePart").mousedown(function(event){
  if (playbackMode) return;
  let w = thePartCanvas.width+0.0;
  let p2 = partModel.yOffset + partModel.boxY -(event.offsetY)/w;
  //changeOffset(1,20,partModel.yOffset, p2)
  lastyOffset = partModel.yOffset;
  partModel.yOffset = p2;
  drawPart();
})

function changeOffset(step,steps,start,finish){
  partModel.yOffset += (finish-start)/steps;
  drawPart();
  if (step>=steps) {
    partModel.yOffset = finish;
  } else {
    window.requestAnimationFrame(function(){changeOffset(step+1,steps,start,finish)})
  }
}
