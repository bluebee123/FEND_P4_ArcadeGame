var App = (function(global) {
    "use strict";
    var X_WIDTH = 101; //width of each "field"
    var Y_HEIGHT = 83; //height of each "field"
    var numEnemies = 0; //stores the number of enemies on the field
    var MAXENEMIES = 4; // defines the max number of enemies on the field
    var X_MAX = 5; //tge field is 5 fields wide
    var Y_MAX = 6; //6 fields high
    var NUM_ROCKS = 3; // there are NUM_ROCKS rocks on the field which can not be traversed by the player
    var NUM_GEMS = 3; //there are NUM_GEMS collectible gems on the field
    var allEnemies = []; //enemy objects go in this array
    var allObjects = []; // rocks, gems go in this array
    var ROCK = 1; // some constants for better readbility
    var GEM = 2;
    var NOOBJECT = 0;
    //scoreboard data
    var wins = 0;
    var losses = 0;
    var score = 0;
    var dict = {}; //this dict serves as hashmap for easy acces to all non-player/enemy objects
    //update the wins/losses statistics
    function updateStatistics() {
        updateTextById('wins',  wins);
        updateTextById('losses', losses);
        updateTextById('gems', score);
    }
    //removes any previous children of the id node and adds a new text node as child to the id. this is safer than using something such as innerHTML
    function updateTextById(id, text) {
        var span = document.getElementById(id);
        while (span.firstChild) {
            span.removeChild(span.firstChild);
        }
        span.appendChild(document.createTextNode(text));
    }
    //returns the object type on the given x,y
    function getObject(x, y) {
        var key = x + "-" + y;
        if (dict[key]) {
            return dict[key].iType;
        }
        return NOOBJECT;
    }
    //debug function which prints the positions of the player as well as the enemies.
    function printPositions() {
        console.log("Player position: x: " + player.x + " y: " + player.y);
        for (var i = 0; i < MAXENEMIES; i++) {
            console.log("Enemy " + i + " position: x: " + allEnemies[i].x + " y:" + allEnemies[i].y);
        }
    }
    //removes an entry from the dictionary
    function dictRemove(x, y) {
        var key = dictGetKey(x, y);
        var obj = dict[key];
        obj.visible = false;
        obj.x = -100;
        obj.y = -100;
        delete dict[key];
    }
    //creates a unique key using the x-y coordinates of objects
    //this is unique because it is secured that no 2 objects occupy the same
    //position. however, at more complex programs there is need for a more uniqe key.
    function dictGetKey(x, y) {
        var str = x + "-" + y;
        return str;
    }
    // Enemies our player must avoid
    var Enemy = function(id) {
        // Variables applied to each of our instances go here,
        // we've provided one for you to get started
        // The image/sprite for our enemies, this uses
        // a helper we've provided to easily load images
        this.sprite = 'images/enemy-bug.png';
        this.visible = false;
        this.id = id;
        //this.onStartfield = false;
        this.setSpeed();
    };
    /*lets an enemy spawn on one of the 3 pavement lines*/
    Enemy.prototype.spawn = function() {
        //pick a random entry point, a y value between 1 and 3, the indices of the pavement
        this.y = Math.floor((Math.random() * 3) + 1);
        this.setSpeed();
        this.x = 0;
        this.y = this.y * Y_HEIGHT;
        numEnemies++;
        this.visible = true;
    };
    /*despawns an enemy*/
    Enemy.prototype.despawn = function() {
        this.visible = false;
        this.x = -100;
        numEnemies--;
    };
    // Update the enemy's position, required method for game
    // Parameter: dt, a time delta between ticks
    Enemy.prototype.update = function(dt) {
        // You should multiply any movement by the dt parameter
        // which will ensure the game runs at the same speed for
        // all computers.
        //if this enemy is not yet visible and there are less than MAXENEMIS
        //enemies on the field...
        if (this.visible === false && numEnemies < MAXENEMIES) {
            //a 1/50 chance that this bug spawns
            if (Math.floor((Math.random() * 50) + 1) === 1) {
                this.spawn();
            }
        } else if (this.visible === true) {
            //this bug is on the field already, proceed according to speed and dt parameter
            this.x += this.speed * dt;
            if (this.eatsPlayer()) {
                //console.log("YUMYUM");
                losses++;
                player.reset();
            }
            //if this bug has reached the right border of the field, despawn
            if (this.x > X_MAX * X_WIDTH) {
                this.despawn();
            }
        }
    };
    //set a random speed, there are 6 different speeds multiplied by a sensible multiplier
    Enemy.prototype.setSpeed = function() {
        this.speed = 50 * Math.floor((Math.random() * 6) + 1);
    };
    //checks if the enemy collides with player i.e. eats him
    //the y is either equal or not, for x the outer borders of the sprites are checked.
    Enemy.prototype.eatsPlayer = function() {
        if (player.y === this.y) { // === suffices because the player moves in steps. Needs to be adapted when smooth motion of player should be implemented.
            if ((player.x > this.x && player.x < this.x + 75) || (player.x + 70 > this.x && player.x + 70 < this.x + 75)) {
                return true;
            }
        }
        //no collision detected
        return false;
    };
    // Draw the enemy on the screen, required method for game
    Enemy.prototype.render = function() {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    };

    //Fieldobject class for all other "things" on the field, i.e. rocks and gems.
    var Fieldobject = function(bcollectable, bcrossable, stsprite, iType) {
        this.collectable = bcollectable;
        this.crossable = bcrossable;
        this.visible = true;
        this.sprite = stsprite;
        this.iType = iType;
    };
    //renders the object
    Fieldobject.prototype.render = function() {
        if (this.visible) {
            ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
        }
    };
    //calculates a random position on the field. If that position is not occupied by something else, the object is
    //placed there.
    Fieldobject.prototype.calculatePosition = function() {
        var pos = Math.floor(Math.random() * 3 * X_MAX) + X_MAX; //calculate a random index in the field
        this.x = (pos % X_MAX) * X_WIDTH;
        this.y = Math.floor(pos / X_MAX) * Y_HEIGHT;
        while (dict[dictGetKey(this.x, this.y)]) {
            pos = Math.floor(Math.random() * 3 * X_MAX) + X_MAX;
            this.x = (pos % X_MAX) * X_WIDTH;
            this.y = Math.floor(pos / X_MAX) * Y_HEIGHT;
        }
        dict[dictGetKey(this.x, this.y)] = this;
        //      console.log(dict);
    };

    //fill the enemy and object arrays with enemys, gems and rocks
    //the number of gems/rocks can be defined on top.
    for (var i = 0; i < MAXENEMIES; i++) {
        allEnemies.push(new Enemy(i));
    }
    for (var j = 0; j < NUM_ROCKS; j++) {
        allObjects.push(new Fieldobject(false, false, 'images/Rock.png', ROCK));
    }
    for (i = 0; i < NUM_GEMS; i++) {
        allObjects.push(new Fieldobject(true, true, 'images/Gem Green.png', GEM));
    }
    //resets the objects i.e. calculates completely new positions for them.
    function resetObjects() {
        dict = {};
        var num = NUM_GEMS + NUM_ROCKS;
        for (i = 0; i < num; i++) {
            var obj = allObjects[i];
            obj.visible = true; //set visible to true, important for gems
            obj.calculatePosition();
        }
    }
    // Now write your own player class
    // This class requires an update(), render() and
    // a handleInput() method.
    var Player = function() {
        this.sprite = 'images/char-boy.png';
        this.reset();
    };
    Player.prototype.reset = function() {
        //starting position is center field of the bottom row
        this.x = 2 * X_WIDTH;
        this.y = 5 * Y_HEIGHT;
        updateStatistics(); //update statistics after each reset (so either a loss or a win)
    };
    Player.prototype.update = function() {
        //check the player position for gems or for if the player has reached
        //the top row
        if (getObject(this.x, this.y) === GEM) {
            console.log(dict);
            dictRemove(this.x, this.y);
            console.log(dict);
            score++;
            updateStatistics();
        }
        if (this.y === 0) {
            //player reached water!
            //console.log("You Won!");
            wins++;
            this.reset();
            resetObjects(); //reset the objects as well after each win
        }
        //  printPositions();
    };
    Player.prototype.render = function() {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    };
    Player.prototype.handleInput = function(dir) {
        //switch cascade for the input,
        //it is checked whether there is a rock at the position
        //where the player intends to go. no movement happens if there
        //is either a rock, or the border of the playing field.
        switch (dir) {
            case 'left': //left
                if (getObject(this.x - X_WIDTH, this.y) === ROCK) {
                    break;
                }
                if (this.x * X_WIDTH > 0) {
                    this.x -= X_WIDTH;
                }
                break;
            case 'up': //up
                if (getObject(this.x, this.y - Y_HEIGHT) === ROCK) {
                    break;
                }
                if (this.y * Y_HEIGHT > Y_HEIGHT) {
                    this.y -= Y_HEIGHT;
                }
                break;
            case 'right': //right
                if (getObject(this.x + X_WIDTH, this.y) === ROCK) {
                    break;
                }
                //i save X_MAX-1 in this variable, because when I used X_MAX-1 * X_WIDTH
                //directly it would give me REALLY funny values , from NaN to -96 depending
                //on how i put  ( ) . Why?!
                var temp = X_MAX - 1;
                if (this.x < temp * X_WIDTH) {
                    this.x += X_WIDTH;
                }
                break;
            case 'down': //down
                if (getObject(this.x, this.y + Y_HEIGHT) === ROCK) {
                    break;
                }
                temp = Y_MAX - 1;
                if (this.y < temp * Y_HEIGHT) {
                    this.y += Y_HEIGHT;
                }
                break;
            default:
                console.log("invalid key: " + dir);
        }
        //  console.log("position: x: " + this.x + "   y: " + this.y);
    };
    //
    var player = new Player();
    resetObjects();
    // This listens for key presses and sends the keys to your
    // Player.handleInput() method. You don't need to modify this.
    document.addEventListener('keyup', function(e) {
        var allowedKeys = {
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down'
        };
        player.handleInput(allowedKeys[e.keyCode]);
    });
    //global variables
    //global.drawRocks = drawRocks;
    global.allEnemies = allEnemies;
    global.allObjects = allObjects;
    global.player = player;
    // global.playingField = playingField;
    global.NUM_ROCKS = NUM_ROCKS;
})(this);