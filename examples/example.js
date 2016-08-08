// var player;

window.onload = function() {

    var game = new Phaser.Game(960, 320, Phaser.AUTO, '');
    var GameStates = {};

    GameStates.Boot = function(game) {};
    GameStates.Boot.prototype = {
        preload: function() {
            this.load.image('preloadBar', 'assets/images/preloadBar.png');
        },
        create: function() {
            this.state.start('Preload');
        }
    };

    GameStates.Preload = function(game) {};
    GameStates.Preload.prototype = {
        preload: function() {
            this.preloadBar = this.add.sprite(this.world.centerX, this.world.centerY, 'preloadBar');
            this.preloadBar.anchor.setTo(0.5, 0.5);
            this.game.load.setPreloadSprite(this.preloadBar);

            this.game.load.spritesheet('player', 'assets/images/player.png', 32, 48);
            this.game.load.image('heartFull', 'assets/images/heartFull.png');

            this.game.load.image('baseTileset', 'assets/tilemaps/baseTileset.png');
        },

        create: function() {
            this.state.start('Level1');
        }
    };

    GameStates.Level1 = function(game) {};
    GameStates.Level1.prototype = {
        preload: function() {
            this.game.load.tilemap('level1Tilemap', 'assets/tilemaps/level1.json', null, Phaser.Tilemap.TILED_JSON);
        },

        create: function() {

            // setup our map
            this.stage.backgroundColor = "#D3EEFF";
            this.map = this.add.tilemap('level1Tilemap');
            this.map.addTilesetImage('baseTileset', 'baseTileset');
            this.blockLayer = this.map.createLayer('blockLayer');
            this.blockLayer.setScale(2, 2);
            this.blockLayer.resizeWorld();

            // setup our player
            this.player = this.game.add.sprite(32, 100, 'player');
            this.game.physics.arcade.enable(this.player);
            this.player.body.collideWorldBounds = true;
            this.player.body.gravity.y = 1000;
            this.player.health = 10;
            this.player.maxHealth = 10;

            // setup controls
            this.cursors = this.game.input.keyboard.createCursorKeys();

            // setup collisions
            this.map.setCollision(43, true, 'blockLayer'); // ground
            this.map.setTileIndexCallback(38, this.hitLava, this); // lava
            this.map.setCollisionBetween(105, 108, true, 'blockLayer'); // platform

            // create our hearts
            this.hearts = this.game.add.group();
            this.hearts.enableBody = true;

            for (var i=0; i<6; i++) {
                this.hearts.create(100 + Math.random() * 800, 45 + Math.random() * 200, 'heartFull');
            }

            // set up a timer so player is briefly invincible after being damaged
            this.invincibleTimer = 0;

            // finally, setup our health indicator
            this.healthMeterText = this.game.add.plugin(Phaser.Plugin.HealthMeter);
            this.healthMeterText.text(this.player, {x: 400, y: 20, font: {font: "22px arial", fill: "#ff0000" }});

            this.healthMeterIcons = this.game.add.plugin(Phaser.Plugin.HealthMeter);
            this.healthMeterIcons.icons(this.player, {icon: 'heartFull', y: 20, x: 250, width: 16, height: 16, rows: 2});

            this.healthMeterBar = this.game.add.plugin(Phaser.Plugin.HealthMeter);
            this.healthMeterBar.bar(this.player, {y: 20, x: 100, width: 100, height: 20});
        },

        update: function() {
            // handle collisions
            this.game.physics.arcade.collide(this.player, this.blockLayer);
            this.game.physics.arcade.overlap(this.player, this.hearts, this.collectedHeart, null, this);

            this.player.body.velocity.x = 0;

            // update our health indicator
            this.healthMeterText.update();
            this.healthMeterIcons.update();
            this.healthMeterBar.update();

            // handle movement input
            if (this.cursors.right.isDown) {
                this.player.body.velocity.x = 200;
            }
            else if (this.cursors.left.isDown) {
                this.player.body.velocity.x = -200;
            }

            if (this.cursors.up.isDown) {
                this.player.body.velocity.y = -300;
            }
        },

        collectedHeart: function(player, heart) {
            heart.kill();
            if (this.player.health < this.player.maxHealth) {
                this.player.heal(1);
            }
        },

        hitLava: function(player, tile) {
            if (this.game.time.now > this.invincibleTimer) {
                this.player.damage(1);
                this.invincibleTimer = this.game.time.now + 1000;
            }

            // player is dead, start over
            if (this.player.health <= 0) {
                this.game.state.start('Level1');
            }
        }
    };

    game.state.add('Boot', GameStates.Boot);
    game.state.add('Preload', GameStates.Preload);
    game.state.add('Level1', GameStates.Level1);

    game.state.start('Boot');
};