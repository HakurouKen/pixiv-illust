import Promise from 'Bluebird';
import cheerio from 'cheerio';
import 'babel-polyfill';

const request = Promise.promisifyAll(require('request'));

const HOST = 'www.pixiv.net';
const LOGIN_PAGE = 'https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index';
const LOGIN_API = 'https://accounts.pixiv.net/api/login?lang=zh'

class Login {
    constructor(){
        this.cookieJar = request.jar();
    }

    _getPostKey(){
        return request.getAsync({
            url: LOGIN_PAGE,
            jar: this.cookieJar
        }).then(resp => {
            if (resp.statusCode !== 200) return Promise.reject(resp);
            let $ = cheerio.load(resp.body);
            let jsonData = $('#init-config').attr('value');
            let data = JSON.parse(jsonData);
            return data['pixivAccount.postKey'];
        });
    }

    async login(account,password){
        let postKey = await this._getPostKey();
        return request.postAsync({
            url: LOGIN_API,
            jar: this.cookieJar,
            form: {
                pixiv_id: account,
                password: password,
                captcha: '',
                g_recaptcha_response: '',
                post_key: postKey,
                source: 'pc'
            }
        }).then(resp => {
            if (resp.statusCode !== 200) {
                return Promise.reject(resp);
            }
            // there are two types of data returned when sucessed:
            // 1. nothing
            // 2. '{"error":false,"message":"","body":{"successed":{"return_to":"http:\/\/www.pixiv.net\/"}}}'
            // the `error` key cannot be used to judge whether the request is successed,
            // it's always false.
            if (!resp.body) return;
            let ret = JSON.parse(resp.body);
            if (ret.body && ret.body.successed){
                return ret;
            }
            return Promise.reject(resp);
        });
    }

    getCookies(){
        return this.cookieJar.getCookies(`http://${HOST}`);
    }
}

const login = new Login();
export default login;
