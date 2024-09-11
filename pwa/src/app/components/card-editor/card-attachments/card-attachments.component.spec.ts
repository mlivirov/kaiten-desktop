import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAttachmentsComponent } from './card-attachments.component';

describe('CardAttachmentsComponent', () => {
  let component: CardAttachmentsComponent;
  let fixture: ComponentFixture<CardAttachmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardAttachmentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardAttachmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
