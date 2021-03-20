export interface IObjectIndexer<T> {
    [id: string]: T;
}

export interface IObject extends IObjectIndexer<any> {
}

export const sleep = (milliseconds: number) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};
export const toInt = (val: any, def: number = 0) => {
    if (typeof val === 'string') {
        const ret = parseInt(val, 10);
        if (!isNaN(ret)) {
            return ret;
        }
    } else if (typeof val === 'number') {
        return val;
    }
    return def;
};
export const capitalize = (s: string) => {
    if (s.length === 0) {
        return '';
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
};
export const waitObjectParamSet = (p: any, m: string, nbRetry = 300) =>
    new Promise((resolve, reject) => {
        try {
            if (p && p[m] && nbRetry > 0) {
                return resolve(nbRetry > 0);
            }
            nbRetry -= 1;
            setTimeout(async () => {
                await waitObjectParamSet(p, m);
            }, 1000);
        } catch (e) {
            reject(e);
        }
    });
const underscoreRegex = /(?:[^\w\s]|_)+/g;
const sandwichNumberRegex = /(\d)\s+(?=\d)/g;
const camelCaseRegex = /(?:^\s*\w|\b\w|\W+)/g;

export function toCamelCase(str: string) {
    if (/^\s*_[\s_]*$/g.test(str)) {
        return '_';
    }
    return str
        .replace(underscoreRegex, ' ')
        .replace(sandwichNumberRegex, '$1_')
        .replace(camelCaseRegex, function(match, index) {
            if (/^\W+$/.test(match)) {
                return '';
            }
            return index === 0 ? match.trimLeft().toLowerCase() : match.toUpperCase();
        });
}

export async function mapAsync<T, U>(
    arr: T[],
    callbackFn: (value: T, index: number, array: T[]) => Promise<U>,
    thisArg?: any
) {
    return Promise.all(arr.map(async (value, index, array) => {
        try {
            return await callbackFn(value, index, array);
        } catch(e) {
            throw e;
        }
    }, thisArg));
}

export function arrayMove(array: [], oldIndex: number, newIndex: number) {
    if (newIndex >= array.length) {
        newIndex = array.length - 1;
    }
    array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
    return array;
}

export function remap(obj: IObject, mapping: IObject, deep: boolean = false) {
    function keyMap(k: string) {
        return (mapping && mapping.keys && mapping.keys[k]) || k;
    }

    function keyVal(k: string) {
        const val = obj[k];
        const vMap: IObject =
            mapping && mapping.values && mapping.values[k] && mapping.values[k];
        if (vMap) {
            for (const kv in vMap) {
                if (kv === val && vMap.hasOwnProperty(kv)) {
                    return vMap[kv];
                }
            }
        }
        return val;
    }

    const newObj: IObject = {};
    Object.keys(obj).forEach((k: string) => {
        newObj[keyMap(k)] = deep ? remap(obj[k], mapping) : keyVal(k);
    });
    return newObj;
}

const isRegExp = function(obj: any) {
    return !!(obj && obj.test && obj.exec && (obj.ignoreCase || !obj.ignoreCase));
};
let foundR = 0;

export function clone(obj: any, excludes: Array<string | RegExp> = [], dropEmptyString = false, depth = 0): any {
    const REDUNDANT = '<Too much clone depth>';
    // console.log('clone with excludes', excludes);
    let newObj: IObject;
    if (depth > 20) {
        if (!foundR) {
            console.trace('found redundant');
            foundR += 1;
        }
        return REDUNDANT;
    }
    if (obj === null) {
        return obj;
    }
    if (typeof obj === 'string') {
        if (dropEmptyString && !obj.length) {
            return;
        }
        return obj;
    }
    if (typeof obj === 'undefined'
        || typeof obj === 'number' || typeof obj === 'boolean') {
        return obj;
    }

    if (obj.constructor.name === 'Date') {
        return obj;
    }

    if (Object.prototype.toString.apply(obj) === '[object Array]') {
        newObj = [];
        for (let k = 0; k < obj.length; k += 1) {
            newObj[k] = clone(obj[k], excludes, dropEmptyString, depth + 1);
            if (newObj[k] === REDUNDANT) {
                console.log('redundant key', k);
            }
        }
        return newObj;
    }

    const regExps = excludes.filter((r: any) => isRegExp(r));
    newObj = {};
    for (let k in obj) {
        if (obj.hasOwnProperty && obj.hasOwnProperty(k)) {
            let includedStr = excludes.indexOf(k) === -1;
            let includeFromRegExp = regExps.filter((r: RegExp | string) => {
                return k.match(r) !== null;
            }).length === 0;
            if (includedStr && includeFromRegExp) {
                newObj[k] = clone(obj[k], excludes, dropEmptyString, depth + 1);
                if (newObj[k] === REDUNDANT) {
                    console.trace('redundant key', k);
                }
            } else {
                console.log('====> clone', k, includedStr, includeFromRegExp, 'excluded');
            }
        }
    }
    return newObj;
}

export function getDefinedValueKeys(obj: IObject): any[] {
    return Object.keys(obj).filter(k => obj[k]);
}
