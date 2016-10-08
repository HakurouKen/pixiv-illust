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

export function range(start, stop, step=1) {
    if (typeof stop == 'undefined') {
        stop = start;
        start = 0;
    }

    let result = [];
    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return result;
    }

    for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }

    return result;
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

export function leftPad (str, len, pad=' ') {
    str = str.toString();
    let i = -1;
    len = len - str.length;
    while (++i < len) {
        str = pad + str;
    }
    return str;
}
