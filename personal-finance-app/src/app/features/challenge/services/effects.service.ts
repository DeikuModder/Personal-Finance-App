import { Injectable } from '@angular/core';
import confetti from 'canvas-confetti';

@Injectable({ providedIn: 'root' })
export class EffectsService {
  celebrate(): void {
    confetti({
      particleCount: 120,
      spread: 80,
      startVelocity: 45,
      colors: ['#bb86fc', '#03dac6', '#ffd54f', '#ffffff', '#6200ee'],
      disableForReducedMotion: true,
      zIndex: 2200,
    });
  }

  goldBurst(): void {
    confetti({
      particleCount: 220,
      spread: 120,
      startVelocity: 60,
      colors: ['#ffd54f', '#ffb300', '#ffca28', '#fff8e1'],
      disableForReducedMotion: true,
      zIndex: 2300,
    });
  }
}