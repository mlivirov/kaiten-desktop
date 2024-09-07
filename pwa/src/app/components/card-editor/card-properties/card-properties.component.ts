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
  EditorPropertyTemplate,
  GroupOfEditorProperties,
  PropertiesEditorComponent
} from '../../properties-editor/properties-editor.component';
import { CardEx } from '../../../models/card-ex';
import { Column } from '../../../models/column';
import { catchError, EMPTY, finalize, forkJoin, of, switchMap } from 'rxjs';
import { User } from '../../../models/user';
import { Tag } from '../../../models/tag';
import { CustomProperty, CustomPropertyAndValues, CustomPropertySelectValue } from '../../../models/custom-property';
import { CardProperties } from '../../../models/card-properties';
import { StringToDateFunction } from '../../../functions/string-to-date.function';
import { Owner } from '../../../models/owner';
import { MemberType } from '../../../models/member-type';
import { UnionIfNotExistsFunction } from '../../../functions/union-if-not-exists.function';
import { CardStateLabelComponent } from '../card-state-label/card-state-label.component';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InlineMemberComponent } from '../../inline-member/inline-member.component';
import { FindColumnRecursiveFunction } from '../../../functions/find-column-recursive.function';
import { ColumnEx } from '../../../models/column-ex';
import { FlattenColumnsFunction } from '../../../functions/flatten-columns.function';
import { NgbDateStringAdapter } from '../ngb-date-string-adapter.service';
import { Board } from '../../../models/board';
import { SpaceBoardPermissions } from '../../../models/space-board-permissions';
import { Lane } from '../../../models/lane';
import { CardUsersTypeaheadOperator } from '../../../functions/typeahead/card-users.typeahead-operator';
import { UsersTypeaheadOperator } from '../../../functions/typeahead/users.typeahead-operator';
import { TagsTypeaheadOperator } from '../../../functions/typeahead/tags.typeahead-operator';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../../../services/card-editor.service';
import { BoardService } from '../../../services/board.service';
import { CustomPropertyService } from '../../../services/custom-property.service';
import { CardState } from '../../../models/card-state';
import { getLaneColor } from '../../../functions/get-lane-color.function';

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
    EditorPropertyTemplate,
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
  NumberMin = Number.MIN_VALUE;
  NumberMax = Number.MAX_VALUE;
  FindColumnRecursiveFunction = FindColumnRecursiveFunction;
  MemberType = MemberType;

  @ViewChild('propertiesEditor')
  propertiesEditor: PropertiesEditorComponent;

  @Input({ required: true })
  card: CardEx;

  @ViewChild('locationPopover')
  locationPopover: NgbPopover;

  newMember: Owner = null;
  newBoardId?: number;
  newLaneId?: number;
  newColumnId?: number;

  cardUsersTypeaheadSearch = CardUsersTypeaheadOperator(() => this.card.state === CardState.Draft ? null : this.card.id);
  allUsersTypeaheadSearch = UsersTypeaheadOperator();
  tagTypeaheadSearch = TagsTypeaheadOperator();

  userTypeaheadFormatter = (item: User) => item.full_name;
  tagTypeaheadFormatter = (item: Tag) => item.name;

  properties: GroupOfEditorProperties[] = [];
  spaceBoardPermissions: SpaceBoardPermissions[] = [];
  lanes: Lane[] = [];
  columns: Column[] = [];
  newBoardColumns: Column[] = [];
  isSaveInProgress: boolean = false;
  isLoading: boolean = false;
  isLoadingBoardAndLanes: boolean = false;
  private customProperties: CustomPropertyAndValues[] = [];

  constructor(
    private boardService: BoardService,
    private customPropertyService: CustomPropertyService,
    @Inject(CARD_EDITOR_SERVICE) private cardEditorService: CardEditorService
  ) {
    this.isLoadingBoardAndLanes = true;
    this.boardService
      .getSpaces()
      .pipe(
        finalize(() => this.isLoadingBoardAndLanes = false)
      )
      .subscribe(spaces => this.spaceBoardPermissions = spaces.flatMap(s => s.boards));
  }

  findSelectValue(values: CustomPropertySelectValue[], id: number) {
    return values.find(value => value.id === id);
  }

  getLaneColor(lane: Lane) {
    return getLaneColor(lane);
  }

  getCustomPropertyValue(values: CardProperties, property: CustomProperty) {
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

  extractProperties() {
    this.properties = [];

    const globalPropertiesGroup = {
      title: 'Common',
      properties: [
        <EditorProperty>{ label: 'Sprint', value: this.card.sprint_id, multi: false, name: 'sprint', type: 'plain' },
        <EditorProperty>{ label: 'State', value: this.card.state, multi: false, name: 'state', type: 'state' },
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
        <EditorProperty>{ label: 'Due date', value: StringToDateFunction(this.card.due_date), multi: false, name: 'due_date', type: 'date' },
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

  confirmSave(property: EditorProperty) {
    if (property.type === 'tag') {
      this.addTag(property);
    } else if (property.type === 'member') {
      this.addMember(property);
    } else if (property.type === 'custom-date') {
      this.updateCustomDate(property);
    } else if (property.type === 'custom-string') {
      this.updateCustomString(property);
    } else if (property.type === 'custom-select') {
      this.updateCustomSelect(property);
    } else if (property.type === 'custom-checkbox') {
      this.updateCustomCheckbox(property);
    } else if (property.type === 'custom-user') {
      this.updateCustomUser(property);
    } else if (property.type === 'size') {
      this.updateSize(property);
    } else if (property.type === 'column') {
      this.updateColumn(property);
    } else if (property.type === 'date') {
      this.updateDateProperty(property);
    }
  }

  updateBoardAndLane() {
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
          })
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

  updateDateProperty(property: EditorProperty<string>) {
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

  updateColumn(property: EditorProperty<Column>) {
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

  updateSize(property: EditorProperty<number>) {
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

  updateCustomUser(property: EditorProperty<string, CustomPropertyAndValues>) {
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

  updateCustomCheckbox(property: EditorProperty<boolean, CustomPropertyAndValues>) {
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

  updateCustomSelect(property: EditorProperty<number, CustomPropertyAndValues>) {
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

  updateCustomString(property: EditorProperty<string, CustomPropertyAndValues>) {
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

  updateCustomDate(property: EditorProperty<{ date: string}, CustomPropertyAndValues>) {
    let newValue = null;
    const date = StringToDateFunction(property.value.date);
    if (date) {
      newValue = {
        date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
        time: null,
        tzOffset: null
      }
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

  makeMemberResponsible(member: Owner) {
    this.isSaveInProgress = true;
    const previousResponsible = this.card.members.find(t => t.type === MemberType.Responsible);
    this.cardEditorService
      .makeMemberResponsible(this.card.id, member.id)
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

  addMember(property: EditorProperty<User>) {
    this.cardEditorService
      .addMemberToCard(this.card.id, this.newMember.id)
      .pipe(
        catchError(() => {
          this.propertiesEditor.abortSave();
          return EMPTY;
        })
      )
      .subscribe(member => {
        this.card.members = UnionIfNotExistsFunction(this.card.members, member, 'id');
        this.propertiesEditor.commitChanges(this.card.members);
      })
  }

  removeMember(member: User, property: EditorProperty<User[]>) {
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

  addTag(property: EditorProperty) {
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
        this.card.tags = UnionIfNotExistsFunction(this.card.tags, tag, 'id');
        this.propertiesEditor.commitChanges(this.card.tags);
      });
  }

  removeTag(tag: Tag, property: EditorProperty<Tag[]>) {
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

  ngOnChanges(changes: SimpleChanges): void {
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
        this.columns = FlattenColumnsFunction(data.columns);
        this.extractProperties();
      });
  }

  handlePropertyClick(event: EditorPropertyClickedEvent) {
    if (event.property.name === 'board' || event.property.name === 'lane') {
      this.locationPopover.positionTarget = event.event.target as HTMLElement;
      this.newBoardId = this.card.board_id;
      this.newLaneId = this.card.lane_id;
      this.newColumnId = this.card.column_id;

      this.handleNewBoardSelected(this.newBoardId);
      this.locationPopover.open();
    }
  }

  handleNewBoardSelected(boardId: number) {
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
          this.newLaneId = lanes[0].id
        } else {
          this.newLaneId = null;
        }

        this.newBoardColumns = FlattenColumnsFunction(columns);
        this.newBoardColumns.sort((a, b) => a.sort_order - b.sort_order);

        if (this.newBoardColumns.length === 1) {
          this.newColumnId = this.newBoardColumns[0].id;
        } else {
          this.newColumnId = null;
        }
      });
  }

  checkNewLocationCanBeSaved() {
    return !this.isLoadingBoardAndLanes && this.newLaneId && this.newBoardId && this.newColumnId;
  }

  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.locationPopover.isOpen() && event.code === 'Enter' && event.ctrlKey && this.checkNewLocationCanBeSaved()) {
      this.updateBoardAndLane();
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
