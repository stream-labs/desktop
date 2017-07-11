import { Service } from './service';
import { nodeObs } from './obs-api';

export type TConfigEvent =
  'starting_step' |
  'progress' |
  'stopping_step' |
  'done';

export type TConfigStep =
  '' |
  'detecting_location' |
  'location_found' |
  'bandwidth_test' |
  'streamingEncoder_test' |
  'recordingEncoder_test' |
  'saving_service' |
  'saving_settings';

export interface IConfigProgress {
  event: TConfigEvent;
  step: TConfigStep;
  percentage?: number;
  continent?: string;
}

export class AutoConfigService extends Service {

  start(cb: (progress: IConfigProgress) => void) {
    this.fetchLocation(cb).then(() => {
      nodeObs.RunAutoConfig(cb);
    });
  }

  // Uses GeoIP to detect the user's location to narrow
  // down the number of servers we need to test.
  fetchLocation(cb: (progress: IConfigProgress) => void) {
    // TODO: Implement
    nodeObs.SetContinent('America');

    const request = new Request('http://freegeoip.net/json/');

    cb({
      event: 'starting_step',
      step: 'detecting_location',
      percentage: 0
    });

    return fetch(request).then(response => {
      cb({
        event: 'stopping_step',
        step: 'detecting_location',
        percentage: 100
      });

      return response.json();
    }).then(json => {
      const continent = this.countryCodeToContinent(json.country_code);

      this.setContinent(continent, cb);
    }).catch(() => {
      this.setContinent('Other', cb);
    });
  }

  setContinent(continent: string, cb: (progress: IConfigProgress) => void) {
    nodeObs.SetContinent(continent);

    cb({
      event: 'stopping_step',
      step: 'location_found',
      continent
    });
  }

