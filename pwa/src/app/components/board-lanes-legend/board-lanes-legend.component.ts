import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CardEx } from '../../models/card-ex';
import { nameof } from '../../functions/name-of';
import { getLaneColor } from '../../functions/get-lane-color';
import { JsonPipe, NgForOf, NgIf } from '@angular/common';
import { getTextOrDefault } from '../../functions/get-text-or-default';
import { LaneEx } from '../../models/lane';
import { WipLimitType } from '../../models/wip-limit-type';
import { getCardStateByCard } from '../../functions/get-card-state';
import { CardState } from '../../models/card-state';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ChangesNotificationService } from '../../services/changes-notification.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Component({
  selector: 'app-board-lanes-legend',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    JsonPipe,
    NgbTooltip
  ],
  templateUrl: './board-lanes-legend.component.html',
  styleUrl: './board-lanes-legend.component.scss'
})
export class BoardLanesLegendComponent implements OnChanges {
  @Input() public cards: CardEx[];
  @Input() public lanes: LaneEx[];
  protected readonly getLaneColor = getLaneColor;
  protected readonly getTextOrDefault = getTextOrDefault;
  protected activeCountByLaneId: Record<number, number> = {};
  protected activeSizeByLaneId: Record<number, number> = {};
  protected totalCardsCountByLaneId: Record<number, number> = {};
  protected totalCardsSizeByLaneId: Record<number, number> = {};

  public constructor(private changesNotificationService: ChangesNotificationService) {
    this.changesNotificationService
      .cardUpdated$
      .pipe(
        takeUntilDestroyed(),
        filter(card => this.cards.some(t => t.id === card.id) || card.board_id === this.lanes[0].board_id)
      )
      .subscribe(card => this.handleCardUpdated(card));
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes[nameof<BoardLanesLegendComponent>('lanes')]
      || changes[nameof<BoardLanesLegendComponent>('cards')]
    ) {
      this.mapCardsByLaneId();
    }
  }

  protected getLaneLimitFulfillment(laneId: number, limitType: WipLimitType): number {
    if (limitType === WipLimitType.Size) {
      return this.activeSizeByLaneId[laneId];
    }

    return this.activeCountByLaneId[laneId];
  }

  private mapCardsByLaneId(): void {
    this.activeCountByLaneId = this.lanes.reduce((agg, item) => <Record<number, number>>{ ...agg, [item.id]: 0 }, {});
    this.activeSizeByLaneId = { ...this.activeCountByLaneId };
    this.totalCardsSizeByLaneId = { ...this.activeCountByLaneId };
    this.totalCardsCountByLaneId = { ...this.activeCountByLaneId };

    this.cards.forEach((card: CardEx) => {
      if (getCardStateByCard(card) !== CardState.Done) {
        this.activeCountByLaneId[card.lane_id]++;
        this.activeSizeByLaneId[card.lane_id] += card.size;
      }

      this.totalCardsCountByLaneId[card.lane_id]++;
      this.totalCardsSizeByLaneId[card.lane_id] += card.size;
    });
  }

  private handleCardUpdated(updatedCard: CardEx): void {
    const card = this.cards.find(t => t.id === updatedCard.id);

    if (updatedCard.board_id !== this.lanes[0].board_id) {
      const indexToDelete = this.cards.findIndex(t => t.id === updatedCard.id);
      this.cards.splice(indexToDelete, 1);
    } else if (card) {
      Object.assign(card, updatedCard);
    } else {
      this.cards.push(updatedCard);
    }

    this.mapCardsByLaneId();
  }
}
