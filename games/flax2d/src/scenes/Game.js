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
        this.worldWidth;                                                                                // Set world width
        this.worldHeight;                                                                               // Set world height
        this.levelKey = 'level1';                                                                       // Level key for loading specific levels
        this.map = null;                                                                                // Tilemap reference
        this.groundLayer = null;                                                                        // Layer for ground areas
        this.groundInsideLayer = null;                                                                  // Layer for ground inside areas
        this.objectLayer = null;                                                                        // Layer for objects
        this.objectLayer2 = null;                                                                       // Layer for objects layer 2
        this.isOverlappingGroundInsideLayer = false;                                                    // Flag to track overlap state
        this.currentAmbientColour = 0xCCCCCC;                                                           // Current ambient light color set to a neutral color
        this.daylightAmbientColour = this.currentAmbientColour;                                         // Daylight color
        this.nightAmbientColour = 0x222222;                                                             // Nighttime color
        this.munchers = [];                                                                             // Array to hold Muncher enemies
        this.glizzards = [];                                                                            // Array to hold Glizzard enemies
        this.dnas = [];                                                                                 // Array to hold DNA collectibles
        this.crates = [];                                                                               // Array to hold Crates
        this.poles = [];                                                                                // Array to hold Poles
        this.signs = [];                                                                                // Array to hold Signs
        this.levelExiting = false;                                                                      // Flag to indicate if the level is exiting
        this.levelReady = false;                                                                        // Flag to indicate if the level is ready
    }

    create() {
        this.physics.world.TILE_BIAS = 64;                                                              // Increase the tile bias to prevent tunneling
        this.background = this.add.image(960, 540, 'sky').setDepth(0).setScrollFactor(0);               // Add the background image at the center of the game canvas
        this.setupCamera();                                                                             // Setup camera to follow the player
        this.inputManager = new InputManager(this);                                                     // Create an instance of InputManager
        this.initUIManager();                                                                           // Initialise UI Manager
        this.createLevel('level1');                                                                     // Create level 1
        this.level1Music = this.sound.add('level1Music', { loop: true, volume: 0.5 });                  // Load and play level 1 music
        this.level1Music.play();                                                                        // Play the level 1 music
        this.caveAmbience = this.sound.add('caveAmbience', { loop: true, volume: 0.05 });               // Load cave ambience sound
        //this.relayer();                                                                               // Adjust layer depths
    }

    update() {
        this.handlePlayerInput();                                                                       // Handle player input
    }

    createLevel(levelKey) {
        this.levelReady = false;                                                                                // Mark level as not ready during creation
        this.levelExiting = false;                                                                              // Reset level exiting flag
        this.levelKey = levelKey;                                                                               // Set the current level key
        this.map = this.make.tilemap({ key: this.levelKey, tileWidth: 64, tileHeight: 64 });                    // key must match the key used in preload

        this.worldWidth = this.map.widthInPixels;                                                               // Get map dimensions in pixels
        this.worldHeight = this.map.heightInPixels;                                                             // Get map dimensions in pixels
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);                                  // Set physics world bounds to match the tilemap size

        // CREATE GROUND LAYER      
        const groundTileSet = this.map.addTilesetImage('GroundTileSet', 'tiles');                               // Arg 1: tileset name in Tiled.    2: key used in preload
        this.groundLayer = this.map.createLayer('Ground', groundTileSet, 0, 0).setDepth(3);                     // Arg 1: layer name in Tiled.      2: tileset object created above.    Arg 3 & 4: x,y position.
        if (!this.groundLayer) throw new Error(`[Level ${levelKey}] Missing layer: Ground`);

        this.groundLayer.setCollisionByProperty({ collides: true });                                            // Enable collision for tiles with the 'collides' property set to true
        // CREATE GROUND INSIDE LAYER
        const groundTileSetInside = this.map.addTilesetImage('GroundTileSet_Inside', 'tilesInside');            // Arg 1: tileset name in Tiled.    2: key used in preload
        this.groundInsideLayer = this.map.createLayer('Ground_Inside', groundTileSetInside, 0, 0).setDepth(2);  // Arg 1: layer name in Tiled.      2: tileset object created above.    Arg 3 & 4: x,y position.
        if (!this.groundInsideLayer) throw new Error(`[Level ${levelKey}] Missing layer: Ground_Inside`);

        this.groundInsideLayer.setCollisionByProperty({ overlaps: true });                                      // Enable collision for tiles with the 'collides' property set to true
        // CREATE OBJECT LAYER
        const objectTileSet = this.map.addTilesetImage('ObjectTileSet', 'objectTiles');                         // Arg 1: tileset name in Tiled.    2: key used in preload
        this.objectLayer = this.map.createLayer('ObjectTiles', objectTileSet, 0, 0).setDepth(3);               // Arg 1: layer name in Tiled.      2: tileset object created above.    Arg 3 & 4: x,y position.
        this.objectLayer2 = this.map.createLayer('ObjectTilesLayer2', objectTileSet, 0, 0).setDepth(3);        // Arg 1: layer name in Tiled.      2: tileset object created above.    Arg 3 & 4: x,y position.
        if (!this.objectLayer) throw new Error(`[Level ${levelKey}] Missing layer: ObjectTiles`);

        // ENABLE LIGHTING ON LAYERS
        this.groundLayer.setPipeline('Light2D');
        this.groundInsideLayer.setPipeline('Light2D');
        this.objectLayer.setPipeline('Light2D');
        this.objectLayer2.setPipeline('Light2D');
        // PLAYER SETUP
        const spawnPoint = this.map.findObject("Objects", obj => obj.name === "spawnPoint");                    // Find the spawn point object in the Tiled map
        if (!spawnPoint) throw new Error(`[Level ${levelKey}] Missing object: spawnPoint`);

        this.spawnPlayer(spawnPoint.x, spawnPoint.y);                                                           // Spawn the player at the spawn point location
        // COLLISIONS SETUP FOR PLAYER WITH GROUND LAYER            
        this.physics.add.collider(this.player.hitbox, this.groundLayer, (hitbox, tile) => {                     // Player collides with ground layer
            if (tile && tile.properties.collides && this.groundLayer) {                                         // Check if the tile has the 'collides' property
                this.player.handleCollision(tile);                                                              // Use the Player instance to handle collision
            }
        });

        this.addLights();                                                                               // Add lighting effects
        this.spawnSigns();                                                                              // Spawn signs with text
        this.spawnPoles();                                                                              // Spawn poles for swinging
        this.spawnCrates();                                                                             // Spawn crates
        this.spawnGlizzards();                                                                          // Spawn glizzard enemies
        this.spawnMunchers();                                                                           // Spawn muncher enemies
        this.spawnDNAs();                                                                               // Spawn DNA collectables
        this.spawnClouds();                                                                             // Spawn background clouds
        this.cameras.main.fadeIn(1000);                                                                 // Fade in the camera
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
        this.physics.add.overlap(this.player.hitbox, this.objectLayer, (hitbox, tile) => {                      // Check overlap with object layer
            if (tile && tile.properties.exit && !this.levelExiting) {                                           // Check if the tile has the 'exit' property
                this.levelExiting = true;                                                                       // Prevent multiple triggers
                this.levelReady = false;                                                                        // Mark level as not ready during transition
                this.cameras.main.fadeOut(1000);                                                                // Fade out the camera
                this.time.delayedCall(1000, () => {                                                             // Small delay to ensure smooth transition
                    switch (this.levelKey) {                                                                    // Determine the next level based on current level key
                        case 'level1': this.levelKey = 'level2'; this.transitionToLevel(this.levelKey); break;  // Transition to level 2
                        case 'level2': this.levelKey = 'level3'; this.transitionToLevel(this.levelKey); break;  // Transition to level 3
                        case 'level3': this.levelKey = 'GameOver'; this.scene.start('GameOver'); break;         // Transition to Game Over scene
                        default: console.error('Unknown level key:', this.levelKey); break;                     // Handle unknown level keys
                    }
                });
            }
        });
        this.levelReady = true;                                                                                 // Mark level as ready
    }

    transitionToLevel(levelKey) {
        this.destroyLevel();        // Clean up the current level
        this.createLevel(levelKey); // Load the new level
    }

    destroyLevel() {
        this.physics.world.colliders.getActive().forEach(c => c.destroy());                             // Destroy all active colliders
        this.destroyGroup(this.munchers);                                                               // Destroy muncher enemies
        this.destroyGroup(this.glizzards);                                                              // Destroy glizzard enemies
        this.destroyGroup(this.dnas);                                                                   // Destroy DNA collectables
        this.destroyGroup(this.crates);                                                                 // Destroy crates
        this.destroyGroup(this.poles);                                                                  // Destroy poles
        this.destroyGroup(this.signs);                                                                  // Destroy signs
        if (this.player) this.player.setTilemapAndLayer(null, null);                                    // Clear player's tilemap and layer references
        if (this.lights) this.lights.destroy();                                                         // Destroy the Lights Manager
        if (this.map) {                                                                                 // Check if map exists before destroying
            this.groundLayer = null;                                                                    // Clear ground layer reference
            this.groundInsideLayer = null;                                                              // Clear ground inside layer reference
            this.objectLayer = null;                                                                    // Clear object layer reference
            this.objectLayer2 = null;                                                                   // Clear object layer 2 reference
            this.map.destroy();                                                                         // Destroy the tilemap
        }
        if (this.level1Music) this.level1Music.stop();                                                  // Stop level music
        if (this.caveAmbience) this.caveAmbience.stop();                                                // Stop cave ambience
        this.tweens.killAll();                                                                          // Stop all tweens
    }

    destroyGroup(group) {
        if (group && group.children) {                                                                  // Check if group and its children exist
            group.children.each(child => child.destroy());                                              // Destroy each child in the group
            group.clear(true, true);                                                                    // Clear the group
        }
    }

    initUIManager() {
        this.uiManager = new UIManager(this);                                                           // Create UI Manager
        this.uiManager.startTimerEvent(0);                                                              // Start the timer event
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
        this.signs = this.add.group();                                                                  // Create a group for signs
        const signPoints = this.map.filterObjects("Objects", obj => obj.name === "signPoint");          // Find all sign objects in the Tiled map
        signPoints.forEach(signPoint => {                                                               // Iterate through each signPoint and create a sign with text
            const textProperty = signPoint.properties.find(prop => prop.name === 'text');               // Get the text property
            const textSizeProperty = signPoint.properties.find(prop => prop.name === 'size');           // Get the text size property
            const textWrapProperty = signPoint.properties.find(prop => prop.name === 'wrapWidth')       // Get the text wrap width property
                || { value: 128 };                                                                      // Default wrap width if not specified
            const signText = this.add.text(signPoint.x, signPoint.y, textProperty.value)                // Create text object at sign position
                .setFontFamily('Impact')                                                                // Set font family
                .setFontSize(`${textSizeProperty.value}px`)                                             // Set font size
                .setColor('#000000')                                                                    // Set text color
                .setAlign('center')                                                                     // Set text alignment
                .setWordWrapWidth(textWrapProperty.value)                                               // Set word wrap width
                .setLineSpacing(0)                                                                      // Set line spacing
                .setOrigin(0.5)                                                                         // Center horizontally, align bottom
                .setDepth(4);                                                                           // Set depth above ground layer
            this.signs.add(signText);                                                                   // Add sign text to the signs group
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
        this.lights.enable();                                                                               // Enable Lights Manager
        this.lights.setAmbientColor(this.daylightAmbientColour);                                            // Set ambient light color for the scene
        this.lights.addLight(this.cameras.main.x, 0, 3000)                                                  // Light position and radius
            .setColor(0xFFFACD)                                                                             // Light color
            .setIntensity(1.2)                                                                              // Simulated sunlight
            .setScrollFactor(1, 0);                                                                         // Make the light follow the camera. Arg1: x scroll factor. 2: y scroll factor

        // Add flickering lights at designated light points         
        const lightPoints = this.map.filterObjects("Objects", obj => obj.name === "lightPoint");
        lightPoints.forEach(point => {
            const light = this.lights.addLight(point.x, point.y, 200)                                       // Light position and radius
                .setColor(0xFFD580)                                                                         // Warm light color
                .setIntensity(1.5);                                                                         // Random brightness of the light
            this.tweens.add({
                targets: light,                                                                             // Animate the Phaser Light object
                intensity: { from: 1.5, to: 2 },                                                            // Flicker intensity between 1.5 and 2
                radius: { from: 200, to: 250 },                                                             // Flicker radius between 200 and 250
                duration: 1500,                                                                             // Duration of one flicker cycle
                yoyo: true,                                                                                 // Flicker back and forth
                repeat: -1                                                                                  // Repeat indefinitely
            });
        });
    }

    // Spawn the player character
    spawnPlayer(x, y) {
        if (!this.player) {                                                                                 // If player doesn't exist, create a new one
            this.player = new Player(this, x, y).setDepth(10);                                              // Spawn player and set depth
            this.player.setPipeline('Light2D');                                                             // Enable lighting effects on the player
            const playerDamageBox = new DamageBox(this, this.player);                                       // create damage box for player
            this.player.setDamageBox(playerDamageBox);                                                      // assign damage box to player
            this.uiManager.initHealthDisplay();                                                             // Initialise health display in UI
        }
        this.player.hitbox.setPosition(x, y);                                                               // Set player hitbox position to spawn point
        this.cameras.main.startFollow(this.player, false, 0.08, 0.08);                                      // Make the camera follow the player smoothly
        this.player.setTilemapAndLayer(this.map, this.groundLayer);                                         // Provide player with tilemap and ground layer for collision handling
        this.uiManager.updateHealth(this.player.health);                                                    // Update health display in UI
    }

    // Setup camera to follow the player                        
    setupCamera() {
        const cam = this.cameras.main;                                                                      // get main camera
        cam.setBounds(0, 0, this.worldWidth, this.worldHeight);                                             // Set camera bounds to the size of the level
        cam.setDeadzone(cam.width / 4, 0);                                                                  // Set deadzone to center quarter width and full height
        this.cameras.main.roundPixels = true;                                                               // Prevent sub-pixel rendering to avoid blurriness
    }

    // Spawn poles for swinging         
    spawnPoles() {
        this.poles = this.physics.add.staticGroup();                                                        // Create a static group for poles
        const polePoints = this.map.filterObjects("Objects", obj => obj.name === "polePoint");              // Find all pole spawn points
        polePoints.forEach(polePoint => {                                                                   // Iterate through each polePoint and create a pole at its position
            const pole = this.poles.create(polePoint.x, polePoint.y, 'pole')                                // create pole at point
                .setOrigin(0.5, 0.5)
                .setScale(2)
                .refreshBody()
                .setDepth(4);
        });
        this.physics.add.overlap(this.player.hitbox, this.poles, (hitbox, pole) => {                        // player overlaps pole
            this.player.poleSwing(pole);                                                                    // initiate pole swinging
        });
    }

    // Spawn DNA collectables           
    spawnDNAs() {
        this.dnas = this.physics.add.staticGroup();                                                         // Create a static group for DNAs
        const dnaPoints = this.map.filterObjects("Objects", obj => obj.name === "dnaPoint");                // Find all DNA spawn points
        dnaPoints.forEach(dnaPoint => {                                                                     // Iterate through each dnaPoint and create a DNA at its position
            const dna = new DNA(this, dnaPoint.x, dnaPoint.y);                                              // create dna at point
            this.dnas.add(dna).setDepth(4);                                                                 // add to the group
        });
        this.physics.add.overlap(this.player.hitbox, this.dnas, (hitbox, dna) => {                          // player collects dna
            this.player.collectDNA(dna);                                                                    // Handle DNA collection
        });
    }

    // Spawn muncher enemies
    spawnMunchers() {
        this.munchers = this.physics.add.group({ runChildUpdate: true });                                   // Create a group for munchers
        const muncherPoints = this.map.filterObjects("Objects", obj => obj.name === "muncherPoint");        // Find all muncher spawn points
        muncherPoints.forEach(muncherPoint => {                                                             // Iterate through each muncherPoint and create a Muncher at its position
            const muncher = new Muncher(this, muncherPoint.x, muncherPoint.y);                              // create muncher at point
            this.munchers.add(muncher).setDepth(4);                                                                     // add to the group
            const damageBox = new DamageBox(this, muncher);                                                 // create damage box for muncher
            muncher.setDamageBox(damageBox);                                                                // assign damage box to muncher
        });
        this.physics.add.collider(this.munchers, this.groundLayer);                                         // munchers collide with ground layer
        this.physics.add.overlap(this.player.hitbox, this.munchers, (player, muncher) => {                  // player stomps muncher
            if (player.y < muncher.y - muncher.height && player.body.velocity.y >= 200) {                   // player is above muncher and falling fast
                player.body.setVelocityY(-600);                                                             // bounce the player up
                muncher.death();                                                                            // destroy the muncher
                this.player.handleCollision();                                                              // handle player collision effects
            }
        });
    }

    // Spawn glizzard enemies
    spawnGlizzards() {
        this.glizzards = this.add.group({ runChildUpdate: true });                                          // Create a group for glizzards
        const glizzardPoints = this.map.filterObjects("Objects", obj => obj.name === "glizzardPoint");      // Find all glizzard spawn points
        glizzardPoints.forEach(glizzardPoint => {                                                           // Iterate through each glizzardPoint and create a Glizzard at its position
            const glizzard = new Glizzard(this, glizzardPoint.x, glizzardPoint.y);                          // create glizzard at point
            this.glizzards.add(glizzard).setDepth(4);                                                       // add to the group
        });
        this.physics.add.overlap(this.player.hitbox, this.glizzards, (player, glizzard) => {                // player stomps glizzard
            if (player.y < glizzard.y - glizzard.height && player.body.velocity.y >= 200) {                 // player is above glizzard and falling fast
                player.body.setVelocityY(-600);                                                             // bounce the player up
                glizzard.death();                                                                           // destroy the glizzard
                this.player.handleCollision();                                                              // handle player collision effects
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


