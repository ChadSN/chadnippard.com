export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.cursors = scene.input.keyboard.createCursorKeys(); // Add cursor keys for movement
        this.keyA = scene.input.keyboard.addKey('A');           // Add key A for left movement
        this.keyD = scene.input.keyboard.addKey('D');           // Add key D for right movement
        this.keyW = scene.input.keyboard.addKey('W');           // Add key W for jump
        this.keyS = scene.input.keyboard.addKey('S');           // Add key S for crouch
        this.keySPACE = scene.input.keyboard.addKey('SPACE');   // Add spacebar for jump
        this.keyESC = scene.input.keyboard.addKey('ESC');       // Add ESC key for pause menu
        this.keyP = scene.input.keyboard.addKey('P');         // Add P key for pause menu

        this.scene.input.on("pointerdown", (pointer) => {              // Listen for pointer down
            if (pointer.buttons === 1)                          // Left mouse button
                this.scene.pointerLeftPressed();                // Call the scene's pointerPressed method
            else if (pointer.buttons === 2)                     // Right mouse button
                this.scene.pointerRightPressed();
        });
        this.scene.input.on("pointerup", (pointer) => {                // Listen for pointer up
            if (pointer.buttons === 1)                          // Left mouse button
                this.scene.pointerLeftReleased();               // Call the scene's pointerReleased method
            else if (pointer.buttons === 2)                     // Right mouse button
                this.scene.pointerRightReleased();
        });
    }
}