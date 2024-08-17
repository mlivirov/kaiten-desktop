import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardEditorDialogComponent } from './card-editor-dialog.component';

describe('CardEditorDialogComponent', () => {
  let component: CardEditorDialogComponent;
  let fixture: ComponentFixture<CardEditorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardEditorDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
