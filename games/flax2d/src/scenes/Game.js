import { Player } from '../../gameObjects/Player.js';
import { Glizzard } from '../../gameObjects/Glizzard.js';
import { Muncher } from '../../gameObjects/Muncher.js';
import { DNA } from '../../gameObjects/DNA.js';
import { InputManager } from '../utils/InputManager.js';
import { UIManager } from '../utils/UIManager.js';
import { DamageBox } from '../../gameObjects/damageBox.js';

export class Game extends Phaser.Scene {

    constructor() {
        super('Game');
        this.worldWidth = 5080;
        this.worldHeight = 4000;
    }

    create() {
        this.physics.world.TILE_BIAS = 64;                  // Increase the tile bias to prevent tunneling
        this.background = this.add.image(960, 540, 'sky');  // Add the background image at the center of the game canvas
        this.background.setScrollFactor(0);                 // Keep the background fixed on the camera
        this.inputManager = new InputManager(this);         // Create an instance of InputManager
        this.physics.world.setBounds(                       // Set world bounds
            0,                                              // left
            0,                                              // top
            this.worldWidth,                                // right
            this.worldHeight);                              // bottom

        this.map = null;
        this.createTilemap();
        this.setupCamera();                                 // Setup camera to follow the player
        this.uiManager = new UIManager(this);               // Create UI Manager
        this.uiManager.updateHealth(this.player.health);    // Initialise health display
        //this.relayer();                                   // Adjust layer depths
    }

    createTilemap() {
        this.map = this.make.tilemap({ key: 'tilemap', tileWidth: 64, tileHeight: 64 });   // key must match the key used in preload
        const tileset = this.map.addTilesetImage('GrassTileSet', 'tiles');                       // Arg 1: tileset name in Tiled, Arg 2: key used in preload
        const groundLayer = this.map.createLayer('Ground', tileset, 0, 0);                       // Arg 1: layer name in Tiled, Arg 2: tileset object created above, Arg 3 & 4: x,y position.
        groundLayer.setCollisionByProperty({ collides: true });                             // Enable collision for tiles with the 'collides' property set to true

        // PLAYER SETUP
        const spawnPoint = this.map.findObject("Objects", obj => obj.name === "spawnPoint");     // Find the spawn point object in the Tiled map
        this.spawnPlayer(spawnPoint.x, spawnPoint.y);                                       // Spawn the player at the spawn point
        this.physics.add.collider(this.player.hitbox, groundLayer, (hitbox, tile) => {
            this.player.handleCollision(tile); // Use the Player instance to handle collision
        });

        this.spawnPoles();                                  // Spawn poles for swinging
        this.spawnGlizzards();                              // Spawn glizzard enemies
        this.spawnMunchers();                               // Spawn muncher enemies
        this.spawnDNAs();                                   // Spawn DNA collectables
        this.addLights();                                   // Add lighting effects





        // const debugGraphics = this.add.graphics().setAlpha(0.75);
        // groundLayer.renderDebug(debugGraphics, {
        //     tileColor: null, // Color of non-colliding tiles
        //     collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        //     faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
        // });
    }

    // Game loop
    update() {
        this.handlePlayerInput();                           // Handle player input
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
        // 0x555555  dim twilight, 0xAAAAAA  bright daylight, 0xFFFFFF  full white, no shadows visible, 0x222222  dark night
        this.lights.setAmbientColor(0xFFFFFF);
        this.lights.addLight(2000, -1000, 3000).setColor(0xFFFACD).setIntensity(1.2); // Simulated sunlight
        // Visible intense light 
        this.lights.addLight(400, 600, 300)
            .setColor(0xFFD580)
            .setIntensity(2);
        // Adding a light sprite
        this.add.sprite(400, 600, '')
            .setBlendMode(Phaser.BlendModes.ADD)
            .setAlpha(0.6);
        // Add a visible point light
        this.pointLight = this.lights.addPointLight(400, 600, 0xfffffff, 50, 1, 0.1);
    }

    // Spawn the player character
    spawnPlayer(x, y) {
        this.player = new Player(this, x, y);    // atlas and misa-front means use the texture atlas and the frame named misa-front. The frame is defined in preload.js
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
    }

    spawnPoles() {
        this.poles = this.physics.add.staticGroup();
        const polePoints = this.map.filterObjects("Objects", obj => obj.name === "polePoint");

        // Iterate through each polePoint and create a pole at its position
        polePoints.forEach(polePoint => {
            const pole = this.poles.create(polePoint.x, polePoint.y, 'pole')
                .setScale(2)
                .setOrigin(0.5, 0.5)
                .refreshBody();
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
        this.glizzards = this.physics.add.group({ runChildUpdate: true });                              // Create a group for glizzards
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


