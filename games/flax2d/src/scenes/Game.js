import { Player } from '../../gameObjects/Player.js';
import { Glizzard } from '../../gameObjects/Glizzard.js';
import { Muncher } from '../../gameObjects/Muncher.js';
import { DNA } from '../../gameObjects/DNA.js';
import { Crate } from '../../gameObjects/Crate.js';
import { InputManager } from '../utils/InputManager.js';
import { UIManager } from '../utils/UIManager.js';
import { DamageBox } from '../../gameObjects/damageBox.js';
import { CloudSpawner } from '../utils/CloudSpawner.js';

export class Game extends Phaser.Scene {

    constructor() {
        super('Game');
        this.worldWidth = 8000;                                                                         // Set world width
        this.worldHeight = 4000;                                                                        // Set world height
        this.levelKey = null;                                                                           // Level key for loading specific levels
        this.map = null;                                                                                // Tilemap reference
        this.groundLayer = null;                                                                        // Layer for ground areas
        this.groundInsideLayer = null;                                                                  // Layer for ground inside areas
        this.isOverlappingGroundInsideLayer = false;                                                    // Flag to track overlap state
        this.currentAmbientColour = 0xCCCCCC;                                                           // Current ambient light color set to a neutral color
        this.daylightAmbientColour = this.currentAmbientColour;                                         // Daylight color
        this.nightAmbientColour = 0x222222;                                                             // Nighttime color
    }

    init() {
        this.levelKey = 'level1';                                                     // Get level key from data or default to 'level1'
    }

    create() {
        this.physics.world.TILE_BIAS = 64;                                                              // Increase the tile bias to prevent tunneling
        this.background = this.add.image(960, 540, 'sky')                                               // Add the background image at the center of the game canvas
            .setDepth(0)                                                                                // Set depth to ensure it's behind other game objects
            .setScrollFactor(0);                                                                        // Make the background static relative to the camera
        this.setupCamera();                                                                             // Setup camera to follow the player
        this.inputManager = new InputManager(this);                                                     // Create an instance of InputManager
        this.physics.world.setBounds(                                                                   // Set world bounds
            0,                                                                                          // left
            0,                                                                                          // top
            this.worldWidth,                                                                            // right
            this.worldHeight);                                                                          // bottom
        this.createTilemap();
        this.initUIManager();                                                                           // Initialise UI Manager
        //this.relayer();                                                                               // Adjust layer depths
        this.level1Music = this.sound.add('level1Music', { loop: true, volume: 0.5 });                  // Load and play level 1 music
        this.level1Music.play();                                                                        // Play the level 1 music
        this.caveAmbience = this.sound.add('caveAmbience', { loop: true, volume: 0.05 });               // Load cave ambience sound
        this.cameras.main.fadeIn(1000, 0, 0, 0);                                                        // Fade in the screen
    }

    update() {
        this.handlePlayerInput();                                                                       // Handle player input
    }

    initUIManager() {
        this.uiManager = new UIManager(this);                                                           // Create UI Manager
        this.uiManager.updateHealth(this.player.health);                                                // Initialise health display
        this.uiManager.startTimerEvent(0);                                                                  // Start the timer event
    }


