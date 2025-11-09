import { Player } from '../../gameObjects/Player.js';
import { Glizzard } from '../../gameObjects/Glizzard.js';
import { Muncher } from '../../gameObjects/Muncher.js';
import { DNA } from '../../gameObjects/DNA.js';
import { InputManager } from '../utils/InputManager.js';
import { UIManager } from '../utils/UIManager.js';
import { DamageBox } from '../../gameObjects/damageBox.js';
import { CloudSpawner } from '../utils/CloudSpawner.js';

export class Game extends Phaser.Scene {

    constructor() {
        super('Game');
        this.worldWidth = 8000;
        this.worldHeight = 4000;
        this.map = null;                                    // Tilemap reference
        this.groundLayer = null;                            // Layer for ground areas
        this.groundInsideLayer = null;                      // Layer for ground inside areas
        this.isOverlappingGroundInsideLayer = false;        // Flag to track overlap state
        this.currentAmbientColor = 0xcccccc;                // Current ambient light color set to a neutral color
    }

    create() {
        this.physics.world.TILE_BIAS = 64;                  // Increase the tile bias to prevent tunneling
        this.background = this.add.image(960, 540, 'sky')   // Add the background image at the center of the game canvas
            .setDepth(0)                                    // Set depth to ensure it's behind other game objects
            .setScrollFactor(0);                            // Make the background static relative to the camera
        this.inputManager = new InputManager(this);         // Create an instance of InputManager
        this.physics.world.setBounds(                       // Set world bounds
            0,                                              // left
            0,                                              // top
            this.worldWidth,                                // right
            this.worldHeight);                              // bottom
        this.createTilemap();
        this.setupCamera();                                 // Setup camera to follow the player
        this.uiManager = new UIManager(this);               // Create UI Manager
        this.uiManager.updateHealth(this.player.health);    // Initialise health display
        //this.relayer();                                   // Adjust layer depths
        // add level1music
        this.level1Music = this.sound.add('level1Music', { loop: true, volume: 0.5 });
        this.level1Music.play();
        this.caveAmbience = this.sound.add('caveAmbience', { loop: true, volume: 0.1 });
    }

    update() {
        this.handlePlayerInput();                           // Handle player input
    }

