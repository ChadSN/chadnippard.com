const BASE_WIDTH = 800;                  // Canvas width
const BASE_HEIGHT = 450;                 // Canvas height
let WIDTH = BASE_WIDTH;                  // Current canvas width
let HEIGHT = BASE_HEIGHT;                // Current canvas height
let canvas;                         // canvas
let ctx;                            // context
let aniFrameID = 0;                 // Animation frame ID
let playButton;                     // Play/Restart button
let audioElm;                       // Audio element
let rightDown_bool = false;         // Right Arrow Button Down
let leftDown_bool = false;          // Left Arrow Button Down
let gameOver = true;                // Game over flag
let score = 0;                      // Player score

// Touch controls
let touchStartX = 0;                // Touch start X position
let touchCurrentX = 0;              // Current touch X position
let isTouching = false;             // Touch active flag

let ball = {                        // Ball object
    x: 0,                           // Ball x position
    y: 0,                           // Ball y position
    radius: 10,                     // Ball radius
    dyBase: 10,                     // Ball y direction base speed
    dxBase: 0,                      // Ball x direction base speed
    dx: 0,                          // Ball x direction
    dy: 10,                         // Ball y direction
    colour: 'red',                  // Ball colour
    damage: 1                       // Ball damage
};

let paddle = {                      // Paddle object
    x: 0,                           // Paddle x position
    y: 0,                           // Paddle y position
    radius: WIDTH / 10,            // Paddle radius
    speed: 5                        // Paddle speed
};

let bricks = {                      // Bricks object
    nRows: 5,                       // Number of rows
    nCols: 5,                       // Number of columns
    brickWidth: (WIDTH / 5) - 1,    // Brick width
    brickHeight: 15,                // Brick height
    padding: 1,                    // Padding between bricks
    colour: 'red',                  // Brick colour
    health: 1,                      // Brick health
    brick_ary: []                   // 2D array to hold the bricks
};

// DOM Loaded event listener
window.addEventListener("load", (evt) => {
    init(); // Initialise the game
});

// Init method - initialises the game
function init() {
    gameOver = true;                                                    // Set game over to true
    fitToScreen();                                                      // Adjust canvas size to fit screen
    bricks.brickWidth = (WIDTH / 5) - 1;                                // Brick width
    canvas = document.querySelector("#canvas");                         // Get the canvas
    canvas.width = WIDTH;                                               // Set canvas width
    canvas.height = HEIGHT;                                             // Set canvas height
    ctx = canvas.getContext('2d');                                      // Get the context
    ctx.clearRect(0, 0, WIDTH, HEIGHT);                                 // Clear the canvas
    audioElm = document.createElement('audio');                         // Create audio element
    playButton = document.getElementById("playButton");                 // Get play/pause button
    window.addEventListener('keydown', doKeyDown, true);                // Add event listener for key down
    window.addEventListener('keyup', doKeyUp, true);                    // Add event listener for key up
    playButton.addEventListener('click', onPlayButtonClicked, true);    // Add event listener for play button click

    // Add touch event listeners for mobile support
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    paddle.x = WIDTH / 2;                                               // Set initial paddle position
    paddle.y = HEIGHT;                                                  // Set initial paddle position
    ball.x = WIDTH / 2;                                                 // Set initial ball position
    ball.y = HEIGHT / 2;                                                // Set initial ball position
    ball.dx = ball.dxBase;                                              // Reset ball x direction
    ball.dy = ball.dyBase;                                              // Reset ball y direction
    ball.damage = 1;                                                    // Reset ball damage
    scoreText = document.getElementById("scoreText");                   // Get score text element
    score = 0;                                                          // Initialise score
    scoreText.innerHTML = score;                                        // Initialise score text
    damageText = document.getElementById("damageText");                 // Get damage text element
    damageText.innerHTML = ball.damage;                                 // Initialise damage text
    changeBallColour();                                                 // Reset ball colour
    initBricks();                                                       // Initialise the bricks array
    bricksRemainingText = document.getElementById("bricksRemaining");   // Get bricks remaining text element
    countRemainingBricks();                                             // Initialise bricks remaining text
    drawBall();                                                         // Draw the ball
    drawPaddle();                                                       // Draw the paddle
    drawBricks();                                                       // Draw the bricks
}

// Start method - starts or restarts the game
function start() {
    if (gameOver) {                     // If the game is over, start a new game
        init();                         // Re-initialise the game
        gameOver = false;               // Set game over to false
        update();                       // Start the game loop
        playButton.value = "Restart";   // Change button text to "Restart"
    }
    else {
        init();                         // Re-initialise the game
        playButton.value = "Start";     // Change button text to "Start"
    }
}