    createTilemap() {
        this.map = this.make.tilemap({ key: 'tilemap', tileWidth: 64, tileHeight: 64 });                // key must match the key used in preload

        // CREATE GROUND LAYER
        const groundTileSet = this.map.addTilesetImage('GroundTileSet', 'tiles');                       // Arg 1: tileset name in Tiled.    2: key used in preload
        this.groundLayer = this.map.createLayer('Ground', groundTileSet, 0, 0)                          // Arg 1: layer name in Tiled.      2: tileset object created above.    Arg 3 & 4: x,y position.
            .setDepth(3);                                                                               // Set depth to ensure it's above the background
        this.groundLayer.setCollisionByProperty({ collides: true });                                    // Enable collision for tiles with the 'collides' property set to true

        // CREATE GROUND INSIDE LAYER
        const groundTileSetInside = this.map.addTilesetImage('GroundTileSet_Inside', 'tilesInside');    // Arg 1: tileset name in Tiled.    2: key used in preload
        this.groundInsideLayer = this.map.createLayer('Ground_Inside', groundTileSetInside, 0, 0)       // Arg 1: layer name in Tiled.      2: tileset object created above.    Arg 3 & 4: x,y position.

            .setDepth(2);                                                                               // Set depth to ensure it's above the background
        this.groundInsideLayer.setCollisionByProperty({ overlaps: true });                              // Enable collision for tiles with the 'collides' property set to true

        // CREATE OBJECT LAYER
        const objectTileSet = this.map.addTilesetImage('ObjectTileSet', 'objectTiles');                 // Arg 1: tileset name in Tiled.    2: key used in preload
        const objectLayer = this.map.createLayer('ObjectTiles', objectTileSet, 0, 0)                    // Arg 1: layer name in Tiled.      2: tileset object created above.    Arg 3 & 4: x,y position.
            .setDepth(3);
        const objectLayer2 = this.map.createLayer('ObjectTilesLayer2', objectTileSet, 0, 0)                    // Arg 1: layer name in Tiled.      2: tileset object created above.    Arg 3 & 4: x,y position.
            .setDepth(3);                                                                               // Set depth to ensure it's above the background

        // ENABLE LIGHTING ON LAYERS
        this.groundLayer.setPipeline('Light2D');
        this.groundInsideLayer.setPipeline('Light2D');
        objectLayer.setPipeline('Light2D');

        // PLAYER SETUP
        const spawnPoint = this.map.findObject("Objects", obj => obj.name === "spawnPoint");            // Find the spawn point object in the Tiled map
        this.spawnPlayer(spawnPoint.x, spawnPoint.y);                                                   // Spawn the player at the spawn point

        // COLLISIONS SETUP FOR PLAYER WITH GROUND LAYER
        this.physics.add.collider(this.player.hitbox, this.groundLayer, (hitbox, tile) => {
            if (tile && tile.properties.collides) {                                                     // Check if the tile has the 'collides' property
                this.player.handleCollision(tile);                                                      // Use the Player instance to handle collision
            }
        });

        // COLLISIONS SETUP FOR PLAYER WITH GROUND INSIDE LAYER
        this.physics.add.overlap(this.player.hitbox, this.groundInsideLayer, (hitbox, tile) => {
            if (tile && tile.properties.overlaps) {                                                     // Check if the tile has the 'overlaps' property
                if (!this.isOverlappingGroundInsideLayer) {                                             // Only trigger once when starting to overlap
                    this.isOverlappingGroundInsideLayer = true;                                         // Set flag to true
                    this.tweenAmbientLight(this.nightAmbientColour);                                    // Dim light
                    if (!this.caveAmbience.isPlaying) {                                                 // Play cave ambience if not already playing
                        this.caveAmbience.stop();                                                       // Ensure it's stopped before playing again
                        this.caveAmbience.play();                                                       // Play cave ambience
                    }
                }

            } else {
                if (this.isOverlappingGroundInsideLayer) {                                              // Only trigger once when stopping overlap
                    this.isOverlappingGroundInsideLayer = false;                                        // Set flag to false
                    this.tweenAmbientLight(this.daylightAmbientColour);                                 // Full white light
                    if (this.caveAmbience.isPlaying) this.caveAmbience.stop();                          // Stop cave ambience
                }
            }
        });

        this.physics.add.overlap(this.player.hitbox, objectLayer, (hitbox, tile) => {                   // Check overlap with object layer
            if (tile && tile.properties.exit) {                                                         // Check if the tile has the 'exit' property
                console.log('Level Complete!');                                                         // Log level complete
            }
        });

        this.spawnSigns();                                                                              // Spawn signs with text
        this.spawnPoles();                                                                              // Spawn poles for swinging
        this.spawnCrates();
        this.spawnGlizzards();                                                                          // Spawn glizzard enemies
        this.spawnMunchers();                                                                           // Spawn muncher enemies
        this.spawnDNAs();                                                                               // Spawn DNA collectables
        this.addLights();                                                                               // Add lighting effects
        this.spawnClouds();

        // DEBUG RENDERING OF COLLISION LAYERS
        // const debugGraphics = this.add.graphics().setAlpha(0.75);
        // // Debug groundLayer
        // groundLayer.renderDebug(debugGraphics, {
        //     tileColor: null, // Color of non-colliding tiles
        //     collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        //     faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
        // });
        // // Debug groundInsideLayer
        // groundInsideLayer.renderDebug(debugGraphics, {
        //     tileColor: null, // Color of non-colliding tiles
        //     collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        //     faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
        // });
    }

