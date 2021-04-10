/*
This is an attempt to refactor old code from musicapp4module.js from function to class based
*/

const initialPartModel = {
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


  // Notes have the form:
  // {"action":"cursor","time":"0","x":355,"y":250,"yoff":92}
  note:{},  // the last note processed
  nextNote:{}, // the next note to process
};

const pieceDataSet = {
  imagesize:{
     cantus:{width:2551, height:3450},
     altus:{width:2549, height:3749},
      tenor:{width:2549, height:3751},
     bassus:{width:2548, height:3749},
     score:{width:1073, height:6548},
     mastermenu:{width:1073, height:6548},
  },
  timeOffsets:{},
  boxSize:{},
  animation:{}
};



/**
* An instance of the 'Player' class is created when a user visits a piece
*/
class Player {

  /**
  * Create an instance of this class
  *
  * @param id
  *        Piece id given when initialy stored in the db
  * @param parts
  *        Parts of the piece set by the user when uploaded into db
  */
  constructor(id, parts, pieceDataSet, initialPartModel) {
    // Currently, the parts are a comma separated string 'Altus,Cantus,Bassus' and thus must be split
    // TODO: When user creates a piece, parts are not based on a single string
    this.id = id
    this.parts = parts.split(",");
    this.currentPart = $("#part").val();
    this.aspect = 1.0
    this.audio = document.getElementsByTagName("audio")[0];
    this.partModel = Object.assign({}, initialPartModel)
    this.video = document.getElementsByTagName("video")[0];
    this.pauseTime = 0;
    this.paused = false;

    this.pieceDataSet = pieceDataSet


    // Init slider
    //$("#theTime").html(mins+":"+(secs(<10?"0":"")+secs));
    this.slider = $("#timeSlider");

    this.partCanvas = document.getElementById("thePart");
    this.partImage = document.getElementById("source");
    this.partImage.src = "../userpieces/" + this.id + "/media/"+this.currentPart+".jpg";
    this.running = true;
  }

  initFiles() {
    this.theFiles = [];

    this.pieceDataSet["pieceName"] = document.getElementById("lhPieceTitle").textContent;
    for (let j = 0; j < this.parts.length; j++) {
      this.pieceDataSet.timeOffsets[this.parts[j]] = 0;
      this.pieceDataSet.boxSize[this.parts[j]] = 0.12;
      this.pieceDataSet.animation[this.parts[j]] = eval("animation" + this.parts[j].charAt(0).toUpperCase() + this.parts[j].slice(1));

      this.theFiles.push({
        "id": this.parts[j],
        "name": '../userpieces/'+ this.id + '/media/' + this.parts[j] + '.mp4',
        "type":'video/mp4'
      });
    }
  }

  playLoop(){
    if (!this.running) { return; }
    this.drawPart(this.partCanvas.getContext("2d"));
    this.updateModel();
    window.requestAnimationFrame(playLoop);
  }

  startApp(part){
    this.video.muted=true

    this.switchVideo(part);
    this.switchPart(part);

    this.video.muted=false;
    this.video.play();
    $("input[type='range']").val(0);
    //partModel.currentTime=0;
    this.video.currentTime = this.partModel.currentTime/1000.0;
    this.running=true;
    this.playLoop();
  }

