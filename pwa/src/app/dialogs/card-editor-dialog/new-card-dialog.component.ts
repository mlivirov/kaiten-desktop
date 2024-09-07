import { Component, Inject } from '@angular/core';
import { CardEditorComponent } from '../../components/card-editor/card-editor.component';
import { NgIf } from '@angular/common';
import { CardEx } from '../../models/card-ex';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../services/card-editor.service';
import { DraftCardEditorService } from '../../services/implementations/draft-card-editor.service';
import { ServerCardEditorService } from '../../services/implementations/server-card-editor.service';
import { finalize, of, switchMap, tap, zip } from 'rxjs';
import { MemberType } from '../../models/member-type';

@Component({
  standalone: true,
  imports: [
    CardEditorComponent,
    NgIf
  ],
  templateUrl: './new-card-dialog.component.html',
  styleUrl: './new-card-dialog.component.scss',
  providers: [
    { provide: CARD_EDITOR_SERVICE, useExisting: DraftCardEditorService },
  ]
})
export class NewCardDialogComponent {
  card: CardEx;
  isSaving = false;

  constructor(
    public modal: NgbActiveModal,
    private serverCardEditorService: ServerCardEditorService,
    @Inject(CARD_EDITOR_SERVICE) private draftCardEditorService: CardEditorService
  ) {
  }

  save() {
    this.isSaving = true;

    this.draftCardEditorService
      .getCard(this.card.id)
      .pipe(
        tap(card => Object.assign(this.card, card)),
        switchMap(card => this.serverCardEditorService.createCard({
          title: card.title,
          description: card.description,
          board_id: card.board_id,
          lane_id: card.lane_id,
          column_id: card.column_id,
        })),
        tap(card => {
          this.card.id = card.id;
          this.card.state = card.state;
        }),
        switchMap(() => this.serverCardEditorService.updateCard(this.card.id, this.card)),
        switchMap(() => this.card.tags?.length
          ? zip(...this.card.tags.map(t => this.serverCardEditorService.createTag(this.card.id, t.name)))
          : of(null)),
        switchMap(() => this.card.members?.length
          ? zip(this.card.members.map(m => this.serverCardEditorService.addMemberToCard(this.card.id, m.id)))
          : of(null)),
        switchMap(() => this.card.members?.length && this.card.members.some(t => t.type === MemberType.Responsible)
          ? this.serverCardEditorService.makeMemberResponsible(this.card.id, this.card.members.find(t => t.type === MemberType.Responsible).id)
          : of(null)
        ),
        switchMap(() => this.card.checklists?.length
          ? zip(this.card.checklists.map(m => this.serverCardEditorService.addCardCheckList(this.card.id, m)
              .pipe(
                tap(saved => m.id = saved.id),
                switchMap(saved =>
                  m.items?.length
                  ? zip(m.items.map(i => this.serverCardEditorService.addCheckListItem(this.card.id, saved.id, i.text, i.sort_order)))
                  : of(null)
                )
              )))
          : of(null)
        ),
        finalize(() => this.isSaving = false),
      )
      .subscribe(() => {
        this.modal.close(this.card.id);
      });
  }
}
