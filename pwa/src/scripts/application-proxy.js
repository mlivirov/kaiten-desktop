function ApplicationProxy() {
}

ApplicationProxy.prototype.initialize = function () {
    self = this;
    self.promises = {};

    let promiseResolve = null;
    const promise = new Promise((resolve, reject) => {
        promiseResolve = resolve;
    });

    self.channel = new QWebChannel(qt.webChannelTransport, function (channel) {
        self.proxy = channel.objects.proxy;

        self.proxy.httpRequestReady.connect((requestId, statusCode, data) => {
            self.promises[requestId].resolve({ statusCode, data });

            delete self.promises[requestId];
        });

        promiseResolve();
    });

    return promise;
}

ApplicationProxy.prototype.httpRequest = function (method, url, data) {
    return this.proxy
        .httpRequest(method, url, data)
        .then(requestId => {
            let promise_resolve = null;
            let promise_reject = null;
            const promise = new Promise((resolve, reject) => {
                promise_resolve = resolve;
                promise_reject = reject;
            });

            this.promises[requestId] = {
                resolve: promise_resolve,
                reject: promise_reject,
                promise: promise
            }

            return promise;
        });
}