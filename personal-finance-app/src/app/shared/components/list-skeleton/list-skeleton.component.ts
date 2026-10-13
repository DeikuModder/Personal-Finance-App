import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-list-skeleton',
  standalone: true,
  templateUrl: './list-skeleton.html',
  styleUrl: './list-skeleton.scss',
})
export class ListSkeletonComponent {
  count = input(4);
  rows = computed(() => Array.from({ length: Math.max(1, this.count()) }, (_, i) => i));
}
