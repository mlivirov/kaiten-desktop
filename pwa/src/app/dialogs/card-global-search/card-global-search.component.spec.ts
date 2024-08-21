import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardGlobalSearchComponent } from './card-global-search.component';

describe('CardGlobalSearchComponent', () => {
  let component: CardGlobalSearchComponent;
  let fixture: ComponentFixture<CardGlobalSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardGlobalSearchComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardGlobalSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
