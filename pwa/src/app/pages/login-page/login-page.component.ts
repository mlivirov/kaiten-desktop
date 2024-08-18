import { Component, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { catchError, filter, switchMap } from 'rxjs';
import { DialogService } from '../../services/dialogService';
import { Credentials } from '../../models/credentials';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    NgOptimizedImage,
    FormsModule,
    ReactiveFormsModule
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
    private apiService: ApiService,
    private dialogService: DialogService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.initializeForm({apiToken: null, resourcesEndpoint: null, apiEndpoint: null});
  }

  initializeForm(creds: Credentials) {
    this.form = this.fb.group({
      apiEndpoint: [creds.apiEndpoint, [Validators.required]],
      resourcesEndpoint: [creds.resourcesEndpoint, [Validators.required]],
      apiToken: [creds.apiToken, [Validators.required]]
    });
  }

  submit() {
    this.apiService
      .setCredentials(this.form.value)
      .pipe(
        switchMap(v => this.dialogService.loginConfirmation(v)),
        catchError((err) => this.dialogService.alert('Failed to login. Please make sure that credentials are valid.')),
        filter(t => t),
        switchMap(() => this.apiService.getSpaces()),
      )
      .subscribe(spaces => {
        this.router.navigate(['board', spaces[0].boards[0].id]);
      });
  }
}
