import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListOfRelatedCardsComponent } from './list-of-related-cards.component';

describe('ListOfRelatedCardsComponent', () => {
  let component: ListOfRelatedCardsComponent;
  let fixture: ComponentFixture<ListOfRelatedCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListOfRelatedCardsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListOfRelatedCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
