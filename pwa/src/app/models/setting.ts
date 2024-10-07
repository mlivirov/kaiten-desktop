export enum Setting {
  LastURL = 'LAST_URL',
  ApiUrl = 'API_URL',
  FilesUrl = 'FILES_URL',
  Token = 'TOKEN',
  CustomColumns = 'CUSTOM_COLUMNS',
  CollapsedColumns = 'COLLAPSED_COLUMNS',
  BoardStyle = 'BOARD_STYLE',
  Theme = 'THEME',
  ForwardedApiUrl = 'FORWARDED_API_URL',
  LinkCopyStyle = 'LINK_COPY_STYLE',
  BoardCardLifetimeStyle = 'BOARD_CARD_LIFETIME_STYLE',
}

export enum LinkCopyStyle {
  CLIENT = 'CLIENT',
  KAITEN = 'KAITEN',
}

export enum BoardCardLifetimeStyle {
  Dots = 'DOTS',
  TextBadges = 'TEXT_BADGES'
}

export enum BoardStyle {
  Vertical = 'Vertical',
  HorizontalCollapsible = 'HorizontalCollapsible',
}

export class DefaultSettings {
  public static readonly BoardStyle = BoardStyle.Vertical;
  public static readonly BoardCardLifetimeStyle = BoardCardLifetimeStyle.Dots;
  public static readonly LinkCopyStyle = LinkCopyStyle.CLIENT;
}