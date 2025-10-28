export class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;

        this.scoreText = scene.add.text(96, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
        this.healthIcon = scene.add.sprite(16, 100, 'dna').setOrigin(0, 0.5).setScale(0.5);
        this.healthText = scene.add.text(96, 100, 'Health: 0', { fontSize: '32px', fill: '#000' }).setOrigin(0, 0.5);

        // Fix UI to camera
        this.scoreText.setScrollFactor(0);
        this.healthIcon.setScrollFactor(0);
        this.healthText.setScrollFactor(0);
    }

    updateScore(amount) {
        this.score += amount;
        this.scoreText.setText('Score: ' + this.score);
    }

    updateHealth(health) {
        this.healthText.setText('Health: ' + health);
    }
}