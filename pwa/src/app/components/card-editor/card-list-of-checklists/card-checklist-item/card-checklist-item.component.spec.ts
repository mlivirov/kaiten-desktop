import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardChecklistItemComponent } from './card-checklist-item.component';

describe('CardChecklistItemComponent', () => {
  let component: CardChecklistItemComponent;
  let fixture: ComponentFixture<CardChecklistItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardChecklistItemComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardChecklistItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
