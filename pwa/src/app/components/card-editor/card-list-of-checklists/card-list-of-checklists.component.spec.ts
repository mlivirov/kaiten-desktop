import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardListOfChecklistsComponent } from './card-list-of-checklists.component';

describe('CardListOfChecklistsComponent', () => {
  let component: CardListOfChecklistsComponent;
  let fixture: ComponentFixture<CardListOfChecklistsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardListOfChecklistsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardListOfChecklistsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
