import { HttpParams } from "@angular/common/http";

  export const makeParams = (keys: string[], filter:any): HttpParams => {
    let params = new HttpParams();
    const dates = [
      "dateFrom",
      "dateTo",
      "expirationDateFrom",
      "expirationDateTo",
      "createAtFrom",
      "createAtTo",
      "date-to",
      "date-from"
    ];

    const valuesBools = ["onlyEnabled", "firstTime", "onlyIncoming"];

    keys.forEach((key) => {
      let hours = "";
      if (dates.includes(key))
        hours = key.toLowerCase().includes("from") ? " 00:00:00" : " 23:59:59";

      if (key === "page" && filter[key]) {
        params = params.set(key, `${filter[key]}`);
      } else if (valuesBools.includes(key)) {
        params = params.set(key, `${filter[key]}`);
      } else {
        if (filter[key]) {
          const value = `${filter[key]}${hours}`;
          params = params.set(key, `${value.trim()}`);
        }
      }
    });
    return params;
  };