  // Update model determines the delta time between notes and updates the animation accordingly
  updateModel() {

    // Our current time is the time elapsed between the model's start time and the current time
    currTime = (new Date()).getTime() - this.partModel.startTime;
    currTimeWithOff = currTime - this.partModel.timeOffset;

    totalSecs = Math.floor(currTime/1000);
    mins = Math.floor(totalSecs/60);
    secs = totalSecs % 60;

    //$("#theTime").html(mins+":"+(secs(<10?"0":"")+secs));
    this.slider.val(currTime);

    // From our part model, get our current position and notes
    currPosition = this.partModel.position;
    currNote = this.partModel.notes[currPosition]
    nextNote = this.partModel.notes[currPosition+1]

    // When our elapsed time is greater than our next note's maximum time, we proceed to the next note
    while (currTime > nextNote.time) {
      // Update our new position (increment)
      currPosition++;
      this.partModel.position = currPosition;

      // Update our notes, given our new position
      currNote = this.partModel.notes[currPosition]
      nextNote = this.partModel.notes[currPosition+1]
    }

    // When our elapsed time is less than our current note, and our current note is not the first
    // We update backwards (this situation comes about when a player moves the slider to left/rewind)
    while (currTime < currNote.time & currPosition > 1) {
      // Update our new position (decrement)
      currPosition--;
      this.partModel.position = currPosition;

      // Update our notes, given our new position
      currNote = this.partModel.notes[currPosition]
      nextNote = this.partModel.notes[currPosition+1]
    }

    // Check for seeing if we are on the last note, end if we are
    if (currentPosition == this.partModel.notes.length-1) {
      this.running = false;
      return
    }

    // Given our current time, update our part model
    partModel.currentTime = currTime;

    t2 = currTime - currNote.time;
    t1 = nextNote.time - currTime;
    t = nextNote.time - currNote.time;

    // We updat eour offsets with the average of the two note times for smooth transition
    this.partModel.boxX = (t1*currNote.x + t2*nextNote.x)/t;
    this.partModel.yOffset = (t1*currNote.yoff + t2*nextNote.yoff)/t;
  }

  switchPart(part) {
    this.currentPart = part;

    // Init the box height and time offset for the part
    this.partModel.boxHeight = this.pieceDataSet.boxSize[part];
    this.partModel.timeOffset = this.partModel.timeOffsets[part];

    this.animation = this.pieceDataSet.animation;
    this.selectThePart(part);
    this.initPart();
    let ctx = this.partCanvas;
    this.drawPart(ctx);
  }

  drawPart(ctx) {
    ctx.fillStyle = "blue";
    ctx.strokeStyle = "blue";

    this.drawImage();

    let backgroundColor = "rgba(112,66,20,0.2)";
    let foregroundColor = "rgba(255,215,0,0.2)";
    let leftColor = "rgba(255,255,255,0.0)";

    ctx.fillStyle = leftColor;
    this.drawHighlightBox();

    ctx.fillStyle = foregroundColor;
    this.drawRightBox();

    ctx.fillStyle = backgroundColor;
    this.drawLeftBox();
    this.drawTopBox();
    this.drawBottomBox();
  }

  drawHighlightBox(){
    let ctx = this.partCanvas.getContext("2d");
    ctx.fillRect(
      (this.partModel.boxX-this.partModel.boxWidth/2)*this.partCanvas.width,
      (this.partModel.boxY-this.partModel.boxHeight/2)*this.partCanvas.width,
      this.partModel.wideBoxWidth*this.partCanvas.width,
      this.partModel.boxHeight*this.partCanvas.width);
  }

  drawRightBox(){
    let ctx = this.partCanvas.getContext("2d");
    ctx.fillRect(
      (this.partModel.boxX-this.partModel.boxWidth/2)*this.partCanvas.width,
      (this.partModel.boxY-this.partModel.boxHeight/2)*this.partCanvas.width,
      this.partModel.boxWidth*this.partCanvas.width,
      this.partModel.boxHeight*this.partCanvas.width);
  }

  drawBottomBox(){
    let ctx = this.partCanvas.getContext("2d");
    ctx.fillRect(
            (this.partModel.boxX-this.partModel.boxWidth/2)*this.partCanvas.width,
            (this.partModel.boxY+this.partModel.boxHeight/2)*this.partCanvas.width,
            4000,
            window.innerHeight);
  }

  drawTopBox(){
    let ctx = this.partCanvas.getContext("2d");
    ctx.fillRect(
        (this.partModel.boxX-this.partModel.boxWidth/2)*this.partCanvas.width,
        0,
        4000,
        (this.partModel.boxY-this.partModel.boxHeight/2)*this.partCanvas.width);
  }

  drawLeftBox(){
    let ctx = this.partCanvas.getContext("2d");
    ctx.fillRect(
      0,
      0,
      (this.partModel.boxX-this.partModel.boxWidth/2)*this.partCanvas.width,
      this.partCanvas.height*this.partCanvas.width);
  }

