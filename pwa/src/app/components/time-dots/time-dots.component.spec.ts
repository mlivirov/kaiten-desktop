import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeDotsComponent } from './time-dots.component';

describe('TimeDotsComponent', () => {
  let component: TimeDotsComponent;
  let fixture: ComponentFixture<TimeDotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeDotsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TimeDotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
