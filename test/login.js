import { expect } from 'chai';
import Promise from 'Bluebird';
import login from '../dist/login';
const config = require('./config');
import 'babel-polyfill';

describe('login',() => {
    describe('#getCookies()',() => {
        it('should return the cookies array',() => {
            expect(login.getCookies()).to.be.an('array');
        });
    });

    describe('#_getPostKey()', () => {
        it('should return a Promise resolved with postKey', done => {
            let postKey = login._getPostKey();
            expect(postKey).to.be.an.instanceof(Promise);
            postKey.then(ret => {
                expect(ret).to.match(/^[a-z0-9]{32}$/);
                done();
            })
        });
    });

    describe('#login()',() => {
        let user = login.login(config.USERNAME,config.PASSWORD);
        it('should return a Promise',() => {
            expect(user).to.be.an.instanceof(Promise);
        });

        it('should set cookie properly',done => {
            user.then(() => {
                let cookies = login.getCookies();
                let keys = cookies.map(cookie => cookie.key);
                expect(keys).to.have.members(['PHPSESSID','p_ab_id','device_token']);
                done();
            }).catch(err => {
                throw err;
            });
        }).timeout(5000);

        it('should reject when login info is invalid',done => {
             login.login('FAKE_USER_ACCOUNT','WRONG_PASSWORD').catch(() => {
                 done();
             });
        }).timeout(5000);
    });
});