  drawImage(){
    this.partImage = document.getElementById("source");
    let w = this.partCanvas.width+0.0;
    let thePart = this.currentPart
    let imagesize = this.pieceDataSet.imagesize;
    let aspect = imagesize[this.currentPart.toString()].height/imagesize[this.currentPart.toString()].width;
    let ctx = this.partCanvas.getContext("2d");
    ctx.drawImage(this.partImage,
      this.partModel.xOffset*w,
      this.partModel.yOffset*w,
      partdiv.offsetWidth,
      Math.round(partdiv.offsetWidth*aspect)
    );
  }

  resizePart(){
    this.partCanvas.width = partdiv.offsetWidth;
  }

  changePiece(){
    let piece=$("#thePiece").val();
    if (piece=="Select a piece"){
      alert("Please select a piece");
      return;
    }
    this.switchPiece(piece);
  }

  switchPiece(piece){
    document.getElementById('startVideos').innerHTML = "Start"
    document.getElementById('startVideos').disabled = true
    document.getElementById("content").style.display = "none"; // Hide content for loading videos
    document.getElementById("loadSpin").style.display = "flex"; // Activate loading screen (unhide)
    document.getElementById("loadSpin2").style.display = "block"; // Activate loading screen bottom
    console.log(this.pieceDataSet)
    // Get image size from piece data set
    let imagesize = this.pieceDataSet.imagesize;

    // Get the notes for the first part
    let notes = this.pieceDataSet.animation[this.parts[0]];

    // Make changes to our part model dependent on piece data set
    this.partModel.piece=piece;
    this.partModel.timeOffsets = this.pieceDataSet.timeOffsets;
    this.partModel.notes = notes;
    this.partModel.position=0;
    this.partModel.boxHeight = this.pieceDataSet.boxSize;

    $(".description").hide();
    $("."+piece).show();
    for (let v = 0; v < this.parts.length; v++) {
      this.playSelectedFile(v);
    }
    this.playSelectedFile(0)
    this.switchVideo(this.parts[0]);
    this.switchPart(this.parts[0]);
    $("input[type='range']").val(0);
    this.partModel.currentTime=0;
    this.partModel.timeOffset = this.pieceDataSet.timeOffsets[this.parts[0]];
    console.log("setting the video time!"+this.video.currentTime+" "+this.partModel.currentTime/1000.0)
    this.video.currentTime = this.partModel.currentTime/1000.0;
    this.running=true;
    this.partModel.position=0;
    let startTime = new Date();
    startTime = startTime.getTime();
    this.partModel.startTime = startTime;
  }

  playSelectedFile(fileNum){
    // Get out file object from our files directory
    let fileObj = this.theFiles[fileNum]
    let file = fileObj.name
    let id = fileObj.id

    let type = file.type
    let vid = id //file.name.substring(file.name.lastIndexOf("/")+1,file.name.indexOf("."))
    //console.log(`vid=${vid} type=${type} file=${JSON.stringify(file)}`)
    let videoNode = document.getElementById(vid)
    //console.dir(['videoNode',videoNode])
    let req = new XMLHttpRequest();
    req.open('GET', file, true);
    req.responseType = 'blob';
    req.onload = function() {
       if (this.status === 200) {
          var videoBlob = this.response;
          var vid = URL.createObjectURL(videoBlob); // IE10+
          videoNode.src = vid;

          // TODO:: Change this to grab from outer scope
          let parts = document.getElementById("lhPieceParts").textContent.split(",")

          console.log('just loaded '+file)
          console.log(parts)
          if (fileNum<(parts.length-1)){this.playSelectedFile(fileNum+1)} else {
            document.getElementById('startVideos').disabled = false
            console.log('disabled = '+ document.getElementById('startVideos').disabled)
            document.getElementById("loadSpin2").style.display = ""; // Videos done loading, hide loading screen
            document.getElementById("loadSpin").style.display = ""; // Videos done loading, rehide loading screen
            document.getElementById("content").style.display = ""; // Reveal content, videos done loading
          }
       }
    }
    req.onerror = function() {
    }
    req.send();
    return videoNode
  }

