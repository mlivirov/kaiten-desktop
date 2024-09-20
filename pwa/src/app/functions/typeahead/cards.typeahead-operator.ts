import { debounceTime, Observable, OperatorFunction, switchMap } from 'rxjs';
import { inject } from '@angular/core';
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