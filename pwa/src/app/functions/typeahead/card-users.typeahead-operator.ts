import { debounceTime, Observable, OperatorFunction, switchMap } from 'rxjs';
import { inject } from '@angular/core';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';

export function CardUsersTypeaheadOperator(cardIdProvider: () => number|null): OperatorFunction<string, readonly User[]> {
  const userService = inject(UserService);

  return (text$: Observable<string>) =>
    text$
      .pipe(
        debounceTime(200),
        switchMap(term => {
          const id = cardIdProvider();

          if (id) {
            return userService.getCardAllowedUsers(cardIdProvider(), 0, 10, term);
          } else {
            return userService.getUsers(0, 10, term);
          }
        })
      );
}