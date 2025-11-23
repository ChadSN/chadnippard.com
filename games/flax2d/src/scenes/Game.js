import { Player } from '../../gameObjects/Player.js';
import { Glizzard } from '../../gameObjects/Glizzard.js';
import { Muncher } from '../../gameObjects/Muncher.js';
import { DNA } from '../../gameObjects/DNA.js';
import { Crate } from '../../gameObjects/Crate.js';
import { InputManager } from '../utils/InputManager.js';
import { UIManager } from '../utils/UIManager.js';
import { DamageBox } from '../../gameObjects/damageBox.js';
import { CloudSpawner } from '../utils/CloudSpawner.js';
import { musicManager } from '../utils/musicManager.js';

export class Game extends Phaser.Scene {

    constructor() {
        super('Game');
        this.worldWidth;                                                                                        // Set world width
        this.worldHeight;                                                                                       // Set world height
        this.levelKey = 'level1';                                                                               // Level key for loading specific levels
        this.map = null;                                                                                        // Tilemap reference
        this.groundLayer = null;                                                                                // Layer for ground areas
        this.groundInsideLayer = null;                                                                          // Layer for ground inside areas
        this.objectLayer = null;                                                                                // Layer for objects
        this.objectLayer2 = null;                                                                               // Layer for objects layer 2
        this.objectLayerTop = null;                                                                             // Layer for top objects
        this.isOverlappingGroundInsideLayer = false;                                                            // Flag to track overlap state
        this.currentAmbientColour = 0xCCCCCC;                                                                   // Current ambient light color set to a neutral color
        this.daylightAmbientColour = this.currentAmbientColour;                                                 // Daylight color
        this.nightAmbientColour = 0x555555;                                                                     // Nighttime color
        this.munchers = [];                                                                                     // Array to hold Muncher enemies
        this.glizzards = [];                                                                                    // Array to hold Glizzard enemies
        this.dnas = [];                                                                                         // Array to hold DNA collectibles
        this.crates = [];                                                                                       // Array to hold dynamic crates
        this.poles = [];                                                                                        // Array to hold Poles
        this.signs = [];                                                                                        // Array to hold Signs
        this.wheels = [];                                                                                       // Array to hold Wheels
        this.wheelPlatforms = [];                                                                               // Array to hold Wheel Platforms
        this.tpSenders = [];                                                                                    // Array to hold Teleporters
        this.tpReceivers = [];                                                                                  // Array to hold Teleporters
        this.levelExiting = false;                                                                              // Flag to indicate if the level is exiting
        this.levelReady = false;                                                                                // Flag to indicate if the level is ready
        this.musicManager = new musicManager(this);                                                             // Music manager instance
        this.hasMovementInput = false;                                                                          // Track if there was movement input in the previous frame
        this.playerLastVel = { x: 0, y: 0 };                                                                    // Store the player's last velocity
    }

    create() {
        this.physics.world.TILE_BIAS = 64;                                                                      // Increase the tile bias to prevent tunneling
        this.background = this.add.image(960, 540, 'sky').setDepth(0).setScrollFactor(0);                       // Add the background image at the center of the game canvas
        this.setupCamera();                                                                                     // Setup camera to follow the player
        this.inputManager = new InputManager(this);                                                             // Create an instance of InputManager
        this.uiManager = new UIManager(this);                                                                   // Create UI Manager
        this.createLevel('level1');                                                                             // Create level 1
        this.musicManager.setMusic('level1Music');                                                              // Load and set level 1 music        
        this.caveAmbience = this.sound.add('caveAmbience', { loop: true, volume: 0.05 });                       // Load cave ambience sound
        //this.relayer();                                                                                       // Adjust layer depths
    }

