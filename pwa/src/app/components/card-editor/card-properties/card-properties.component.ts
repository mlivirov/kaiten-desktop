import { Component, HostListener, Inject, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import {
  NgbDateAdapter,
  NgbDatepicker,
  NgbInputDatepicker,
  NgbPopover,
  NgbTooltip,
  NgbTypeahead
} from '@ng-bootstrap/ng-bootstrap';
import {
  EditorProperty,
  EditorPropertyClickedEvent,
  EditorPropertyTemplateDirective,
  GroupOfEditorProperties,
  PropertiesEditorComponent
} from '../../properties-editor/properties-editor.component';
import { CardEx } from '../../../models/card-ex';
import { Column, ColumnBase } from '../../../models/column';
import { catchError, EMPTY, finalize, forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import { User } from '../../../models/user';
import { Tag } from '../../../models/tag';
import { CustomProperty, CustomPropertyAndValues, CustomPropertySelectValue } from '../../../models/custom-property';
import { CardProperties } from '../../../models/card-properties';
import { stringToDate } from '../../../functions/string-to-date';
import { Owner } from '../../../models/owner';
import { MemberType } from '../../../models/member-type';
import { unionIfNotExists } from '../../../functions/union-if-not-exists';
import { CardStateLabelComponent } from '../card-state-label/card-state-label.component';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InlineMemberComponent } from '../../inline-member/inline-member.component';
import { findColumnRecursive } from '../../../functions/find-column-recursive';
import { ColumnEx } from '../../../models/column-ex';
import { flattenColumns } from '../../../functions/flatten-columns';
import { NgbDateStringAdapter } from '../ngb-date-string-adapter.service';
import { SpaceBoardPermissions } from '../../../models/space-board-permissions';
import { Lane } from '../../../models/lane';
import { CardUsersTypeaheadOperator } from '../../../functions/typeahead/card-users.typeahead-operator';
import { UsersTypeaheadOperator } from '../../../functions/typeahead/users.typeahead-operator';
import { TagsTypeaheadOperator } from '../../../functions/typeahead/tags.typeahead-operator';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../../services/card-editor.service';
import { BoardService } from '../../../services/board.service';
import { CustomPropertyService } from '../../../services/custom-property.service';
import { CardState } from '../../../models/card-state';
import { getLaneColor } from '../../../functions/get-lane-color';
import { nameof } from '../../../functions/name-of';
import { DialogService } from '../../../services/dialog.service';
import { getCardState, getCardStateByCard } from '../../../functions/get-card-state';

interface CustomDatePropertyValue {
  date: string;
}

@Component({
  selector: 'app-card-properties',
  standalone: true,
  imports: [
    CardStateLabelComponent,
    DatePipe,
    FormsModule,
    InlineMemberComponent,
    NgForOf,
    NgbInputDatepicker,
    NgbTypeahead,
    PropertiesEditorComponent,
    EditorPropertyTemplateDirective,
    NgbDatepicker,
    NgbInputDatepicker,
    NgbTypeahead,
    AsyncPipe,
    NgbTooltip,
    NgIf,
    NgbPopover,
  ],
  templateUrl: './card-properties.component.html',
  styleUrl: './card-properties.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: NgbDateStringAdapter }
  ]
})
export class CardPropertiesComponent implements OnChanges {
  @Input({ required: true }) public card: CardEx;
  @ViewChild('locationPopover') public locationPopover: NgbPopover;
  protected readonly NumberMin = Number.MIN_VALUE;
  protected readonly NumberMax = Number.MAX_VALUE;
  protected readonly findColumnRecursive = findColumnRecursive;
  protected readonly MemberType = MemberType;
  protected readonly cardUsersTypeaheadSearch = CardUsersTypeaheadOperator(() => this.card.state === CardState.Draft ? null : this.card.id);
  protected readonly allUsersTypeaheadSearch = UsersTypeaheadOperator();
  protected readonly tagTypeaheadSearch = TagsTypeaheadOperator();
  protected readonly userTypeaheadFormatter = (item: User): string => item.full_name;
  protected readonly tagTypeaheadFormatter = (item: Tag): string => item.name;
  @ViewChild('propertiesEditor') protected propertiesEditor: PropertiesEditorComponent;
  protected newMember: Owner = null;
  protected newBoardId?: number;
  protected newLaneId?: number;
  protected newColumnId?: number;
  protected properties: GroupOfEditorProperties[] = [];
  protected spaceBoardPermissions: SpaceBoardPermissions[] = [];
  protected lanes: Lane[] = [];
  protected columns: Column[] = [];
  protected newBoardColumns: Column[] = [];
  protected isSaveInProgress: boolean = false;
  protected isLoading: boolean = false;
  protected isLoadingBoardAndLanes: boolean = false;
  protected isEditingComplexProperty: boolean = false;
  private customProperties: CustomPropertyAndValues[] = [];

