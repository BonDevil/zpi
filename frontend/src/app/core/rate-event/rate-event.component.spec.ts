import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RateEventComponent } from './rate-event.component';

describe('RateEventComponent', () => {
  let component: RateEventComponent;
  let fixture: ComponentFixture<RateEventComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RateEventComponent]
    });
    fixture = TestBed.createComponent(RateEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