    createTilemap() {
        this.map = this.make.tilemap({ key: 'tilemap', tileWidth: 64, tileHeight: 64 });                // key must match the key used in preload

        // CREATE GROUND LAYER
        const groundTileSet = this.map.addTilesetImage('GroundTileSet', 'tiles');                       // Arg 1: tileset name in Tiled, Arg 2: key used in preload
        this.groundLayer = this.map.createLayer('Ground', groundTileSet, 0, 0).setDepth(2);             // Arg 1: layer name in Tiled, Arg 2: tileset object created above, Arg 3 & 4: x,y position.
        this.groundLayer.setCollisionByProperty({ collides: true });                                    // Enable collision for tiles with the 'collides' property set to true

        // CREATE GROUND INSIDE LAYER
        const groundTileSetInside = this.map.addTilesetImage('GroundTileSet_Inside', 'tilesInside');    // Arg 1: tileset name in Tiled, Arg 2: key used in preload
        this.groundInsideLayer = this.map
            .createLayer('Ground_Inside', groundTileSetInside, 0, 0)                                    // Arg 1: layer name in Tiled, Arg 2: tileset object created above, Arg 3 & 4: x,y position.
            .setDepth(2);                                                                               // Set depth to ensure it's above the ground layer
        this.groundInsideLayer.setCollisionByProperty({ overlaps: true });                              // Enable collision for tiles with the 'collides' property set to true

        // CREATE OBJECT LAYER
        const objectTileSet = this.map.addTilesetImage('ObjectTileSet', 'objectTiles');                 // Arg 1: tileset name in Tiled, Arg 2: key used in preload
        const objectLayer = this.map.createLayer('ObjectTiles', objectTileSet, 0, 0).setDepth(2);       // Arg 1: layer name in Tiled, Arg 2: tileset object created above, Arg 3 & 4: x,y position.

        // ENABLE LIGHTING ON LAYERS
        this.groundLayer.setPipeline('Light2D');
        this.groundInsideLayer.setPipeline('Light2D');
        objectLayer.setPipeline('Light2D');

        // PLAYER SETUP
        const spawnPoint = this.map.findObject("Objects", obj => obj.name === "spawnPoint");            // Find the spawn point object in the Tiled map
        this.spawnPlayer(spawnPoint.x, spawnPoint.y);                                                   // Spawn the player at the spawn point

        // COLLISIONS SETUP FOR PLAYER WITH GROUND LAYER
        this.physics.add.collider(this.player.hitbox, this.groundLayer, (hitbox, tile) => {
            if (tile && tile.properties.collides) {
                this.player.handleCollision(tile); // Use the Player instance to handle collision
            }
        });

        // COLLISIONS SETUP FOR PLAYER WITH GROUND INSIDE LAYER
        this.physics.add.overlap(this.player.hitbox, this.groundInsideLayer, (hitbox, tile) => {
            if (tile && tile.properties.overlaps) {
                if (!this.isOverlappingGroundInsideLayer) {
                    this.isOverlappingGroundInsideLayer = true;
                    this.tweenAmbientLight(0x222222); // Dim light
                    if (!this.caveAmbience.isPlaying) {
                        this.caveAmbience.stop();
                        this.caveAmbience.play();
                    }
                }

            } else {
                if (this.isOverlappingGroundInsideLayer) {
                    this.isOverlappingGroundInsideLayer = false;
                    this.tweenAmbientLight(0xFFFFFF); // Full white light

                    if (this.caveAmbience.isPlaying) this.caveAmbience.stop();
                }
            }
        });

        this.spawnPoles();                                  // Spawn poles for swinging
        this.spawnGlizzards();                              // Spawn glizzard enemies
        this.spawnMunchers();                               // Spawn muncher enemies
        this.spawnDNAs();                                   // Spawn DNA collectables
        this.addLights();                                   // Add lighting effects
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

    tweenAmbientLight(targetColour) {
        if (this.currentAmbientColour === targetColour) return;                                             // No need to tween if already at target color
        const start = Phaser.Display.Color.ValueToColor(this.currentAmbientColor);                          // Current ambient color
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
                this.currentAmbientColor = hex;                                                             // Update current ambient color

            },
            onComplete: () => {
                this.lights.setAmbientColor(targetColour);                                                  // Final set to target color
                this.currentAmbientColor = targetColour;                                                    // Update current ambient color
            }
        });
    }

    spawnClouds() {
        const CloudYMinPoint = this.map.filterObjects("Objects", obj => obj.name === "CloudYMin")[0]; // Match the exact name
        const CloudYMaxPoint = this.map.filterObjects("Objects", obj => obj.name === "CloudYMax")[0];
        this.cloudSpawner = new CloudSpawner(this); // Create a CloudSpawner instance
        this.cloudSpawner.spawnClouds(1, CloudYMinPoint.y, CloudYMaxPoint.y); // Spawn clouds in the background with depth 1
    }

    // Handle player input
    handlePlayerInput() {
        if (this.player.disableMovement) return;        // prevent movement if canMove is false
        if (
            Phaser.Input.Keyboard.JustDown(this.inputManager.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.inputManager.keySPACE) ||
            Phaser.Input.Keyboard.JustDown(this.inputManager.keyW)
        ) this.player.jump();

        if (this.inputManager.cursors.left.isDown || this.inputManager.keyA.isDown) {
            this.player.moveLeft();
        } else if (this.inputManager.cursors.right.isDown || this.inputManager.keyD.isDown) {
            this.player.moveRight();
        } else {
            this.player.idle();
        }
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
        this.lights.enable(); // Enable Lights Manager

        // 0x555555  dim twilight, 
        // 0xAAAAAA  bright daylight,
        // 0xFFFFFF  full white, no shadows visible, 
        // 0x222222  dark night
        this.lights.setAmbientColor(this.currentAmbientColor);  // Set ambient light color for the scene
        this.lights.addLight(this.cameras.main.x, 0, 3000)      // Light position and radius
            .setColor(0xFFFACD)                                 // Light color
            .setIntensity(1.2)                                  // Simulated sunlight
            .setScrollFactor(1, 0);                             // Make the light follow the camera. Arg1: x scroll factor, Arg2: y scroll factor

        // Add flickering lights at designated light points
        const lightPoints = this.map.filterObjects("Objects", obj => obj.name === "lightPoint");
        lightPoints.forEach(point => {
            const light = this.lights.addLight(point.x, point.y, 200)   // Light position and radius
                .setColor(0xFFD580)                                     // Warm light color
                .setIntensity(1.5);                                     // Random brightness of the light
            this.tweens.add({
                targets: light,                                         // Animate the Phaser Light object
                intensity: { from: 1.5, to: 2 },                        // Flicker intensity between 1.5 and 2
                radius: { from: 200, to: 250 },                         // Flicker radius between 200 and 250
                duration: 1500,                                         // Duration of one flicker cycle
                yoyo: true,                                             // Flicker back and forth
                repeat: -1                                              // Repeat indefinitely
            });
        });

        //this.lights.addLight(2000, -1000, 3000).setColor(0xFFFACD).setIntensity(1.2);   // Simulated sunlight
        // // Visible intense light 
        // this.lights.addLight(400, 600, 300)
        //     .setColor(0xFFD580)
        //     .setIntensity(2);
        // // Adding a light sprite
        // this.add.sprite(400, 600, '')
        //     .setBlendMode(Phaser.BlendModes.ADD)
        //     .setAlpha(0.6);
        // // Add a visible point light
        // this.pointLight = this.lights.addPointLight(400, 600, 0xfffffff, 50, 1, 0.1);
    }

    // Spawn the player character
    spawnPlayer(x, y) {
        this.player = new Player(this, x, y).setDepth(3);               // Spawn player and set depth
        this.player.setPipeline('Light2D');                             // Enable lighting effects on the player
        const playerDamageBox = new DamageBox(this, this.player);       // create damage box for player
        this.player.setDamageBox(playerDamageBox);                      // assign damage box to player
    }

    // Setup camera to follow the player
    setupCamera() {
        const cam = this.cameras.main;                                  // get main camera
        cam.setBounds(0, 0, this.worldWidth, this.worldHeight);         // Set camera bounds to the size of the level
        cam.startFollow(this.player, false, 0.08, 0.08);                // Make the camera follow the player smoothly
        cam.setDeadzone(cam.width / 4, 0);                              // Set deadzone to center quarter width and full height
        this.cameras.main.roundPixels = true;                           // Prevent sub-pixel rendering to avoid blurriness
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
            this.dnas.add(dna);
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
            this.munchers.add(muncher);                                                                 // add to the group
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
            this.glizzards.add(glizzard);                                                               // add to the group
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


