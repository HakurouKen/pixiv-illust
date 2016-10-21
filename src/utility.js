import Promise from 'Bluebird';
import _ from 'lodash';

export function isthenable(o){
    return typeof (o && o.then) === 'function';
}

export function cachedProperty(target, prop, descriptor) {
    const method = descriptor.value;
    descriptor.value = function(...args) {
        let cache = this._cache = this._cache || {};
        if (cache.hasOwnProperty(prop)) {
            for (let result of cache[prop]) {
                if (_.isEqual(args,result.args)) {
                    let value = result.value;
                    return isthenable(value) ? value : Promise.resolve(value);
                }
            }
        }
        cache[prop] = cache[prop] || [];
        let ret = method.apply(this, args);
        ret = isthenable(ret) ? ret : Promise.resolve(ret);
        cache[prop].push({
            args: args,
            value: ret
        });
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

export function getDate(d) {
    if (typeof d === 'string') {
        return d;
    }
    if (!(d instanceof Date)) {
        d = new Date(d);
    }
    let year = d.getFullYear();
    let month = d.getMonth() + 1;
    let date = d.getDate();
    return `${year}${_.padStart(month,2,'0')}${_.padStart(date,2,'0')}`;
}
