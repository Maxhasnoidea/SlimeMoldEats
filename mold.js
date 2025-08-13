// Mold class - represents a single slime mold agent
class Mold {
  constructor(startX, startY) {
    // === POSITION AND PHYSICAL PROPERTIES ===
    // Use provided starting coordinates, or random if not provided
    this.x = startX !== undefined ? startX : random(width);
    this.y = startY !== undefined ? startY : random(height);
    this.r = 0.5; // Radius of the mold agent (size when drawn)
    
    // === MOVEMENT AND DIRECTION ===
    this.heading = random(360); // Random initial direction (0-360 degrees)
    this.vx = cos(this.heading); // X velocity component based on heading
    this.vy = sin(this.heading); // Y velocity component based on heading
    this.rotAngle = 45; // How much the mold rotates when turning (degrees)
    this.stop = false // Boolean to control if mold should stop moving 
    
    // === FLOCKING/DISPERSAL BEHAVIOR ===
    this.dispersalRadius = 25; // Radius to check for nearby molds
    this.minClusterSize = 8; // Minimum number of nearby molds to trigger dispersal
    this.dispersalStrength = 2; // How strongly molds push away from each other
    this.isDispersing = false; // Whether this mold is in dispersal mode
    this.dispersalCheckCounter = floor(random(10)); // Stagger dispersal checks for performance 
    
    // === SENSOR SYSTEM (for detecting trails/food) ===
    // Three sensors: Right, Left, and Forward - used to detect existing trails
    this.rSensorPos = createVector(0, 0); // Right sensor position
    this.lSensorPos = createVector(0, 0); // Left sensor position  
    this.fSensorPos = createVector(0, 0); // Forward sensor position
    this.sensorAngle = 45; // Angle offset for left/right sensors (degrees)
    this.sensorDist = 10; // How far ahead the sensors look (pixels)
    
  }
  
