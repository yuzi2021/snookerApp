let canvas;
let tableWidth = 1000; // 12 ft scaled down to 1000 pixels
let tableHeight = tableWidth / 2; // 6 ft scaled down to 500 pixels
let ballDiameter = tableWidth / 36; // Ball diameter
let ballRadius = ballDiameter / 2; // Ball radius
let pocketDiameter = ballDiameter * 1.5; // Pocket diameter
let pocketRadius = pocketDiameter / 2; // Pocket radius
let dRadius = tableWidth / 12; // Reduced Radius to 1/12 of the table width for better visuals
let dCenterX = tableWidth / 5;
let cushionThickness = pocketRadius * 3 / 4; // Thickness of the cushions
let cushionLength = tableWidth / 2 - 3.5 * pocketRadius;
let baulkLineX = dCenterX;

let Engine = Matter.Engine;
let Render = Matter.Render;
let World = Matter.World;
let Bodies = Matter.Bodies;
let Body = Matter.Body;

let engine;
let cueStick;
let cushion1, cushion2, cushion3, cushion4, cushion5, cushion6;

let staticLayer;
let collisionMessages = []; // Store collision messages
let showCollisionMessages = false;

let mode = 1; // Default mode
let placingCueBall = false; // Flag for placing cue ball

// Track the last potted ball's color
let lastPottedBallColor = null;
let foulOccurred = false;
let showFoulMessage = false;
let foulMessageTimeout;

let firstShotTaken = false;


function setup() {
    canvas = createCanvas(tableWidth + 300, tableHeight + 300);
    engine = Engine.create();
    engine.world.gravity.y = 0; // Disable gravity for a top-down view
    setupBalls();
    setupCushions();

    cueStick = new CueStick();

    Matter.Runner.run(engine); // Start the physics engine

    setupCollisionDetection(); // Set up collision detection only once
    drawStaticElements();
    
    // Start the game in cue ball placement mode
    placingCueBall = true;
}

function draw() {
    background(60, 82, 45); // the floor colour
    image(staticLayer, 150, 150); // Draw static elements centered
    drawCushions(); // Draw cushions directly on the main canvas
    drawBalls();
    cueStick.draw();
    handleBallInteractions(); // Check for collisions and handle pocketing
    Engine.update(engine);

    if (!cueStick.visible && allBallsStopped() && !placingCueBall) {
        cueStick.makeVisible(); // Make cue stick visible after all balls have stopped
    }

    if (!cueStick.visible) {
        showCollisionMessages = true; // Show collision messages after the shot
    }

    if (showCollisionMessages) {
        displayCollisionMessages(); // Display collision messages on the screen
    }

    if (placingCueBall) {
        displayCueBallPlacementMessage(); // Display message when placing cue ball
    }

    if (showFoulMessage) {
        displayFoulPlayMessage(); // Display foul play message
    }

    if (allBallsStopped() && showCollisionMessages) {
        collisionMessages = []; // Clear collision messages once all balls have stopped moving
        showCollisionMessages = false; // Reset the flag to hide messages
    }

    displayInstructions();
    displayAppName();
}

function drawStaticElements() {
    staticLayer = createGraphics(tableWidth, tableHeight);
    drawPerlinNoiseTableColor(staticLayer); // Draw Perlin noise background
    drawTable(staticLayer);
}

function drawPerlinNoiseTableColor(graphics) {
    graphics.loadPixels();
    let noiseScale = 20;
    for (let x = 0; x < graphics.width; x++) {
        for (let y = 0; y < graphics.height; y++) {
            let noiseVal = noise(x * noiseScale, y * noiseScale);
            let colorVal = map(noiseVal, 0, 1, 100, 150); // Green color range for felt texture
            graphics.set(x, y, color(0, colorVal, 0));
        }
    }
    graphics.updatePixels();
}

function drawTable(graphics) {
    // Draw the "D" zone and baulk line
    drawDZone(graphics);
    // Draw rails
    drawRails(graphics);
    // Draw pockets
    graphics.fill(0);
    drawPockets(graphics);
}

function drawDZone(graphics) {
    graphics.noFill();
    graphics.stroke(255);
    // Draw the baulk line (vertical line)
    graphics.line(baulkLineX, 0, baulkLineX, tableHeight);
    // Draw the "D" zone arc
    graphics.arc(dCenterX, tableHeight / 2, dRadius * 2, dRadius * 2, PI / 2, 3 * PI / 2);
    // Label "D" zone
    graphics.textSize(12);
    graphics.fill(255);
    graphics.noStroke();
    graphics.text("the \"D\" zone", dCenterX - 70, tableHeight / 2);
}

