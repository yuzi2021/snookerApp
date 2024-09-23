class CueStick {
    constructor() {
        this.angle = 0;
        this.power = 0;
        this.length = 150; // Fixed length of the cue stick
        this.offset = 25; // Distance between the cue stick and the ball
        this.visible = false; // Visibility of the cue stick
        this.dragging = false; // To track if the cue stick is being dragged
        this.dragStart = null; // Initial drag position
    }

    draw() {
        if (this.visible) {
            push();
            stroke(255);
            strokeWeight(4); // Make the cue stick line thicker for better visibility
            translate(cueBall.body.position.x + 150, cueBall.body.position.y + 150);
            rotate(this.angle);
            line(-this.offset - this.power, 0, -this.offset - this.length - this.power, 0); // Adjust stick position based on power
            pop();
        }
    }

    aim(x, y) {
        this.angle = atan2(cueBall.body.position.y - y, cueBall.body.position.x - x);
    }

    adjustAngle(delta) {
        this.angle += delta;
    }

    shoot() {
        let forceMagnitude = this.power * 0.001; // Adjust force magnitude for realism
        let force = p5.Vector.fromAngle(this.angle).mult(forceMagnitude);
        Body.applyForce(cueBall.body, cueBall.body.position, { x: force.x, y: force.y });
        this.power = 0; // Reset power after shooting
        this.visible = false; // Retract cue stick after shooting

        // Mark the first shot as taken
        if (!firstShotTaken) {
            firstShotTaken = true;
        }
    }

    updatePower(x, y) {
        if (this.dragging) {
            // Calculate power based on the distance from the initial drag position
            let maxDragDistance = 200; // Define the maximum drag distance for full power
            let dragDistance = dist(x, y, this.dragStart.x, this.dragStart.y);
            dragDistance = constrain(dragDistance, 0, maxDragDistance); // Ensure drag distance does not exceed maxDragDistance
            this.power = map(dragDistance, 0, maxDragDistance, 0, 200); // Map drag distance to power
            if (this.power < 0) this.power = 0; // Ensure power does not go negative
        }
    }

    updatePosition(x, y) {
        this.aim(x, y); // Update angle based on mouse position
        this.updatePower(x, y); // Update power based on mouse position
    }

    makeVisible() {
        this.visible = true;
        this.dragging = false; // Reset dragging when the cue stick becomes visible
        this.dragStart = null; // Reset drag start position
    }

    makeInvisible() {
        this.visible = false;
        this.dragging = false; // Reset dragging when the cue stick becomes invisible
        this.dragStart = null; // Reset drag start position
    }

    increasePower() {
        this.power = min(this.power + 5, 100); // Increment power by 5, max 100
    }

    decreasePower() {
        this.power = max(this.power - 5, 0); // Decrement power by 5, min 0
    }

    handleKeyInput(keyCode) {
        if (!placingCueBall) {
            if (keyCode === LEFT_ARROW) {
                this.adjustAngle(-0.05); // Fine-tune angle to the left
            } else if (keyCode === RIGHT_ARROW) {
                this.adjustAngle(0.05); // Fine-tune angle to the right
            } else if (keyCode === UP_ARROW) {
                this.increasePower(); // Increase power
            } else if (keyCode === DOWN_ARROW) {
                this.decreasePower(); // Decrease power
            }
        }
    }
}

function mouseMoved() {
    if (cueStick && !placingCueBall && cueStick.visible && !cueStick.dragging) {
        cueStick.aim(mouseX - 150, mouseY - 150);
    }
}

function mousePressed() {
    if (placingCueBall) {
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
            cueStick.dragStart = { x: mouseX - 150, y: mouseY - 150 }; // Set initial drag position
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
        cueStick.dragStart = null; // Reset drag start position
    }
}
