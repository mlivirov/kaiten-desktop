import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { CardEx } from '../models/card-ex';
import { CARD_EDITOR_SERVICE, CardEditorService } from '../services/card-editor.service';

export const cardResolver: ResolveFn<CardEx> = (route, state) => {
  const service = inject(CARD_EDITOR_SERVICE);
  return service.getCard(route.params['cardId']);
};
