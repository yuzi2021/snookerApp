// Class Ball
class Ball {
    constructor(x, y, radius, color) {
        // Initialize the Matter.js body
        this.body = Bodies.circle(x, y, radius, {
            isStatic: false,
            restitution: 0.8,  // Adjusted for better bounce
            friction: 0.005,   // Low friction to prevent sticking
            frictionAir: 0.01, // Low air friction to simulate realistic movement
            label: 'ball',     // Ensure the label is set for collision detection
            render: {
                fillStyle: color
            }
        });

        this.color = color;
        this.initialPosition = { x, y }; // Store initial position
        World.add(engine.world, this.body);
        Body.setVelocity(this.body, { x: 0, y: 0 }); // Ensure balls start with zero velocity
    }

    // Method to draw the ball on the canvas
    draw() {
        push();
        fill(this.color);
        drawVertices(this.body.vertices);
        pop();
    }

    // Method to check if the ball has been potted
    isPotted() {
        let x = this.body.position.x;
        let y = this.body.position.y;

        // Define pocket centers
        let pockets = [
            { x: pocketRadius * 1.5, y: pocketRadius * 1.5 }, // top-left
            { x: tableWidth - pocketRadius * 1.5, y: pocketRadius * 1.5 }, // top-right
            { x: pocketRadius, y: tableHeight - pocketRadius * 1.5 }, // bottom-left
            { x: tableWidth - pocketRadius, y: tableHeight - pocketRadius * 1.5 }, // bottom-right
            { x: tableWidth / 2, y: pocketRadius }, // top-middle
            { x: tableWidth / 2, y: tableHeight - pocketRadius } // bottom-middle
        ];

        // Check if the ball is within any pocket
        for (let pocket of pockets) {
            let distance = dist(x, y, pocket.x, pocket.y);
            if (distance <= pocketRadius) {
                return true;
            }
        }

        return false;
    }

    // Method to check if the ball is out of bounds
    isOutOfBounds() {
        let x = this.body.position.x;
        let y = this.body.position.y;
        return x < ballRadius || x > tableWidth - ballRadius || y < ballRadius || y > tableHeight - ballRadius;
    }

    // Method to reset the ball to its initial position
    resetPosition(x, y) {
        Body.setPosition(this.body, { x: x, y: y });
        Body.setVelocity(this.body, { x: 0, y: 0 });
    }

    resetToInitialPosition() {
        this.resetPosition(this.initialPosition.x, this.initialPosition.y);
    }

    // Method to check if the ball has moved from its initial position
    hasMoved() {
        let x = this.body.position.x;
        let y = this.body.position.y;
        return dist(x, y, this.initialPosition.x, this.initialPosition.y) > 0.1;
    }
}

// Variables
let balls = [];
let redBalls = [];
let cueBall;
let initialColoredBallPositions = [];

