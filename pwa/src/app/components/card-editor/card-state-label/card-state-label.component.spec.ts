import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardStateLabelComponent } from './card-state-label.component';

describe('CardStateLabelComponent', () => {
  let component: CardStateLabelComponent;
  let fixture: ComponentFixture<CardStateLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardStateLabelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardStateLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
