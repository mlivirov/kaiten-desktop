import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardTransitionConfirmationDialogComponent } from './card-transition-confirmation-dialog.component';

describe('CardTransitionConfirmationDialogComponent', () => {
  let component: CardTransitionConfirmationDialogComponent;
  let fixture: ComponentFixture<CardTransitionConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardTransitionConfirmationDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardTransitionConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