function drawRails(graphics) {
    // Draw long side rails
    graphics.fill(139, 69, 19);
    graphics.rect(0, 0, tableWidth, pocketRadius);
    graphics.rect(0, tableHeight - pocketRadius, tableWidth, pocketRadius);
    // Draw short side rails
    graphics.rect(0, 0, pocketRadius, tableHeight);
    graphics.rect(tableWidth - pocketRadius, 0, pocketRadius, tableHeight);
}

function drawPockets(graphics) {
    // Corner pockets
    graphics.ellipse(pocketRadius * 1.5, pocketRadius * 1.5, pocketRadius * 2, pocketRadius * 2);
    graphics.ellipse(tableWidth - pocketRadius * 1.5, pocketRadius * 1.5, pocketRadius * 2, pocketRadius * 2);
    graphics.ellipse(pocketRadius * 1.5, tableHeight - pocketRadius * 1.5, pocketRadius * 2, pocketRadius * 2);
    graphics.ellipse(tableWidth - pocketRadius * 1.5, tableHeight - pocketRadius * 1.5, pocketRadius * 2, pocketRadius * 2);
    // Middle pockets
    graphics.ellipse(tableWidth / 2, pocketRadius, pocketRadius * 2, pocketRadius * 2);
    graphics.ellipse(tableWidth / 2, tableHeight - pocketRadius, pocketRadius * 2, pocketRadius * 2);
}

function setupCushions() {
    // Define trapezoidal cushions using Matter.Bodies from vertices
    cushion1 = Bodies.fromVertices(
        tableWidth * 1 / 4 + pocketRadius / 1.5, pocketRadius + cushionThickness / 2,
        [
            { x: -cushionLength / 2, y: -cushionThickness / 2 },
            { x: cushionLength / 2, y: -cushionThickness / 2 },
            { x: cushionLength / 2 - pocketRadius, y: cushionThickness / 2 },
            { x: -cushionLength / 2 + pocketRadius, y: cushionThickness / 2 }
        ],
        { isStatic: true, restitution: 1, label: 'cushion' }
    );
    cushion2 = Bodies.fromVertices(
        tableWidth * 3 / 4 - pocketRadius / 1.5, pocketRadius + cushionThickness / 2,
        [
            { x: -cushionLength / 2, y: -cushionThickness / 2 },
            { x: cushionLength / 2, y: -cushionThickness / 2 },
            { x: cushionLength / 2 - pocketRadius, y: cushionThickness / 2 },
            { x: -cushionLength / 2 + pocketRadius, y: cushionThickness / 2 }
        ],
        { isStatic: true, restitution: 1, label: 'cushion' }
    );
    cushion3 = Bodies.fromVertices(
        tableWidth * 1 / 4 + pocketRadius / 1.5, tableHeight - (pocketRadius + cushionThickness / 2),
        [
            { x: -cushionLength / 2 + pocketRadius, y: -cushionThickness / 2 },
            { x: cushionLength / 2 - pocketRadius, y: -cushionThickness / 2 },
            { x: cushionLength / 2, y: cushionThickness / 2 },
            { x: -cushionLength / 2, y: cushionThickness / 2 }
        ],
        { isStatic: true, restitution: 1, label: 'cushion' }
    );
    cushion4 = Bodies.fromVertices(
        tableWidth * 3 / 4 - pocketRadius / 1.5, tableHeight - (pocketRadius + cushionThickness / 2),
        [
            { x: -cushionLength / 2 + pocketRadius, y: -cushionThickness / 2 },
            { x: cushionLength / 2 - pocketRadius, y: -cushionThickness / 2 },
            { x: cushionLength / 2, y: cushionThickness / 2 },
            { x: -cushionLength / 2, y: cushionThickness / 2 }
        ],
        { isStatic: true, restitution: 1, label: 'cushion' }
    );

    // Short side cushions

    var shortsidecushionlength = tableHeight - pocketDiameter * 2 - pocketRadius
    cushion5 = Bodies.fromVertices(
        pocketRadius + cushionThickness / 2, tableHeight / 2,
        [
            { x: -cushionThickness / 2, y: -shortsidecushionlength / 2 },
            { x: cushionThickness / 2, y: -shortsidecushionlength / 2 + pocketRadius },
            { x: cushionThickness / 2, y: shortsidecushionlength / 2 - pocketRadius },
            { x: -cushionThickness / 2, y: shortsidecushionlength / 2 }
        ],
        { isStatic: true, restitution: 1, label: 'cushion' }
    );
    cushion6 = Bodies.fromVertices(
        tableWidth - (pocketRadius + cushionThickness / 2), tableHeight / 2,
        [
            { x: -cushionThickness / 2, y: -shortsidecushionlength / 2 + pocketRadius },
            { x: cushionThickness / 2, y: -shortsidecushionlength / 2 },
            { x: cushionThickness / 2, y: shortsidecushionlength / 2 },
            { x: -cushionThickness / 2, y: shortsidecushionlength / 2 - pocketRadius }
        ],
        { isStatic: true, restitution: 1, label: 'cushion' }
    );

    World.add(engine.world, [cushion1, cushion2, cushion3, cushion4, cushion5, cushion6]);
}