// Update method - the main game loop
function update() {
    if (gameOver) return;                       // If the game is over, exit the function
    movePaddle();                               // Move the paddle
    moveBall();                                 // Move the ball
    render();                                   // Render the game objects
    aniFrameID = requestAnimationFrame(update); // Request the next frame
}

// OnPlayButtonClicked method
function onPlayButtonClicked() {
    start();
}

// doKeyDown method
function doKeyDown(evt) {
    const key = evt.key;                                            // Get the key that was pressed
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {       // Right arrow or 'd' key
        rightDown_bool = true;                                      // Set right down to true
        evt.preventDefault();                                       // Prevent default action (scrolling)
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') { // Left arrow or 'a' key
        leftDown_bool = true;                                       // Set left down to true
        evt.preventDefault();                                       // Prevent default action (scrolling)
    }
}

// doKeyUp method
function doKeyUp(evt) {
    const key = evt.key;                                            // Get the key that was released
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {       // Right arrow or 'd' key
        rightDown_bool = false;                                     // Set right down to false
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') { // Left arrow or 'a' key
        leftDown_bool = false;                                      // Set left down to false
    }
}

// Move the paddle based on key states
function movePaddle() {
    if (leftDown_bool && paddle.x > 0 + paddle.radius) paddle.x -= paddle.speed;        // Move the paddle once per frame based on the current key state
    if (rightDown_bool && paddle.x < WIDTH - paddle.radius) paddle.x += paddle.speed;   // Move the paddle once per frame based on the current key state

    // Touch controls
    if (isTouching) {
        // Set paddle X to touch position, clamped to canvas bounds
        paddle.x = Math.max(paddle.radius, Math.min(WIDTH - paddle.radius, touchCurrentX));
    }
}

// Render the game objects
function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT); // Clear the canvas
    drawPaddle();                       // Draw the paddle
    drawBall();                         // Draw the ball
    drawBricks();                       // Draw the bricks
}

// Draw the paddle
function drawPaddle() {
    ctx.save();                                                             // Save the current state
    ctx.scale(1, 0.5);                                                      // Scale the context to create an ellipse effect
    ctx.beginPath();                                                        // Draw the shape
    ctx.arc(paddle.x, paddle.y + HEIGHT, paddle.radius, 0, Math.PI, true);  // Draw a semicircle
    ctx.restore();                                                          // Restore the context to its original state
    ctx.fillStyle = 'cyan';                                                // Set the fill color
    ctx.fill();                                                             // Fill the semicircle
}

// Draw the ball
function drawBall() {
    ctx.beginPath();                                            // Draw the shape
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, true); // Draw a circle
    ctx.fillStyle = ball.colour;                                // Set the fill color
    ctx.fill();                                                 // Fill the circle
}

// Move the ball
function moveBall() {
    ball.x += ball.dx; // Move the ball in the x direction
    ball.y += ball.dy; // Move the ball in the y direction
    onCollisionBall(); // Check for collisions
}

// Check for collisions 
function onCollisionBall() {
    ballOnCollisionCanvas(); // Check for collisions with the canvas
    ballOnCollisionPaddle(); // Check for collisions with the paddle
    ballOnCollisionBricks(); // Check for collisions with the bricks
}

// Check for collisions with the canvas
function ballOnCollisionCanvas() {
    if (ball.x >= WIDTH - ball.radius && ball.dx > 0) { ball.dx *= -1 }     // If it hits the right wall and is moving right, reverse direction
    if (ball.x <= 0 + ball.radius && ball.dx < 0) { ball.dx *= -1 }         // If it hits the left wall and is moving left, reverse direction
    if (ball.y >= HEIGHT - ball.radius && ball.dy > 0) {                    // If it hits the bottom wall and is moving down
        ball.damage = 1;                                                    // Reset ball damage
        ball.colour = 'red';                                                // Reset ball colour
        damageText.innerHTML = ball.damage;                                 // Update the damage text
        ball.dy *= -1;                                                      // If it hits the bottom wall and is moving down, reverse direction
        if (score > 0) score--;                                             // Decrease score
        scoreText.innerHTML = score;                                        // Update the score text
    }
    if (ball.y <= 0 + ball.radius && ball.dy < 0) { ball.dy *= -1 }         // If it hits the top wall and is moving up, reverse direction
}

