import { createQuitButton } from '../utils/Utils.js';

export class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    create() {
        this.cameras.main.setBackgroundColor(0xff0000);
        this.add.text(960, 540, 'Game Over')
            .setOrigin(0.5)
            .setFontFamily('Impact')
            .setFontSize('64px')
            .setColor('#ffffff')
            .setStroke('#000000', 8);
        createQuitButton(this);
    }
}
