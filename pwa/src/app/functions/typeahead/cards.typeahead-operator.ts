import { debounceTime, Observable, OperatorFunction, switchMap } from 'rxjs';
import { inject } from '@angular/core';
import { FileService } from '../../services/file.service';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';
import { CardSearchService } from '../../services/card-search.service';
import { Card } from '../../models/card';

export function CardsTypeaheadOperator(): OperatorFunction<string, readonly Card[]> {
  const cardSearchService = inject(CardSearchService);

  return (text$: Observable<string>) =>
    text$
      .pipe(
        debounceTime(200),
        switchMap(term => {
          return cardSearchService.searchCards({ text: term}, 0, 10);
        })
      );
}