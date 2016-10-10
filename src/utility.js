import Promise from 'Bluebird';

export function isthenable(o){
    return typeof (o && o.then) === 'function';
}

export function cachedProperty(target, prop, descriptor) {
    const method = descriptor.value;
    descriptor.value = function(...args) {
        let cache = this._cache = this._cache || {};
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

export function replacePlaceholder(str, dataSource, startDelimiter='{{', endDelimiter='}}') {
    let regex = new RegExp(startDelimiter + '(.*?)' + endDelimiter,'g');
    str = str.toString();
    return str.replace(regex,($,$1) => {
        return (new Function('dataSource',
            `try {
                with(dataSource){
                    return ${$1};
                }
            } catch(e) {
                return "";
            }`
        ))(dataSource);
    });
}
