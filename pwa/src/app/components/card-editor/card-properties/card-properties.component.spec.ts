import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardPropertiesComponent } from './card-properties.component';

describe('CardPropertiesComponent', () => {
  let component: CardPropertiesComponent;
  let fixture: ComponentFixture<CardPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardPropertiesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