function drawCushions() {
    push();
    fill(139, 69, 19, 90); // Cushion color
    drawVertices(cushion1.vertices);
    drawVertices(cushion2.vertices);
    drawVertices(cushion3.vertices);
    drawVertices(cushion4.vertices);
    drawVertices(cushion5.vertices);
    drawVertices(cushion6.vertices);
    pop();
}

function drawVertices(vertices) {
    beginShape();
    for (let i = 0; i < vertices.length; i++) {
        vertex(vertices[i].x + 150, vertices[i].y + 150);
    }
    endShape(CLOSE);
}

function displayInstructions() {
    push();
    fill(255);
    textSize(18);
    let x = 150; // Adjusted x position to center the text
    let y = tableHeight + 180; // Position below the table
    text("Instructions:", x, y);
    y += 20;
    text("1. Mouse to aim/shoot, drag to adjust power.", x, y);
    y += 20;
    text("2. Arrow keys: Left/Right to adjust angle, Up/Down to adjust power.", x, y);
    y += 20;
    text("3. Press 'P' to place cue ball.", x, y);
    y += 20;
    text("4. Modes: 1 - Standard, 2 - Random Reds, 3 - All Random.", x, y);
    pop();
}

function displayAppName() {
    push();
    translate(width - 75, height / 2); // Adjust the position to the right margin
    rotate(HALF_PI); // Rotate to make the text vertical from bottom to top
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Snooker Practice", 0, 0);
    pop();
}

function displayCollisionMessages() {
    fill(255);
    textSize(16);
    let y = 20;
    for (let i = 0; i < collisionMessages.length; i++) {
        text(`${i + 1}. ${collisionMessages[i]}`, 10, y);
        y += 20;
    }
}

function displayCueBallPlacementMessage() {
    push();
    stroke(255, 0, 0);
    strokeWeight(4);
    textSize(25);
    textAlign(CENTER, CENTER);
    text("Place the cue ball in the 'D' zone", 150 + tableWidth / 2, 75);
    pop();
}

function displayFoulPlayMessage() {
    push();
    stroke(255, 0, 0);
    strokeWeight(4);
    textSize(25);
    textAlign(CENTER, CENTER);
    text("Foul Two Coloured Balls Potted in a Row", 150 + tableWidth / 2, 150);
    pop();
}

// Handle key presses to switch between modes
function keyPressed() {
    if (key === '1') {
        mode = 1;
        setupBalls();
        setupCushions();
    } else if (key === '2') {
        mode = 2;
        setupBalls();
        setupCushions();
    } else if (key === '3') {
        mode = 3;
        setupBalls();
        setupCushions();
    } else if (key === 'P' || key === 'p') {
        placingCueBall = !placingCueBall;
        if (placingCueBall) {
            cueStick.makeInvisible(); // Hide cue stick when placing the cue ball
        } else {
            cueStick.makeVisible(); // Show cue stick after placing the cue ball
        }
    } else {
        cueStick.handleKeyInput(keyCode); // Forward key input to cueStick
    }
}

function mouseMoved() {
    if (!placingCueBall && cueStick.visible && !cueStick.dragging) {
        cueStick.aim(mouseX - 150, mouseY - 150);
    }
}

function mousePressed() {
    if (placingCueBall) {
        let dx = mouseX - dCenterX - 150;
        let dy = mouseY - tableHeight / 2 - 150;
        if (isCueBallInDZone(mouseX - 150, mouseY - 150)) { // Ensure within "D" zone
            cueBall.resetPosition(mouseX - 150, mouseY - 150);
        }
    } else {
        // Check if the cue ball is clicked to show the cue stick
        let d = dist(mouseX - 150, mouseY - 150, cueBall.body.position.x, cueBall.body.position.y);
        if (d < ballRadius) {
            cueStick.makeVisible();
        }

        if (cueStick.visible) {
            // Initial aim when mouse is pressed
            cueStick.aim(mouseX - 150, mouseY - 150);
        }
    }
}