  public constructor(
    private boardService: BoardService,
    private customPropertyService: CustomPropertyService,
    @Inject(CARD_EDITOR_SERVICE) private cardEditorService: CardEditorService,
    private dialogService: DialogService
  ) {
    this.isLoadingBoardAndLanes = true;
    this.boardService
      .getSpaces()
      .pipe(
        finalize(() => this.isLoadingBoardAndLanes = false)
      )
      .subscribe(spaces => this.spaceBoardPermissions = spaces.flatMap(s => s.boards));
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes[nameof<CardPropertiesComponent>('card')]) {
      this.loadProperties();
    }
  }

  protected findSelectValue(values: CustomPropertySelectValue[], id: number): CustomPropertySelectValue {
    return values.find(value => value.id === id);
  }

  protected getLaneColor(lane: Lane): string {
    return getLaneColor(lane);
  }

  protected confirmSave(property: EditorProperty): void {
    if (property.type === 'tag') {
      this.addTag(<EditorProperty<string|Tag>>property);
    } else if (property.type === 'member') {
      this.addMember();
    } else if (property.type === 'custom-date') {
      this.updateCustomDate(<EditorProperty<CustomDatePropertyValue, CustomPropertyAndValues>>property);
    } else if ([
      'custom-string',
      'custom-url',
      'custom-phone',
      'custom-email',
      'custom-number',
    ].includes(property.type)) {
      this.updateCustomSimple(<EditorProperty<string, CustomPropertyAndValues>>property);
    } else if (property.type === 'custom-select') {
      this.updateCustomSelect(<EditorProperty<number, CustomPropertyAndValues>>property);
    } else if (property.type === 'custom-checkbox') {
      this.updateCustomCheckbox(<EditorProperty<boolean, CustomPropertyAndValues>>property);
    } else if (property.type === 'custom-user') {
      this.updateCustomUser(<EditorProperty<string, CustomPropertyAndValues>>property);
    } else if (property.type === 'size') {
      this.updateSize(<EditorProperty<number>>property);
    } else if (property.type === 'column') {
      this.updateColumn(<EditorProperty<Column<ColumnBase>>>property);
    } else if (property.type === 'date') {
      this.updateDateProperty(<EditorProperty<string>>property);
    }
  }

  protected updateBoardAndLane(): void {
    this.isLoadingBoardAndLanes = true;
    this.isSaveInProgress = true;

    this.cardEditorService
      .updateCard(this.card.id, {
        board_id: this.newBoardId,
        lane_id: this.newLaneId,
        column_id: this.newColumnId
      })
      .pipe(
        finalize(() => this.isSaveInProgress = this.isLoadingBoardAndLanes = false),
        switchMap(card => {
          return forkJoin({
            card: of(card),
            board: this.boardService.getBoard(card.board_id),
          });
        })
      )
      .subscribe(({card, board}) => {
        const flatProperties = this.properties.flatMap(t => t.properties);

        Object.assign(this.card, card);
        this.card.board = board;
        this.card.lane = this.lanes.find(t => t.id === card.lane_id);
        this.card.column = this.newBoardColumns.find(t => t.id === card.column_id);
        this.columns = this.newBoardColumns;

        flatProperties.find(t => t.name == 'column').value = this.card.column;
        flatProperties.find(t => t.name == 'board').value = this.card.board;
        flatProperties.find(t => t.name == 'lane').value = this.card.lane;

        this.locationPopover.close();
      });
  }

  protected toggleMemberResponsible(member: Owner): void {
    if (member.type === MemberType.Responsible) {
      this.makeMemberNotResponsible(member);
    } else {
      this.makeMemberResponsible(member);
    }
  }

  protected removeMember(member: User): void {
    this.isSaveInProgress = true;
    this.cardEditorService
      .removeMemberFromCard(this.card.id, member.id)
      .pipe(
        finalize(() => this.isSaveInProgress = false)
      )
      .subscribe(() => {
        const indexOfElement = this.card.members.indexOf(member);
        this.card.members.splice(indexOfElement, 1);
      });
  }

  protected removeTag(tag: Tag): void {
    this.isSaveInProgress = true;
    this.cardEditorService
      .removeTag(this.card.id, tag.id)
      .pipe(
        finalize(() => this.isSaveInProgress = false)
      )
      .subscribe(() => {
        const indexOfTag = this.card.tags.indexOf(tag);
        this.card.tags.splice(indexOfTag, 1);
      });
  }

  protected handlePropertyClick(event: EditorPropertyClickedEvent): void {
    if (event.property.name === 'board' || event.property.name === 'lane') {
      this.locationPopover.positionTarget = event.event.target as HTMLElement;
      this.newBoardId = this.card.board_id;
      this.newLaneId = this.card.lane_id;
      this.newColumnId = this.card.column_id;

      this.handleNewBoardSelected(this.newBoardId);
      this.locationPopover.open();
    }
  }

  protected handleNewBoardSelected(boardId: number): void {
    this.isLoadingBoardAndLanes = true;

    forkJoin({
      lanes: this.boardService.getLanes(boardId),
      columns: this.boardService.getColumns(boardId)
    })
      .pipe(
        finalize(() => this.isLoadingBoardAndLanes = false)
      )
      .subscribe(({lanes, columns}) => {
        this.newBoardId = boardId;
        this.lanes = lanes;

        if (lanes.length === 1) {
          this.newLaneId = lanes[0].id;
        } else {
          this.newLaneId = null;
        }

        this.newBoardColumns = flattenColumns(columns);
        this.newBoardColumns.sort((a, b) => a.sort_order - b.sort_order);

        if (this.newBoardColumns.length === 1) {
          this.newColumnId = this.newBoardColumns[0].id;
        } else {
          this.newColumnId = null;
        }
      });
  }

  protected checkNewLocationCanBeSaved(): boolean {
    return !this.isLoadingBoardAndLanes && !!this.newLaneId && !!this.newBoardId && !!this.newColumnId;
  }

  protected createNewSelectValue(property: EditorProperty<number, CustomPropertyAndValues>, value: string): Observable<CustomPropertySelectValue> {
    const existingValue = property.extra.values.find(v => v.value === value);
    if (!existingValue) {
      return this.customPropertyService
        .addCustomPropertyValue(property.extra.property.id, value)
        .pipe(
          tap(newValue => {
            property.extra.values.push(newValue);
          })
        );
    }

    return of(existingValue);
  }

  protected handleSelectValueChange(property: EditorProperty<number, CustomPropertyAndValues>, value: number): void {
    if (value === 0) {
      this.isEditingComplexProperty = true;
      this.dialogService
        .prompt<CustomPropertySelectValue>('New value', 'Enter new value', value => this.createNewSelectValue(property, value))
        .pipe(
          finalize(() => this.isEditingComplexProperty = false)
        )
        .subscribe(value => {
          property.value = value.id;
        });
    } else {
      property.value = value;
    }
  }

  private getCustomPropertyValue(values: CardProperties, property: CustomProperty): unknown {
    if (!values) {
      return null;
    }
    const value = values[`id_${property.id}`];
    if (value === undefined) {
      return null;
    } else if (property.multi_select) {
      return values;
    } else if (Array.isArray(value)) {
      return value[0];
    } else {
      return value;
    }
  }
  
  private extractProperties(): void {
    this.properties = [];

    const globalPropertiesGroup = {
      title: 'Common',
      properties: [
        <EditorProperty>{ label: 'Sprint', value: this.card.sprint_id, multi: false, name: 'sprint', type: 'plain' },
        <EditorProperty>{ label: 'State', value: getCardStateByCard(this.card), multi: false, name: 'state', type: 'state' },
        <EditorProperty>{ label: 'Size', value: this.card.size, multi: false, name: 'size', type: 'size' },
        <EditorProperty>{ label: 'Lane', value: this.card.lane, multi: false, name: 'lane', type: 'lane', clickable: true },
        <EditorProperty>{ label: 'Board', value: this.card.board, multi: false, name: 'board', type: 'title', clickable: true },
        <EditorProperty>{ label: 'Column', value: this.card.column, multi: false, name: 'column', type: 'column' },
      ]
    };
    this.properties.push(globalPropertiesGroup);

    const customPropertiesGroup = <GroupOfEditorProperties>{
      title: 'Properties',
      properties: this.customProperties.map<EditorProperty>(property => ({
        extra: property,
        label: property.property.name,
        name: property.property.name,
        multi: false,
        value: this.getCustomPropertyValue(this.card.properties, property.property),
        type: `custom-${property.property.type}${property.property.multi_select ? '-multi' : ''}`
      }))
    };

    if (customPropertiesGroup.properties.length) {
      this.properties.push(customPropertiesGroup);
    }

    const timeManagementGroup = {
      title: 'Time management',
      properties: [
        <EditorProperty>{ label: 'Due date', value: stringToDate(this.card.due_date), multi: false, name: 'due_date', type: 'date' },
      ]
    };

    if (this.card.completed_at) {
      timeManagementGroup.properties.push(<EditorProperty>{ label: 'Completed at', value: this.card.completed_at, multi: false, name: 'completed_at', type: 'date' },);
    }

    if (this.card.completed_on_time) {
      timeManagementGroup.properties.push(<EditorProperty>{ label: 'Completed on time', value: this.card.completed_on_time, multi: false, name: 'completed_on_time', type: 'bool' });
    }

    if (this.card.goals_total) {
      timeManagementGroup.properties.push(<EditorProperty>{ label: 'Goals', value: { total: this.card.goals_total, done: this.card.goals_done }, multi: false, name: 'goals', type: 'goals'});
    }

    this.properties.push(timeManagementGroup);

    const membersGroup = {
      title: 'Members',
      properties: [
        <EditorProperty>{ label: null, value: this.card.members, multi: true, name: 'members', type: 'member' },
      ]
    };

    this.properties.push(membersGroup);

    const tagsGroup = {
      title: 'Tags',
      properties: [
        <EditorProperty>{ label: null, value: this.card.tags, multi: true, name: 'tags', type: 'tag' },
      ]
    };

    this.properties.push(tagsGroup);
  }

  private updateDateProperty(property: EditorProperty<string>): void {
    this.cardEditorService
      .updateCard(this.card.id, {
        [property.name]: property.value
      } as unknown as CardEx)
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(property.value);
      });
  }
  
  private updateColumn(property: EditorProperty<Column>): void {
    this.cardEditorService
      .updateCard(this.card.id, {
        column_id: property.value.id
      })
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(card => {
        Object.assign(this.card, card);
        this.card.column = this.columns.find(c => c.id === property.value.id);
        this.propertiesEditor.commitChanges(property.value);
      });
  }
  
  private updateSize(property: EditorProperty<number>): void {
    this.cardEditorService
      .updateCard(this.card.id, {
        size: property.value
      })
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(property.value);
      });
  }
  
  private updateCustomUser(property: EditorProperty<string, CustomPropertyAndValues>): void {
    this.cardEditorService
      .updateCard(this.card.id, {
        properties: {
          [`id_${property.extra.property.id}`]: property.value ? [property.value] : null
        }
      })
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(property.value);
      });
  }
  
  private updateCustomCheckbox(property: EditorProperty<boolean, CustomPropertyAndValues>): void {
    this.cardEditorService
      .updateCard(this.card.id, {
        properties: {
          [`id_${property.extra.property.id}`]: property.value
        }
      })
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(property.value);
      });
  }
  
  private updateCustomSelect(property: EditorProperty<number, CustomPropertyAndValues>): void {
    this.cardEditorService
      .updateCard(this.card.id, {
        properties: {
          [`id_${property.extra.property.id}`]: [property.value]
        }
      })
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(property.value);
      });
  }
  
  private updateCustomSimple(property: EditorProperty<string|number, CustomPropertyAndValues>): void {
    this.cardEditorService
      .updateCard(this.card.id, {
        properties: {
          [`id_${property.extra.property.id}`]: property.value
        }
      })
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(property.value);
      });
  }
  
  private updateCustomDate(property: EditorProperty<CustomDatePropertyValue, CustomPropertyAndValues>): void {
    let newValue = null;
    const date = stringToDate(property.value.date);
    if (date) {
      newValue = {
        date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
        time: null,
        tzOffset: null
      };
    }

    this.cardEditorService
      .updateCard(this.card.id, {
        properties: {
          [`id_${property.extra.property.id}`]: newValue
        }
      })
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.propertiesEditor.commitChanges(newValue);
      });
  }

  private makeMemberResponsible(member: Owner): void {
    this.isSaveInProgress = true;
    const previousResponsible = this.card.members.find(t => t.type === MemberType.Responsible);
    this.cardEditorService
      .updatedMemberType(this.card.id, member.id, MemberType.Responsible)
      .pipe(
        finalize(() => this.isSaveInProgress = false),
      )
      .subscribe(() => {
        if (previousResponsible) {
          previousResponsible.type = MemberType.Member;
        }

        member.type = MemberType.Responsible;
      });
  }

  private makeMemberNotResponsible(member: Owner): void {
    this.isSaveInProgress = true;
    this.cardEditorService
      .updatedMemberType(this.card.id, member.id, MemberType.Responsible)
      .pipe(
        finalize(() => this.isSaveInProgress = false),
      )
      .subscribe(() => {
        member.type = MemberType.Member;
      });
  }
  
  private addMember(): void {
    this.cardEditorService
      .addMemberToCard(this.card.id, this.newMember.id)
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(member => {
        this.card.members = unionIfNotExists(this.card.members, member, 'id');
        this.propertiesEditor.commitChanges(this.card.members);
      });
  }
  
  private addTag(property: EditorProperty<string|Tag>): void {
    const name = typeof property.value === 'string' ? property.value : property.value.name;
    this.cardEditorService
      .createTag(this.card.id, name)
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(tag => {
        this.card.tags = unionIfNotExists(this.card.tags, tag, 'id');
        this.propertiesEditor.commitChanges(this.card.tags);
      });
  }
  
  private loadProperties(): void {
    this.isLoading = true;
    forkJoin({
      card: of(this.card),
      customProperties: this.customPropertyService.getCustomPropertiesWithValues(),
      columns: this.boardService.getColumns(this.card.board_id)
    }).pipe(
      finalize(() => this.isLoading = false)
    )
      .subscribe((data: { card: CardEx, customProperties: CustomPropertyAndValues[], columns: ColumnEx[] }) => {
        this.customProperties = data.customProperties;
        this.columns = flattenColumns(data.columns);
        this.extractProperties();
      });
  }

  @HostListener('keydown', ['$event'])
  private handleKeyDown(event: KeyboardEvent): void {
    if (this.locationPopover.isOpen() && event.code === 'Enter' && event.ctrlKey && this.checkNewLocationCanBeSaved()) {
      this.updateBoardAndLane();
      event.preventDefault();
      event.stopPropagation();
    }
  }
  
}
