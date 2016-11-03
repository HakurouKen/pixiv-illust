import 'babel-polyfill';
import path from 'path';
import fs from 'fs';
import Promise from 'bluebird';
import _ from 'lodash';

const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);

const prompt = async (text='') => {
    process.stdin.resume();
    process.stdout.write(text);
    return new Promise((resolve) => {
        process.stdin.once('data', data => {
            process.stdin.pause();
            resolve(data.toString().trim());
        });
    });
};

const getAccount = async () => {
    const ACCOUNT_FILE = path.join(__dirname,'.account.privacy.json');
    try {
        let accountFile = await readFile(ACCOUNT_FILE);
        let account = JSON.parse(accountFile);
        if (account.USERNAME && account.PASSWORD) {
            return account;
        }
        throw new Error('Lack of login information');
    } catch(err) {
        console.log('Cannot find pixiv account for test, please input an account for test.');
        let username = await prompt('Pixiv ID: ');
        let password = await prompt('Pixiv Password: ');
        let account = {
            USERNAME: username,
            PASSWORD: password
        };
        await writeFile(ACCOUNT_FILE,JSON.stringify(account,null,4));
        return account;
    }
};

const getCookies = async () => {
    const COOKIE_FILE = path.join(__dirname,'.cookie.privacy.json');
    try {
        let cookieFile = await readFile(COOKIE_FILE);
        let cookie = JSON.parse(cookieFile);
        if (!_.isArray(cookie)) {
            throw new Error('Invalid cookie.');
        }
    } catch(err) {
        console.log('Tests need some specific keys in your cookie');
        let PHPSESSID = await prompt('Key `PHPSESSID` in your cookie: ');
        let p_ab_id = await prompt('Key `p_ab_id` in your cookie: ');
        let device_token = await prompt('Key `device_token` in your cookie: ');
        let cookies = [{
            key: 'PHPSESSID',
            value: PHPSESSID
        },{
            key: 'p_ab_id',
            value: p_ab_id
        },{
            key: 'device_token',
            value: device_token
        }];
        await writeFile(COOKIE_FILE,JSON.stringify(cookies,null,4));
        return cookies;
    }
};


before(function(){
    this.timeout(Infinity);
    return Promise.all([
        getAccount(),getCookies()
    ]);
});
