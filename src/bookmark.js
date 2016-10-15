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
    async getPage(page=1){
        let response = await request.getAsync({
            url: `${URL}?p=${page}`,
            jar: login.cookieJar
        });
        if (response.statusCode !== 200) {
            throw response;
        }
        let $ = cheerio.load(response.body);

        return {
            current: page,
            total: $('.page-list').eq(0).find('li').length || 1,
            contents: $('.image-item').map((i,elem)=>{
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
            }).get()
        };
    }

    async get(page=1){
        return this.getPage(page);
    }

    @loginRequired
    @cachedProperty
    async getAll(){
        let page0 = await this.getPage();
        let total = page0.total;
        let ret = page0.contents;
        for (let i = 2; i < total; i++) {
            let pageN = await this.getPage(i);
            ret = ret.concat(pageN.contents);
        }
        return ret;
    }
}

export default Bookmark;
