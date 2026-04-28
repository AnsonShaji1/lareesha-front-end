import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionsDrawer } from './collections-drawer';

describe('CollectionsDrawer', () => {
  let component: CollectionsDrawer;
  let fixture: ComponentFixture<CollectionsDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionsDrawer],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionsDrawer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
