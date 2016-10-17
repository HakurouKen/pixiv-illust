import 'babel-polyfill';
import Promise from 'Bluebird';
import cheerio from 'cheerio';
import login, { loginRequired } from './login';
import { cachedProperty } from './utility';

const request = Promise.promisifyAll(require('request'));

class Author {
    constructor(id) {
        this.id = id;
    }

    get infoUrl() {
        return `http://www.pixiv.net/member.php?id=${this.id}`
    }

    illustPageUrl(page=1) {
        return `http://www.pixiv.net/member_illust.php?id=${this.id}&type=all&p=${page}`
    }

    @loginRequired
    @cachedProperty
    async getInfo() {
        let url = this.infoUrl;
        let response = await request.getAsync({
            url: url,
            jar: login.cookieJar
        });

        let $ = cheerio.load(response.body);
        return $('.worksListOthers .ws_table').eq(0).find('tr').map((i,elem) => {
            let $elem = $(elem);
            return {
                name: $elem.find('.td1').text(),
                value: $elem.find('.td2').text().trim()
            }
        }).get();
    }

    @loginRequired
    @cachedProperty
    async _getIllustsPage(page) {
        let url = this.illustPageUrl(page);
        let response = await request.getAsync({
            url: url,
            jar: login.cookieJar
        });

        return cheerio.load(response.body);
    }

    @cachedProperty
    async _getIllustsContent(page=1) {
        let $ = await this._getIllustsPage(page);
        return $('.image-item').map((i,elem) => {
            let $elem = $(elem);
            // The keys here are consistent with the ranking page.
            return {
                illust_id: +($elem.find('a.work').attr('href').match(/\d+$/) || [0])[0],
                url: $elem.find('img._thumbnail').attr('src'),
                title: $elem.find('.title').text()
            }
        }).get();
    }

    @cachedProperty
    async getIllusts(page=1) {
        let $ = await this._getIllustsPage(page);
        let contents = await this._getIllustsContent(page);
        let total = parseInt($('.count-badge').text().trim(),10) || 0;

        return {
            currentPage: page,
            // 20 illusts per page
            totalPage: (total / 20 | 0) + 1,
            total: total,
            contents: contents
        }
    }

    @cachedProperty
    async getAllIllusts() {
        let page0 = await this.getIllusts();
        let totalPage = page0.totalPage;
        let contents = page0.contents;
        for (let i = 2; i <= totalPage; i++) {
            let pageContents = await this._getIllustsContent(i);
            contents = contents.concat(pageContents);
        }
        return contents;
    }

}

export default Author;