    update(time, delta) {
        this.handlePlayerInput();                                                                               // Handle player input
        this.updateWheelPlatforms();                                                                            // Update wheel platform positions
        this.player.lastVel = this.player.hitbox.body.velocity.clone();                                         // Store the player's last velocity

    }

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
        // COLLISIONS SETUP FOR PLAYER WITH LAYERS           
        this.physics.add.collider(this.player.hitbox, this.groundLayer);
        this.physics.add.collider(this.player.hitbox, this.objectLayerTop, null, (player, tile) => {            // Custom collision callback for one-way platforms
            const body = player.body;                                                                           // player's hitbox physics body
            if (tile && tile.properties && tile.properties.death) {                                             // Check if the tile has the 'death' property
                this.player.die();                                                                              // Trigger player death on death tiles
                return false;                                                                                   // Prevent further collision handling
            }
            if (body.velocity.y <= 0) return false;                                                             // Pass-through when moving up (jumping)
            const prevBottom = body.prev.y + body.height;                                                       // previous bottom edge
            const tileTop = tile.getTop();                                                                      // world Y of tile top
            return prevBottom <= tileTop;                                                                       // Collide only if the player's bottom was above the tile's top in the previous frame
        });
        this.addLights();                                                                                       // Add lighting effects
        this.spawnSigns();                                                                                      // Spawn signs with text
        this.spawnPoles();                                                                                      // Spawn poles for swinging
        this.spawnCrates();                                                                                     // Spawn crates
        this.spawnWheels();                                                                                     // Spawn wheels
        this.spawnTeleporters();                                                                                // Spawn teleporters
        this.spawnGlizzards();                                                                                  // Spawn glizzard enemies
        this.spawnMunchers();                                                                                   // Spawn muncher enemies
        this.spawnDNAs();                                                                                       // Spawn DNA collectables
        this.spawnClouds();                                                                                     // Spawn background clouds
        // COLLISIONS SETUP FOR PLAYER WITH GROUND INSIDE LAYER
        this.physics.add.overlap(this.player.hitbox, this.groundInsideLayer, (_, tile) => {
            if (tile && tile.properties.overlaps) {                                                             // Check if the tile has the 'overlaps' property
                if (!this.isOverlappingGroundInsideLayer) {                                                     // Only trigger once when starting to overlap
                    this.isOverlappingGroundInsideLayer = true;                                                 // Set flag to true
                    this.tweenAmbientLight(this.nightAmbientColour);                                            // Dim light
                    if (!this.caveAmbience.isPlaying) {                                                         // Play cave ambience if not already playing
                        this.caveAmbience.stop();                                                               // Ensure it's stopped before playing again
                        this.caveAmbience.play();                                                               // Play cave ambience
                    }
                }
            } else {
                if (this.isOverlappingGroundInsideLayer) {                                                      // Only trigger once when stopping overlap
                    this.isOverlappingGroundInsideLayer = false;                                                // Set flag to false
                    this.tweenAmbientLight(this.daylightAmbientColour);                                         // Full white light
                    if (this.caveAmbience.isPlaying) this.caveAmbience.stop();                                  // Stop cave ambience
                }
            }
        });
        this.physics.add.overlap(this.player.hitbox, this.objectLayer, (_, tile) => {                           // Check overlap with object layer
            if (tile && tile.properties.exit && !this.levelExiting) {                                           // Check if the tile has the 'exit' property
                this.levelExiting = true;                                                                       // Prevent multiple triggers
                this.levelReady = false;                                                                        // Mark level as not ready during transition

                this.cameras.main.fadeOut(1000, 255, 255, 255).once('camerafadeoutcomplete', () => {            // Fade out the camera over 1 second once
                    switch (this.levelKey) {                                                                    // Determine the next level based on current level key
                        case 'level1': this.levelKey = 'level2'; this.transitionToLevel(this.levelKey); break;  // Transition to level 2
                        case 'level2': this.levelKey = 'level3'; this.transitionToLevel(this.levelKey); break;  // Transition to level 3
                        case 'level3': this.levelKey = 'GameOver'; this.scene.start('GameOver'); break;         // Transition to Game Over scene
                        default: console.error('Unknown level key:', this.levelKey); break;                     // Handle unknown level keys
                    }
                });
            }
            if (tile && tile.properties && tile.properties.spawnPoint) {                                        // Check if the tile has the 'spawnPoint' property
                if (
                    this.player.checkpoint.x !== tile.getCenterX()                                              // New checkpoint X
                    || this.player.checkpoint.y !== tile.getBottom()                                            // New checkpoint Y
                ) this.player.setCheckpoint(tile.getCenterX(), tile.getBottom());                               // Set new checkpoint at tile center
            }
        });

