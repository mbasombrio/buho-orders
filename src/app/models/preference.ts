
export interface PreferenceModal {
  preference: Preference;
  add: boolean;
}
export class Preference {
  id: number;
  value: string | null;
  key: string | null;
  value2: string | null;
  sort: number | null;
  date: Date | null;
  sectionTitle?: string; // Propiedad opcional para el título de la sección

  constructor(id: number, value: string | null, key: string | null, value2: string | null, sort: number | null, sectionTitle?: string) {
    this.id = id;
    this.value = value;
    this.key = key;
    this.value2 = value2;
    this.sort = sort;
    this.date = null;
    this.sectionTitle = sectionTitle;
  }
}

export class PreferenceFilter {
  value: string | null;
  page: number | null;
  constructor() {
    this.value = null;
    this.page = 1;
  }
}

// clase para armar el listado de preferencias
export class PreferenceItemList {
  title: string | null;
  key: string | null;
  values: Preference[];

  constructor(title: string, key: string | null, values: Preference[]) {
    this.title = title;
    this.key = key;
    this.values = values;
  }
}

// clase para guardar la lista ordenada
export class PreferenceSortSave {
  preferenceList: Preference[];

  constructor(list: Preference[]) {
    this.preferenceList = list;
  }
}


export interface ISelectedPreference {
  key: string;
  value: string;
}
