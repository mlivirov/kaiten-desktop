import { Component, OnInit } from '@angular/core';
import { NgIf, NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, EMPTY, EmptyError, filter, of, switchMap, throwError } from 'rxjs';
import { DialogService } from '../../services/dialog.service';
import { Credentials } from '../../models/credentials';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BoardService } from '../../services/board.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    NgOptimizedImage,
    FormsModule,
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent implements OnInit {
  protected form: FormGroup<{
    apiEndpoint: FormControl<string>,
    resourcesEndpoint: FormControl<string>,
    apiToken: FormControl<string>
  }>;

  public constructor(
    private fb: FormBuilder,
    private dialogService: DialogService,
    private router: Router,
    private authService: AuthService,
    private boardService: BoardService,
    private activatedRoute: ActivatedRoute
  ) {

  }

  public ngOnInit(): void {
    this.authService
      .getCredentials()
      .pipe(
        catchError((error) => {
          if (error instanceof EmptyError) {
            const creds = <Credentials>{
              apiEndpoint: this.activatedRoute.snapshot.queryParamMap.get('api'),
              resourcesEndpoint: this.activatedRoute.snapshot.queryParamMap.get('files'),
              apiToken: this.activatedRoute.snapshot.queryParamMap.get('token'),
            };

            return of(creds);
          }

          return throwError(error);
        }),
      )
      .subscribe(creds => this.initializeForm(creds));
  }

  protected getApiKeyUrl(): string {
    const apiEndpoint = this.form.value.apiEndpoint ?? '';
    const pathStartIndex = apiEndpoint.lastIndexOf('/api');
    if (pathStartIndex === -1) {
      return null;
    }

    return this.form.value.apiEndpoint.substring(0, pathStartIndex) + '/profile/api-key';
  }

  protected submit(): void {
    const creds = {...this.form.value};
    while (creds.apiEndpoint.endsWith('/')) {
      creds.apiEndpoint = creds.apiEndpoint.substring(0, creds.apiEndpoint.length - 1);
    }

    this.authService
      .login(creds)
      .pipe(
        switchMap(v => this.dialogService.loginConfirmation(v)),
        filter(t => t),
        switchMap(() => this.boardService.getSpaces()),
        catchError(() => this.dialogService.alert('Failed to login. Please make sure that credentials are valid.').pipe(switchMap(() => EMPTY))),
      )
      .subscribe(spaces => {
        this.router.navigate(['board', spaces[0].boards[0].id]);
      });
  }

  private initializeForm(creds: Credentials): void {
    this.form = this.fb.group({
      apiEndpoint: [creds.apiEndpoint, [Validators.required]],
      resourcesEndpoint: [creds.resourcesEndpoint, [Validators.required]],
      apiToken: [creds.apiToken, [Validators.required]]
    });
  }
  
}
