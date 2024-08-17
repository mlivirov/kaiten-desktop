import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardReferencesAccordionComponent } from './card-references-accordion.component';

describe('CardReferencesAccordionComponent', () => {
  let component: CardReferencesAccordionComponent;
  let fixture: ComponentFixture<CardReferencesAccordionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardReferencesAccordionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardReferencesAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
