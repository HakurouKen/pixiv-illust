import Promise from 'Bluebird';

export function isthenable(o){
    return typeof (o && o.then) === 'function';
}

export function cachedProperty(target, prop, descriptor) {
    let cache = target._cache = target._cache || {};
    const method = descriptor.value;
    descriptor.value = function(...args) {
        if (cache.hasOwnProperty(prop)) {
            return isthenable(prop) ? prop : Promise.resolve(cache[prop]);
        }
        let ret = method.apply(this, args);
        ret = isthenable(ret) ? ret : Promise.resolve(ret);
        cache[prop] = ret;
        return ret;
    };
    return descriptor;
}
