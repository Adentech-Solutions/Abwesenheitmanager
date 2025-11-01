export interface CalendarEvent {
  subject: string;
  body: {
    contentType: 'HTML' | 'Text';
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  isAllDay: boolean;
  showAs: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere';
  categories: string[];
}

export interface AutoReplySettings {
  status: 'enabled' | 'disabled' | 'scheduled';
  externalReplyMessage?: string;
  internalReplyMessage?: string;
  scheduledStartDateTime?: {
    dateTime: string;
    timeZone: string;
  };
  scheduledEndDateTime?: {
    dateTime: string;
    timeZone: string;
  };
}
