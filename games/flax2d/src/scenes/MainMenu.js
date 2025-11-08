import { CloudSpawner } from '../utils/CloudSpawner.js';

export class MainMenu extends Phaser.Scene {

    constructor() {
        super('MainMenu');
    }
    create() {
        this.background = this.add.image(960, 540, 'sky').setDepth(0);          // Add the background image at the center of the game canvas and set depth to 0
        this.title = this.add.image(960, 300, 'title').setScale(2).setDepth(2); // Add the title image at the center top and set depth to 2
        this.createStartButton();                                               // Create the start button
        this.cloudSpawner = new CloudSpawner(this);                             // Create a CloudSpawner instance
        this.cloudSpawner.spawnClouds(1, 50, 400);                              // Spawn clouds in the background with depth 1 for use in other levels
    }

    createStartButton() {
        const startButton = this.add.image(960, 700, 'startGameButton')
            .setDepth(3)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        const startButtonText = this.add.text(960, 700, 'Start Game', { fontSize: '64px', fill: 'black' })
            .setDepth(3)
            .setOrigin(0.5);
        startButton.on('pointerdown', () => this.startGame());
        startButton.on('pointerover', () => {
            startButtonText.setStyle({ fill: 'white' });
            this.tweens.add({
                targets: [startButton, startButtonText],
                scale: 1.1,
                duration: 200,
                ease: 'cubic.easeOut'
            });
        });
        startButton.on('pointerout', () => {
            startButtonText.setStyle({ fill: 'black' });
            this.tweens.add({
                targets: [startButton, startButtonText],
                scale: 1,
                duration: 200,
                ease: 'cubic.easeIn'
            });
        });
    }

    startGame() {
        this.scene.start('Game'); // Transition to the Game scene
    }
}