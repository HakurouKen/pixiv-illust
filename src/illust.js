import 'babel-polyfill';
import login from './login';
import { loginRequired } from './login';
import cheerio from 'cheerio';
import Promise from 'Bluebird';
import _ from 'lodash';
import path from 'path';
import { cachedProperty,replacePlaceholder } from './utility';
import extend from 'extend';

const request = Promise.promisifyAll(require('request'));
const fs = Promise.promisifyAll(require('fs'));

const PAGE = 'http://www.pixiv.net/member_illust.php';
const TYPE = {
    NORMAL: 0,
    UGOIRA: 1,
    MULTIPLE: 2
};

function validType(...types) {
    const VALID_TYPES = Object.values(TYPE);
    types.forEach(type => {
        if (!VALID_TYPES.includes(type)) {
            throw new Error('Unvalid types.');
        }
    });

    return (target, prop, descriptor) => {
        const method = descriptor.value;
        descriptor.value = async function(...args){
            let type = await this._type();
            if (!types.includes(type)){
                throw new Error('Not allowed in this type of illust.');
            }
            return method.call(this,args);
        };
        return descriptor;
    };
}

class Illust {
    constructor(id){
        this.id = id;
    }

    getPageUrl(mode='medium'){
        return `${PAGE}?mode=${mode}&illust_id=${this.id}`;
    }

    get url(){
        return this.getPageUrl();
    }

    @cachedProperty
    @loginRequired
    async getContent(){
        let response = await request.getAsync({
            url: this.url,
            headers: {
                'Host': 'www.pixiv.net',
                'Referer': 'http://www.pixiv.net/',
            },
            jar: login.cookieJar
        });
        return cheerio.load(response.body);
    }


    @cachedProperty
    async getInfo(){
        let $ = await this.getContent();
        let $workInfo = $('.work-info');
        let $metas = $workInfo.find('.meta li');
        return {
            id: this.id,
            title: $workInfo.find('.title').text(),
            author: $('.user').text().trim(),
            tools: $workInfo.find('.tools li').map((i,elem) => {
                return $(elem).text().trim();
            }).get(),
            page: this.url,
            date: $metas.eq(0).text()
        };
    }

    @cachedProperty
    async _type(){
        let $ = await this.getContent();
        if ($('.works_display .multiple').length) {
            return TYPE.MULTIPLE;
        } else if ($('._ugoku-illust-player-container').length) {
            return TYPE.UGOIRA;
        } else {
            return TYPE.NORMAL;
        }
    }

    @cachedProperty
    @validType(TYPE.NORMAL)
    async _getImageUrl(){
        let $ = await this.getContent();
        return $('.original-image').attr('data-src');
    }

    @cachedProperty
    @validType(TYPE.MULTIPLE)
    async _getNum(){
        let $ = await this.getContent();
        let text=  $('.meta li').eq(1).text();
        return +(text.match(/(\d+)P/) || [])[1] || 0;
    }

    @cachedProperty
    @validType(TYPE.MULTIPLE)
    async _getImageUrls(){
        let num = await this._getNum();
        return Promise.all(_.range(num).map(index =>
            request.getAsync({
                url: `${this.getPageUrl('manga_big')}&page=${index}`,
                jar: login.cookieJar
            })
        )).then(responses => {
            return responses.map(response => {
                let $ = cheerio.load(response.body);
                return $('img').attr('src');
            });
        });
    }

    @cachedProperty
    @validType(TYPE.MULTIPLE)
    async _guessImageUrls(){
        let num = await this._getNum();
        let response = await request.getAsync({
            url: `${this.getPageUrl('manga_big')}&page=0`,
            jar: login.cookieJar
        });
        let $ = cheerio.load(response.body);
        let img0 = $('img').attr('src');
        return _.range(num).map(index => img0.replace(/_p(\d+)\..*?$/,($,$1) => {
            return $.replace(`_p${$1}`,`_p${index}`);
        }));
    }

    @cachedProperty
    @validType(TYPE.UGOIRA)
    async _getPackUrl(){
        let $ = await this.getContent();
        let $script = $('script').filter((i,elem) => {
            return $(elem).text().includes('pixiv.context.ugokuIllustFullscreenData');
        });
        let pixiv = (new Function('var pixiv={context:{}};' + $script.text() +';return pixiv;'))();
        return pixiv.context.ugokuIllustFullscreenData.src;
    }

    async _getDownloadQueue(){
        let type = await this._type();
        let info = await this.getInfo();
        if (type === TYPE.MULTIPLE) {
            let urls = this._guessImageUrls();
            return urls.map((url,index) => {
                return extend({},info,{
                    title: `${info.title} - ${_.padStart(index+1, 2, '0')}`,
                    url: url,
                    suffix: path.extname(url)
                });
            });
        }

        let url;
        if (type === TYPE.NORMAL) {
            url = await this._getImageUrl();
        }
        if (type === TYPE.UGOIRA) {
            url = await this._getPackUrl();
        }
        extend(info,{
            url: url,
            suffix: path.extname(url)
        });
        return [info];

    }

    async download(filepath='{{author}} - {{title}}{{suffix}}'){
        let infos = await this._getDownloadQueue();
        for (let info of infos) {
            try {
                let file = replacePlaceholder(filepath,info);
                console.log(`Downloading ${file} ...`);
                let resp = await request.getAsync({
                    url: info.url,
                    headers: {
                        'Referer': this.url
                    },
                    // do not encode the response data
                    // directly dumps to the files.
                    encoding: null,
                    jar: login.cookieJar
                });
                await fs.writeFileAsync(file,resp.body);
            } catch(e) {
                // do nothing
            }
        }
    }
}

export default Illust;
