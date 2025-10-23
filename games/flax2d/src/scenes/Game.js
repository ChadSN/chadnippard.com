import { Player } from '../../gameObjects/Player.js';

export class Game extends Phaser.Scene {

    constructor() {
        super('Game');
    }

    create() {
        this.add.image(960, 540, 'sky'); // Add the background image at the center of the game canvas
        //this.add.sprite(960, 540, 'player'); // Add the player sprite at the center of the game canvas

        this.platforms = this.physics.add.staticGroup();    // Create a static group for platforms
        this.dnas = this.physics.add.group();               // Create a group for DNA collectables


        // CREATE PLATFORMS
        // Create ground platforms
        for (let i = 0; i < 8; i++) {
            this.platforms.create(256 * i, 1080 - 64, 'ground');
        }

        // Create some floating platforms
        for (let i = 0; i < 5; i++) {
            this.platforms.create(128 * i, 560, 'ground').setScale(0.5).refreshBody(); // refreshBody is needed after scaling to update the physics body
        }

        this.player = new Player(this, 100, 450); // Create a new player instance

        this.addInputKeys(); // Call the method to add input keys

        // Create the DNA collectables
        this.dnas = this.physics.add.group({
            key: 'dna',                         // Key of the DNA collectable image
            repeat: 7,                         // Number of additional DNA collectables to create (total will be repeat + 1)
            setXY: { x: 64, y: 0, stepX: 256 }  // Positioning of the DNA collectables
        });

        this.dnas.children.iterate(function (child) {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });
        this.physics.add.collider(this.player, this.platforms); // Add collision between the player and the platforms

        this.physics.add.collider(this.dnas, this.platforms);   // Add collision between the DNA collectables and the platforms

        this.physics.add.overlap(this.player, this.dnas, this.collectDNA, null, this); // Add overlap check between player and DNA collectables


        this.score = 0; // Initialise score
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' }); // Display score text

        // BOMBS
        this.bombs = this.physics.add.group(); // Create a group for bombs
        this.physics.add.collider(this.bombs, this.platforms); // Add collision between bombs and platforms
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this); // Add collision between player and bombs
        ///


    }

    update() {
        if (this.cursors.left.isDown || this.keyA.isDown) {
            this.player.moveLeft();
        } else if (this.cursors.right.isDown || this.keyD.isDown) {
            this.player.moveRight();
        } else {
            this.player.idle();
        }

        if (this.cursors.up.isDown || this.keyW.isDown || this.keySPACE.isDown) {
            this.player.jump();
        }
    }

    // Function to handle DNA collection
    collectDNA(player, dna) {
        dna.disableBody(true, true); // Remove the collected DNA
        this.score += 10; // Increase score by 10
        this.scoreText.setText('Score: ' + this.score); // Update score text

        if (this.dnas.countActive(true) === 0) {
            this.dnas.children.iterate(function (child) {
                child.enableBody(true, child.x, 0, true, true);
            });
            this.releaseBomb();
        }
    }

    // Function to handle bomb collision
    hitBomb(player, bomb) {
        this.physics.pause(); // Pause the game
        player.setTint(0xff0000); // Change player color to red
        this.time.delayedCall(2000, () => {
            this.scene.start('GameOver'); // Restart the game after 2 seconds
        });
    }

    releaseBomb() {
        var x = (this.player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = this.bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }

    // Add method for adding input keys
    addInputKeys() {
        this.cursors = this.input.keyboard.createCursorKeys(); // Create cursor keys for movement
        this.keyA = this.input.keyboard.addKey('A');            // Add key A for left movement
        this.keyD = this.input.keyboard.addKey('D');            // Add key D for right movement
        this.keyW = this.input.keyboard.addKey('W');            // Add key W for jump
        this.keyS = this.input.keyboard.addKey('S');            // Add key S for crouch
        this.keySPACE = this.input.keyboard.addKey('SPACE');    // Add spacebar for jump
    }
}

