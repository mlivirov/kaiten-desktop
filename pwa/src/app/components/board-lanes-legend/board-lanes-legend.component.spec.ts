import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardLanesLegendComponent } from './board-lanes-legend.component';

describe('BoardLanesLegendComponent', () => {
  let component: BoardLanesLegendComponent;
  let fixture: ComponentFixture<BoardLanesLegendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardLanesLegendComponent]
    })
      .compileComponents();
    
    fixture = TestBed.createComponent(BoardLanesLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
