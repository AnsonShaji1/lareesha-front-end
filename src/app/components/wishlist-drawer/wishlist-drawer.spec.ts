import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WishlistDrawer } from './wishlist-drawer';

describe('WishlistDrawer', () => {
  let component: WishlistDrawer;
  let fixture: ComponentFixture<WishlistDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WishlistDrawer],
    }).compileComponents();

    fixture = TestBed.createComponent(WishlistDrawer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
