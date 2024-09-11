import { EMPTY, Observable, of, Subject } from 'rxjs';
import { HttpErrorResponse, HttpEvent, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';

declare interface QObject {}

declare interface QSignal<TCallback = (...args: any) => void> {
  connect(callback: TCallback): void;
}

export type QHeaders = { [key: string]: string };

declare class ApplicationObject implements QObject {
  httpRequestReady: QSignal<(requestId: string, statusCode: number, data: string, headers: QHeaders) => void>
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
  headers: QHeaders;
}

interface SentRequest {
  resolve(data: ResponseData): void;
}

function base64ToBlob(val: string) {
  const separatorIndex = val.indexOf(':');
  const type = val.substring(0, separatorIndex);
  const base64 = val.substring(separatorIndex + 1);

  const data = Uint8Array.from(atob(base64).split(''), c => c.charCodeAt(0));
  return new Blob([data], { type });
}

export class QtApplication {
  private static _instance: QtApplication;
  private readonly _readySubject: Subject<QtApplication> = new Subject();

  private readonly _promises: { [key: string]: SentRequest } = {};
  private readonly _channel: QWebChannel;
  private _proxy: ApplicationObject;

  private constructor() {
    this._channel = new QWebChannel(window['qt'].webChannelTransport, (channel) => this.initialize(channel));
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

    this._proxy.httpRequestReady.connect((requestId, statusCode, data, headers) => {
      this._promises[requestId].resolve({ statusCode, data, headers });

      delete this._promises[requestId];
    });

    this._readySubject.next(this);
    this._readySubject.complete();
  }

  private parseQtResponseBody(request: HttpRequest<any>, data?: string) {
    switch (request.responseType) {
      case 'json':
        return data ? JSON.parse(data) : null;
      case 'blob':
        return data ? base64ToBlob(data) : null;
      default:
        return data;
    }
  }

  private processQtApplicationResponse(request: HttpRequest<any>, response: ResponseData): HttpResponse<any> {
    if (response.statusCode !== 200) {
      return new HttpResponse({
        status: response.statusCode,
        statusText: response.data,
        url: request.url,
        headers: new HttpHeaders(response.headers),
      })
    }

    const parsedBody = this.parseQtResponseBody(request, response.data);
    return new HttpResponse({
      status: response.statusCode,
      body: parsedBody,
      url: request.url,
      headers: new HttpHeaders(response.headers),
    });
  }


  sendHttpRequest(request: HttpRequest<any>): Observable<HttpEvent<any>> {
    const serializedRequestBody = request.serializeBody();
    if (!(serializedRequestBody === null || typeof serializedRequestBody === 'string')) {
      throw('not supported body type');
    }

    return new Observable(subscriber => {
      QtApplication
        .instance()
        .sendHttpRequestInner(
          request.method,
          request.url,
          serializedRequestBody as string
        )
        .then(response => {
          try {
            const httpResponse = this.processQtApplicationResponse(request, response);

            if (httpResponse.status !== 200) {
              subscriber.error(new HttpErrorResponse(httpResponse));
            } else {
              subscriber.next(httpResponse);
            }
          } catch (e) {
            subscriber.error(new HttpErrorResponse({
              status: 0,
              statusText: 'Middleware error',
              error: e
            }));
          }

          subscriber.complete();
        });
    });
  }


  private sendHttpRequestInner(method, url, data): Promise<ResponseData> {
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