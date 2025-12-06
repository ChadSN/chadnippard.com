import { Player } from '../../gameObjects/Player.js';
import { Glizzard } from '../../gameObjects/NPCs/Glizzard.js';
import { Muncher } from '../../gameObjects/NPCs/Muncher.js';
import { DNA } from '../../gameObjects/DNA.js';
import { Crate } from '../../gameObjects/Crate.js';
import { InputManager } from '../utils/InputManager.js';
import { UIManager } from '../utils/UIManager.js';
import { DamageBox } from '../../gameObjects/damageBox.js';
import { CloudSpawner } from '../utils/CloudSpawner.js';
import { MusicManager } from '../utils/MusicManager.js';
import { saveHighScore } from '../utils/HighScoreManager.js';
import { Teleporter } from '../../gameObjects/Teleporters.js';
import { Wheel } from '../../gameObjects/Wheel.js';
import { WheelPlatform } from '../../gameObjects/WheelPlatform.js';
import { Ring } from '../../gameObjects/Ring.js';
import { Geyser } from '../../gameObjects/Geyser.js';

// ADD CAMERA SHAKE

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        this.worldWidth;                                                                                                // Set world width
        this.worldHeight;                                                                                               // Set world height
        this.levelKey = 'level1';                                                                                       // Level key for loading specific levels
        this.map = null;                                                                                                // Tilemap reference
        this.groundLayer = null;                                                                                        // Layer for ground areas
        this.groundInsideLayer = null;                                                                                  // Layer for ground inside areas
        this.objectLayer = null;                                                                                        // Layer for objects
        this.objectLayer2 = null;                                                                                       // Layer for objects layer 2
        this.objectLayerTop = null;                                                                                     // Layer for top objects
        this.isOverlappingGroundInsideLayer = false;                                                                    // Flag to track overlap state
        this.currentAmbientColour = 0xCCCCCC;                                                                           // Current ambient light color set to a neutral color
        this.daylightAmbientColour = this.currentAmbientColour;                                                         // Daylight color
        this.nightAmbientColour = 0x555555;                                                                             // Nighttime color
        this.levelExiting = false;                                                                                      // Flag to indicate if the level is exiting
        this.levelReady = false;                                                                                        // Flag to indicate if the level is ready
        this.musicManager = new MusicManager(this);                                                                     // Music manager instance
        this.hasMovementInput = false;                                                                                  // Track if there was movement input in the previous frame
        this.playerLastVel = { x: 0, y: 0 };                                                                            // Store the player's last velocity
    }

    create() {
        this.input.setDefaultCursor('none');                                                                            // Hide the default cursor
        this.physics.world.TILE_BIAS = 64;                                                                              // Increase the tile bias to prevent tunneling
        this.background = this.add.image(960, 540, 'sky').setDepth(0).setScrollFactor(0);                               // Add the background image at the center of the game canvas
        this.setupCamera();                                                                                             // Setup camera to follow the player
        this.inputManager = new InputManager(this);                                                                     // Create an instance of InputManager
        this.uiManager = new UIManager(this);                                                                           // Create UI Manager
        this.musicManager.setMusic('level1Music');                                                                      // Load and set level 1 music        
        this.caveAmbience = this.sound.add('caveAmbience', { loop: true, volume: 0.05 });                               // Load cave ambience sound
        // CREATE GROUPS ------------------------------------------------------------------------------------------------------------------------------------------------------------
        this.poles = this.physics.add.staticGroup();                                                                    // Create a static group for poles
        this.signs = this.add.group();                                                                                  // Create a group for signs
        this.crates = this.physics.add.group({ runChildUpdate: true });                                                 // dynamic group
        this.wheels = this.add.group();                                                                                 // Create a group for wheels
        this.wheelPlatforms = this.physics.add.group({ runChildUpdate: true, allowGravity: false, immovable: true });   // Create a physics group for wheel platforms
        this.geysers = this.physics.add.staticGroup();                                                                  // Create a group for geysers
        this.tpSenders = this.physics.add.staticGroup();                                                                // Create a group for teleporters
        this.tpReceivers = this.add.group();                                                                            // Create a group for teleporters
        this.rings = this.physics.add.staticGroup();                                                                    // Create a group for rings
        this.munchers = this.physics.add.group({ runChildUpdate: true });                                               // Create a group for munchers
        this.glizzards = this.add.group({ runChildUpdate: true });                                                      // Create a group for glizzards
        this.dnas = this.physics.add.staticGroup();                                                                     // Create a static group for DNAs
        this.mountains = this.add.group();                                                                              // Create a group for mountains
        // CREATE LEVEL -------------------------------------------------------------------------------------------------------------------------------------------------------------
        this.createLevel('level1');                                                                                     // Create level 1
    }

    update() {
        this.handlePlayerInput();                                                                                       // Handle player input
    }

    // LEVEL CREATION AND DESTRUCTION ------------------------------------------------------------------------------------------------------------------------------------------------

    createLevel(levelKey) {
        this.levelReady = false;                                                                                // Mark level as not ready during creation
        this.levelExiting = false;                                                                              // Reset level exiting flag
        this.levelKey = levelKey;                                                                               // Set the current level key
        this.map = this.make.tilemap({ key: this.levelKey, tileWidth: 64, tileHeight: 64 });                    // key must match the key used in preload
        this.worldWidth = this.map.widthInPixels;                                                               // Get map dimensions in pixels
        this.worldHeight = this.map.heightInPixels;                                                             // Get map dimensions in pixels
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);                                   // Set camera bounds to match the tilemap size
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);                                  // Set physics world bounds to match the tilemap size
        // CREATE TILESETS
        const groundTileSet = this.map.addTilesetImage('GroundTileSet', 'groundTiles');                         // Arg 1: tileset name in Tiled.    2: key used in preload
        const objectTileSet = this.map.addTilesetImage('ObjectTileSet', 'objectTiles');                         // Arg 1: tileset name in Tiled.    2: key used in preload
        // CREATE LAYERS
        this.groundLayer = this.map.createLayer('Ground', groundTileSet, 0, 0).setDepth(3);                     // Arg 1: layer name in Tiled.      2: tileset object created above.    Arg 3 & 4: x,y position.
        this.groundInsideLayer = this.map.createLayer('GroundInside', groundTileSet, 0, 0).setDepth(2);         // Arg 1: layer name in Tiled.      2: tileset object created above.    Arg 3 & 4: x,y position.
        this.objectLayer = this.map.createLayer('ObjectTiles', objectTileSet, 0, 0).setDepth(3);                // Arg 1: layer name in Tiled.      2: tileset object created above.    Arg 3 & 4: x,y position.
        this.objectLayer2 = this.map.createLayer('ObjectTilesLayer2', objectTileSet, 0, 0).setDepth(3);         // Arg 1: layer name in Tiled.      2: tileset object created above.    Arg 3 & 4: x,y position.
        this.objectLayerTop = this.map.createLayer('ObjectTilesLayerTop', objectTileSet, 0, 0).setDepth(500);   // Arg 1: layer name in Tiled.      2: tileset object created above.    Arg 3 & 4: x,y position.
        // SET COLLISIONS ON LAYERS
        this.groundLayer.setCollisionByProperty({ collides: true });                                            // Enable collision for tiles with the 'collides' property set to true
        this.groundInsideLayer.setCollisionByProperty({ overlaps: true });                                      // Enable collision for tiles with the 'collides' property set to true
        this.objectLayerTop.setCollisionByProperty({ collides: true });                                         // Enable collision for tiles with the 'collides' property set to true
        // ENABLE LIGHTING ON LAYERS
        this.groundLayer.setPipeline('Light2D');
        this.groundInsideLayer.setPipeline('Light2D');
        this.objectLayer.setPipeline('Light2D');
        this.objectLayer2.setPipeline('Light2D');
        this.objectLayerTop.setPipeline('Light2D');
        // PLAYER SETUP
        const spawnPoint = this.map.findObject("Objects", obj => obj.name === "spawnPoint");                    // Find the spawn point object in the Tiled map
        this.spawnPlayer(spawnPoint.x, spawnPoint.y);                                                           // Spawn the player at the spawn point location
        // OBJECTS SETUP
        this.createMountains();
        this.addLights();                                                                                       // Add lighting effects
        this.spawnSigns();                                                                                      // Spawn signs with text
        this.spawnPoles();                                                                                      // Spawn poles for swinging
        this.spawnCrates();                                                                                     // Spawn crates
        this.spawnWheels();                                                                                     // Spawn wheels
        this.spawnGeysers();                                                                                    // Spawn geysers
        this.spawnTeleporters();                                                                                // Spawn teleporters
        this.spawnRings();
        this.spawnGlizzards();                                                                                  // Spawn glizzard enemies
        this.spawnMunchers();                                                                                   // Spawn muncher enemies
        this.spawnClouds();                                                                                     // Spawn background clouds
        // COLLISIONS SETUP
        this.player.setCollisions();
        // FINAL LEVEL SETUP
        this.cameras.main.fadeIn(500, 255, 255, 255).once('camerafadeincomplete', () => {                       // Fade in the camera over 0.5 seconds once
            this.uiManager.startTimerEvent(this.uiManager.elapsed);                                             // Start the level timer 
            this.player.disableMovement = false;                                                                // Enable player movement
            this.uiManager.resumeTimer();                                                                       // Resume the timer
        });
        this.levelReady = true;                                                                                 // Mark level as ready after creation
    }

    destroyLevel() {
        this.physics.world.colliders.getActive().forEach(c => c.destroy());                                     // Destroy all active colliders
        this.destroyGroup(this.mountains);                                                                      // Destroy mountains
        this.destroyGroup(this.signs);                                                                          // Destroy signs
        this.destroyGroup(this.poles);                                                                          // Destroy poles
        this.destroyGroup(this.crates);                                                                         // Destroy crates
        this.destroyGroup(this.wheels);                                                                         // Destroy wheels
        this.destroyGroup(this.wheelPlatforms);                                                                 // Destroy wheel platforms
        this.destroyGroup(this.geysers);                                                                        // Destroy geysers
        this.destroyGroup(this.tpSenders);                                                                      // Destroy teleporter senders
        this.destroyGroup(this.tpReceivers);                                                                    // Destroy teleporter receivers
        this.destroyGroup(this.rings);                                                                          // Destroy rings
        this.destroyGroup(this.glizzards);                                                                      // Destroy glizzard enemies
        this.destroyGroup(this.munchers);                                                                       // Destroy muncher enemies
        this.destroyGroup(this.dnas);                                                                           // Destroy DNA collectables
        this.lights.destroy();                                                                                  // Destroy the Lights Manager
        this.groundLayer = null;                                                                                // Clear ground layer reference
        this.groundInsideLayer = null;                                                                          // Clear ground inside layer reference
        this.objectLayer = null;                                                                                // Clear object layer reference
        this.objectLayer2 = null;                                                                               // Clear object layer 2 reference
        this.objectLayerTop = null;                                                                             // Clear object layer top reference
        this.map.destroy();                                                                                     // Destroy the tilemap
        this.tweens.killAll();                                                                                  // Stop all tweens
    }

    changeLevel() {
        this.uiManager.pauseTimer();
        this.cameras.main.fadeOut(1000, 255, 255, 255).once('camerafadeoutcomplete', () => {                    // Fade out the camera over 1 second once
            switch (this.levelKey) {                                                                            // Determine the next level based on current level key
                case 'level1': this.levelKey = 'level2'; this.transitionToLevel(this.levelKey); break;          // Transition to level 2
                case 'level2': this.levelKey = 'level3'; this.transitionToLevel(this.levelKey); break;          // Transition to level 3
                case 'level3': this.input.setDefaultCursor('default'); this.endGame(); break;                   // Transition to Game Over scene          
                default: break;                                                                                 // Handle unknown level keys
            }
        });
    }

    endGame() {
        this.destroyLevel();                                                                                    // Clean up the current level                    
        this.musicManager.fadeOutAndStop(500);                                                                  // Pause the music
        this.time.delayedCall(500, () => {                                                                      // Delay to allow music fade out
            const score = this.uiManager.score;                                                                 // Get final score
            const elapsed = this.uiManager.elapsed;                                                             // Get elapsed time
            saveHighScore(score, elapsed);                                                                      // Save high score if it's a new record
            this.scene.start('GameOver', { score, elapsed });                                                   // Transition to Game Over scene with score and time data
        });
    }

    // PLAYER INPUT ---------------------------------------------------------------------------------------------------------------------------------------------------------------------

    handlePlayerInput() {
        if (Phaser.Input.Keyboard.JustDown(this.inputManager.keyP)                                              // P key
            || Phaser.Input.Keyboard.JustDown(this.inputManager.keyESC))                                        // ESC key
            this.pauseGame();                                                                                   // Pause the game
        if (this.player.disableMovement) return;                                                                // prevent movement if canMove is false
        if (                                                                                                    // Jump input
            Phaser.Input.Keyboard.JustDown(this.inputManager.cursors.up) ||                                     // Up arrow
            Phaser.Input.Keyboard.JustDown(this.inputManager.keySPACE) ||                                       // Space bar
            Phaser.Input.Keyboard.JustDown(this.inputManager.keyW)                                              // W key
        ) this.player.jump();                                                                                   // Make the player jump
        if (this.inputManager.cursors.left.isDown || this.inputManager.keyA.isDown)                             // Left arrow or A key
        { this.player.move(true); this.hasMovementInput = true; }                                               // Move player left
        else if (this.inputManager.cursors.right.isDown || this.inputManager.keyD.isDown)                       // Right arrow or D key
        { this.player.move(false); this.hasMovementInput = true; }                                              // Move player right
        else { this.player.idle(); this.hasMovementInput = false; }                                             // No horizontal input, Player idle
        if (Phaser.Input.Keyboard.JustDown(this.inputManager.keyShift)                                          // Shift or Z key for tailwhip
            || Phaser.Input.Keyboard.JustDown(this.inputManager.keyZ)) this.player.tailwhip();
        if (Phaser.Input.Keyboard.JustDown(this.inputManager.keyE)                                              // E key  or X key for glide spin
            || Phaser.Input.Keyboard.JustDown(this.inputManager.keyX)) this.player.glideSpin();
    }

    pointerLeftPressed() { if (!this.player.disableMovement) this.player.tailwhip(); }                          // Left click for tailwhip
    pointerRightPressed() { if (!this.player.disableMovement) this.player.glideSpin(); }                        // Right click for glide spin

    // PAUSE/UNPAUSE GAME --------------------------------------------------------------------------------------------------------------------------------------------------------------

    pauseGame() {
        if (this.scene.isPaused()) return;                                                                      // Prevent double-pause
        this.musicManager.pauseMusic();                                                                         // Pause music
        this.scene.launch('Pause');                                                                             // Launch Pause scene
        this.input.setDefaultCursor('default');                                                                 // Show the default cursor
        this.scene.pause();                                                                                     // Pause Game scene
    }

    unpauseGame() {
        this.scene.resume();                                                                                    // Resume Game scene
        this.musicManager.resumeMusic();                                                                        // Resume music
        this.input.setDefaultCursor('none');                                                                    // Hide the default cursor
    }

    // SETUP CAMERA ---------------------------------------------------------------------------------------------------------------------------------------------------------------------

    setupCamera() {
        const cam = this.cameras.main;                                                                          // get main camera
        cam.setDeadzone(cam.width / 4, 0);                                                                      // Set deadzone to center quarter width and full height
        cam.roundPixels = true;                                                                                 // Prevent sub-pixel rendering to avoid blurriness
    }

    // SPAWN OBJECTS --------------------------------------------------------------------------------------------------------------------------------------------------------------------

    spawnPlayer(x, y) {
        if (!this.player) {                                                                                     // If player doesn't exist, create a new one
            this.player = new Player(this, x, y).setDepth(10);                                                  // Spawn player and set depth
            this.player.setPipeline('Light2D');                                                                 // Enable lighting effects on the player
            const playerDamageBox = new DamageBox(this, this.player);                                           // create damage box for player
            this.player.setDamageBox(playerDamageBox);                                                          // assign damage box to player
            this.uiManager.initHealthDisplay();                                                                 // Initialise health display in UI
        }
        this.player.hitbox.setPosition(x, y);                                                                   // Set player hitbox position to spawn point
        this.player.checkpoint = { x: x, y: y };                                                                // Set player's checkpoint to spawn point
        this.uiManager.updateHealth(this.player.health);                                                        // Update health display in UI
        this.cameras.main.stopFollow();                                                                         // Temporarily stop camera from following player
        this.cameras.main.centerOn(x, y);                                                                       // Center camera on player spawn point
        this.time.delayedCall(100, () => this.cameras.main.startFollow(this.player, false, 0.08, 0.08));        // Make the camera follow the player smoothly
    }

    createMountains() {
        const scrollFactor = 0.15;                                                                              // Parallax scroll factor for mountains
        const imageHeight = this.textures.get('mountains').getSourceImage().height;                             // Get the height of the mountain image
        const initM = this.add.image(0, imageHeight + 32, 'mountains')                                          // initial mountain
            .setOrigin(0, 1).setDepth(0).setScrollFactor(scrollFactor);                                         // Position at bottom-left corner
        const M = this.add.image(initM.displayWidth, initM.y, 'mountains')                                      // next mountain
            .setOrigin(0, 1).setDepth(0).setScrollFactor(scrollFactor);                                         // Position to the right of the initial mountain
        this.mountains.addMultiple([initM, M]);                                                                 // Add mountains to the mountains group
    }

    addLights() {
        this.lights.enable();                                                                                   // Enable Lights Manager
        this.currentAmbientColour = this.daylightAmbientColour;                                                 // Set initial ambient light color to daylight
        const x = this.player.checkpoint.x;                                                                     // Get checkpoint x position
        const y = this.player.checkpoint.y;                                                                     // Get checkpoint y position
        const tile = this.groundInsideLayer.getTileAtWorldXY(x, y);                                             // Get tile at checkpoint position
        if (tile && tile.properties && tile.properties.overlaps)                                                // Check if tile has 'overlaps' property
            this.currentAmbientColour = this.nightAmbientColour;                                                // Set ambient light color to nighttime if overlapping
        this.lights.setAmbientColor(this.currentAmbientColour);                                                 // Set ambient light color
        this.lights.addLight(this.cameras.main.x, 0, 3000)                                                      // Add a global light to simulate sunlight
            .setColor(0xFFFACD)                                                                                 // Light color
            .setIntensity(1.2)                                                                                  // Simulated sunlight
            .setScrollFactor(1, 0);                                                                             // Make the light follow the camera
        const lightPoints = this.map.filterObjects("Objects", obj => obj.name === "lightPoint");
        lightPoints.forEach(point => {
            const intensity = point.properties?.find(prop => prop.name === 'intensity')?.value || 1.5;
            const flicker = point.properties?.find(prop => prop.name === 'flicker')?.value || false;
            const light = this.lights.addLight(point.x, point.y, 200)                                           // Light position and radius
                .setColor(0xFFD580)                                                                             // Warm light color
                .setIntensity(intensity);                                                                       // Random brightness of the light
            if (flicker)
                this.tweens.add({
                    targets: light,                                                                             // Animate the Phaser Light object
                    intensity: { from: intensity, to: intensity * 1.3 },                                        // Flicker intensity between 1.5 and 2
                    radius: { from: 200, to: 250 },                                                             // Flicker radius between 200 and 250
                    duration: 1500,                                                                             // Duration of one flicker cycle
                    yoyo: true,                                                                                 // Flicker back and forth
                    repeat: -1                                                                                  // Repeat indefinitely
                });
        });
    }

    spawnSigns() {
        const signPoints = this.map.filterObjects("Objects", obj => obj.name === "signPoint");                  // Find all sign objects in the Tiled map
        signPoints.forEach(signPoint => {                                                                       // Iterate through each signPoint and create a sign with text
            const textProperty = signPoint.properties.find(prop => prop.name === 'text');                       // Get the text property
            const textSizeProperty = signPoint.properties.find(prop => prop.name === 'size');                   // Get the text size property
            const textWrapProperty = signPoint.properties.find(prop => prop.name === 'wrapWidth')               // Get the text wrap width property
                || { value: 128 };                                                                              // Default wrap width if not specified
            const signText = this.add.text(signPoint.x, signPoint.y, textProperty.value)                        // Create text object at sign position
                .setFontFamily('Impact')                                                                        // Set font family
                .setFontSize(`${textSizeProperty.value}px`)                                                     // Set font size
                .setColor('black')                                                                              // Set text color
                .setAlign('center')                                                                             // Set text alignment
                .setWordWrapWidth(textWrapProperty.value)                                                       // Set word wrap width
                .setLineSpacing(0)                                                                              // Set line spacing
                .setOrigin(0.5)                                                                                 // Center horizontally, align bottom
                .setDepth(4);                                                                                   // Set depth above ground layer
            this.signs.add(signText);                                                                           // Add sign text to the signs group
        });
    }

    spawnPoles() {
        const polePoints = this.map.filterObjects("Objects", obj => obj.name === "polePoint");                  // Find all pole spawn points
        polePoints.forEach(polePoint =>                                                                         // Iterate through each polePoint and create a pole at its position
            this.poles.create(polePoint.x, polePoint.y, 'pole').setScale(2).refreshBody().setDepth(4));         // Create pole sprite, scale it, refresh body for physics, and set depth
    }

    spawnCrates() {
        const cratePoints = this.map.filterObjects("Objects", obj =>                                            // Find all crate points (small and large)
            obj.name === "cratePointSmall"                                                                      // small crate
            || obj.name === "cratePointTall"                                                                    // tall crate
            || obj.name === "cratePointLarge"                                                                   // large crate
        );
        const crateScaleByName = {                                                                              // Define scale for each crate type
            cratePointSmall: new Phaser.Math.Vector2(1, 1),                                                     // small crate 
            cratePointTall: new Phaser.Math.Vector2(1, 2),                                                      // tall crate
            cratePointLarge: new Phaser.Math.Vector2(2, 2),                                                     // large crate
        };
        cratePoints.forEach(cratePoint => {
            const scale = crateScaleByName[cratePoint.name];                                                    // Get scale based on crate type
            this.crates.add(new Crate(this, cratePoint.x, cratePoint.y, scale));                                // Add the crate to the crates group
        });
    }

    spawnWheels() {
        const wheelPoints = this.map.filterObjects("Objects", obj => obj.name === "WheelPoint");                // Find all wheel points based on their names
        const duration = 10000;                                                                                 // Duration of one full rotation in milliseconds
        wheelPoints.forEach(wheelPoint => {                                                                     // Add wheels to the group
            const ropeAngle = wheelPoint.properties.find(prop => prop.name === 'angle').value;                  // Get rope angle from properties or default to 0
            const wheel = new Wheel(this, wheelPoint.x, wheelPoint.y, duration, ropeAngle);                     // Create wheel instance
            this.wheels.add(wheel);                                                                             // Add the wheel to the wheels group
            const platformOffset = wheel.displayWidth / 2 - 32;                                                 // Distance from wheel center to platform center
            this.spawnWheelPlatform(wheelPoint.x, wheelPoint.y - platformOffset, wheelPoint, duration);         // Top platform
            this.spawnWheelPlatform(wheelPoint.x, wheelPoint.y + platformOffset, wheelPoint, duration);         // Bottom platform
            this.spawnWheelPlatform(wheelPoint.x - platformOffset, wheelPoint.y, wheelPoint, duration);         // Left platform
            this.spawnWheelPlatform(wheelPoint.x + platformOffset, wheelPoint.y, wheelPoint, duration);         // Right platform
        });
    }

    spawnWheelPlatform(posX, posY, wheelPos, duration) {
        this.wheelPlatforms.add(new WheelPlatform(this, posX, posY, wheelPos, duration));                       // Add platform to the wheel platforms group
    }

    spawnGeysers() {
        const geyserPoints = this.map.filterObjects("Objects", obj => obj.name === "geyserPoint");              // Find all geyser points based on their names
        geyserPoints.forEach(geyserPoint => {                                                                   // Iterate over each geyser point
            const gustAmount = geyserPoint.properties.find(prop => prop.name === 'gustAmount').value;           // Get gust amount from properties
            this.geysers.add(new Geyser(this, geyserPoint.x, geyserPoint.y, gustAmount));                       // Add geyser base to the group
        });
    }

    spawnTeleporters() {
        const tpSenders = this.map.filterObjects("Objects", obj => obj.name === "TPSender");                    // Find all teleporter points based on their names
        tpSenders.forEach(tpSender => {                                                                         // Add teleporters to the group
            const channel = tpSender.properties.find(prop => prop.name === 'channel').value;                    // Get teleporter channel from properties
            this.tpSenders.add(new Teleporter(this, tpSender.x, tpSender.y, channel));                          // Create teleporter sender at point and add to group
        });
        const tpReceivers = this.map.filterObjects("Objects", obj => obj.name === "TPReceiver");                // Find all teleporter points based on their names
        tpReceivers.forEach(tpReceiver => {                                                                     // Add teleporters to the group
            const receiver = this.add.image(tpReceiver.x, tpReceiver.y - 64, 'teleporterPad')                   // Create teleporter pad sprite at point
                .setOrigin(0.5, 0.5).setDepth(11);                                                              // Set origin to center and depth above player layer
            receiver.channel = tpReceiver.properties.find(prop => prop.name === 'channel').value;               // Get teleporter channel from properties
            this.tpReceivers.add(receiver);                                                                     // Add teleporter to the group
        });
    }

    spawnRings() {
        const ringPoints = this.map.filterObjects("Objects", obj => obj.name === "ringPoint");                  // Find all ring points based on their names
        ringPoints.forEach(ringPoint => {                                                                       // Iterate over each ring point
            const ringRotation = ringPoint.properties.find(prop => prop.name === 'rotation').value;             // Get rotation from properties
            const ringScale = ringPoint.properties.find(prop => prop.name === 'scale').value;                   // Get scale from properties
            this.rings.add(new Ring(this, ringPoint.x, ringPoint.y, ringRotation, ringScale));                  // Add ring to the group
        });
    }

    spawnDNA(x, y) {
        this.dnas.add(new DNA(this, x, y));                                                                     // add to the group
    }

    spawnMunchers() {
        const muncherPoints = this.map.filterObjects("Objects", obj => obj.name === "muncherPoint");            // Find all muncher spawn points
        muncherPoints.forEach(muncherPoint => {                                                                 // Iterate through each muncherPoint and create a Muncher at its position
            const chaseDistance = muncherPoint.properties?.find(prop => prop.name === 'chaseDistance')?.value;  // Get patrol distance from properties or default to 0
            const muncher = new Muncher(this, muncherPoint.x, muncherPoint.y, chaseDistance);                   // create muncher at point
            this.munchers.add(muncher);                                                                         // add to the group
            const damageBox = new DamageBox(this, muncher);                                                     // create damage box for muncher
            muncher.setDamageBox(damageBox);                                                                    // assign damage box to muncher
            muncher.body.setImmovable(true);                                                                    // make muncher immovable
        });
    }

    spawnGlizzards() {
        const glizzardPoints = this.map.filterObjects("Objects", obj => obj.name === "glizzardPoint");              // Find all glizzard spawn points
        glizzardPoints.forEach(glizzardPoint => {                                                                   // Iterate through each glizzardPoint and create a Glizzard at its position
            const patrolDistance = glizzardPoint.properties?.find(prop => prop.name === 'patrolDistance')?.value;   // Get patrol distance from properties or default to 0
            const detectionRange = glizzardPoint.properties?.find(prop => prop.name === 'detectionRange')?.value;   // Get detection range from properties or default to 300
            const glizzard = new Glizzard(this, glizzardPoint.x, glizzardPoint.y, patrolDistance, detectionRange);  // create glizzard at point
            this.glizzards.add(glizzard);                                                                           // add to the group
        });
    }

    spawnClouds() {
        const CloudYMinPoint = this.map.filterObjects("Objects", obj => obj.name === "CloudYMin")[0];               // Get cloud Y min point 
        const CloudYMaxPoint = this.map.filterObjects("Objects", obj => obj.name === "CloudYMax")[0];               // Get cloud Y max point
        if (!this.cloudSpawner) this.cloudSpawner = new CloudSpawner(this);                                         // Create a CloudSpawner instance
        this.cloudSpawner.spawnClouds(1, CloudYMinPoint.y, CloudYMaxPoint.y);                                       // Spawn clouds in the background with depth 1
    }

    handleDamageBoxOverlap(parent, damageBox) {                                                                     // parent is the entity that owns the damage box
        if (parent === this.player) {                                                                               // IF THE PLAYER IS THE ATTACKER
            this.physics.add.overlap(damageBox, this.munchers, (_, muncher) => {                                    // Check overlap with munchers
                muncher.death(muncher.x < this.player.x ? -1 : 1);                                                  // Muncher dies, knockback direction based on player position
            });
            this.physics.add.overlap(damageBox, this.glizzards, (_, glizzard) => {                                  // Check overlap with glizzards
                glizzard.death(glizzard.x < this.player.x ? -1 : 1);                                                // Glizzard dies, knockback direction based on player position
            });
        } else {
            this.physics.add.overlap(damageBox, this.player.hitbox, (damageBox, _) => {                             // Check overlap with player
                this.player.damagePlayer(damageBox.damage, damageBox);                                              // Damage the player
            });
        }
    }

    // HELPER METHODS -------------------------------------------------------------------------------------------------------------------------------------------------------------------

    tweenAmbientLight(targetColour) {
        if (this.currentAmbientColour === targetColour) return;                                                     // No need to tween if already at target color
        const start = Phaser.Display.Color.ValueToColor(this.currentAmbientColour);                                 // Current ambient color
        const end = Phaser.Display.Color.ValueToColor(targetColour);                                                // Target ambient color
        const colorObj = { t: 0 };                                                                                  // Tweened value 0 - 1
        this.tweens.add({
            targets: colorObj,                                                                                      // Tween the t value from 0 to 1
            t: 1,                                                                                                   // Target value
            duration: 500,                                                                                          // Duration of the tween
            ease: 'Linear',                                                                                         // Easing function
            onUpdate: () => {
                const colour = Phaser.Display.Color.Interpolate.ColorWithColor(start, end, 1, colorObj.t);          // Interpolate between start and end colors
                const hex = Phaser.Display.Color.GetColor(colour.r, colour.g, colour.b);                            // Convert to hex
                this.lights.setAmbientColor(hex);                                                                   // Update ambient color
                this.currentAmbientColour = hex;                                                                    // Update current ambient color

            },
            onComplete: () => {
                this.lights.setAmbientColor(targetColour);                                                          // Final set to target color
                this.currentAmbientColour = targetColour;                                                           // Update current ambient color
            }
        });
    }

    destroyGroup(group) {                                                                                           // Utility method to destroy all children in a group
        if (group && group.children) {                                                                              // IF THE GROUP EXISTS AND HAS CHILDREN
            group.children.each(child => {                                                                          // iterate over each child
                if (child.ringBehind) child.ringBehind.destroy();                                                   // IF THE CHILD HAS A LINKED BEHIND RING, destroy it
                child.destroy();                                                                                    // destroy the child
            });
            group.clear(true, true);                                                                                // clear the group
        }
    }

    transitionToLevel(levelKey) {
        this.destroyLevel();                                                                                        // Clean up the current level
        this.createLevel(levelKey);                                                                                 // Load the new level
    }
}