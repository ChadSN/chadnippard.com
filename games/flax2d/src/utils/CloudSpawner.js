export class CloudSpawner {
    constructor(scene) {
        this.scene = scene;
        this.clouds = [];                                                               // Array to hold active clouds
    }

    spawnClouds(depth, cloudYMin, cloudYMax) {
        this.destroyClouds();                                                           // Clear any existing clouds
        for (let i = 0; i < 20; i++)                                                    // Create the initial clouds
            this.createCloud(depth, true, cloudYMin, cloudYMax);                        // Create a cloud at the random X position
        this.scheduleNextCloud(depth, false, cloudYMin, cloudYMax);                     // Start the cloud spawning timer
    }

    createCloud(depth, areInitialClouds, cloudYMin, cloudYMax) {
        const randomScale = Phaser.Math.FloatBetween(0.5, 2);                           // Random scale for depth effect
        const randomAlpha = Phaser.Math.FloatBetween(0.5, 1);                           // Random alpha for depth effect
        const cloudWidth = this.scene.textures.get('cloud').getSourceImage().width;     // Get the width of the cloud image
        const randomY = Phaser.Math.Between(cloudYMin, cloudYMax);                      // Generate random Y position within the range
        const cloudX = areInitialClouds                                                 // If initial clouds, random X within camera view
            ? Phaser.Math.Between(this.scene.cameras.main.scrollX - this.scene.cameras.main.width / 2, this.scene.cameras.main.width)
            : this.scene.cameras.main.scrollX + this.scene.cameras.main.width;          // Else spawn off-screen to the right
        const newCloud = this.scene.add.image(cloudX + cloudWidth, randomY, 'cloud')    // Create cloud image
            .setScale(randomScale)                                                      // Set scale based on depth
            .setAlpha(randomAlpha)                                                      // Set transparency based on depth
            .setDepth(depth);                                                           // Set depth for layering
        this.clouds.push(newCloud);                                                     // Add cloud to the array
        this.cloudTween(newCloud);                                                      // Create a tween to move the cloud across the screen
    }

    scheduleNextCloud(depth, cloudX, cloudYMin, cloudYMax) {
        const randomDelay = Phaser.Math.Between(1000, 3000);                            // Random delay between 1 and 3 seconds
        this.scene.time.addEvent({                                                      // Create a timed event
            delay: randomDelay,                                                         // Delay before spawning the next cloud
            callback: () => { this.createCloud(depth, cloudX, cloudYMin, cloudYMax); }, // Create a new cloud
            loop: true                                                                  // Repeat indefinitely
        });
    }

    cloudTween(cloud) {
        const velocity = Phaser.Math.Between(50, 100);                                  // Set a constant velocity (pixels per second)
        const distance = cloud.x;                                                       // Distance to travel (from current x to off-screen at -cloud.width)
        const duration = (distance / velocity) * 1000;                                  // Calculate duration in milliseconds
        this.scene.tweens.add({                                                         // Create the tween
            targets: cloud,                                                             // Target the cloud image
            x: 0 - cloud.width,                                                         // Move cloud off-screen to the left
            duration: duration,                                                         // Use the calculated duration
            ease: 'Linear',                                                             // Linear easing for constant speed
            onComplete: () => cloud.destroy()                                           // Destroy cloud after it moves off-screen
        });
    }

    destroyClouds() {
        for (let cloud of this.clouds) {                                                // Iterate through clouds 
            cloud.destroy();                                                            // Destroy each cloud
        }
    }
}