import { inject, Pipe, PipeTransform } from '@angular/core';
import { PrivacyService } from '../../core/services/privacy.service';

const MASK = '\u2022\u2022\u2022\u2022';

@Pipe({
  name: 'privacyMask',
  pure: false,
  standalone: true,
})
export class PrivacyMaskPipe implements PipeTransform {
  private readonly privacy = inject(PrivacyService);

  transform(value: string, section: string): string {
    return this.privacy.hiddenFor(section) ? MASK : value;
  }
}