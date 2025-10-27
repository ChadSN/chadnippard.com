import { Player } from '../../gameObjects/Player.js';
import { Glizzard } from '../../gameObjects/Glizzard.js';
import { Muncher } from '../../gameObjects/Muncher.js';
import { DNA } from '../../gameObjects/DNA.js';

export class Game extends Phaser.Scene {

    constructor() {
        super('Game');
    }

    create() {
        this.background = this.add.image(960, 540, 'sky');  // Add the background image at the center of the game canvas
        this.background.setScrollFactor(0);                 // Keep the background fixed on the camera
        this.addInputKeys();                                // Call the method to add input keys
        this.player = new Player(this, 128, 450);           // Create a new player instance
        this.setupCamera();                                 // Setup camera to follow the player
        this.spawnLeftEdgeBlocker();                        // Spawn invisible blocker on left edge
        this.spawnPlatforms();                              // Spawn platforms
        this.spawnDNAs();                                   // Spawn DNA collectables
        this.spawnGlizzards();                              // Spawn glizzard enemies
        this.spawnMunchers();                               // Spawn muncher enemies
        this.createUI();                                    // Create UI elements for score and health
    }

    update() {
        this.handlePlayerInput();                           // Handle player input
        this.player.outOfBoundsCheck();                     // Check if player is out of bounds
    }

    // Function to handle DNA collection
    collectDNA(player, dna) {
        if (this.player.health >= this.player.maxHealth) return;    // Don't collect if health is full
        dna.disableBody(true, true);                                // Remove the collected DNA
        this.updateScore(10);                                       // Increase score by 10
        this.player.heal(1);                                        // Heal the player
    }

    // Add method for adding input keys
    addInputKeys() {
        this.cursors = this.input.keyboard.createCursorKeys();  // Create cursor keys for movement
        this.keyA = this.input.keyboard.addKey('A');            // Add key A for left movement
        this.keyD = this.input.keyboard.addKey('D');            // Add key D for right movement
        this.keyW = this.input.keyboard.addKey('W');            // Add key W for jump
        this.keyS = this.input.keyboard.addKey('S');            // Add key S for crouch
        this.keySPACE = this.input.keyboard.addKey('SPACE');    // Add spacebar for jump
    }

    damagePlayer(amount, attacker) {
        this.player.takeDamage(amount);                                 // Reduce player health
        this.player.setVelocityY(-600);                                 // Knockback upwards
        if (attacker.x < this.player.x) this.player.setVelocityX(600);  // Knockback to the right
        else this.player.setVelocityX(-600);                            // Knockback to the left
    }



    spawnDamageBox(x, y, width, height, damage, duration = 100) {
        const damageBox = this.add.rectangle(x, y, width, height, 0, 1);    // invisible rectangle
        this.physics.add.existing(damageBox);                               // enable physics
        damageBox.body.setAllowGravity(false);                              // no gravity
        damageBox.body.setImmovable(true);                                  // don't move on collision
        this.physics.add.overlap(this.player, damageBox, () => {            // on overlap
            this.damagePlayer(damage, damageBox);                           // damage the player
        }, null, this);
        this.time.delayedCall(duration, () => {                             // wait duration
            damageBox.destroy();                                            // destroy the damage box
        });
    }

    updateScore(amount) {
        this.score += amount;
        this.scoreText.setText('Score: ' + this.score);
    }

    // Create UI elements for score and health
    createUI() {
        this.score = 0; // Initialise score
        this.scoreText = this.add.text(96, 16, 'Score: 0', { fontSize: '32px', fill: '#000' }); // Display score text

        this.healthIcon = this.add.sprite(16, 100, 'dna').setOrigin(0, 0.5).setScale(0.5);
        this.healthText = this.add.text(96, 100, 'Health: ' + this.player.health, { fontSize: '32px', fill: '#000' }); // Display health text
        this.healthText.setOrigin(0, 0.5); // Set origin to center left

        // Fix UI to camera
        this.scoreText.setScrollFactor(0);
        this.healthIcon.setScrollFactor(0);
        this.healthText.setScrollFactor(0);
    }

    spawnPlatforms() {
        // CREATE PLATFORMS
        this.platforms = this.physics.add.staticGroup();    // Create a static group for platforms

        // Create ground platforms
        for (let i = 0; i < 8; i++) {
            this.platforms.create(256 * i, 1080, 'ground');
        }
        // Create some floating platforms
        for (let i = 0; i < 10; i++) {
            this.platforms.create(51 * i, 720, 'ground').setScale(0.2).refreshBody(); // refreshBody is needed after scaling to update the physics body
        }
        for (let i = 0; i < 10; i++) {
            this.platforms.create(51 * i + 560, 450, 'ground').setScale(0.2).refreshBody(); // refreshBody is needed after scaling to update the physics body
        }
        for (let i = 0; i < 10; i++) {
            this.platforms.create(51 * i + 1080, 190, 'ground').setScale(0.2).refreshBody(); // refreshBody is needed after scaling to update the physics body
        }
        for (let i = 10; i > 0; i--) {
            this.platforms.create(51 * i + 1400, 720, 'ground').setScale(0.2).refreshBody(); // refreshBody is needed after scaling to update the physics body
        }


        this.physics.add.collider(this.player, this.platforms); // Add collision between the player and the platforms
    }

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
        this.physics.add.overlap(this.player, this.dnas, this.collectDNA, null, this);
    }

    spawnMunchers() {
        this.munchers = this.physics.add.group({ runChildUpdate: true });
        const m = new Muncher(this, 960, 800);
        this.munchers.add(m);
        this.physics.add.collider(this.munchers, this.platforms);   // Add collision between munchers and platforms
        this.physics.add.collider(this.player, this.munchers);      // Add collision between player and munchers
    }

    spawnGlizzards() {
        this.glizzards = this.add.group({ runChildUpdate: true });  // create a group that will call update() on its children
        const g = new Glizzard(this, 960, 300);                     // pass speed/patrolDistance only if needed
        this.glizzards.add(g);                                      // add to the group
    }

    // best name for input method called on update
    handlePlayerInput() {
        if (this.cursors.left.isDown || this.keyA.isDown) {
            this.player.moveLeft();
        }
        else if (this.cursors.right.isDown || this.keyD.isDown) {
            this.player.moveRight();
        }
        else {
            this.player.idle();
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keySPACE) || Phaser.Input.Keyboard.JustDown(this.keyW)) {
            this.player.jump();
        }
    }

    setupCamera() {
        const cam = this.cameras.main;                      // get main camera
        cam.setBounds(0, -4000, 4000, 5080);                // Set camera bounds to the size of the level
        cam.startFollow(this.player, false, 0.08, 0.08);    // Make the camera follow the player smoothly
        cam.setDeadzone(cam.width / 4, 0);                  // Set deadzone to center quarter width and full height
    }

    spawnLeftEdgeBlocker() {
        const blocker = this.add.rectangle(-50, 2500, 50, 5000, 0x000000f, 100);    // invisible rectangle *CHANGE ALPHA*
        this.physics.add.existing(blocker);                                         // enable physics
        blocker.body.setAllowGravity(false);                                        // no gravity
        blocker.body.setImmovable(true);                                            // don't move on collision
        this.physics.add.collider(this.player, blocker);                            // add collider with player
    }
}