// Check for collisions with the paddle
function ballOnCollisionPaddle() {
    if (ball.x + ball.radius > paddle.x - paddle.radius && ball.x - ball.radius < paddle.x + paddle.radius) {   // If the ball is within the paddle's x range
        let centreDiff = ball.x - paddle.x;                                                                     // Distance from the center of the paddle
        let pr2 = (paddle.radius + (ball.radius * 1.5)) * (paddle.radius + (ball.radius * 1.5));                // Sum of the radii squared
        let centreDiff2 = Math.pow(centreDiff, 2);                                                              // Distance squared
        let h = 0.5 * Math.sqrt(pr2 - centreDiff2);                                                             // Height from the center of the paddle to the collision point
        if (ball.y >= HEIGHT - h && ball.dy > 0) {                                                              // If the ball is at the height of the paddle and is moving down
            ball.dy *= -1;                                                                                      // Reverse the y direction
            ball.dx = (centreDiff) / (paddle.radius / 2);                                                       // Set the x direction based on where it hit the paddle
        }
    }
}

// Check for collisions with the bricks
function ballOnCollisionBricks() {
    var rowHeight = bricks.brickHeight + bricks.padding;                                                                    // Height of each row including padding
    var colWidth = bricks.brickWidth + bricks.padding;                                                                      // Width of each column including padding
    var row = Math.floor(((ball.dy < 0) ? (ball.y - ball.radius) : (ball.y + ball.radius)) / rowHeight);                    // Calculate the row the ball is in
    var col = Math.floor(((ball.dx < 0) ? (ball.x - ball.radius) : (ball.x + ball.radius)) / colWidth);                     // Calculate the column the ball is in

    if (row < bricks.nRows && row >= 0 && col >= 0 && bricks.brick_ary[row][col] && bricks.brick_ary[row][col].colour) {    // If the ball is in a valid row and column and the brick is present

        if (ball.y > (row * (bricks.brickHeight + bricks.padding)) + bricks.brickHeight + bricks.padding ||                 // If the ball is above or below the brick, reverse the y direction, otherwise reverse the x direction
            ball.y < (row * (bricks.brickHeight + bricks.padding)) - bricks.padding) { ball.dy *= -1; }                     // Reverse the y direction
        else { ball.dx *= -1; }                                                                                             // Reverse the x direction
        OnBrickDamage(row, col);                                                                                            // Change the brick colour
    }
}

// Change the brick colour
function OnBrickDamage(row, col) {
    let brick = bricks.brick_ary[row][col];                     // Get the brick at the specified row and column
    if (!brick || !brick.colour) return;                        // If the brick is not present, return
    if (brick.health > 1) {                                     // If the brick has more than 1 health
        brick.health -= ball.damage;                            // Decrease the brick's health by the ball's damage
        score += ball.damage;                                   // Increase the score based on the damage dealt
        scoreText.innerHTML = score;                            // Update the score text
        if (brick.health < 1) { onBrickDestroyed(row, col); }   // If the brick's health is less than 1, handle brick destruction
        else { changeBrickColourOnHealth(row, col); }           // Change the brick colour based on its health
    }
    else { onBrickDestroyed(row, col); }                        // Change the ball colour
}

// Handle brick destruction
function onBrickDestroyed(row, col) {
    score += ball.damage;                                       // Update the score
    score += bricks.brick_ary[row][col].health - ball.damage;   // Adjust score if overkill occurs
    scoreText.innerHTML = score;                                // Update the score text
    bricks.brick_ary[row][col] = null;                          // Remove the brick
    if (ball.damage < 5) {                                      // If the ball damage is less than 5
        ball.damage += 1;                                       // Increase the ball damage
        damageText.innerHTML = ball.damage;                     // Update the damage text
    }
    changeBallColour();                                         // Change the ball colour
    let remaining = countRemainingBricks();                     // Count remaining bricks
    if (remaining === 0) {                                      // If no bricks remain
        onWinGame();                                            // Handle winning the game
        return;                                                 // Exit the function to prevent further processing
    }
}

// Change the ball colour
function changeBallColour() {
    switch (ball.damage) {                      // Check the colour of the ball
        case 1: ball.colour = 'red'; break;     // Change the ball colour to the next colour
        case 2: ball.colour = 'orange'; break;  // Change the ball colour to the next colour
        case 3: ball.colour = 'yellow'; break;  // Change the ball colour to the next colour
        case 4: ball.colour = 'green'; break;   // Change the ball colour to the next colour
        case 5: ball.colour = 'blue'; break;    // Change the ball colour to the next colour
        default: break;                         // Do nothing if the colour is not recognised
    }
}

