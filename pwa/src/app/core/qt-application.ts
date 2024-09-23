import { EMPTY, Observable, of, Subject } from 'rxjs';
import { HttpErrorResponse, HttpEvent, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';

declare interface QObject {}

declare interface QSignal<TCallback = (...args: unknown[]) => void> {
  connect(callback: TCallback): void;
}

export type QHeaders = { [key: string]: string };

declare class ApplicationObject implements QObject {
  public httpRequestReady: QSignal<(requestId: string, statusCode: number, data: string, headers: QHeaders) => void>;

  public httpRequest(method: string, url: string, data: string): Promise<string>;
}

declare interface QChannel {
  objects: { proxy: ApplicationObject };
}

declare class QWebChannel {
  public constructor(transport: unknown, callback: (channel: QChannel) => void);
}

export interface ResponseData {
  statusCode: number;
  data?: string;
  headers: QHeaders;
}

interface SentRequest {
  resolve(data: ResponseData): void;
}

function base64ToBlob(val: string): Blob {
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

  public static instance(): QtApplication {
    return QtApplication._instance;
  }

  public static isAvailable(): boolean {
    return !!window['qt'];
  }

  public static create(): Observable<QtApplication> {
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

  public sendHttpRequest(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
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

  private initialize(channel: QChannel): void {
    this._proxy = <ApplicationObject>channel.objects.proxy;

    this._proxy.httpRequestReady.connect((requestId, statusCode, data, headers) => {
      this._promises[requestId].resolve({ statusCode, data, headers });

      delete this._promises[requestId];
    });

    this._readySubject.next(this);
    this._readySubject.complete();
  }

  private parseQtResponseBody(request: HttpRequest<unknown>, data?: string): unknown {
    switch (request.responseType) {
      case 'json':
        return data ? JSON.parse(data) : null;
      case 'blob':
        return data ? base64ToBlob(data) : null;
      default:
        return data;
    }
  }

  private processQtApplicationResponse(request: HttpRequest<unknown>, response: ResponseData): HttpResponse<unknown> {
    if (response.statusCode !== 200) {
      return new HttpResponse({
        status: response.statusCode,
        statusText: response.data,
        url: request.url,
        headers: new HttpHeaders(response.headers),
      });
    }

    const parsedBody = this.parseQtResponseBody(request, response.data);
    return new HttpResponse({
      status: response.statusCode,
      body: parsedBody,
      url: request.url,
      headers: new HttpHeaders(response.headers),
    });
  }

  private sendHttpRequestInner(method, url, data): Promise<ResponseData> {
    return this._proxy
      .httpRequest(method, url, data)
      .then(requestId => {
        let resolveCallback = null;
        const promise = new Promise<ResponseData>((resolve) => {
          resolveCallback = resolve;
        });

        this._promises[requestId] = <SentRequest>{
          resolve: resolveCallback,
        };

        return promise;
      });
  }
}
