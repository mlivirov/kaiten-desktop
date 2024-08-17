import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginConfirmationDialogComponent } from './login-confirmation-dialog.component';

describe('LoginConfirmationDialogComponent', () => {
  let component: LoginConfirmationDialogComponent;
  let fixture: ComponentFixture<LoginConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginConfirmationDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