// Initialise the bricks array
function initBricks() {
    for (let i = 0; i < bricks.nRows; i++) {                // Initialise each row
        bricks.brick_ary[i] = [];                           // Create a new array for each row
        let health = 1;                                     // Determine row health
        switch (i) {                                        // Set row health based on row index
            case 0: health = 1; break;                      // Set row health for row 0
            case 1: health = 2; break;                      // Set row health for row 1
            case 2: health = 3; break;                      // Set row health for row 2
            case 3: health = 4; break;                      // Set row health for row 3
            case 4: health = 5; break;                      // Set row health for row 4
            default: health = 1; break;                     // Set row health for all other rows
        }
        for (let j = 0; j < bricks.nCols; j++) {            // Initialise each column
            bricks.brick_ary[i][j] = { health: health };    // Set the brick colour and health
            changeBrickColourOnHealth(i, j);                // Ensure the brick colour is up to date
        }
    }
}

// Change the brick colour based on its health
function changeBrickColourOnHealth(row, col) {
    switch (bricks.brick_ary[row][col].health) {                        // Check the health of the brick
        case 1: bricks.brick_ary[row][col].colour = 'red'; break;       // Change the brick colour to red
        case 2: bricks.brick_ary[row][col].colour = 'orange'; break;    // Change the brick colour to orange
        case 3: bricks.brick_ary[row][col].colour = 'yellow'; break;    // Change the brick colour to yellow
        case 4: bricks.brick_ary[row][col].colour = 'green'; break;     // Change the brick colour to green
        case 5: bricks.brick_ary[row][col].colour = 'blue'; break;      // Change the brick colour to blue
        default: break;                                                 // Do nothing if the health is not recognised
    }
}

// Draw the bricks
function drawBricks() {
    for (let i = 0; i < bricks.nRows; i++) {        // Loop through each row
        for (let j = 0; j < bricks.nCols; j++) {    // Loop through each column
            const brick = bricks.brick_ary[i][j];   // Get the brick at the current row and column
            if (brick && brick.colour) {            // If the brick is present
                ctx.fillStyle = brick.colour;       // Set the fill style to the brick colour
                // Draw the brick by calculating its position based on its row and column and adding padding
                ctx.fillRect((j * (bricks.brickWidth + bricks.padding)) + bricks.padding, (i * (bricks.brickHeight + bricks.padding)) + bricks.padding,
                    bricks.brickWidth, bricks.brickHeight);
            }
        }
    }
}

// Count all remaining bricks (non-null entries with a colour) across the 2D brick array
function countRemainingBricks() {
    let total = 0;                                      // Initialise total count
    for (let i = 0; i < bricks.nRows; i++) {            // Loop through each row
        const row = bricks.brick_ary[i];                // Get the current row
        if (!row) continue;                             // If the row is null, skip it
        for (let j = 0; j < bricks.nCols; j++) {        // Loop through each column
            const brick = row[j];                       // Get the brick at the current column
            if (brick != null && brick.colour) total++; // If the brick is present and has a colour, increment the count
        }
    }
    bricksRemainingText.innerHTML = total;              // Update the bricks remaining text
    return total;                                       // Return the total count
}

// Handle winning the game
function onWinGame() {
    gameOver = true;            // Set game over to true
    playButton.value = "Restart";   // Change button text to "Restart"
}

// Handle touch start
function handleTouchStart(evt) {
    evt.preventDefault();                               // Prevent default touch behavior (scrolling, zooming)
    const touch = evt.touches[0];                       // Get the first touch
    const rect = canvas.getBoundingClientRect();        // Get canvas position
    touchStartX = touch.clientX - rect.left;            // Store starting X position relative to canvas
    touchCurrentX = touchStartX;                        // Initialize current position
    isTouching = true;                                  // Set touching flag
}

// Handle touch move
function handleTouchMove(evt) {
    if (!isTouching) return;                            // If not touching, exit
    evt.preventDefault();                               // Prevent scrolling
    const touch = evt.touches[0];                       // Get the first touch
    const rect = canvas.getBoundingClientRect();        // Get canvas position
    touchCurrentX = touch.clientX - rect.left;          // Update current X position relative to canvas
}

// Handle touch end
function handleTouchEnd(evt) {
    evt.preventDefault();                               // Prevent default behavior
    isTouching = false;                                 // Clear touching flag
    touchStartX = 0;                                    // Reset start position
    touchCurrentX = 0;                                  // Reset current position
}

function fitToScreen() {
    WIDTH = Math.min(BASE_WIDTH, window.innerWidth);
    HEIGHT = Math.round(WIDTH * (BASE_HEIGHT / BASE_WIDTH));
}