// Function to set up all balls
function setupBalls() {
    // Clear the previous balls
    balls = [];
    redBalls = [];
    World.clear(engine.world, false);

    pinkBallFactor = 22 / 8.5;
    pinkBallPositionX = tableWidth - pinkBallFactor * dRadius * 1.5; // adjusted for better visuals

    // Initialize positions for colored balls
    let yellowPos = { x: baulkLineX, y: tableHeight / 2 + dRadius };
    let greenPos = { x: baulkLineX, y: tableHeight / 2 - dRadius };
    let brownPos = { x: baulkLineX, y: tableHeight / 2 };
    let bluePos = { x: tableWidth / 2, y: tableHeight / 2 };
    let pinkPos = { x: pinkBallPositionX, y: tableHeight / 2 };
    let blackPos = { x: tableWidth - dRadius, y: tableHeight / 2 };

    // Create Ball objects for each colored ball
    let yellowBall = new Ball(yellowPos.x, yellowPos.y, ballRadius, 'yellow');
    let greenBall = new Ball(greenPos.x, greenPos.y, ballRadius, 'lightgreen');
    let brownBall = new Ball(brownPos.x, brownPos.y, ballRadius, 'brown');
    let blueBall = new Ball(bluePos.x, bluePos.y, ballRadius, 'blue');
    let pinkBall = new Ball(pinkPos.x, pinkPos.y, ballRadius, 'pink');
    let blackBall = new Ball(blackPos.x, blackPos.y, ballRadius, 'black');

    // Store initial positions of colored balls
    initialColoredBallPositions = [
        { ball: yellowBall, pos: yellowPos },
        { ball: greenBall, pos: greenPos },
        { ball: brownBall, pos: brownPos },
        { ball: blueBall, pos: bluePos },
        { ball: pinkBall, pos: pinkPos },
        { ball: blackBall, pos: blackPos }
    ];

    // Add colored balls to the balls array
    balls.push(yellowBall, greenBall, brownBall, blueBall, pinkBall, blackBall);

    if (mode === 1 || mode === 2 || mode === 3) {
        // Position the red balls in a tightly packed triangle formation
        let startX = pinkPos.x + 2 * ballRadius + 1; // Adjust starting X position
        let startY = pinkPos.y; // Starting Y position is the same as the pink ball
        let gap = ballRadius * 2;
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col <= row; col++) {
                let x = startX + row * ballRadius * 1.7;
                let y = startY - row * gap / 2 + col * gap;
                let redBall = new Ball(x, y, ballRadius, 'red');
                redBalls.push(redBall);
                balls.push(redBall);
            }
        }
    }

    if (mode === 2 || mode === 3) {
        // Position red balls randomly in mode 2 and all balls randomly in mode 3
        if (mode === 2) {
            redBalls.forEach(ball => {
                let x = random(pocketDiameter + cushionThickness, tableWidth - pocketDiameter - cushionThickness);
                let y = random(pocketDiameter + cushionThickness, tableHeight - pocketDiameter - cushionThickness);
                ball.resetPosition(x, y);
            });
        } else if (mode === 3) {
            balls.forEach(ball => {
                let x = random(pocketDiameter + cushionThickness, tableWidth - pocketDiameter - cushionThickness);
                let y = random(pocketDiameter + cushionThickness, tableHeight - pocketDiameter - cushionThickness);
                ball.resetPosition(x, y);
            });
        }
    }

    // Clear collision messages when switching modes
    collisionMessages = [];

    // Create and initialize the cue ball in a random position within the "D" zone
    let randomAngle = random(PI / 2, 3 / 2 * PI); // Angle within the "D" zone
    let randomRadius = random(0, dRadius - ballRadius); // Radius within the "D" zone
    let cueBallX = dCenterX + randomRadius * cos(randomAngle);
    let cueBallY = tableHeight / 2 + randomRadius * sin(randomAngle);
    cueBall = new Ball(cueBallX, cueBallY, ballRadius, 'white');

    // Set labels for collision detection
    yellowBall.body.label = 'ball';
    greenBall.body.label = 'ball';
    brownBall.body.label = 'ball';
    blueBall.body.label = 'ball';
    pinkBall.body.label = 'ball';
    blackBall.body.label = 'ball';
    redBalls.forEach(ball => ball.body.label = 'ball');
    cueBall.body.label = 'cueBall';
}

function drawBalls() {
    cueBall.draw();
    for (let ball of balls) {
        ball.draw();
    }
}

function handleBallInteractions() {
    let allRedBallsPotted = redBalls.every(ball => ball.isPotted());

    // Logic to detect collisions and handle pocketing
    for (let ball of balls) {
        if (ball.isPotted()) {
            if (ball.color === 'red') {
                removePottedBall(ball);
                lastPottedBallColor = 'red'; // Update the last potted ball's color
            } else {
                if (allRedBallsPotted) {
                    // Allow colored balls to be potted and removed from the table
                    removePottedBall(ball);
                } else {
                    // Check if two consecutive colored balls are potted
                    if (lastPottedBallColor !== 'red' && lastPottedBallColor !== null) {
                        foulOccurred = true;
                        showFoulMessage = true;
                        clearTimeout(foulMessageTimeout);
                        foulMessageTimeout = setTimeout(() => {
                            showFoulMessage = false;
                        }, 3000); // Hide message after 3 seconds
                    } else {
                        foulOccurred = false;
                    }
                    lastPottedBallColor = ball.color; // Update the last potted ball's color
                    if (!allRedBallsPotted) {
                        ball.resetToInitialPosition();
                    }
                }
            }
        } else if (ball.isOutOfBounds()) {
            ball.resetToInitialPosition();
        }
    }
    if (cueBall.isPotted() || cueBall.isOutOfBounds()) {
        placingCueBall = true; // Set flag for placing the cue ball
        cueStick.makeInvisible(); // Hide the cue stick
        cueBall.resetPosition(dCenterX, tableHeight / 2); // Place the cue ball in the D zone
    }

    // Check if any colored ball has moved from its initial position and reset it
    if ((mode === 1 || mode === 2) && !firstShotTaken) {
        initialColoredBallPositions.forEach(({ ball, pos }) => {
            if (ball.hasMoved()) {
                ball.resetToInitialPosition();
            }
        });
    }
}


// Utility function to remove a potted ball
function removePottedBall(ball) {
    World.remove(engine.world, ball.body);
    balls = balls.filter(b => b !== ball);
    redBalls = redBalls.filter(b => b !== ball);
}

function resetCueBall() {
    let randomAngle = random(PI / 2, 3 / 2 * PI);
    let randomRadius = random(0, dRadius - ballRadius);
    let cueBallX = dCenterX + randomRadius * cos(randomAngle);
    let cueBallY = tableHeight / 2 + randomRadius * sin(randomAngle);
    cueBall.resetPosition(cueBallX, cueBallY);
}
