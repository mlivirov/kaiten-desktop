// https://github.com/valor-software/ng2-dragula#1-important-add-the-following-line-to-your-polyfillsts

window.global = window;

Date.prototype.elapsed = function() {
    var now = new Date();

    return now - this.getTime();
}