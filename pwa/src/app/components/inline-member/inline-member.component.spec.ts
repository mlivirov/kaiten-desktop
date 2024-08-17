import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InlineMemberComponent } from './inline-member.component';

describe('InlineMemberComponent', () => {
  let component: InlineMemberComponent;
  let fixture: ComponentFixture<InlineMemberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InlineMemberComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InlineMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