    spawnCrates() {
        this.crates = this.physics.add.staticGroup();                                                   // Create a single static group for all crates
        const cratePoints = this.map.filterObjects("Objects", obj =>                                    // Find all crate points (small and large)
            obj.name === "crateSmallPoint" || obj.name === "crateLargePoint"                            // based on their names
        );
        cratePoints.forEach(cratePoint => {                                                             // Add crates to the group
            const isLarge = cratePoint.name === "crateLargePoint";                                      // Check if it's a large crate
            const crate = new Crate(this, cratePoint.x, cratePoint.y)                                   // Use the same sprite for both
                .setOrigin(0.5, 0.5)                                                                    // Set origin to center
                .setPipeline('Light2D')                                                                 // Enable lighting effects on the crate
                .setDepth(4)                                                                            // Set depth above ground layer
                .setScale(1, isLarge ? 2 : 1);                                                          // Scale the crate based on its type
            this.crates.add(crate);                                                                     // Add the crate to the static group
        });
        this.physics.add.collider(this.player.hitbox, this.crates, (hitbox, crate) => {                 // Player collides with crate
            this.player.handleCollision(crate);                                                         // Handle player collision effects
        });
        this.physics.add.overlap(this.player.damageBox, this.crates, (damageBox, crate) => {            // Player damage box overlaps with crate
            crate.break();                                                                              // Break the crate
        });
    }

    spawnSigns() {
        const signPoints = this.map.filterObjects("Objects", obj => obj.name === "signPoint");          // Find all sign objects in the Tiled map
        signPoints.forEach(signPoint => {                                                               // Iterate through each signPoint and create a sign with text
            const textProperty = signPoint.properties.find(prop => prop.name === 'text');               // Get the text property
            const textSizeProperty = signPoint.properties.find(prop => prop.name === 'size');           // Get the text size property
            const textWrapProperty = signPoint.properties.find(prop => prop.name === 'wrapWidth')       // Get the text wrap width property
                || { value: 128 };                                                                      // Default wrap width if not specified
            const signText = this.add.text(signPoint.x, signPoint.y, textProperty.value)                // Create text object at sign position
                .setFontFamily('Impact')                                                                // Set font family
                .setFontSize(`${textSizeProperty.value}px`)                                             // Set font size
                .setColor('#000000')                                                                 // Set text color
                .setAlign('center')                                                                     // Set text alignment
                .setWordWrapWidth(textWrapProperty.value)                                               // Set word wrap width
                .setLineSpacing(0)                                                                      // Set line spacing
                .setOrigin(0.5)                                                                         // Center horizontally, align bottom
                .setDepth(4);                                                                           // Set depth above ground layer
        });
    }

    tweenAmbientLight(targetColour) {
        if (this.currentAmbientColour === targetColour) return;                                             // No need to tween if already at target color
        const start = Phaser.Display.Color.ValueToColor(this.currentAmbientColour);                         // Current ambient color
        const end = Phaser.Display.Color.ValueToColor(targetColour);                                        // Target ambient color
        const colorObj = { t: 0 };                                                                          // Tweened value 0 - 1
        this.tweens.add({
            targets: colorObj,                                                                              // Tween the t value from 0 to 1
            t: 1,                                                                                           // Target value
            duration: 500,                                                                                  // Duration of the tween
            ease: 'Linear',                                                                                 // Easing function
            onUpdate: () => {
                const colour = Phaser.Display.Color.Interpolate.ColorWithColor(start, end, 1, colorObj.t);  // Interpolate between start and end colors
                const hex = Phaser.Display.Color.GetColor(colour.r, colour.g, colour.b);                    // Convert to hex
                this.lights.setAmbientColor(hex);                                                           // Update ambient color
                this.currentAmbientColour = hex;                                                            // Update current ambient color

            },
            onComplete: () => {
                this.lights.setAmbientColor(targetColour);                                                  // Final set to target color
                this.currentAmbientColour = targetColour;                                                   // Update current ambient color
            }
        });
    }

    spawnClouds() {
        const CloudYMinPoint = this.map.filterObjects("Objects", obj => obj.name === "CloudYMin")[0];       // Get cloud Y min point 
        const CloudYMaxPoint = this.map.filterObjects("Objects", obj => obj.name === "CloudYMax")[0];       // Get cloud Y max point
        this.cloudSpawner = new CloudSpawner(this);                                                         // Create a CloudSpawner instance
        this.cloudSpawner.spawnClouds(1, CloudYMinPoint.y, CloudYMaxPoint.y);                               // Spawn clouds in the background with depth 1
    }