  // === UPDATE METHOD - called every frame to move the mold ===
  update() {   
    // === DISPERSAL BEHAVIOR CHECK (OPTIMIZED) ===
    // Only check dispersal every 10 frames for performance, staggered across molds
    this.dispersalCheckCounter++;
    if (this.dispersalCheckCounter >= 10) {
      this.checkDispersalBehavior();
      this.dispersalCheckCounter = 0;
    }
    
    // === MOVEMENT CONTROL ===
    // Check if mold should stop moving (controlled by this.stop variable)
    if (this.stop) {
      this.vx = 0; // Stop horizontal movement
      this.vy = 0; // Stop vertical movement
    } else {
      // Calculate velocity components based on current heading direction
      this.vx = cos(this.heading); // Convert heading to X velocity
      this.vy = sin(this.heading); // Convert heading to Y velocity
    }
    
    // === POSITION UPDATE WITH EDGE COLLISION ===
    // Move position and handle collisions with canvas boundaries
    let newX = this.x + this.vx;
    let newY = this.y + this.vy;
    
    // Check for collision with left or right edges
    if (newX <= 0 || newX >= width - 1) {
      this.heading = 180 - this.heading; // Reflect horizontally
      this.vx = cos(this.heading); // Recalculate velocity components
      this.vy = sin(this.heading);
      newX = constrain(newX, 1, width - 2); // Keep within bounds with buffer
    }
    
    // Check for collision with top or bottom edges
    if (newY <= 0 || newY >= height - 1) {
      this.heading = -this.heading; // Reflect vertically
      this.vx = cos(this.heading); // Recalculate velocity components
      this.vy = sin(this.heading);
      newY = constrain(newY, 1, height - 2); // Keep within bounds with buffer
    }
    
    // Update position
    this.x = newX;
    this.y = newY;
    
    // === SENSOR POSITION CALCULATION ===
    // Update the 3 sensor positions based on current position and heading
    this.getSensorPos(this.rSensorPos, this.heading + this.sensorAngle); // Right sensor
    this.getSensorPos(this.lSensorPos, this.heading - this.sensorAngle); // Left sensor  
    this.getSensorPos(this.fSensorPos, this.heading); // Forward sensor (straight ahead)
  
    // === TRAIL DETECTION (reading pixel values) ===
    // Get pixel array indices for each sensor position and read brightness values
    let index, l, r, f; // Variables to store sensor readings
    
    // Calculate pixel index for right sensor and get brightness
    index = 4*(d * floor(this.rSensorPos.y)) * (d * width) + 4*(d * floor(this.rSensorPos.x));
    r = pixels[index]; // Right sensor reading
    
    // Calculate pixel index for left sensor and get brightness  
    index = 4*(d * floor(this.lSensorPos.y)) * (d * width) + 4*(d * floor(this.lSensorPos.x));
    l = pixels[index]; // Left sensor reading
    
    // Calculate pixel index for forward sensor and get brightness
    index = 4*(d * floor(this.fSensorPos.y)) * (d * width) + 4*(d * floor(this.fSensorPos.x));
    f = pixels[index]; // Forward sensor reading
    
    // === FOOD DETECTION ===
    // Check for food at sensor positions and add to sensor readings
    if (typeof foods !== 'undefined') {
      for (let food of foods) {
        r += food.getNutritionAt(this.rSensorPos.x, this.rSensorPos.y);
        l += food.getNutritionAt(this.lSensorPos.x, this.lSensorPos.y);
        f += food.getNutritionAt(this.fSensorPos.x, this.fSensorPos.y);
        
        // Consume food if mold is on top of it
        if (food.contains(this.x, this.y)) {
          food.consume(1);
        }
      }
    }
    
    // === DECISION MAKING (steering behavior) ===
    // Check for proximity to edges and turn away if too close
    let edgeAvoidance = false;
    let edgeBuffer = 20; // Distance from edge to start avoiding
    
    if (this.x < edgeBuffer) {
      // Too close to left edge - turn right
      this.heading += this.rotAngle;
      edgeAvoidance = true;
    } else if (this.x > width - edgeBuffer) {
      // Too close to right edge - turn left
      this.heading -= this.rotAngle;
      edgeAvoidance = true;
    }
    
    if (this.y < edgeBuffer) {
      // Too close to top edge - turn away from top (toward bottom)
      if (this.heading > 180) {
        this.heading = 315; // Turn toward bottom-left
      } else {
        this.heading = 45;  // Turn toward bottom-right
      }
      edgeAvoidance = true;
    } else if (this.y > height - edgeBuffer) {
      // Too close to bottom edge - turn away from bottom (toward top)
      if (this.heading < 180) {
        this.heading = 135; // Turn toward top-left
      } else {
        this.heading = 225; // Turn toward top-right
      }
      edgeAvoidance = true;
    }
    
    // Priority: Edge avoidance > Dispersal > Trail following
    if (edgeAvoidance) {
      // Edge avoidance takes highest priority
    } else if (this.isDispersing) {
      // Apply dispersal behavior - molds spread away from each other
      this.applyDispersalForce();
    } else {
      // Use normal trail-following behavior
      if (f > l && f > r) {
        // Forward has most trail/food -> keep going straight
        this.heading += 0;
      } else if (f < l && f < r) {
        // Forward has least trail/food -> turn randomly left or right
        if (random(1) < 0.5) {
          this.heading += this.rotAngle; // Turn right
        } else {
          this.heading -= this.rotAngle; // Turn left
        }
      } else if (l > r) {
        // Left sensor detects more trail/food -> turn left
        this.heading += -this.rotAngle;
      } else if (r > l) {
        // Right sensor detects more trail/food -> turn right
        this.heading += this.rotAngle;
      }
    }
    
    
  }
  
  // === DISPLAY METHOD - draws the mold on screen ===
  display() {
    noStroke(); // Remove outline from shapes
    fill(255); // Set fill color to white
    ellipse(this.x, this.y, this.r*2, this.r*2); // Draw mold as white circle
    
    // === DEBUG VISUALIZATION (currently commented out) ===
    // These lines can be uncommented to visualize the mold's direction and sensors
    // line(this.x, this.y, this.x + this.r*3*this.vx, this.y + this.r*3*this.vy); // Direction line
    // fill(255, 0, 0); // Red color for sensors
    // ellipse(this.rSensorPos.x, this.rSensorPos.y, this.r*2, this.r*2); // Right sensor
    // ellipse(this.lSensorPos.x, this.lSensorPos.y, this.r*2, this.r*2); // Left sensor  
    // ellipse(this.fSensorPos.x, this.fSensorPos.y, this.r*2, this.r*2); // Forward sensor
    
  }
  
