/*
----- Coding Tutorial by Patt Vira ----- 
Name: Slime Molds (Physarum)
Video Tutorial: https://youtu.be/VyXxSNcgDtg

References: 
1. Algorithm by Jeff Jones: https://uwe-repository.worktribe.com/output/980579/characteristics-of-pattern-formation-and-evolution-in-approximations-of-physarum-transport-networks

Connect with Patt: @pattvira
https://www.pattvira.com/
----------------------------------------

further improvements can be made to the mold's behavior and interactions with food sources.
by Max Dufner

MODIFICATIONS MADE:
• Changed mold initialization to start from one random point instead of scattered positions
• Implemented physical boundary collision system - molds bounce off canvas edges instead of wrapping
• Created Food class system with square food sources that molds can consume and that regenerate
• Added mouse click interaction to drop food anywhere on canvas
• Removed automatic food spawning - food only appears when user clicks
• Implemented mold clustering and 360-degree dispersal behavior when groups get too dense
• Optimized dispersal system for better performance (staggered checks, limited neighbor search)
• Added video recording capability - press 'S' to start/stop recording and auto-download WebM video
• Enhanced food durability - much slower consumption rate and faster regeneration
• Improved food visual effects - white food that darkens to black when consumed
• Added recording indicator with red dot and "REC" text during video capture

https://www.max-dufner.me

*/

let molds = []; let num = 5000;
let foods = []; // Array to hold food objects
let d;

// === VIDEO RECORDING VARIABLES ===
let mediaRecorder;
let recordedChunks = [];
let isRecording = false; 

function setup() {
  createCanvas(800, 800);
  angleMode(DEGREES);
  d = pixelDensity();
  
  // Generate one random starting point for all molds
  let startX = random(width);
  let startY = random(height);
  
  for (let i=0; i<num; i++) {
    molds[i] = new Mold(startX, startY);
  } 
  
  // No automatic food creation - food will only spawn when user clicks
  
  // === SETUP VIDEO RECORDING ===
  setupVideoRecording();
}

function draw() {
  background(0, 5);
  loadPixels();
  
  // Update and display food sources
  for (let food of foods) {
    food.update();
    food.display();
  }
  
  for (let i=0; i<num; i++) {
    molds[i].update();
    molds[i].display();
  }
  
  // === RECORDING INDICATOR ===
  if (isRecording) {
    // Show red recording dot
    fill(255, 0, 0);
    noStroke();
    ellipse(width - 30, 30, 20, 20);
    fill(255);
    textAlign(CENTER, CENTER);
    text("REC", width - 30, 50);
  }
}

// === MOUSE INTERACTION ===
// Drop food when mouse is clicked
function mousePressed() {
  // Check if mouse is within canvas bounds
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    // Create new food at mouse position
    let newFoodSize = 50; // Default size for dropped food
    foods.push(new Food(mouseX, mouseY, newFoodSize));
    
    console.log("Food dropped at:", mouseX, mouseY);
  }
}

// === KEYBOARD INTERACTION ===
function keyPressed() {
  if (key === 's' || key === 'S') {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }
}

// === VIDEO RECORDING FUNCTIONS ===
function setupVideoRecording() {
  // This function will be called in setup()
  console.log("Video recording system initialized. Press 'S' to start/stop recording.");
}

async function startRecording() {
  try {
    // Get the canvas element
    const canvas = document.querySelector('canvas');
    
    // Create a MediaRecorder to capture the canvas
    const stream = canvas.captureStream(30); // 30 FPS
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm; codecs=vp9'
    });
    
    recordedChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, {
        type: 'video/webm'
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `slime_mold_simulation_${getTimestamp()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Video saved as:', a.download);
    };
    
    mediaRecorder.start();
    isRecording = true;
    console.log('Recording started...');
    
  } catch (error) {
    console.error('Error starting recording:', error);
    alert('Recording failed. Please make sure your browser supports video recording.');
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    console.log('Recording stopped. Video will be downloaded shortly...');
  }
}

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}