    // Handle player input
    handlePlayerInput() {
        if (this.player.disableMovement) return;                                                            // prevent movement if canMove is false
        if (                                                                                                // Jump input
            Phaser.Input.Keyboard.JustDown(this.inputManager.cursors.up) ||                                 // Up arrow
            Phaser.Input.Keyboard.JustDown(this.inputManager.keySPACE) ||                                   // Space bar
            Phaser.Input.Keyboard.JustDown(this.inputManager.keyW)                                          // W key
        ) this.player.jump();                                                                               // Make the player jump
        if (this.inputManager.cursors.left.isDown || this.inputManager.keyA.isDown)                         // Left arrow or A key
            this.player.moveLeft();                                                                         // Move player left
        else if (this.inputManager.cursors.right.isDown || this.inputManager.keyD.isDown)                   // Right arrow or D key
            this.player.moveRight();                                                                        // Move player right
        else this.player.idle();                                                                            // No horizontal input, Player idle
    }

    pointerLeftPressed() {
        if (this.player.isPoleSwinging) return;
        this.player.tailwhip();
    }

    pointerLeftReleased() {
    }

    pointerRightPressed() {
        this.player.glideSpin();
    }

    pointerRightReleased() {
    }

    // Add lighting effects to the scene
    addLights() {
        this.lights.enable();                                                                   // Enable Lights Manager
        this.lights.setAmbientColor(this.daylightAmbientColour);                                // Set ambient light color for the scene
        this.lights.addLight(this.cameras.main.x, 0, 3000)                                      // Light position and radius
            .setColor(0xFFFACD)                                                                 // Light color
            .setIntensity(1.2)                                                                  // Simulated sunlight
            .setScrollFactor(1, 0);                                                             // Make the light follow the camera. Arg1: x scroll factor. 2: y scroll factor

        // Add flickering lights at designated light points
        const lightPoints = this.map.filterObjects("Objects", obj => obj.name === "lightPoint");
        lightPoints.forEach(point => {
            const light = this.lights.addLight(point.x, point.y, 200)                           // Light position and radius
                .setColor(0xFFD580)                                                             // Warm light color
                .setIntensity(1.5);                                                             // Random brightness of the light
            this.tweens.add({
                targets: light,                                                                 // Animate the Phaser Light object
                intensity: { from: 1.5, to: 2 },                                                // Flicker intensity between 1.5 and 2
                radius: { from: 200, to: 250 },                                                 // Flicker radius between 200 and 250
                duration: 1500,                                                                 // Duration of one flicker cycle
                yoyo: true,                                                                     // Flicker back and forth
                repeat: -1                                                                      // Repeat indefinitely
            });
        });
    }

    // Spawn the player character
    spawnPlayer(x, y) {
        this.player = new Player(this, x, y).setDepth(10);                                       // Spawn player and set depth
        this.player.setPipeline('Light2D');                                                     // Enable lighting effects on the player
        const playerDamageBox = new DamageBox(this, this.player);                               // create damage box for player
        this.player.setDamageBox(playerDamageBox);                                              // assign damage box to player
        this.cameras.main.startFollow(this.player, false, 0.08, 0.08);                                        // Make the camera follow the player smoothly
    }

    // Setup camera to follow the player                        
    setupCamera() {
        const cam = this.cameras.main;                                                          // get main camera
        cam.setBounds(0, 0, this.worldWidth, this.worldHeight);                                 // Set camera bounds to the size of the level
        cam.setDeadzone(cam.width / 4, 0);                                                      // Set deadzone to center quarter width and full height
        this.cameras.main.roundPixels = true;                                                   // Prevent sub-pixel rendering to avoid blurriness
    }

    spawnPoles() {
        this.poles = this.physics.add.staticGroup();
        const polePoints = this.map.filterObjects("Objects", obj => obj.name === "polePoint");

        // Iterate through each polePoint and create a pole at its position
        polePoints.forEach(polePoint => {
            const pole = this.poles.create(polePoint.x, polePoint.y, 'pole')
                .setScale(2)
                .setOrigin(0.5, 0.5)
                .refreshBody()
                .setDepth(4);
        });

        this.physics.add.overlap(this.player.hitbox, this.poles, (hitbox, pole) => {
            this.player.poleSwing(pole);
        });
    }


    // Spawn DNA collectables
    spawnDNAs() {
        this.dnas = this.physics.add.staticGroup();
        const dnaPoints = this.map.filterObjects("Objects", obj => obj.name === "dnaPoint");

        dnaPoints.forEach(dnaPoint => {
            const dna = new DNA(this, dnaPoint.x, dnaPoint.y);
            this.dnas.add(dna).setDepth(4);
        });

        this.physics.add.overlap(this.player, this.dnas, (player, dna) => {
            this.player.collectDNA(dna);                // Handle DNA collection
        });
    }

