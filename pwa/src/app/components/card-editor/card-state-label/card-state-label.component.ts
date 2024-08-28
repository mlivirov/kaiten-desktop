import { Component, Input } from '@angular/core';
import { CardState } from '../../../models/card-state';
import { NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';

@Component({
  selector: 'app-card-state-label',
  standalone: true,
  imports: [
    NgSwitchCase,
    NgSwitch,
    NgSwitchDefault
  ],
  templateUrl: './card-state-label.component.html',
  styleUrl: './card-state-label.component.scss'
})
export class CardStateLabelComponent {
  CardState = CardState;

  @Input()
  state: CardState;

  @Input()
  colored: boolean = true;
}
