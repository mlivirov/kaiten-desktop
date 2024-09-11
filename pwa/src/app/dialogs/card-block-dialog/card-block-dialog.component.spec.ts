import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardBlockDialogComponent } from './card-block-dialog.component';

describe('CardBlockDialogComponent', () => {
  let component: CardBlockDialogComponent;
  let fixture: ComponentFixture<CardBlockDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardBlockDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardBlockDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