        this.cameras.main.fadeIn(500, 255, 255, 255).once('camerafadeincomplete', () => {                       // Fade in the camera over 0.5 seconds once
            this.uiManager.startTimerEvent(this.uiManager.elapsed);                                             // Start the level timer                                   
        });
        this.levelReady = true;                                                                                 // Mark level as ready after creation
    }

    transitionToLevel(levelKey) {
        this.destroyLevel();                                                                                    // Clean up the current level
        this.createLevel(levelKey);                                                                             // Load the new level
    }

    destroyLevel() {
        this.physics.world.colliders.getActive().forEach(c => c.destroy());                                     // Destroy all active colliders
        this.destroyGroup(this.munchers);                                                                       // Destroy muncher enemies
        this.destroyGroup(this.glizzards);                                                                      // Destroy glizzard enemies
        this.destroyGroup(this.dnas);                                                                           // Destroy DNA collectables
        this.destroyGroup(this.crates);                                                                         // Destroy crates
        this.destroyGroup(this.poles);                                                                          // Destroy poles
        this.destroyGroup(this.signs);                                                                          // Destroy signs
        this.destroyGroup(this.wheels);                                                                         // Destroy wheels
        this.destroyGroup(this.wheelPlatforms);                                                                 // Destroy wheel platforms
        this.destroyGroup(this.tpSenders);                                                                      // Destroy teleporter senders
        this.destroyGroup(this.tpReceivers);                                                                    // Destroy teleporter receivers

        if (this.player) this.player.setTilemapAndLayer(null, null);                                            // Clear player's tilemap and layer references
        if (this.lights) this.lights.destroy();                                                                 // Destroy the Lights Manager
        if (this.map) {                                                                                         // Check if map exists before destroying
            this.groundLayer = null;                                                                            // Clear ground layer reference
            this.groundInsideLayer = null;                                                                      // Clear ground inside layer reference
            this.objectLayer = null;                                                                            // Clear object layer reference
            this.objectLayer2 = null;                                                                           // Clear object layer 2 reference
            this.objectLayerTop = null;                                                                         // Clear object layer top reference
            this.map.destroy();                                                                                 // Destroy the tilemap
        }
        if (this.level1Music) this.level1Music.stop();                                                          // Stop level music
        if (this.caveAmbience) this.caveAmbience.stop();                                                        // Stop cave ambience
        this.tweens.killAll();                                                                                  // Stop all tweens
    }

    destroyGroup(group) {
        if (group && group.children) {                                                                          // Check if group and its children exist
            group.children.each(child => child.destroy());                                                      // Destroy each child in the group
            group.clear(true, true);                                                                            // Clear the group
        }
    }

    spawnTeleporters() {
        this.tpSenders = this.physics.add.group({ allowGravity: false });                                       // Create a group for teleporters
        this.tpReceivers = this.add.group();                                                                    // Create a group for teleporters
        const tpSenders = this.map.filterObjects("Objects", obj => obj.name === "TPSender");                    // Find all teleporter points based on their names
        tpSenders.forEach(tpSender => {                                                                         // Add teleporters to the group
            this.add.image(tpSender.x, tpSender.y - 64, 'teleporterPad')                                        // Create teleporter pad sprite at point
                .setDepth(11)                                                                                   // Set depth above player layer
                .setPipeline('Light2D');                                                                        // Enable lighting on teleporter pad
            const teleporter = this.add.sprite(tpSender.x, tpSender.y - 64, 'teleporter')                       // Create teleporter sprite at point
                .setDepth(11);                                                                                  // Set depth above player layer
            if (!this.anims.exists('teleporterAnim')) {                                                         // Check if animation already exists
                this.anims.create({                                                                             // Create teleporter animation
                    key: 'teleporterAnim',
                    frames: this.anims.generateFrameNumbers('teleporter', { start: 0, end: 7 }),
                    frameRate: 16,
                    repeat: -1
                });
            }
            teleporter.play('teleporterAnim');                                                                      // Play teleporter animation
            teleporter.channel = tpSender.properties.find(prop => prop.name === 'channel').value;                   // Get teleporter channel from properties
            this.tpSenders.add(teleporter);                                                                         // Add teleporter to the group
        });
        const tpReceivers = this.map.filterObjects("Objects", obj => obj.name === "TPReceiver");                    // Find all teleporter points based on their names
        tpReceivers.forEach(tpReceiver => {                                                                         // Add teleporters to the group
            const receiver = this.add.image(tpReceiver.x, tpReceiver.y - 64, 'teleporterPad')                       // Create teleporter pad sprite at point
                .setOrigin(0.5, 0.5)                                                                                // Set origin to center
                .setDepth(11);                                                                                      // Set depth above ground layer
            receiver.channel = tpReceiver.properties.find(prop => prop.name === 'channel').value;                   // Get teleporter channel from properties
            this.tpReceivers.add(receiver);                                                                         // Add teleporter to the group
        });
        this.physics.add.overlap(this.player.hitbox, this.tpSenders, (player, tpSender) => {
            if (Math.abs(player.x - tpSender.x) > 8) return;                                                        // Prevent teleporting when player is not centered on the teleporter
            const channel = tpSender.channel;                                                                       // Get the channel of the sender
            const targetReceiver = this.tpReceivers.getChildren().find(receiver => receiver.channel === channel);   // Find the matching receiver by channel
            if (!targetReceiver) return;                                                                            // Safety check
            this.player.setCheckpoint(targetReceiver.x, targetReceiver.y);                                          // Set checkpoint above the receiver
            player.setPosition(this.player.checkpoint.x, this.player.checkpoint.y);                                 // Move player to checkpoint
        });
    }

    spawnCrates() {
        this.crates = this.physics.add.group({ runChildUpdate: true });                                         // dynamic group
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
            const depth = 4;                                                                                    // Set depth above ground layer
            const crate = new Crate(this, cratePoint.x, cratePoint.y, scale, depth);                            // Create crate instance
            this.crates.add(crate);                                                                             // Add the crate to the crates group
        });
        this.physics.add.collider(this.groundLayer, this.crates);                                               // Enable collision between ground layer and crates
        this.physics.add.collider(this.crates, this.crates, null, (crateA, crateB) => !crateA.broken && !crateB.broken);

        this.physics.add.overlap(this.player.damageBox, this.crates, (_, crate) => crate.break());              // Enable overlap between player's damage box and crates to break them
        this.physics.add.collider(this.player.hitbox, this.crates,
            (hitbox, crate) => {
                crate.body.setVelocity(0);                                                                      // Stop crate movement on player collision
                if (hitbox.body.bottom >= crate.body.top + 8) {                                                 // IF COLLIDING FROM TOP
                    if (hitbox.x < crate.x) hitbox.body.x = hitbox.body.prev.x - 8;                             // IF COLLIDING FROM SIDE, move player to previous x                                                               // Prevent player from being pushed horizontally by crate
                    if (hitbox.x > crate.x) hitbox.body.x = hitbox.body.prev.x + 8;                             // IF COLLIDING FROM SIDE, move player to previous x
                }
            },
            (_, crate) => !crate.broken
        );
    }

    spawnWheels() {
        this.wheels = this.add.group();                                                                         // Create a group for wheels
        this.wheelPlatforms = this.physics.add.group();                                                         // Create a physics group for wheel platforms
        const wheelPoints = this.map.filterObjects("Objects", obj => obj.name === "WheelPoint");                // Find all wheel points based on their names
        const duration = 10000;                                                                                 // Duration of one full rotation in milliseconds
        wheelPoints.forEach(wheelPoint => {                                                                     // Add wheels to the group
            const ropeAngle = wheelPoint.properties.find(prop => prop.name === 'angle').value;                  // Get rope angle from properties or default to 0
            const wheel = this.add.sprite(wheelPoint.x, wheelPoint.y, 'wheel')                                  // Create wheel sprite at point
                .setOrigin(0.5, 0.5)                                                                            // Set origin to center
                .setPipeline('Light2D')                                                                         // Enable lighting effects on the wheel
                .setDepth(4);                                                                                   // Set depth above ground layer
            const rope = this.add.sprite(wheelPoint.x, wheelPoint.y, 'rope_onWheel')                            // Create rope sprite at point
                .setAngle(ropeAngle)                                                                            // Rotate the rope sprite
                .setDepth(4);                                                                                   // Set depth above ground layer
            this.wheels.add(wheel);                                                                             // Add wheel to the wheels group
            this.wheels.add(rope);                                                                              // Add rope to the wheels group
            this.tweens.add({                                                                                   // Create a tween to rotate the wheel
                targets: wheel,                                                                                 // Target the wheel sprite
                angle: 360,                                                                                     // Rotate to 360 degrees
                duration: duration,                                                                             // Duration of one full rotation
                ease: 'Linear',                                                                                 // Linear easing for constant speed
                repeat: -1                                                                                      // Repeat indefinitely
            });
            const platformOffset = wheel.displayWidth / 2 - 32;                                                 // Distance from wheel center to platform center
            this.spawnWheelPlatform(wheelPoint.x, wheelPoint.y - platformOffset, wheelPoint, duration);         // Top platform
            this.spawnWheelPlatform(wheelPoint.x, wheelPoint.y + platformOffset, wheelPoint, duration);         // Bottom platform
            this.spawnWheelPlatform(wheelPoint.x - platformOffset, wheelPoint.y, wheelPoint, duration);         // Left platform
            this.spawnWheelPlatform(wheelPoint.x + platformOffset, wheelPoint.y, wheelPoint, duration);         // Right platform
        });
        this.wheelPlatforms.getChildren().forEach(platform => {                                                 // Configure each wheel platform
            platform.body.setAllowGravity(false);                                                               // Disable gravity on the platform
            platform.body.setImmovable(true);                                                                   // Make the platform immovable
        });
    }

    spawnWheelPlatform(posX, posY, wheelPos, duration) {
        const wheelPlatform = this.physics.add.sprite(posX, posY, 'wheelPlatform')                              // Create platform sprite
            .setDepth(4)                                                                                        // Set depth above ground layer
            .setPipeline('Light2D');                                                                            // Enable lighting effects on the platform
        wheelPlatform.soundType = 'wood';                                                                       // Set sound type for footsteps
        this.wheelPlatforms.add(wheelPlatform);                                                                 // Add platform to the wheel platforms group
        const dx = posX - wheelPos.x;                                                                           // Calculate initial distance from wheel center
        const dy = posY - wheelPos.y;                                                                           // Calculate initial distance from wheel center
        wheelPlatform._orbit = {                                                                                // Store orbit parameters on the platform
            center: { x: wheelPos.x, y: wheelPos.y },                                                           // Center of the wheel
            radius: Math.sqrt(dx * dx + dy * dy),                                                               // Distance from center
            angle: Math.atan2(dy, dx),                                                                          // Current angle in radians
            speed: (2 * Math.PI) / (duration / 1000)                                                            // Radians per second
        };
        this.physics.add.collider(this.player.hitbox, wheelPlatform, (hitbox, platform) => {                    // Enable collision between player and wheel platform
            if (hitbox.body.blocked.down && hitbox.y <= platform.y - platform.displayHeight / 2) {              // Check if player is landing on top of the platform
                this.player.onPlatform = platform;                                                              // Set the player's onPlatform reference
            }
        });
    }

    updateWheelPlatforms() {
        this.wheelPlatforms.getChildren().forEach(platform => {
            if (platform._orbit) {                                                                              // Ensure the platform has orbit parameters
                const oldX = platform.x;                                                                        // Store old position
                const oldY = platform.y;                                                                        // Store old position
                platform._orbit.angle += platform._orbit.speed * (this.game.loop.delta / 1000);                 // Update angle based on speed and delta time
                const x = platform._orbit.center.x + platform._orbit.radius * Math.cos(platform._orbit.angle);  // Calculate new position
                const y = platform._orbit.center.y + platform._orbit.radius * Math.sin(platform._orbit.angle);  // Calculate new position
                platform.body.reset(x, y);                                                                      // Update platform position
                platform._deltaX = x - oldX;                                                                    // Calculate delta movement
                platform._deltaY = y - oldY;                                                                    // Calculate delta movement
            }
        });
        if (this.player.onPlatform) {                                                                           // If the player is on a platform
            this.player.hitbox.x += this.player.onPlatform._deltaX;                                             // Move player horizontally with platform
            this.player.hitbox.y += this.player.onPlatform._deltaY;                                             // Move player vertically with platform
            if (!this.player.hitbox.body.blocked.down)                                                          // If player is no longer on the platform
                this.player.onPlatform = null;                                                                  // Clear the onPlatform reference
        }
    }

    spawnSigns() {
        this.signs = this.add.group();                                                                          // Create a group for signs
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

    tweenAmbientLight(targetColour) {
        if (this.currentAmbientColour === targetColour) return;                                                 // No need to tween if already at target color
        const start = Phaser.Display.Color.ValueToColor(this.currentAmbientColour);                             // Current ambient color
        const end = Phaser.Display.Color.ValueToColor(targetColour);                                            // Target ambient color
        const colorObj = { t: 0 };                                                                              // Tweened value 0 - 1
        this.tweens.add({
            targets: colorObj,                                                                                  // Tween the t value from 0 to 1
            t: 1,                                                                                               // Target value
            duration: 500,                                                                                      // Duration of the tween
            ease: 'Linear',                                                                                     // Easing function
            onUpdate: () => {
                const colour = Phaser.Display.Color.Interpolate.ColorWithColor(start, end, 1, colorObj.t);      // Interpolate between start and end colors
                const hex = Phaser.Display.Color.GetColor(colour.r, colour.g, colour.b);                        // Convert to hex
                this.lights.setAmbientColor(hex);                                                               // Update ambient color
                this.currentAmbientColour = hex;                                                                // Update current ambient color

            },
            onComplete: () => {
                this.lights.setAmbientColor(targetColour);                                                      // Final set to target color
                this.currentAmbientColour = targetColour;                                                       // Update current ambient color
            }
        });
    }

    spawnClouds() {
        const CloudYMinPoint = this.map.filterObjects("Objects", obj => obj.name === "CloudYMin")[0];           // Get cloud Y min point 
        const CloudYMaxPoint = this.map.filterObjects("Objects", obj => obj.name === "CloudYMax")[0];           // Get cloud Y max point
        this.cloudSpawner = new CloudSpawner(this);                                                             // Create a CloudSpawner instance
        this.cloudSpawner.spawnClouds(1, CloudYMinPoint.y, CloudYMaxPoint.y);                                   // Spawn clouds in the background with depth 1
    }

    // Handle player input
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
    }

    pointerLeftPressed() {
        if (this.player.disableMovement) return;
        this.player.tailwhip();
    }

    pointerLeftReleased() {
    }

    pointerRightPressed() {
        if (this.player.disableMovement) return;
        this.player.glideSpin();
    }

    pointerRightReleased() {
    }

    pauseGame() {
        if (this.scene.isPaused()) return;                                                                      // Prevent double-pause
        this.musicManager.pauseMusic();                                                                         // Pause music
        this.scene.launch('Pause');                                                                             // Launch Pause scene
        this.scene.pause();                                                                                     // Pause Game scene
    }

    unpauseGame() {
        this.scene.resume();                                                                                    // Resume Game scene
        this.musicManager.resumeMusic();                                                                        // Resume music
    }

    // Add lighting effects to the scene    
    addLights() {
        this.lights.enable();                                                                                   // Enable Lights Manager
        this.lights.setAmbientColor(this.daylightAmbientColour);                                                // Set ambient light color for the scene
        this.lights.addLight(this.cameras.main.x, 0, 3000)                                                      // Light position and radius
            .setColor(0xFFFACD)                                                                                 // Light color
            .setIntensity(1.2)                                                                                  // Simulated sunlight
            .setScrollFactor(1, 0);                                                                             // Make the light follow the camera. Arg1: x scroll factor. 2: y scroll factor

        // Add flickering lights at designated light points             
        const lightPoints = this.map.filterObjects("Objects", obj => obj.name === "lightPoint");
        lightPoints.forEach(point => {
            // get 'intensity' property or default to 1.5
            const intensity = point.properties?.find(prop => prop.name === 'intensity')?.value || 1.5;
            const flicker = point.properties?.find(prop => prop.name === 'flicker')?.value || false;
            const light = this.lights.addLight(point.x, point.y, 200)                                           // Light position and radius
                .setColor(0xFFD580)                                                                             // Warm light color
                .setIntensity(intensity);                                                                       // Random brightness of the light
            if (flicker)
                this.tweens.add({
                    targets: light,                                                                                 // Animate the Phaser Light object
                    intensity: { from: intensity, to: intensity * 1.3 },                                                                // Flicker intensity between 1.5 and 2
                    radius: { from: 200, to: 250 },                                                                 // Flicker radius between 200 and 250
                    duration: 1500,                                                                                 // Duration of one flicker cycle
                    yoyo: true,                                                                                     // Flicker back and forth
                    repeat: -1                                                                                      // Repeat indefinitely
                });
        });
    }

    // Spawn the player character   
    spawnPlayer(x, y) {
        if (!this.player) {                                                                                     // If player doesn't exist, create a new one
            this.player = new Player(this, x, y).setDepth(10);                                                  // Spawn player and set depth
            this.player.setPipeline('Light2D');                                                                 // Enable lighting effects on the player
            const playerDamageBox = new DamageBox(this, this.player);                                           // create damage box for player
            this.player.setDamageBox(playerDamageBox);                                                          // assign damage box to player
            this.uiManager.initHealthDisplay();                                                                 // Initialise health display in UI
        }
        this.player.hitbox.setPosition(x, y);                                                                   // Set player hitbox position to spawn point
        this.cameras.main.startFollow(this.player, false, 0.08, 0.08);                                          // Make the camera follow the player smoothly
        this.player.setTilemapAndLayer(this.map, this.groundLayer, this.objectLayerTop);                        // Provide player with tilemap and layer references
        this.uiManager.updateHealth(this.player.health);                                                        // Update health display in UI
        this.player.checkpoint = { x: x, y: y };                                                                        // Set initial checkpoint
    }

    // Setup camera to follow the player                            
    setupCamera() {
        const cam = this.cameras.main;                                                                          // get main camera
        cam.setBounds(0, 0, this.worldWidth, this.worldHeight);                                                 // Set camera bounds to the size of the level
        cam.setDeadzone(cam.width / 4, 0);                                                                      // Set deadzone to center quarter width and full height
        this.cameras.main.roundPixels = true;                                                                   // Prevent sub-pixel rendering to avoid blurriness
    }

    // Spawn poles for swinging             
    spawnPoles() {
        this.poles = this.physics.add.staticGroup();                                                            // Create a static group for poles
        const polePoints = this.map.filterObjects("Objects", obj => obj.name === "polePoint");                  // Find all pole spawn points
        polePoints.forEach(polePoint => {                                                                       // Iterate through each polePoint and create a pole at its position
            const pole = this.poles.create(polePoint.x, polePoint.y, 'pole')                                    // create pole at point
                .setOrigin(0.5, 0.5)
                .setScale(2)
                .refreshBody()
                .setDepth(4);
        });
        this.physics.add.overlap(this.player.hitbox, this.poles, (_, pole) => {                                 // player overlaps pole
            this.player.poleSwing(pole);                                                                        // initiate pole swinging
        });
    }

    // Spawn DNA collectables               
    spawnDNAs() {
        this.dnas = this.physics.add.staticGroup();                                                             // Create a static group for DNAs
        const dnaPoints = this.map.filterObjects("Objects", obj => obj.name === "dnaPoint");                    // Find all DNA spawn points
        dnaPoints.forEach(dnaPoint => {                                                                         // Iterate through each dnaPoint and create a DNA at its position
            const dna = new DNA(this, dnaPoint.x, dnaPoint.y);                                                  // create dna at point
            this.dnas.add(dna).setDepth(4);                                                                     // add to the group
        });
        this.physics.add.overlap(this.player.hitbox, this.dnas, (_, dna) => {                                   // player collects dna
            this.player.collectDNA(dna);                                                                        // Handle DNA collection
        });
    }

    // Spawn muncher enemies    
    spawnMunchers() {
        this.munchers = this.physics.add.group({ runChildUpdate: true });                                       // Create a group for munchers
        const muncherPoints = this.map.filterObjects("Objects", obj => obj.name === "muncherPoint");            // Find all muncher spawn points
        muncherPoints.forEach(muncherPoint => {                                                                 // Iterate through each muncherPoint and create a Muncher at its position
            const muncher = new Muncher(this, muncherPoint.x, muncherPoint.y);                                  // create muncher at point
            this.munchers.add(muncher).setDepth(4);                                                                         // add to the group
            const damageBox = new DamageBox(this, muncher);                                                     // create damage box for muncher
            muncher.setDamageBox(damageBox);                                                                    // assign damage box to muncher
            muncher.body.setImmovable(true);                                                                             // make muncher immovable
        });
        this.physics.add.collider(this.munchers, this.groundLayer);                                             // munchers collide with ground layer
        this.physics.add.collider(this.player.hitbox, this.munchers, (player, muncher) => {                     // player collides with muncher
            const stomp = this.player.lastVel.y > 200 && player.body.touching.down;                              // check if player is falling fast enough to stomp
            if (!stomp) return;                                                                                 // if not a stomp, exit
            player.body.setVelocityY(-600);                                                                     // bounce the player up
            muncher.death();                                                                                    // destroy the muncher
        });
    }

    // Spawn glizzard enemies   
    spawnGlizzards() {
        this.glizzards = this.add.group({ runChildUpdate: true });                                                  // Create a group for glizzards
        const glizzardPoints = this.map.filterObjects("Objects", obj => obj.name === "glizzardPoint");              // Find all glizzard spawn points
        glizzardPoints.forEach(glizzardPoint => {                                                                   // Iterate through each glizzardPoint and create a Glizzard at its position
            const patrolDistance = glizzardPoint.properties?.find(prop => prop.name === 'patrolDistance')?.value;   // Get patrol distance from properties or default to 0
            const detectionRange = glizzardPoint.properties?.find(prop => prop.name === 'detectionRange')?.value;   // Get detection range from properties or default to 300
            const glizzard = new Glizzard(this, glizzardPoint.x, glizzardPoint.y, patrolDistance, detectionRange);  // create glizzard at point
            this.glizzards.add(glizzard).setDepth(4);                                                               // add to the group
        });
        this.physics.add.overlap(this.player.hitbox, this.glizzards, (player, glizzard) => {                        // player stomps glizzard
            if (player.y < glizzard.y - glizzard.height                                                             // IF PLAYER IS ABOVE GLIZZARD
                && this.player.lastVel.y >= 200) {                                                                  // AND IF PLAYER IS FALLING FAST ENOUGH
                player.body.setVelocityY(-600);                                                                     // bounce the player up
                glizzard.death();                                                                                   // destroy the glizzard
            }
        });
    }

    // Adjust layer depths to control rendering order
    relayer() {
        const layer = this.add.layer();             // Create a new layer
        layer.add([this.pointLight, this.player]);  // Add objects to the layer
    }

    handleDamageBoxOverlap(parent, damageBox) {
        if (parent === this.player) {
            this.physics.add.overlap(damageBox, this.munchers, (_, muncher) => {
                muncher.death(muncher.x < this.player.x ? -1 : 1);
            });

            this.physics.add.overlap(damageBox, this.glizzards, (_, glizzard) => {
                glizzard.death(glizzard.x < this.player.x ? -1 : 1);
            });
        } else {
            this.physics.add.overlap(damageBox, this.player.hitbox, (damageBox, _) => {
                this.player.damagePlayer(damageBox.damage, damageBox); // Damage the player
            });
        }
    }
}