function mouseDragged() {
    if (placingCueBall) {
        let dx = mouseX - dCenterX - 150;
        let dy = mouseY - tableHeight / 2 - 150;
        if (isCueBallInDZone(mouseX - 150, mouseY - 150)) { // Ensure within "D" zone
            cueBall.resetPosition(mouseX - 150, mouseY - 150);
        }
    } else if (cueStick.visible) {
        cueStick.dragging = true; // Start dragging when the mouse is dragged
        // Update power and aim as mouse is dragged
        cueStick.updatePosition(mouseX - 150, mouseY - 150);
    }
}

function mouseReleased() {
    if (placingCueBall) {
        if (isCueBallInDZone(cueBall.body.position.x, cueBall.body.position.y)) {
            placingCueBall = false;
            cueStick.makeVisible();
        }
    } else if (cueStick.visible && cueStick.dragging) {
        cueStick.shoot();
        cueStick.dragging = false; // Reset dragging when the shot is made
    }
}

function isCueBallInDZone(x, y) {
    let dx = x - dCenterX;
    let dy = y - tableHeight / 2;
    return dx * dx + dy * dy <= dRadius * dRadius;
}

function allBallsStopped() {
    // Check if all balls have stopped moving
    for (let ball of balls) {
        let speed = sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2);
        if (speed > 0.01) {
            return false;
        }
    }
    let cueBallSpeed = sqrt(cueBall.body.velocity.x ** 2 + cueBall.body.velocity.y ** 2);
    if (cueBallSpeed > 0.01) {
        return false;
    }
    return true;
}

// Collision Detection: This handles interactions between the cue ball and other objects
function setupCollisionDetection() {
    Matter.Events.on(engine, 'collisionStart', function(event) {
        let pairs = event.pairs;
        pairs.forEach(pair => {
            let { bodyA, bodyB } = pair;

            if (bodyA.label === 'cueBall' || bodyB.label === 'cueBall') {
                let cueBallBody = bodyA.label === 'cueBall' ? bodyA : bodyB;
                let otherBody = bodyA.label === 'cueBall' ? bodyB : bodyA;
                handleCueBallCollision(cueBallBody, otherBody);
            } else if (bodyA.label === 'ball' && bodyB.label === 'ball') {
                handleBallCollision(bodyA, bodyB);
            }
        });
    });
}

// Function to handle the collision of the cue ball with other bodies
function handleCueBallCollision(cueBallBody, otherBody) {
    if (otherBody.label === 'cushion') {
        collisionMessages.push('Cue ball hit the cushion');
    } else if (otherBody.label === 'ball') {
        let ballColor = otherBody.render.fillStyle;
        if (ballColor === 'red') {
            collisionMessages.push('Cue ball hit a red ball');
        } else {
            collisionMessages.push(`Cue ball hit a ${ballColor} ball`);
        }
        handleBallCollision(cueBallBody, otherBody);
    }
}

// Function to handle the collision between two balls
function handleBallCollision(bodyA, bodyB) {
    let dist = Matter.Vector.sub(bodyB.position, bodyA.position);
    let nDist = Matter.Vector.magnitude(dist);
    let overlap = bodyA.circleRadius + bodyB.circleRadius - nDist;

    if (overlap > 0) {
        let correction = Matter.Vector.mult(Matter.Vector.normalise(dist), overlap / 2);
        Matter.Body.translate(bodyA, Matter.Vector.neg(correction));
        Matter.Body.translate(bodyB, correction);

        let normal = Matter.Vector.normalise(dist);
        let relativeVelocity = Matter.Vector.sub(bodyA.velocity, bodyB.velocity);
        let speed = Matter.Vector.dot(relativeVelocity, normal);

        if (speed < 0) return;

        let impulse = Matter.Vector.mult(normal, (2 * speed) / (bodyA.mass + bodyB.mass));
        Matter.Body.setVelocity(bodyA, Matter.Vector.sub(bodyA.velocity, Matter.Vector.mult(impulse, bodyB.mass)));
        Matter.Body.setVelocity(bodyB, Matter.Vector.add(bodyB.velocity, Matter.Vector.mult(impulse, bodyA.mass)));
    }
}
