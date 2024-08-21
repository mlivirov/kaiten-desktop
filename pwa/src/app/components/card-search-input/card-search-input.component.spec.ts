import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardSearchInputComponent } from './card-search-input.component';

describe('CardSearchInputComponent', () => {
  let component: CardSearchInputComponent;
  let fixture: ComponentFixture<CardSearchInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardSearchInputComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardSearchInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
