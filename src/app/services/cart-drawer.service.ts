import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CartDrawerService {
  private isOpenSubject = new BehaviorSubject<boolean>(false);

  isopen$ = this.isOpenSubject.asObservable();

  open() {
    console.log('CartDrawerService: opening cart drawer');

    this.isOpenSubject.next(true);
  }

  close() {
    console.log('CartDrawerService: closing cart drawer');

    this.isOpenSubject.next(false);
  }
}
