import 'babel-polyfill';
import cheerio from 'cheerio';
import Promise from 'Bluebird';
import login from './login';
import { loginRequired } from './login';
import { cachedProperty } from './utility';

const request = Promise.promisifyAll(require('request'));

const URL = 'http://www.pixiv.net/bookmark.php';

class Bookmark {
    constructor(){}

    @loginRequired
    @cachedProperty
    async _getPage(page) {
        let response = await request.getAsync({
            url: `${URL}?p=${page}`,
            jar: login.cookieJar
        });
        if (response.statusCode !== 200) {
            throw response;
        }
        return cheerio.load(response.body);
    }

    @cachedProperty
    async _getPageContent(page) {
        let $ = await this._getPage(page);
        return $('.image-item').map((i,elem)=>{
            let $elem = $(elem);
            let $user = $elem.find('.user');
            // The keys here are consistent with the ranking page.
            return {
                illust_id: +$elem.attr('id').replace('li_',''),
                url: $elem.find('.work img').attr('src'),
                user_name: $user.attr('data-user_name'),
                user_id: $user.attr('data-user_id'),
                title: $elem.find('.title').text()
            };
        }).get();
    }

    @cachedProperty
    async getPage(page=1){
        let $ = await this._getPage(page);
        let total = parseInt($('.count-badge').text().trim(),10) || 0;
        let contents = await this._getPageContent(page);

        return {
            currentPage: page,
            // 20 illusts per page
            totalPage: (total / 20 | 0) + 1,
            total: total,
            contents: contents
        };
    }

    async get(page=1){
        return this.getPage(page);
    }

    @loginRequired
    @cachedProperty
    async getAll(){
        let page0 = await this.getPage();
        let totalPage = page0.totalPage;
        let ret = page0.contents;
        for (let i = 2; i < totalPage; i++) {
            let contents = await this._getPageContent(i);
            ret = ret.concat(contents);
        }
        return ret;
    }
}

export default Bookmark;
