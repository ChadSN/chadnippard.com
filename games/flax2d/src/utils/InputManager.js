export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.cursors = scene.input.keyboard.createCursorKeys(); // Add cursor keys for movement
        this.keyA = scene.input.keyboard.addKey('A');           // Add key A for left movement
        this.keyD = scene.input.keyboard.addKey('D');           // Add key D for right movement
        this.keyW = scene.input.keyboard.addKey('W');           // Add key W for jump
        this.keyS = scene.input.keyboard.addKey('S');           // Add key S for crouch
        this.keySPACE = scene.input.keyboard.addKey('SPACE');   // Add spacebar for jump

        this.scene.input.on("pointerdown", () => {              // Listen for pointer down
            this.scene.pointerPressed();                        // Call the scene's pointerPressed method
        });
        this.scene.input.on("pointerup", () => {                // Listen for pointer up
            this.scene.pointerReleased();                       // Call the scene's pointerReleased method
        });
    }
}