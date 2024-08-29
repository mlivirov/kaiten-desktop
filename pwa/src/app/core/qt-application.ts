import { EMPTY, Observable, of, Subject, take } from 'rxjs';

declare interface QObject {}

declare interface QSignal<TCallback = (...args: any) => void> {
  connect(callback: TCallback): void;
}

declare class ApplicationObject implements QObject {
  httpRequestReady: QSignal<(requestId: string, statusCode: number, data?: string) => void>
  httpRequest(method: string, url: string, data: string): Promise<string>;
}

declare interface QChannel {
  objects: { proxy: ApplicationObject };
}

declare class QWebChannel {
  constructor(transport: any, callback: (channel: QChannel) => void);
}

export interface ResponseData {
  statusCode: number;
  data?: string;
}

interface SentRequest {
  resolve(data: ResponseData): void;
}

export class QtApplication {
  private static _instance: QtApplication;
  private readonly _readySubject: Subject<QtApplication> = new Subject();

  private readonly _promises: { [key: string]: SentRequest } = {};
  private readonly _channel: QWebChannel;
  private _proxy: ApplicationObject;

  private constructor() {
    this._channel = new QWebChannel(window['qt'].webChannelTransport, this.initialize.bind(this));
  }

  static instance(): QtApplication {
    return QtApplication._instance;
  }

  static isAvailable(): boolean {
    return !!window['qt'];
  }

  static create(): Observable<QtApplication> {
    if (!QtApplication.isAvailable()) {
      return EMPTY;
    }

    if (QtApplication._instance) {
      return of(QtApplication._instance);
    }

    const applicationProxy = new QtApplication();
    QtApplication._instance = applicationProxy;

    return applicationProxy._readySubject;
  }

  private initialize(channel: QChannel): void {
    this._proxy = <ApplicationObject>channel.objects.proxy;

    this._proxy.httpRequestReady.connect((requestId, statusCode, data) => {
      this._promises[requestId].resolve({ statusCode, data });

      delete this._promises[requestId];
    });

    this._readySubject.next(this);
    this._readySubject.complete();
  }

  httpRequest(method, url, data): Promise<ResponseData> {
    return this._proxy
      .httpRequest(method, url, data)
      .then(requestId => {
        let resolveCallback = null;
        let rejectCallback = null;
        const promise = new Promise<ResponseData>((resolve, reject) => {
          resolveCallback = resolve;
          rejectCallback = reject;
        });

        this._promises[requestId] = <SentRequest>{
          resolve: resolveCallback,
        };

        return promise;
      });
  }
}