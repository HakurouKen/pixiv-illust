import Promise from 'Bluebird';
import cheerio from 'cheerio';
import 'babel-polyfill';

const request = Promise.promisifyAll(require('request'));
const fs = Promise.promisifyAll(require('fs'));

const HOST = 'www.pixiv.net';
const ACCOUNT_HOST = 'accounts.pixiv.net';
const LOGIN_PAGE = `https://${ACCOUNT_HOST}/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index`;
const LOGIN_API = `https://${ACCOUNT_HOST}/api/login?lang=zh`;
const LOGOUT_URL = `http://${HOST}/logout.php?return_to=%2F`;

class Login {
    constructor(){
        this.cookieJar = request.jar();
        this.pending = null;
    }

    get cookies(){
        return this.cookieJar.getCookies(`http://${HOST}`);
    }

    get loggedIn(){
        const keys = ['PHPSESSID','device_token'];
        let cookieKeys = this.cookies.map(cookie => cookie.key);
        return keys.every(key => cookieKeys.includes(key));
    }

    async _getPostKey(){
        let resp = await request.getAsync({
            url: LOGIN_PAGE,
            jar: this.cookieJar
        });

        if (resp.statusCode !== 200) return Promise.reject(resp);
        let $ = cheerio.load(resp.body);
        let jsonData = $('#init-config').attr('value');
        let data = JSON.parse(jsonData);
        return data['pixivAccount.postKey'];
    }

    _setPendingPromise(){
        let _resolve,_reject;
        let self = this;
        self.pending = new Promise((resolve,reject) => {
            _resolve = (...args) =>{
                self.pending = null;
                resolve.call(self,args);
            };
            _reject = (...args) => {
                self.pending = null;
                reject.call(self,args);
            };
        });
        return [_resolve,_reject];
    }

    async login(account,password){
        let [_resolve,_reject] = this._setPendingPromise();

        let postKey = await this._getPostKey();
        let resp = await request.postAsync({
            url: LOGIN_API,
            jar: this.cookieJar,
            headers: {
                'Host': ACCOUNT_HOST,
                'Origin': `https://${ACCOUNT_HOST}`,
                'Referer': LOGIN_PAGE,
                'X-Requested-With': 'XMLHttpRequest'
            },
            form: {
                pixiv_id: account,
                password: password,
                captcha: '',
                g_recaptcha_response: '',
                post_key: postKey,
                source: 'pc'
            }
        });

        if (resp.statusCode !== 200) {
            _reject(resp);
            return Promise.reject(resp);
        }
        // there are two types of data returned when sucessed:
        // 1. nothing
        // 2. '{"error":false,"message":"","body":{"successed":{"return_to":"http:\/\/www.pixiv.net\/"}}}'
        // the `error` key cannot be used to judge whether the request is successed,
        // it's always false.
        let ret = JSON.parse(resp.body || null);
        if (!ret || ret.body && ret.body.successed){
            _resolve(ret);
            return ret;
        }
        _reject(ret);
        return Promise.reject(resp);
    }

    async logout() {
        return await request.getAsync({
            url: LOGOUT_URL,
            jar: this.cookieJar
        });
    }

    async dumps(file) {
        let cookies = this.cookies.map(cookie => {
            return {
                key: cookie.key,
                value: cookie.value
            };
        });

        return await fs.writeFileAsync(
            file,
            JSON.stringify(cookies,null,4)
        );
    }

    async loads(file) {
        let [_resolve,_reject] = this._setPendingPromise();
        try {
            // A hack to load json cookiejar from file.
            let content = await fs.readFileAsync(file);
            let jsonContent = JSON.parse(content.toString());
            let jar = request.jar();
            jsonContent.forEach(item => {
                let cookie = request.cookie(`${item.key}=${item.value}`);
                jar.setCookie(cookie,`http://${HOST}`);
            });
            this.cookieJar = jar;
            _resolve(this);
            return this;
        } catch(err) {
            _reject(err);
            throw err;
        }
    }

    reset() {
        this.cookieJar = request.jar();
        return this;
    }
}

const login = new Login();
export default login;
export function loginRequired(target, prop, descriptor) {
    const method = descriptor.value;
    descriptor.value = function(...args) {
        try {
            if (!login.loggedIn && !login.pending) {
                return Promise.reject(new Error('Login Required.'));
            }

            if (login.loggedIn) {
                let ret = method.apply(this, args);
                return ret instanceof Promise ? ret : Promise.resolve(ret);
            }
            if (login.pending) {
                return login.pending.then(() => {
                    let ret = method.apply(this, args);
                    return ret;
                });
            }
        } catch(e) {
            return Promise.reject(e);
        }
    };
    return descriptor;
}
