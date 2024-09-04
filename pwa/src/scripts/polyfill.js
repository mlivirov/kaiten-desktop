// https://github.com/valor-software/ng2-dragula#1-important-add-the-following-line-to-your-polyfillsts

window.global = window;

Date.prototype.elapsed = function() {
    return Date.now() - this.getTime();
}


Element.prototype.getAttributeAsNumber = function(name) {
    const value = this.getAttribute(name);
    const parsedValue = Number.parseInt(value, 10);

    return parsedValue === Number.NaN ? null : parsedValue;
}