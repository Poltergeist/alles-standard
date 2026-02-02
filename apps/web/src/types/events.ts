// TypeScript interfaces for Wizards API event data structure
export interface EventData {
  data: {
    searchEvents: {
      events: Event[];
      pageInfo: {
        page: number;
        pageSize: number;
        totalResults: number;
        __typename: string;
      };
      __typename: string;
    };
  };
}

export interface Event {
  id: string;
  capacity: number | null;
  description: string;
  distance: number;
  emailAddress: string;
  hasTop8: boolean;
  isAdHoc: boolean;
  isOnline: boolean;
  latitude: number;
  longitude: number;
  title: string;
  eventTemplateId: string;
  pairingType: string;
  phoneNumber: string;
  requiredTeamSize: number;
  rulesEnforcementLevel: string;
  scheduledStartTime: string;
  startingTableNumber: number;
  status: string;
  tags: string[];
  timeZone: string;
  cardSet: CardSet | null;
  entryFee: EntryFee;
  organization: Organization;
  eventFormat: EventFormat;
  __typename: string;
}

export interface CardSet {
  id: string;
  __typename: string;
}

export interface EntryFee {
  amount: number; // in cents
  currency: string;
  __typename: string;
}

export interface Organization {
  id: string;
  isPremium: boolean;
  name: string;
  postalAddress: string;
  website: string;
  __typename: string;
}

export interface EventFormat {
  id: string;
  __typename: string;
}
