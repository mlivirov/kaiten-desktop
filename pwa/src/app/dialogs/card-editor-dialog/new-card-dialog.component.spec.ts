import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCardDialogComponent } from './new-card-dialog.component';

describe('CardEditorDialogComponent', () => {
  let component: NewCardDialogComponent;
  let fixture: ComponentFixture<NewCardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewCardDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewCardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
