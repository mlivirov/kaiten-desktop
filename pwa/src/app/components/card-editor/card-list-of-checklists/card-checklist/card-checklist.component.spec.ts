import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardChecklistComponent } from './card-checklist.component';

describe('CardChecklistComponent', () => {
  let component: CardChecklistComponent;
  let fixture: ComponentFixture<CardChecklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardChecklistComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardChecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