    // Spawn muncher enemies
    spawnMunchers() {
        this.munchers = this.physics.add.group({ runChildUpdate: true });                               // Create a group for munchers
        const muncherPoints = this.map.filterObjects("Objects", obj => obj.name === "muncherPoint");    // Find all muncher spawn points
        muncherPoints.forEach(muncherPoint => {                                                         // Iterate through each muncherPoint and create a Muncher at its position
            const muncher = new Muncher(this, muncherPoint.x, muncherPoint.y);                          // create muncher at point
            this.munchers.add(muncher).setDepth(4);                                                                 // add to the group
            const damageBox = new DamageBox(this, muncher);                                             // create damage box for muncher
            muncher.setDamageBox(damageBox);                                                            // assign damage box to muncher
        });
        this.physics.add.collider(this.munchers, this.map.getLayer('Ground').tilemapLayer);             // munchers collide with ground
        this.physics.add.overlap(this.player.hitbox, this.munchers, (player, muncher) => {              // player stomps muncher
            if (player.y < muncher.y - muncher.height && player.body.velocity.y >= 200) {               // player is above muncher and falling fast
                player.body.setVelocityY(-600);                                                         // bounce the player up
                muncher.death();                                                                        // destroy the muncher
                this.player.handleCollision();                                                          // handle player collision effects
            }
        });
    }

    // Spawn glizzard enemies
    spawnGlizzards() {
        this.glizzards = this.add.group({ runChildUpdate: true });                                      // Create a group for glizzards
        const glizzardPoints = this.map.filterObjects("Objects", obj => obj.name === "glizzardPoint");  // Find all glizzard spawn points
        glizzardPoints.forEach(glizzardPoint => {                                                       // Iterate through each glizzardPoint and create a Glizzard at its position
            const glizzard = new Glizzard(this, glizzardPoint.x, glizzardPoint.y);                      // create glizzard at point
            this.glizzards.add(glizzard).setDepth(4);                                                               // add to the group
        });
        this.physics.add.overlap(this.player.hitbox, this.glizzards, (player, glizzard) => {            // player stomps glizzard
            if (player.y < glizzard.y - glizzard.height && player.body.velocity.y > 900) {              // player is above glizzard and falling fast
                player.body.setVelocityY(-600);                                                         // bounce the player up
                glizzard.death();                                                                       // destroy the glizzard
                this.player.handleCollision();                                                          // handle player collision effects
            }
        });
    }

    // Adjust layer depths to control rendering order
    relayer() {
        const layer = this.add.layer(); // Create a new layer
        // Order: background, lights, platforms, dnas, glizzards, munchers, player, pointLight, UI
        layer.add([this.pointLight, this.player]);
    }

    handleDamageBoxOverlap(parent, damageBox) {
        if (parent === this.player) {
            this.physics.add.overlap(damageBox, this.munchers, (damageBox, muncher) => {
                muncher.death(muncher.x < this.player.x ? -1 : 1);
            });

            this.physics.add.overlap(damageBox, this.glizzards, (damageBox, glizzard) => {
                glizzard.death(glizzard.x < this.player.x ? -1 : 1);
            });
        } else {
            this.physics.add.overlap(damageBox, this.player.hitbox, (damageBox, player) => {
                this.player.damagePlayer(damageBox.damage, damageBox); // Damage the player
            });
        }
    }
}


// // Spawn platforms in the game world
// spawnPlatforms() {
//     // CREATE PLATFORMS
//     this.platforms = this.physics.add.staticGroup();    // Create a static group for platforms

//     // Create ground platforms
//     for (let i = 0; i < 8; i++) {
//         this.platforms.create(256 * i, 1080, 'ground');
//     }
// // Create some floating platforms
// for (let i = 0; i < 20; i++) {
//     this.platforms.create(51 * i, 0, 'ground').setScale(0.2).refreshBody(); // refreshBody is needed after scaling to update the physics body
// }
// for (let i = 0; i < 10; i++) {
//     this.platforms.create(51 * i + 560, 450, 'ground').setScale(0.2).refreshBody(); // refreshBody is needed after scaling to update the physics body
// }
// for (let i = 0; i < 10; i++) {
//     this.platforms.create(51 * i + 1080, 190, 'ground').setScale(0.2).refreshBody(); // refreshBody is needed after scaling to update the physics body
// }
// for (let i = 10; i > 0; i--) {
//     this.platforms.create(51 * i + 1400, 0, 'ground').setScale(0.2).refreshBody(); // refreshBody is needed after scaling to update the physics body
// }
//     this.physics.add.collider(this.player.hitbox, this.platforms, (hitbox, platform) => {
//         this.player.handleCollision(platform); // Use the Player instance to handle collision
//     });
// }


