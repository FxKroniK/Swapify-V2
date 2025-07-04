import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoryFilterService {
  private categorySubject = new BehaviorSubject<string>('');
  category$ = this.categorySubject.asObservable();

  setCategory(category: string) {
    this.categorySubject.next(category);
  }
}