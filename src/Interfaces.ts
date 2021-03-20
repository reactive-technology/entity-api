export interface IObjectIndexer<T> {
  [id: string]: T;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IObject = IObjectIndexer<any>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Class<T = any> = new (...args: any[]) => T;

export type Enum<E> = Record<keyof E, number | string> & { [k: number]: string };

export type IClassObject = IObjectIndexer<Class|Array<Class|null>|Enum<any>|null>;

export interface APIError {
  statusCode?: number;
  message?: string;
}

type resetFunc = (func:SetObjectFunc) => void;
type getFieldTypesFunc = () => IClassObject;
type isRefFunc = ()=> boolean;
type getFieldNamesFunc = () => Array<string>;
type getClassNameFunc = () => string ;
type getClassFunc = () => IObject;
export const globalVars: { classRefs: string[], validationRules: IObject, dtoClassApi: IObject } = {
  classRefs: [],
  validationRules: {},
  dtoClassApi: {}
};

export abstract class APIResponse {
// eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  static reset (obj:APIResponse, func:SetObjectFunc): void {}
  // static isRef (): boolean { return false; }
  static getFieldNames (): Array<string> { return []; }
  // static getClassName ():string { return ''; }
  // static getClass (): IObject { return {}; }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // id?:string|number;

  _apiError?: APIError;
  _extraInfo?: string;
  _isTemplate?: boolean;

  constructor (obj?: APIResponse) {
    if (obj) {
      this._apiError = obj._apiError;
    }
  }

  static isAPIClass () {
    return true;
  }

  static getFieldTypes (): IClassObject {
    return {};
  }

  static isRefClass (ref:Class<any>) {
    // @ts-ignore
    return globalVars.classRefs.includes(ref.name);
  }

  static getRefClassInstance (ref:typeof APIResponse, args: IObject): APIResponse {
    return ref.constructor.apply(null, args);
  }

  static getClassValidatorRules = function (type: string) {
    if (globalVars.validationRules[type]) {
      return globalVars.validationRules[type];
    } else {
      console.error('class validation not found');
    }
  }
}

// @ts-ignore
APIResponse.prototype.getClass = function () {
  return (this.constructor as unknown) as Entity;
};

// @ts-ignore
// @ts-ignore
APIResponse.prototype.getClassName = function(): string {
  return this.constructor.name;
};

// @ts-ignore
APIResponse.prototype.getValidatorRules = function() {
  const type = this.constructor.name;
  if (globalVars.validationRules[type]) {
    return globalVars.validationRules[type];
  } else {
    console.error('class validation not found');
  }
};

// @ts-ignore
APIResponse.prototype.isRef = function() {
  // @ts-ignore
  return globalVars.classRefs.includes(this.constructor.name);
};

// @ts-ignore
APIResponse.prototype.getInstance = function(args: IObject): APIResponse {
  return this.constructor.apply(null, args);
};

export type APIResponseClass = typeof APIResponse;
export type APIResponseDerived = APIResponseClass


export class ObjectRef extends APIResponse {

}
// eslint-disable-next-line @typescript-eslint/ban-types,@typescript-eslint/no-explicit-any
export type SetObjectFunc = (o: object, key: string | number, value: any) => any;

export interface EntityField {
  type: string;
  format?: string;
  rules:string[];
  enum?:string[];
}
export type EntityFieldObject = IObjectIndexer<EntityField>

export interface EntityRules {
  getRules (field:string):string;
  isFieldRequired (field:string):boolean;
  getType (field:string):string;
  getFormat (field:string):string;
  getOptions (field:string):string[];
}

export interface Entity {
  getValidatorRules ():EntityRules;
}

export function format(str: string, params:IObject) {
  let newStr = str;
  for (const key in params) {
    if ({}.hasOwnProperty.call(params,key)) {
      newStr = newStr.replace('{' + key + '}', params[key]);
    }
  }
  return newStr;
}

export function transformResponse (responseTypes:unknown, result:unknown) {
  // console.log('transform', result);
  if (Array.isArray(responseTypes)) {
    const isArrayResult = Array.isArray(result);
    for (const ResponseType of responseTypes) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (Array.isArray(ResponseType) && isArrayResult && ResponseType[0]) {
        const responseSubType = ResponseType[0];
        if (Array.isArray(responseSubType)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (responseSubType[0] && responseSubType[0].isAPIClass()) {
            // @ts-ignore
            return result.map(r => new responseSubType[0](r));
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (responseSubType.isAPIClass()) {
            // @ts-ignore
            return result.map(r => new ResponseType(r));
          }
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!Array.isArray(ResponseType) && !isArrayResult && ResponseType.isAPIClass()) {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return new ResponseType(result);
      }
    }
  }
}

