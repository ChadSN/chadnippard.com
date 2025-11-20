export class DamageBox extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, parent) {
        super(scene);                                                       // Call parent constructor
        this.parent = parent;                                               // Set parent reference
        this.damage = 0;                                                    // Set damage value

        // VISUAL AID - REMOVE LATER
        //this.rectangle = scene.add.rectangle(0, 0, 0, 0, 0xff0000, 0.5);    // Visible rectangle for debuggingF

        scene.add.existing(this);                                           // Add this sprite to the scene
        scene.physics.add.existing(this);                                   // Enable physics on the DamageBox
        this.body.setAllowGravity(false);                                   // Disable gravity for the DamageBox
        this.body.setImmovable(true);                                       // Make it immovable
        this.deactivate();                                                  // Initially deactivate the damage box
    }

    activate(width, height, damage) {
        this.damage = damage;                   // Set damage value
        this.body.enable = true;                // Enable physics body
        this.body.setSize(width, height);       // Refresh body size

        // VISUAL AID - REMOVE LATER
        //this.rectangle.setActive(true);         // Set active
        //this.rectangle.setVisible(true);        // Set visible
        //this.rectangle.setSize(width, height);  // Set size
    }

    deactivate() {
        this.body.enable = false;           // Disable physics body

        // VISUAL AID - REMOVE LATER
        //this.rectangle.setActive(false);    // Set inactive
        //this.rectangle.setVisible(false);   // Set invisible
    }

}