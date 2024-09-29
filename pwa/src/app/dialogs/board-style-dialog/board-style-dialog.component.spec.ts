import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardStyleDialogComponent } from './board-style-dialog.component';

describe('BoardStyleDialogComponent', () => {
  let component: BoardStyleDialogComponent;
  let fixture: ComponentFixture<BoardStyleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardStyleDialogComponent]
    })
      .compileComponents();
    
    fixture = TestBed.createComponent(BoardStyleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
