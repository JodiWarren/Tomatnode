var fs           = require('fs'),
	wav          = require('wav'),
	Speaker      = require('speaker'),
	resolutions  = require('time-resolutions'),
	argv         = require('yargs').argv
	Notification = require('node-notifier'),
	pomTime      = argv.pom,
	shortBreak   = argv.short,
	longBreak    = argv.long,
	mute         = argv.mute;


// Time will be in minutes, so convert to miliseconds
var minsToMilliseconds = function(time) {
	return time*60*1000;
}

var notifier = new Notification();

var tomatnode = {
	pomTime : minsToMilliseconds(pomTime),
	shortBreak : minsToMilliseconds(shortBreak),
	longBreak : minsToMilliseconds(longBreak),
	pomCount : 0,
	breakCount : 0,
	currentTime : 0,
	currentStatus : 'pom',
	currentTimer : null,
	init : function(){
		switch (this.currentStatus) {
			case "pom":
				this.pomTimer();
			break;
			case "shortBreak":
				this.shortBreakTimer();
			break;
			case "longBreak":
				this.longBreakTimer();
			break;
			default:
				console.log("Sorry, we are out of " + this.currentStatus + ".");
				exit()
			break;
		}
	},
	playSound: function(filename) {
		if ( mute || ! filename ) {
			return;
		}
		var audioFile = fs.createReadStream(filename);
		var reader = new wav.Reader();
		reader.on('format', function(format){
			reader.pipe(new Speaker(format));
		})
		audioFile.pipe(reader);
	},
	pad: function(num, size) {
	if (! size) {
		size = 2;
	}
    var s = "000000000" + num;
    return s.substr(s.length-size);
	},
	displayTime : function(time) {
		var ms = this.pad(time % 1000);
		time = (time - ms) / 1000;
		var secs = this.pad(time % 60);
		time = (time - secs) / 60;
		var mins = this.pad(time % 60);
		var hrs = this.pad((time - mins) / 60);

		process.stdout.clearLine();  // clear current text
		process.stdout.cursorTo(0);  // move cursor to beginning of line
		if (hrs > 0) {
			process.stdout.write(hrs + ':' + mins + ':' + secs);
		} else {
			process.stdout.write(mins + ':' + secs);
		}

	},
	pomTimer : function(){
		notifier.notify({
			title: 'Tomatnode',
			icon: __dirname + "/tomato.png",
		    message: 'Starting pomodoro'
		});
		console.log('\nStarting pomodoro');
		this.playSound('2.wav');
		var currentTimer = setInterval(function pomInterval(){
			tomatnode.currentTime = tomatnode.currentTime + 1000;
			if (tomatnode.currentTime >= tomatnode.pomTime) {
				clearInterval(currentTimer);
				tomatnode.currentTimer = null;
				tomatnode.currentTime = 0;
				if (tomatnode.breakCount > 2) {
					tomatnode.currentStatus = 'longBreak';
				} else {
					tomatnode.currentStatus = 'shortBreak';
				}
				tomatnode.pomCount++;
				tomatnode.init();
			} else {
				tomatnode.displayTime(tomatnode.currentTime);
			}
		}, 1000);
	},
	shortBreakTimer : function(){
		notifier.notify({
			title: 'Tomatnode',
		    message: 'Short break time!',
			icon: __dirname + "/tomato.png",
		});
		console.log('\nStarting short break');
		tomatnode.playSound('1.wav');
		var currentTimer = setInterval(function pomInterval(){
			tomatnode.currentTime = tomatnode.currentTime + 1000;
			if (tomatnode.currentTime >= tomatnode.shortBreak) {
				clearInterval(currentTimer);
				tomatnode.currentTimer = null;
				tomatnode.currentTime = 0;
				tomatnode.breakCount++;
				tomatnode.currentStatus = 'pom';
				tomatnode.init();
			} else {
				tomatnode.displayTime(tomatnode.currentTime);
			}
		}, 1000);
	},
	longBreakTimer : function(){
		notifier.notify({
			title: 'Tomatnode',
			icon: __dirname + "/tomato.png",
		    message: 'Long break time!'
		});
		console.log('\nStarting long break');
		tomatnode.playSound('3.wav');
		var currentTimer = setInterval(function pomInterval(){
			tomatnode.currentTime = tomatnode.currentTime + 1000;
			if (tomatnode.currentTime >= tomatnode.longBreak) {
				clearInterval(currentTimer);
				tomatnode.currentTimer = null;
				tomatnode.currentTime = 0;
				tomatnode.breakCount = 0;
				tomatnode.currentStatus = 'pom';
				tomatnode.init();
			} else {
				tomatnode.displayTime(tomatnode.currentTime);
			}
		}, 1000);
	}
}

tomatnode.init();