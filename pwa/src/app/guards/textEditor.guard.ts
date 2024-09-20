import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { TextEditorService } from '../components/text-editor/text-editor.component';
import { catchError, EmptyError, of, throwError, throwIfEmpty } from 'rxjs';

export const textEditorGuard: CanActivateFn = (route) => {
  const textEditorService = inject(TextEditorService);

  if (textEditorService.activeEditor) {
    return textEditorService.activeEditor
      .discardChangesWithConfirmation()
      .pipe(
        throwIfEmpty(),
        catchError(err => {
          if(err instanceof EmptyError) {
            window.history.pushState(route.data, undefined, route.url.toString());
            return of(false);
          }

          return throwError(err);
        })
      );
  }

  return true;
};
