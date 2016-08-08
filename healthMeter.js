/**
 Copyright (c) 2016 Matthias Hager <matthias@2helixtech.com>

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

Phaser.Plugin.HealthMeter = function(game, parent) {
    Phaser.Plugin.call(this, game, parent);
    this.options = {};

    this.options.mode = 'text';
    this.options.icon = null;
    this.options.x = 50;
    this.options.y = 50;
    this.options.width = 32;
    this.options.height = 32;
    this.options.rows = 1;
    this.options.font = {
            font: "20px monospace",
            fill: "#fff"
        };

    this.options.foreground = '#00ff00';
    this.options.background = '#333333';
    this.options.alpha = 0.4;
};

Phaser.Plugin.HealthMeter.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.HealthMeter.constructor = Phaser.Plugin.SamplePlugin;

Phaser.Plugin.HealthMeter.prototype._setupOptions = function(options) {
    for (option in this.options) {
        if (option in options) {
            this.options[option] = options[option];
        }
    }
};

Phaser.Plugin.HealthMeter.prototype.text = function(char) {
    this.char = char;
    options = arguments[1] || {};

    this.options.mode = 'text';
    this._setupOptions(options);

    this._draw();
};

Phaser.Plugin.HealthMeter.prototype.icons = function(char) {
    /*
    Can pass an options array to override default options.
    Options should contain an icon name for the sprite used.
    maxHealth should be divisible by rows.
     */
    
    this.char = char;
    options = arguments[1] || {};
    
    this.options.mode = 'icons';
    this._setupOptions(options);
};

Phaser.Plugin.HealthMeter.prototype.bar = function(char) {
    this.char = char;
    options = arguments[1] || {};

    this.options.mode = 'bar';
    this._setupOptions(options);
};

Phaser.Plugin.HealthMeter.prototype._draw = function() {
    if (this.options.mode == 'text') {
        this.updateText();
    }

    else if (this.options.mode == 'icons') {
        this.updateIcons();
    }

    else if (this.options.mode == 'bar') {
        this.updateBar();
    }
};

Phaser.Plugin.HealthMeter.prototype.update = function() {
    if (!this.char) {
        return;
    }

    if (this.char.health === this.oldHealth) {
        return;
    }

    this._draw();

    this.oldHealth = this.char.health;
};

Phaser.Plugin.HealthMeter.prototype.updateText = function() {

    if (!this.healthText) {
        this.healthText = this.game.add.text(this.options.x, this.options.y, this.healthPrint(), this.options.font);
        this.healthText.fixedToCamera = true;
    }

    this.healthText.text = this.healthPrint();
};

Phaser.Plugin.HealthMeter.prototype.updatePercent = function() {};

Phaser.Plugin.HealthMeter.prototype.updateBar = function() {

    if (!this.healthBar) {
        var bmd = this.game.add.bitmapData(this.options.width, this.options.height);
        bmd.ctx.beginPath();
        bmd.ctx.rect(0, 0, this.options.width, this.options.height);
        bmd.ctx.fillStyle = this.options.background;
        bmd.ctx.fill();

        var backBar = this.game.add.sprite(this.options.x, this.options.y, bmd);
        backBar.alpha = this.options.alpha;
        backBar.fixedToCamera = true;

        bmd = this.game.add.bitmapData(this.options.width, this.options.height);
        bmd.ctx.beginPath();
        bmd.ctx.rect(0, 0, this.options.width, this.options.height);
        bmd.ctx.fillStyle = this.options.foreground;;
        bmd.ctx.fill();
        this.healthBar = this.game.add.sprite(this.options.x, this.options.y, bmd);
        this.healthBar.width = (this.char.health / this.char.maxHealth) * this.options.width;
        this.healthBar.fixedToCamera = true;

        return;
    }

    this.game.add.tween(this.healthBar).to(
        {width: (this.char.health / this.char.maxHealth) * this.options.width},
        200, "Linear", true
    );
};

Phaser.Plugin.HealthMeter.prototype.updateIcons = function() {
    // if setting icons, you want to set maxHealth to be the max it EVER will be
    if (!this.options.icon) {
        return;
    }

    if (!this.healthIcons) {
        this.healthIcons = this.game.add.group();
        this.healthIcons.fixedToCamera = true;

        var icons_per_row = this.char.maxHealth / this.options.rows;

        // we do these in reverse so when we use getFirstAlive() with the group
        // we always remove icons from the bottom right to the top left
        for (var row=this.options.rows - 1; row>=0; row--) {
            for (var i=icons_per_row - 1; i>=0; i--) {
                var icon = this.healthIcons.create(
                    this.options.x + ((this.options.width + 2) * i),
                    this.options.y + ((this.options.height + 2) * row),
                    this.options.icon
                );
                icon.anchor.setTo(0, 0);
                // icon.scale.setTo(1, 1); // improve this so we actually scale to width?
                icon.width = this.options.width;
                icon.height = this.options.height;
            }
        }
    }

    while (this.healthIcons.countLiving() > this.char.health) {
        var icon = this.healthIcons.getFirstAlive();
        icon.kill();
    }

    while (this.healthIcons.countLiving() < this.char.health &&
        this.healthIcons.countLiving() < this.char.maxHealth) {

        // finding the lastDead icon by finding the firstAlive, then going down its index by 1
        // must be a more direct way of doing this?
        var index = this.healthIcons.getChildIndex(this.healthIcons.getFirstAlive());

        if (!index || index <= 0) {
            return;
        }

        var icon = this.healthIcons.getChildAt(index-1);

        if (icon) {
            icon.reset(icon.x, icon.y);
        }
    }
};


Phaser.Plugin.HealthMeter.prototype.healthPrint = function() {
    return this.char.health + ' / ' + this.char.maxHealth;
};