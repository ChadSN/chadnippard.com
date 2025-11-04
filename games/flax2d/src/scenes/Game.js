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
        this.background = this.add.image(960, 540, 'sky');  // Add the background image at the center of the game canvas
        this.background.setScrollFactor(0);                 // Keep the background fixed on the camera
        this.inputManager = new InputManager(this);         // Create an instance of InputManager
        this.physics.world.setBounds(                       // Set world bounds
            0,                                              // left
            -this.worldHeight,                              // top
            this.worldWidth,                                // right
            0);                                             // bottom
        this.addLights();                                   // Add lighting effects
        this.spawnPlayer();                                 // Spawn the player character
        this.setupCamera();                                 // Setup camera to follow the player
        this.spawnPlatforms();                              // Spawn platforms
        this.spawnPoles();                                  // Spawn poles for swinging
        this.spawnDNAs();                                   // Spawn DNA collectables
        this.spawnGlizzards();                              // Spawn glizzard enemies
        this.spawnMunchers();                               // Spawn muncher enemies
        this.uiManager = new UIManager(this);               // Create UI Manager
        this.uiManager.updateHealth(this.player.health);    // Initialise health display
        //this.relayer();                                   // Adjust layer depths
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
    spawnPlayer() {
        this.player = new Player(this, 128, -600);                   // Create a new player instance at (128, 450)
        this.player.setPipeline('Light2D');                         // Enable lighting effects on the player
        const playerDamageBox = new DamageBox(this, this.player);   // create damage box for player
        this.player.setDamageBox(playerDamageBox);                  // assign damage box to player
    }

    // Setup camera to follow the player
    setupCamera() {
        const cam = this.cameras.main;                      // get main camera
        cam.setBounds(0, -this.worldHeight, this.worldHeight, this.worldWidth);                // Set camera bounds to the size of the level
        cam.startFollow(this.player, false, 0.08, 0.08);    // Make the camera follow the player smoothly
        cam.setDeadzone(cam.width / 4, 0);                  // Set deadzone to center quarter width and full height
    }

    // Spawn platforms in the game world
    spawnPlatforms() {
        // CREATE PLATFORMS
        this.platforms = this.physics.add.staticGroup();    // Create a static group for platforms

        // Create ground platforms
        for (let i = 0; i < 8; i++) {
            this.platforms.create(256 * i, 1080, 'ground');
        }
        // Create some floating platforms
        for (let i = 0; i < 20; i++) {
            this.platforms.create(51 * i, 0, 'ground').setScale(0.2).refreshBody(); // refreshBody is needed after scaling to update the physics body
        }
        // for (let i = 0; i < 10; i++) {
        //     this.platforms.create(51 * i + 560, 450, 'ground').setScale(0.2).refreshBody(); // refreshBody is needed after scaling to update the physics body
        // }
        // for (let i = 0; i < 10; i++) {
        //     this.platforms.create(51 * i + 1080, 190, 'ground').setScale(0.2).refreshBody(); // refreshBody is needed after scaling to update the physics body
        // }
        // for (let i = 10; i > 0; i--) {
        //     this.platforms.create(51 * i + 1400, 0, 'ground').setScale(0.2).refreshBody(); // refreshBody is needed after scaling to update the physics body
        // }
        this.physics.add.collider(this.player.hitbox, this.platforms, (hitbox, platform) => {
            this.player.handleCollision(platform); // Use the Player instance to handle collision
        });
    }

    spawnPoles() {
        this.poles = this.physics.add.staticGroup()

        this.poles.create(1000, -300, 'pole')
            .setScale(2)
            .setOrigin(0.5, 0.5)
            .refreshBody();

        this.poles.create(1750, -300, 'pole')
            .setScale(2)
            .setOrigin(0.5, 0.5)
            .refreshBody();

        this.poles.create(2500, -300, 'pole')
            .setScale(2)
            .setOrigin(0.5, 0.5)
            .refreshBody();

        this.physics.add.overlap(this.player.hitbox, this.poles, (hitbox, pole) => {
            this.player.poleSwing(pole);
        });
    }

    // Spawn DNA collectables
    spawnDNAs() {
        this.dnas = this.add.group();                   // Create a group for DNA collectables
        const dnaPositions = [                          // Predefined positions for DNA collectables
            { x: 400, y: 600 },
            { x: 200, y: 850 },
            { x: 1500, y: 600 },
            { x: 1700, y: 850 }
        ];
        dnaPositions.forEach(pos => {                   // Iterate through each position
            const dna = new DNA(this, pos.x, pos.y);    // Create a new DNA instance
            this.dnas.add(dna);                         // Add the DNA to the group
        });
        this.physics.add.overlap(this.player, this.dnas, (player, dna) => {
            this.player.collectDNA(dna);                // Handle DNA collection
        });
    }

    // Spawn muncher enemies
    spawnMunchers() {
        this.munchers = this.physics.add.group({ runChildUpdate: true });
        const m = new Muncher(this, 960, 800);
        this.munchers.add(m);
        const mDamageBox = new DamageBox(this, m);          // create damage box for muncher
        m.setDamageBox(mDamageBox);                         // assign damage box to muncher
        this.physics.add.collider(this.munchers, this.platforms);   // Add collision between munchers and platforms
        this.physics.add.overlap(this.player, this.munchers, (player, muncher) => {
            if (player.y < muncher.y - muncher.height && player.body.velocity.y > 900) { // player is above muncher and falling fast
                player.setVelocityY(-600);                 // bounce the player up
                muncher.death();                           // destroy the muncher
                this.player.handleCollision();             // handle player collision effects
            }
        });
    }

    // Spawn glizzard enemies
    spawnGlizzards() {
        this.glizzards = this.add.group({ runChildUpdate: true });  // create a group that will call update() on its children
        const g = new Glizzard(this, 1500, 600);                    // pass speed/patrolDistance only if needed
        this.glizzards.add(g);                                      // add to the group
        this.physics.add.overlap(this.player, this.glizzards, (player, glizzard) => {
            if (player.y < glizzard.y - glizzard.height && player.body.velocity.y > 900) { // player is above glizzard and falling fast
                player.setVelocityY(-600);                          // bounce the player up
                glizzard.death();                                   // destroy the glizzard
                this.player.handleCollision();                      // handle player collision effects
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
            this.physics.add.overlap(damageBox, this.player, (damageBox, player) => {
                player.damagePlayer(damageBox.damage, damageBox); // Damage the player
            });
        }
    }
}