  selectThePart(part){
    this.partCanvas.width = partdiv.offsetWidth;
    this.partImage = document.getElementById("source");
    let piece = this.partModel.piece; //$("#thePiece").val();
    this.partImage.src= "../userpieces/" + this.id + "/media/"+part+".jpg";
    let ctx = this.partCanvas.getContext("2d");
    this.partImage= document.getElementById("source");
    ctx.drawImage(this.partImage,0,0,window.innerWidth,window.innerWidth*4/3);

    this.drawPart(ctx);
    let notes = this.pieceDataSet.animation[part];
    this.partModel.notes = notes;

    let maxtime = notes[notes.length-1].time;
    let attributes = {min:0,max:maxtime,step:1}
    this.theSlider = $('#timeSlider');
    this.theSlider.attr("max",maxtime).change();
  }

  initPart(event){
    this.partCanvas.width = partdiv.offsetWidth;
    this.partCanvas.height = window.innerHeight; // ?????
    //partCanvas.width = window.innerWidth;
    //partCanvas.height = window.innerHeight-50;
    //partModel = Object.assign({},initialPartModel);

    let ctx = this.partCanvas.getContext("2d");
    this.partImage = document.getElementById("source");
    ctx.drawImage(this.partImage,0,0,window.innerWidth,window.innerWidth*4/3);
  }

  switchVideo(part){
  $(".musicvideo").attr("width","0%");
  $("#"+part).attr("width","100%");
  console.log("switching to '"+part+"'")
   this.video = document.getElementById(part);
  }

  pauseApp(){
    if (this.paused){
      let now = new Date().getTime();
      this.partModel.startTime += (now-this.pauseTime);
      this.paused = false;
      this.running=true;

      this.video.play();
      this.playLoop();

    } else {
      this.paused = true;
      this.pauseTime = new Date().getTime();
      this.running=false;
      this.video.pause();
    }
  }

}

let id = document.getElementById("lhPieceId").textContent;
let parts = document.getElementById("lhPieceParts").textContent;
console.log('These are the parts from elementid')
console.log(parts)

// Insantiate player and grab files
let player = new Player(id, parts, pieceDataSet, initialPartModel)
player.initFiles()

function changePiece(){
  player.changePiece()
}

function keydownListener(event){
  if (event.code=="KeyC") {
    player.startApp("cantus")
  } else if (event.code=="KeyA") {
    player.startApp("altus")
  } else if (event.code=="KeyT") {
    player.startApp("tenor")
  } else if (event.code=="KeyB") {
    player.startApp("bassus")
  } else if (event.code=="KeyF") {
    player.startApp("score")
  } else if (event.code=="KeyX") {
    player.startApp("mastermenu")
  } else if (event.code=="KeyP") {
    player.pauseApp();
  } else if (event.code=="KeyS") {
    player.video.currentTime = 0;
    player.partModel.startTime= new Date();
  }
}

document.addEventListener("keydown",keydownListener);


$('input[type="range"]').rangeslider({
  onInit: function() {
    console.log("init");
  },
  onSlide: function(pos, value) {
    console.log("pos="+pos+" val="+val);
    if (!player.running) {
      startTime = new Date();
      player.startTime = startTime.getTime();
      player.running=true;
      player.playLoop();
    }
  }
}).on('input', function() {
  //console.log("val="+this.value);
  player.partModel.startTime -= (this.value - player.partModel.currentTime)
  player.video.currentTime = this.value/1000.0;
});

let startButton = document.getElementById('startVideos')
startButton.addEventListener('click',function(event){
  if (startButton.innerHTML.trim()=='Start'){
    startButton.innerHTML = 'Stop'
    player.video.currentTime = 0
    player.partModel.startTime= new Date()
    player.startApp('cantus')
  } else {
    player.running=false;
    player.video.currentTime = 0
    player.video.pause();
    startButton.innerHTML = 'Start'
  }
})

var myLayout = $('div#container').layout();
myLayout.sizePane("west","40%");
myLayout.sizePane("east","20%");
myLayout.sizePane("south","20%");
$(".description").hide();
$(".partintro").show();