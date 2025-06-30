import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationProfileComponent } from './navigation-profile.component';

describe('NavigationProfileComponent', () => {
  let component: NavigationProfileComponent;
  let fixture: ComponentFixture<NavigationProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigationProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
