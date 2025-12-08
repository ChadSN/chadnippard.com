import { createQuitButton } from '../utils/Utils.js';
import { formatElapsedTime } from '../utils/UIManager.js';

export class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    create(data) {
        window.dataLayer = window.dataLayer || [];              // Initialise dataLayer if it doesn't exist
        window.dataLayer.push({                                 // Push an event to dataLayer indicating the game has completed
            event: 'phaser_game_complete',                      // Event name
            score: data.score,                                  // Player's final score
            elapsed_ms: data.elapsed                            // Elapsed time in milliseconds
        });
        this.background = this.add.image(960, 540, 'sky');      // Set background image
        this.cameras.main.fadeIn(1000, 255, 255, 255);          // Fade in effect
        const elapsed = data.elapsed;                           // Get elapsed time from data
        const formattedTime = formatElapsedTime(elapsed);       // Format elapsed time
        const createText = (x, y, text, fontSize) => {          // Create reusable method for text
            return this.add.text(x, y, text)                    // Add text at specified position
                .setOrigin(0.5)
                .setFontFamily('Impact')
                .setFontSize(fontSize)
                .setColor('white')
                .setScrollFactor(0);
        };
        createText(960, 440, 'The End!', '128px');              // Create "The End!" text
        createText(960, 605, `Score: ${data.score}`, '64px');   // Create Score text
        createText(960, 705, `Time: ${formattedTime}`, '64px'); // Create Time text
        createQuitButton(this);                                 // Create Quit button
    }
}