  // TODO: Move to a separate file maybe
  countryCodeToContinent(code: string) {
    // Source: https://dev.maxmind.com/geoip/legacy/codes/country_continent/
    const map = {
      AD: 'Europe',
      AE: 'Asia',
      AF: 'Asia',
      AG: 'North America',
      AI: 'North America',
      AL: 'Europe',
      AM: 'Asia',
      AN: 'North America',
      AO: 'Africa',
      AP: 'Asia',
      AR: 'South America',
      AS: 'Oceania',
      AT: 'Europe',
      AU: 'Oceania',
      AW: 'North America',
      AX: 'Europe',
      AZ: 'Asia',
      BA: 'Europe',
      BB: 'North America',
      BD: 'Asia',
      BE: 'Europe',
      BF: 'Africa',
      BG: 'Europe',
      BH: 'Asia',
      BI: 'Africa',
      BJ: 'Africa',
      BL: 'North America',
      BM: 'North America',
      BN: 'Asia',
      BO: 'South America',
      BR: 'South America',
      BS: 'North America',
      BT: 'Asia',
      BW: 'Africa',
      BY: 'Europe',
      BZ: 'North America',
      CA: 'North America',
      CC: 'Asia',
      CD: 'Africa',
      CF: 'Africa',
      CG: 'Africa',
      CH: 'Europe',
      CI: 'Africa',
      CK: 'Oceania',
      CL: 'South America',
      CM: 'Africa',
      CN: 'Asia',
      CO: 'South America',
      CR: 'North America',
      CU: 'North America',
      CV: 'Africa',
      CX: 'Asia',
      CY: 'Asia',
      CZ: 'Europe',
      DE: 'Europe',
      DJ: 'Africa',
      DK: 'Europe',
      DM: 'North America',
      DO: 'North America',
      DZ: 'Africa',
      EC: 'South America',
      EE: 'Europe',
      EG: 'Africa',
      EH: 'Africa',
      ER: 'Africa',
      ES: 'Europe',
      ET: 'Africa',
      EU: 'Europe',
      FI: 'Europe',
      FJ: 'Oceania',
      FK: 'South America',
      FM: 'Oceania',
      FO: 'Europe',
      FR: 'Europe',
      FX: 'Europe',
      GA: 'Africa',
      GB: 'Europe',
      GD: 'North America',
      GE: 'Asia',
      GF: 'South America',
      GG: 'Europe',
      GH: 'Africa',
      GI: 'Europe',
      GL: 'North America',
      GM: 'Africa',
      GN: 'Africa',
      GP: 'North America',
      GQ: 'Africa',
      GR: 'Europe',
      GT: 'North America',
      GU: 'Oceania',
      GW: 'Africa',
      GY: 'South America',
      HK: 'Asia',
      HN: 'North America',
      HR: 'Europe',
      HT: 'North America',
      HU: 'Europe',
      ID: 'Asia',
      IE: 'Europe',
      IL: 'Asia',
      IM: 'Europe',
      IN: 'Asia',
      IO: 'Asia',
      IQ: 'Asia',
      IR: 'Asia',
      IS: 'Europe',
      IT: 'Europe',
      JE: 'Europe',
      JM: 'North America',
      JO: 'Asia',
      JP: 'Asia',
      KE: 'Africa',
      KG: 'Asia',
      KH: 'Asia',
      KI: 'Oceania',
      KM: 'Africa',
      KN: 'North America',
      KP: 'Asia',
      KR: 'Asia',
      KW: 'Asia',
      KY: 'North America',
      KZ: 'Asia',
      LA: 'Asia',
      LB: 'Asia',
      LC: 'North America',
      LI: 'Europe',
      LK: 'Asia',
      LR: 'Africa',
      LS: 'Africa',
      LT: 'Europe',
      LU: 'Europe',
      LV: 'Europe',
      LY: 'Africa',
      MA: 'Africa',
      MC: 'Europe',
      MD: 'Europe',
      ME: 'Europe',
      MF: 'North America',
      MG: 'Africa',
      MH: 'Oceania',
      MK: 'Europe',
      ML: 'Africa',
      MM: 'Asia',
      MN: 'Asia',
      MO: 'Asia',
      MP: 'Oceania',
      MQ: 'North America',
      MR: 'Africa',
      MS: 'North America',
      MT: 'Europe',
      MU: 'Africa',
      MV: 'Asia',
      MW: 'Africa',
      MX: 'North America',
      MY: 'Asia',
      MZ: 'Africa',
      NA: 'Africa',
      NC: 'Oceania',
      NE: 'Africa',
      NF: 'Oceania',
      NG: 'Africa',
      NI: 'North America',
      NL: 'Europe',
      NO: 'Europe',
      NP: 'Asia',
      NR: 'Oceania',
      NU: 'Oceania',
      NZ: 'Oceania',
      OM: 'Asia',
      PA: 'North America',
      PE: 'South America',
      PF: 'Oceania',
      PG: 'Oceania',
      PH: 'Asia',
      PK: 'Asia',
      PL: 'Europe',
      PM: 'North America',
      PN: 'Oceania',
      PR: 'North America',
      PS: 'Asia',
      PT: 'Europe',
      PW: 'Oceania',
      PY: 'South America',
      QA: 'Asia',
      RE: 'Africa',
      RO: 'Europe',
      RS: 'Europe',
      RU: 'Europe',
      RW: 'Africa',
      SA: 'Asia',
      SB: 'Oceania',
      SC: 'Africa',
      SD: 'Africa',
      SE: 'Europe',
      SG: 'Asia',
      SH: 'Africa',
      SI: 'Europe',
      SJ: 'Europe',
      SK: 'Europe',
      SL: 'Africa',
      SM: 'Europe',
      SN: 'Africa',
      SO: 'Africa',
      SR: 'South America',
      ST: 'Africa',
      SV: 'North America',
      SY: 'Asia',
      SZ: 'Africa',
      TC: 'North America',
      TD: 'Africa',
      TG: 'Africa',
      TH: 'Asia',
      TJ: 'Asia',
      TK: 'Oceania',
      TL: 'Asia',
      TM: 'Asia',
      TN: 'Africa',
      TO: 'Oceania',
      TR: 'Europe',
      TT: 'North America',
      TV: 'Oceania',
      TW: 'Asia',
      TZ: 'Africa',
      UA: 'Europe',
      UG: 'Africa',
      UM: 'Oceania',
      US: 'North America',
      UY: 'South America',
      UZ: 'Asia',
      VA: 'Europe',
      VC: 'North America',
      VE: 'South America',
      VG: 'North America',
      VI: 'North America',
      VN: 'Asia',
      VU: 'Oceania',
      WF: 'Oceania',
      WS: 'Oceania',
      YE: 'Asia',
      YT: 'Africa',
      ZA: 'Africa',
      ZM: 'Africa',
      ZW: 'Africa'
    };

    return map[code];
  }

}
