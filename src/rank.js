import 'babel-polyfill';
import login from './login';
import { loginRequired } from './login';
import { getDate,cachedProperty } from './utility';
import Promise from 'Bluebird';

const request = Promise.promisifyAll(require('request'));

const MODES = ['daily','weekly','monthly','rookie','male','female'];
const RESTRICT_MODES = ['daily_r18','weekly_r18','r18g','male_r18','female_r18'];
const PAGE = 'http://www.pixiv.net/ranking.php?format=json';

class Rank {
    constructor(mode='daily',date=null){
        if (!(MODES.includes(mode)) && !(RESTRICT_MODES.includes(mode))){
            throw Error('Unvalid mode.');
        }
        this.mode = mode;
        // default 30 hours before.
        this.date = getDate(date || new Date()-30*3600*1000);
    }

    get url(){
        return `${PAGE}&mode=${this.mode}&date=${this.date}`;
    }

    async getPage(page=1){
        if (MODES.includes(this.mode)) {
            return await this._getPage(page);
        } else if (RESTRICT_MODES.includes(this.mode)) {
            return await this._getRestrictPage(page);
        }
    }

    @loginRequired
    async _getRestrictPage(page=1) {
        return this._getPage(page);
    }

    async _getPage(page){
        let resp = await request.getAsync({
            url: `${this.url}&p=${page}`,
            jar: login.cookieJar
        });
        if (resp.statusCode !== 200) {
            throw resp;
        }
        return JSON.parse(resp.body);
    }

    @cachedProperty
    async get(page){
        return await this.getPage(page);
    }

    @cachedProperty
    async getRank(rank=500) {
        let contents = [];
        let page = 1;
        while (page && contents.length < rank){
            let data = await this.getPage(page);
            let len = data && data.contents && data.contents.length;
            if (!len) {
                break;
            }
            page = data.next;
            contents = contents.concat(data.contents);
        }
        return contents.slice(0,rank);
    }

    @cachedProperty
    async getAll(){
        return this.getRank(Infinity);
    }
}

export default Rank;
