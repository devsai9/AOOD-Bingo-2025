

let interval = 2;
let paused = false;

export const Settings = {
    get interval() {
        return interval;
    },
    set interval(val) {
        interval = val;
    },
    get paused() {
        return paused;
    },
    set paused(val) {
        paused = val;
    }
};
