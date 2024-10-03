import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListOfCardsComponent } from './list-of-cards.component';

describe('ListOfCardsComponent', () => {
  let component: ListOfCardsComponent;
  let fixture: ComponentFixture<ListOfCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListOfCardsComponent]
    })
      .compileComponents();
    
    fixture = TestBed.createComponent(ListOfCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
