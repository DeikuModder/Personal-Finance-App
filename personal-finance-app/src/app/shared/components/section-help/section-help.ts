import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-section-help',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './section-help.html',
  styleUrl: './section-help.scss',
})
export class SectionHelpComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly howTo = input<string[]>([]);
  readonly expanded = input(false);
}
