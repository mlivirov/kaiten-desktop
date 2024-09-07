import { debounceTime, Observable, OperatorFunction, switchMap } from 'rxjs';
import { inject } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';

export function UsersTypeaheadOperator(): OperatorFunction<string, readonly User[]> {
  const userService = inject(UserService);

  return (text$: Observable<string>) =>
    text$
      .pipe(
        debounceTime(200),
        switchMap(term => {
          return userService.getUsers(0, 10, term);
        })
      );
}