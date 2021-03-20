import {AxiosRequestConfig, AxiosInstance} from 'axios';
import {IObject} from "./Interfaces";

export interface IAppContext {
  $getAxiosOptions(s:string):AxiosRequestConfig;
  $getAxiosInstance():AxiosInstance;
}

export class StoreManager {
  constructor (private readonly context:IAppContext) {
    this.context = context;
  }

  public getAxiosOptions (url: string):AxiosRequestConfig|null {
    if (this.context) {
      return this.context.$getAxiosOptions(url);
    }
    return null;
  }

  axios (configs: AxiosRequestConfig, resolve: (p: unknown) => void, reject: (p: unknown) => void) {
    if (this.context) {
      return this.context.$getAxiosInstance()
        .request(configs)
        .then((res: { data: unknown; }) => {
          resolve(res.data);
        })
        .catch((err: Error) => {
          console.error('ERROR IN STORE');
          reject(err);
        });
    }
    return null;
  }
}


export abstract class EntityStoreManager<T> extends StoreManager {
  public abstract getOneEntity(params: {id:number}, query: IObject): Promise<T>;
  public abstract getManyEntity (query?:{fields?:string[], s?:string, filter?:string[],
    or?:string[], sort?:string[], join?:string[], limit?:number, offset?:number, page?:number, cache?:number}): Promise<IObject|T[]>;

  public abstract createOneEntity (data:IObject): Promise<T> ;

  public abstract updateOneEntity(params: {id:number}, data: IObject): Promise<T>;

  public abstract replaceOneEntity(params: { id: number }, data: T): Promise<T>;
  public abstract replaceOneEntity(params: { id: number }, data: T): Promise<T> ;
  public abstract deleteOneEntity (params:{id:number}): Promise<IObject>;
  public abstract entityName:string;
  public abstract entityClass:string;

}

export default StoreManager;
