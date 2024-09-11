import { Component, OnInit } from '@angular/core';
import {NgIf, NgOptimizedImage} from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { catchError, filter, switchMap } from 'rxjs';
import { DialogService } from '../../services/dialog.service';
import { Credentials } from '../../models/credentials';
import { Router } from '@angular/router';
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
  form: FormGroup<{
    apiEndpoint: FormControl<string>,
    resourcesEndpoint: FormControl<string>,
    apiToken: FormControl<string>
  }>;

  constructor(
    private fb: FormBuilder,
    private dialogService: DialogService,
    private router: Router,
    private authService: AuthService,
    private boardService: BoardService
  ) {
  }

  ngOnInit(): void {
    this.authService
      .getCredentials()
      .subscribe(creds => this.initializeForm(creds));
  }

  initializeForm(creds: Credentials) {
    this.form = this.fb.group({
      apiEndpoint: [creds.apiEndpoint, [Validators.required]],
      resourcesEndpoint: [creds.resourcesEndpoint, [Validators.required]],
      apiToken: [creds.apiToken, [Validators.required]]
    });
  }

  submit() {
    this.authService
      .login(this.form.value)
      .pipe(
        switchMap(v => this.dialogService.loginConfirmation(v)),
        catchError((err) => this.dialogService.alert('Failed to login. Please make sure that credentials are valid.')),
        filter(t => t),
        switchMap(() => this.boardService.getSpaces()),
      )
      .subscribe(spaces => {
        this.router.navigate(['board', spaces[0].boards[0].id]);
      });
  }
}