  // === SENSOR POSITION HELPER METHOD ===
  // Calculates sensor position with boundary constraints
  getSensorPos(sensor, angle) {
    // Calculate sensor position based on mold position, distance, and angle
    // Constrain sensors to stay within canvas boundaries
    sensor.x = constrain(this.x + this.sensorDist*cos(angle), 1, width-2);
    sensor.y = constrain(this.y + this.sensorDist*sin(angle), 1, height-2);
  }
  
  // === DISPERSAL BEHAVIOR METHODS ===
  // Check if this mold should enter dispersal mode based on nearby molds (OPTIMIZED)
  checkDispersalBehavior() {
    if (typeof molds === 'undefined') return;
    
    let nearbyMolds = 0;
    let maxChecks = 50; // Limit how many molds to check for performance
    let checked = 0;
    
    // Only check a subset of molds for performance
    let startIndex = floor(random(molds.length));
    
    for (let i = 0; i < molds.length && checked < maxChecks; i++) {
      let index = (startIndex + i) % molds.length;
      let other = molds[index];
      
      if (other === this) continue; // Skip self
      checked++;
      
      // Quick distance check (avoid expensive sqrt)
      let dx = this.x - other.x;
      let dy = this.y - other.y;
      let distSq = dx * dx + dy * dy;
      let radiusSq = this.dispersalRadius * this.dispersalRadius;
      
      if (distSq < radiusSq) {
        nearbyMolds++;
        // Early exit if we already have enough for clustering
        if (nearbyMolds >= this.minClusterSize) {
          this.isDispersing = true;
          return;
        }
      }
    }
    
    // Not enough nearby molds found
    this.isDispersing = false;
  }
  
  // Apply dispersal force to spread molds away from each other (OPTIMIZED)
  applyDispersalForce() {
    if (typeof molds === 'undefined') return;
    
    let dispersalX = 0;
    let dispersalY = 0;
    let count = 0;
    let maxChecks = 20; // Limit checks for performance
    let checked = 0;
    
    // Only check nearby molds, starting from a random position
    let startIndex = floor(random(molds.length));
    
    for (let i = 0; i < molds.length && checked < maxChecks; i++) {
      let index = (startIndex + i) % molds.length;
      let other = molds[index];
      
      if (other === this) continue; // Skip self
      checked++;
      
      // Quick distance check
      let dx = this.x - other.x;
      let dy = this.y - other.y;
      let distSq = dx * dx + dy * dy;
      let radiusSq = this.dispersalRadius * this.dispersalRadius;
      
      if (distSq < radiusSq && distSq > 1) { // Avoid division by zero
        let distance = sqrt(distSq);
        
        // Calculate direction away from other mold
        let awayX = dx / distance;
        let awayY = dy / distance;
        
        // Weight by distance (closer = stronger repulsion)
        let strength = map(distance, 0, this.dispersalRadius, this.dispersalStrength, 0);
        
        dispersalX += awayX * strength;
        dispersalY += awayY * strength;
        count++;
      }
    }
    
    // Apply the dispersal force if we have nearby molds
    if (count > 0) {
      dispersalX /= count;
      dispersalY /= count;
      
      // Convert dispersal force to heading direction
      let dispersalHeading = atan2(dispersalY, dispersalX);
      
      // Calculate heading difference
      let headingDiff = dispersalHeading - this.heading;
      
      // Normalize angle difference to -180 to 180
      while (headingDiff > 180) headingDiff -= 360;
      while (headingDiff < -180) headingDiff += 360;
      
      // Apply a smaller portion of the heading difference for smoother performance
      this.heading += headingDiff * 0.2;
    }
  }

}