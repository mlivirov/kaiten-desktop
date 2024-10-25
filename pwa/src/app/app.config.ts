import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HttpBackend, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TimeagoModule } from 'ngx-timeago';
import { DragulaModule } from 'ng2-dragula';
import { errorInterceptor } from './interceptors/error.interceptor';
import { HttpBackendDecorator } from './core/http-backend-decorator';
import { QtApplication } from './core/qt-application';
import { throttleInterceptor } from './interceptors/throttle.interceptor';
import { retryInterceptor } from './interceptors/retry.interceptor';
import { apiInterceptor } from './interceptors/api.interceptor';
import { CordovaApplication } from './core/cordova-application';
import { AutosizeModule } from 'ngx-autosize';
import { ServerCardEditorService } from './services/implementations/server-card-editor.service';
import { CARD_EDITOR_SERVICE } from './services/card-editor.service';
import { ClipboardModule } from 'ngx-clipboard';

const interceptors = [errorInterceptor, throttleInterceptor, retryInterceptor];
if (!QtApplication.isAvailable()) {
  interceptors.push(apiInterceptor);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors(interceptors)
    ),
    importProvidersFrom(
      TimeagoModule.forRoot(),
      DragulaModule.forRoot(),
      AutosizeModule,
      ClipboardModule
    ),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => QtApplication.create,
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => CordovaApplication.create,
    },
    {
      provide: CARD_EDITOR_SERVICE,
      useClass: ServerCardEditorService
    },
    {
      provide: HttpBackend,
      useClass: HttpBackendDecorator
    }
  ],
};
