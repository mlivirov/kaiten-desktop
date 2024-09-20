import { debounceTime, Observable, OperatorFunction, switchMap } from 'rxjs';
import { inject } from '@angular/core';
import { Tag } from '../../models/tag';
import { TagService } from '../../services/tag.service';

export function TagsTypeaheadOperator(): OperatorFunction<string, readonly Tag[]> {
  const tagService = inject(TagService);

  return (text$: Observable<string>) =>
    text$
      .pipe(
        debounceTime(200),
        switchMap(term => {
          return tagService.getTags(0, 10, term);
        })
      );
}