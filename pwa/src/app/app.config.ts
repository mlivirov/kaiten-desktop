import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HttpBackend, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TimeagoModule } from 'ngx-timeago';
import { EMPTY, from } from 'rxjs';
import { DragulaModule } from 'ng2-dragula';
import { errorInterceptor } from './interceptors/error.interceptor';
import { HttpBackendDecorator } from './core/http-backend-decorator';
import { QtApplication } from './core/qt-application';

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
      useFactory: () => QtApplication.create,
    },
    {
      provide: HttpBackend,
      useClass: HttpBackendDecorator
    }
  ],
};
