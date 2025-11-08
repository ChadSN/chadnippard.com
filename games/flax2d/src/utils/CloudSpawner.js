export class CloudSpawner {
    constructor(scene) {
        this.scene = scene;
    }

    spawnClouds(depth, cloudYMin, cloudYMax) {
        this.createCloud(depth, cloudYMin, cloudYMax);                                  // Create the initial cloud
        this.scheduleNextCloud(depth, cloudYMin, cloudYMax);                            // Start the cloud spawning timer
    }

    createCloud(depth, cloudYMin, cloudYMax) {
        const randomScale = Phaser.Math.FloatBetween(0.5, 2);                           // Random scale for depth effect
        const randomAlpha = Phaser.Math.FloatBetween(0.5, 1);                           // Random alpha for depth effect
        const cloudWidth = this.scene.textures.get('cloud').getSourceImage().width;     // Get the width of the cloud image
        const randomY = Phaser.Math.Between(cloudYMin, cloudYMax);                      // Generate random Y position within the range
        const cloudX = this.scene.cameras.main.scrollX + this.scene.cameras.main.width;

        this.cloudTween(                                                                // Create a tween to move the cloud across the screen
            this.scene.add.image(cloudX + cloudWidth, randomY, 'cloud')                 // Spawn cloud off-screen to the right
                .setScale(randomScale)                                                  // Set scale based on depth
                .setAlpha(randomAlpha)                                                  // Set transparency based on depth
                .setDepth(depth)                                                        // Clouds at depth 1 to appear behind other elements
        );
    }

    // Schedule the next cloud spawn
    scheduleNextCloud(depth, cloudYMin, cloudYMax) {
        const randomDelay = Phaser.Math.Between(1000, 3000);                            // Random delay between 1 and 3 seconds
        this.scene.time.addEvent({
            delay: randomDelay,                                                         // Delay before spawning the next cloud
            callback: () => {                                                           // Callback to create a new cloud
                this.createCloud(depth, cloudYMin, cloudYMax);                          // Create a new cloud
            },
            loop: true                                                                  // Repeat indefinitely
        });
    }

    // Create a tween for the cloud movement
    cloudTween(cloud) {
        const velocity = Phaser.Math.Between(50, 100);                                  // Set a constant velocity (pixels per second)
        const distance = cloud.x;                                                       // Distance to travel (from current x to off-screen at -cloud.width)
        const duration = (distance / velocity) * 1000;                                  // Calculate duration in milliseconds
        this.scene.tweens.add({
            targets: cloud,                                                             // Target the cloud image
            x: 0 - cloud.width,                                                         // Move cloud off-screen to the left
            duration: duration,                                                         // Use the calculated duration
            ease: 'Linear',                                                             // Linear easing for constant speed
            onComplete: () => {                                                         // When the tween is complete
                cloud.destroy();                                                        // Destroy cloud after it moves off-screen
            }
        });
    }
}