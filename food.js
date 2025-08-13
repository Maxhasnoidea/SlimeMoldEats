// Food class - represents a square food source that molds can consume
class Food {
  constructor(x, y, size) {
    // === POSITION AND PHYSICAL PROPERTIES ===
    this.x = x !== undefined ? x : random(width * 0.2, width * 0.8);
    this.y = y !== undefined ? y : random(height * 0.2, height * 0.8);
    this.size = size !== undefined ? size : 50; // Size of the square food
    this.originalSize = this.size; // Store original size for regeneration
    
    // === FOOD PROPERTIES ===
    this.nutritionValue = 255; // How bright/nutritious the food appears to sensors
    this.consumptionRate = 0.0000001; // How fast the food gets consumed (reduced for more durability)
    this.minSize = 5; // Minimum size before food disappears
    this.regenerationRate = 1; // How fast food regenerates when not being eaten (increased)
    this.maxRegeneration = this.originalSize; // Maximum size food can regenerate to
    
    // === VISUAL PROPERTIES ===
    this.color = { r: 255, g: 255, b: 255 }; // White color for food
    this.alpha = 255; // Transparency
    
    // === STATE ===
    this.active = true; // Whether the food is available
    this.beingEaten = false; // Whether molds are currently consuming this food
  }
  
  // === UPDATE METHOD - called every frame ===
  update() {
    if (!this.active) return;
    
    // Reset consumption state each frame
    this.beingEaten = false;
    
    // Check if any molds are near this food source
    this.checkMoldInteraction();
    
    // Regenerate food slowly when not being eaten
    if (!this.beingEaten && this.size < this.maxRegeneration) {
      this.size += this.regenerationRate;
      this.size = min(this.size, this.maxRegeneration);
    }
    
    // Deactivate food if it gets too small
    if (this.size <= this.minSize) {
      this.active = false;
    }
  }
  
  // === CHECK INTERACTION WITH MOLDS ===
  checkMoldInteraction() {
    // This will be called from the main sketch to check mold interactions
    // For now, we'll handle the basic consumption logic here
  }
  
  // === CONSUME FOOD ===
  consume(amount) {
    if (!this.active) return false;
    
    this.beingEaten = true;
    this.size -= amount || this.consumptionRate;
    this.size = max(0, this.size);
    
    // Return true if food was successfully consumed
    return this.size > 0;
  }
  
  // === CHECK IF POINT IS INSIDE FOOD ===
  contains(x, y) {
    if (!this.active) return false;
    
    return (x >= this.x - this.size/2 && 
            x <= this.x + this.size/2 && 
            y >= this.y - this.size/2 && 
            y <= this.y + this.size/2);
  }
  
  // === GET NUTRITION VALUE AT POINT ===
  getNutritionAt(x, y) {
    if (!this.active || !this.contains(x, y)) return 0;
    
    // Return nutrition value based on distance from center
    let distance = dist(x, y, this.x, this.y);
    let maxDistance = this.size / 2;
    
    // Closer to center = more nutrition
    let nutritionFactor = map(distance, 0, maxDistance, 1, 0.3);
    return this.nutritionValue * nutritionFactor;
  }
  
  // === DISPLAY METHOD ===
  display() {
    if (!this.active || this.size <= 0) return;
    
    push();
    
    // Set color based on size (darker when consumed, white when full)
    let sizeFactor = this.size / this.originalSize;
    
    // When consumed, food becomes darker (more black)
    let colorValue = sizeFactor * 255; // 0 = black, 255 = white
    fill(colorValue, colorValue, colorValue, this.alpha);
    noStroke();
    
    // Draw the square food
    rectMode(CENTER);
    rect(this.x, this.y, this.size, this.size);
    
    // Optional: Add a subtle border
    noFill();
    stroke(255, 255, 255, 100);
    strokeWeight(3);
    rect(this.x, this.y, this.size, this.size);
    
    pop();
  }
  
  // === RESET/RESPAWN FOOD ===
  respawn(x, y, size) {
    this.x = x !== undefined ? x : random(width * 0.2, width * 0.8);
    this.y = y !== undefined ? y : random(height * 0.2, height * 0.8);
    this.size = size !== undefined ? size : this.originalSize;
    this.active = true;
    this.beingEaten = false;
  }
  
  // === GET FOOD INFO ===
  getInfo() {
    return {
      x: this.x,
      y: this.y,
      size: this.size,
      active: this.active,
      nutritionValue: this.nutritionValue
    };
  }
}
