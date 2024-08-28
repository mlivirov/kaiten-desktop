import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HttpBackend, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TimeagoModule } from 'ngx-timeago';
import { EMPTY, from } from 'rxjs';
import { DragulaModule } from 'ng2-dragula';
import { errorInterceptor } from './interceptors/error.interceptor';
import { AppHttpBackend } from './http-backend';

declare class ApplicationProxy {
  initialize(): Promise<void>;
  httpRequest(method: string, url: string, data: string): Promise<{ statusCode: number, data: string }>;
}

function applicationProxyFactory() {
  if (!window['qt']) {
    return EMPTY;
  }

  const applicationProxy = new ApplicationProxy();
  const promise = applicationProxy
    .initialize()
    .then(() => {
      window['ApplicationProxy'] = applicationProxy;

      return Promise.resolve();
    });

  return from(promise);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([errorInterceptor])
    ),
    importProvidersFrom(
      TimeagoModule.forRoot(),
      DragulaModule.forRoot()
    ),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => applicationProxyFactory,
    },
    {
      provide: HttpBackend,
      useClass: AppHttpBackend
    }
  ],
};
