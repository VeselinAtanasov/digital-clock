/**
 * Function which is called from index.html
 */
function onReady() {
    let clock = new AlarmClock('clock', +180);
    // let clock2 = new TextClock('clock2', 0, 'UTC');
    // let clock3 = new Clock('clock3', +300, 'N/A');

}

/**
 * Using built in Date class, as overriding and adding additional methods
 */
Date.__interval = 0;
Date.__aDates = [];
Date.addToInterval = function (date) {
    Date.__aDates.push(date);
    if (!Date.__interval) {
        Date.__interval = setInterval(Date.updateDates.bind(this), 1000);
    }
};

Date.updateDates = function () {

    for (let i = 0; i < Date.__aDates.length; i++) {
        if (Date.__aDates[i] instanceof Date) {
            Date.__aDates[i].updateSeconds();
        } else if (Date.__aDates[i] instanceof Function) {
            Date.__aDates[i]();
        } else if (Date.__aDates[i] && Date.__aDates[i]['update']) {
            Date.__aDates[i]['update']();
        }

    }
};
Date.prototype.updateSeconds = function () {
    this.setSeconds(this.getSeconds() + 1);
};

Date.prototype.autoClock = function (isAuto) {
    if (isAuto) {
        Date.addToInterval(this);
    }
};

/**
 * Class clock
 * @param {*} elementId 
 * @param {*} offset 
 * @param {*} label 
 */
function Clock(elementId, offset, label) {
    offset = offset || 0;
    label = label || '';

    let d = new Date();
    let currentOffset = (offset + d.getTimezoneOffset()) * 60 * 1000;

    this.d = new Date(currentOffset + d.getTime());
    this.d.autoClock(true);
    this.id = elementId;
    this.label = label;

    this.tick(true);
    Date.addToInterval(this.updateClock.bind(this));
}

Clock.prototype.tick = function (isTicking) {
    this.isTicking = isTicking;
};

Clock.prototype.updateClock = function () {
    if (this.isTicking) {
        this.clock = document.getElementById(this.id);
        this.clock.innerHTML = this.formatOutput(this.d.getHours(), this.d.getMinutes(), this.d.getSeconds(), this.label);
    }
};

Clock.prototype.formatOutput = function (hours, minutes, seconds, label) {
    return (this.formatDigits(hours) + ':' +
        this.formatDigits(minutes) + ':' +
        this.formatDigits(seconds) + ' ' + label);
};

Clock.prototype.formatDigits = function (value) {
    if (Number(value) < 10) {
        value = '0' + value;
    }
    return value;
};


/**
 * Class TextClock which inherits Clock
 * @param {*} id 
 * @param {*} offset 
 * @param {*} label 
 */
function TextClock(id, offset, label) {
    //using apply or call to assign the correct scope
    Clock.apply(this, arguments);
};

TextClock.prototype = Object.create(Clock.prototype);
//Some old browser do not support Object.create() here is the workaround:
function createObject(proto) {
    //create custom constructor:
    function c() { }
    //override the prototype
    c.prototype = proto;
    //return new object form the constructor function;
    return new c();
}
//Usage of workaround solution:
//TextClock.prototype = createObject(Clock.prototype);

// Achieving inheritance by overriding the prototype and constructor:
TextClock.prototype.constructor = TextClock;

//Override method of the parent class:
TextClock.prototype.formatOutput = function (hours, minutes, seconds, label) {
    return (this.formatDigits(hours) + ' Hours ' +
        this.formatDigits(minutes) + ' Minutes ' +
        this.formatDigits(seconds) + ' Seconds ' + label);
};

/**
 * Class AlarmClock which inherits TextClock
 * @param {*} id 
 * @param {*} offset 
 * @param {*} label 
 */
function AlarmClock(id, offset, label) {
    Clock.apply(this, arguments);

    this.doUpdate = true;
    this.dom = document.getElementById(id);
    this.dom.contentEditable = true;

    this.dom.addEventListener('focus', this.onFocus.bind(this, false));
    this.dom.addEventListener('blur', this.onBlur.bind(this, true));

    //** This is the way to listen/catch events emitted from particular dom element
    this.dom.addEventListener('restart_tick', function (e) {
        this.tick(true);
    }.bind(this));
};

AlarmClock.prototype = Object.create(Clock.prototype);
AlarmClock.prototype.constructor = AlarmClock;

AlarmClock.prototype.onFocus = function (state) {
    this.tick(state);
    this.clock.innerHTML = this.clock.innerHTML.slice(0, this.clock.innerHTML.lastIndexOf(':'));
};

AlarmClock.prototype.onBlur = function (state) {
    let a = this.clock.innerHTML.toString().split(':');
    this.alarmHours = Number(a[0]);
    this.alarmMinutes = Number(a[1]);

    if ((this.alarmHours >= 0 && this.alarmHours < 24) && (this.alarmMinutes >= 0 && this.alarmMinutes < 60)) {
        //** This is the way emit/dispatch events from dom element in order to be caught
        let event = new Event('restart_tick');
        this.dom.dispatchEvent(event);
    }
};

AlarmClock.prototype.formatOutput = function (hours, minutes, seconds, label) {

    if (Number(hours) === Number(this.alarmHours) && Number(minutes) === Number(this.alarmMinutes)) {
        var sound = new Audio('art/beep.wav');
        sound.play();
        return "ALARM WAKE UP";
    }
    //Using the parent method by changing the context using apply
    return (Clock.prototype.formatOutput.apply(this, [hours, minutes, seconds, label]));
};

//Start the app
window.onload = onReady;