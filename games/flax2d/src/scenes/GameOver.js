import { createQuitButton } from '../utils/Utils.js';
import { formatElapsedTime } from '../utils/UIManager.js';

export class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    create(data) {
        this.background = this.add.image(960, 540, 'sky')
            .setDepth(0);

        this.cameras.main.fadeIn(1000, 255, 255, 255);

        const elapsed = data.elapsed;
        const formattedTime = formatElapsedTime(elapsed);

        this.add.text(960, 440, 'The end!')
            .setOrigin(0.5)
            .setFontFamily('Impact')
            .setFontSize('128px')
            .setColor('white')
            .setScrollFactor(0);

        this.add.text(960, 540, `Score: ${data.score}`)
            .setOrigin(0.5)
            .setFontFamily('Impact')
            .setFontSize('64px')
            .setColor('white')
            .setScrollFactor(0);

        this.add.text(960, 640, `Time: ${formattedTime}`)
            .setOrigin(0.5)
            .setFontFamily('Impact')
            .setFontSize('64px')
            .setColor('white')
            .setScrollFactor(0);

        createQuitButton(this);
    }
}
