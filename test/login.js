import { expect } from 'chai';
import Promise from 'Bluebird';
import path from 'path';
import fs from 'fs';
import login from '../dist/login';
import { loginRequired } from '../dist/login';
const account = require('./.account.privacy.json');

const ASYNC_REQUEST_TIMEOUT = 10000;

describe('login - ', function() {
    class LoginTest {
        constructor(){
            this.executed = false;
        }

        @loginRequired
        method(){
            expect(login.loggedIn).to.equal(true);
            this.executed = true;
            return 42;
        }
    }

    describe('when not logged in:', function() {
        before(function() {
            login.reset();
        });

        describe('get#cookies()', function() {
            it('should return an empty array', function() {
                let cookies = login.cookies;
                expect(cookies).to.be.an('array');
                expect(cookies.length).to.equal(0);
            });
        });

        describe('get#loggedIn()', function() {
            it('should be false', function() {
                expect(login.loggedIn).to.equal(false);
            });
        });

        describe('#_getPostKey()', function() {
            it('should return a Promise resolved with postKey (32 digits)', function(done) {
                let postKey = login._getPostKey();
                expect(postKey).to.be.an.instanceof(Promise);
                postKey.then(function(ret){
                    expect(ret).to.match(/^[a-z0-9]{32}$/);
                    done();
                });
            }).timeout(ASYNC_REQUEST_TIMEOUT);
        });

        describe('#@loginRequired', function(){
            it('should reject when not logged in', function(done){
                let action = new LoginTest();
                let ret = action.method();
                ret.catch(e => {
                    done();
                });
            });
        });
    });

    describe('login and logout:', function() {
        function makeLoginTest(desc,getUser){
            describe(desc, function() {
                let user,pendingPromise;
                before(function() {
                    user = getUser();
                    pendingPromise = login.pending;
                });

                it('should return a promise', function() {
                    expect(user).to.be.an.instanceof(Promise);
                });

                it('should set a pending promise', function() {
                    expect(pendingPromise).to.be.an.instanceof(Promise);
                });

                it('should clear the pending status', function(done) {
                    user.then(() => {
                        expect(login.pending).to.be.null;
                        done();
                    });
                }).timeout(ASYNC_REQUEST_TIMEOUT);

                it('should set cookies properly', function(done) {
                    user.then(() => {
                        let keys = login.cookies.map(cookie => cookie.key);
                        expect(keys).to.includes.members(['PHPSESSID','device_token','p_ab_id']);
                        done();
                    });
                }).timeout(ASYNC_REQUEST_TIMEOUT);

                it('should resolve the pending promise when resolved', done => {
                    pendingPromise.then(() => {
                        let keys = login.cookies.map(cookie => cookie.key);
                        expect(keys).to.includes.members(['PHPSESSID','device_token','p_ab_id']);
                        done();
                    });
                }).timeout(ASYNC_REQUEST_TIMEOUT);

                it('can be reset correctly', function() {
                    login.reset();
                    expect(login.cookies).to.be.empty;
                });
            });
        }

        makeLoginTest('#login(account,password)', function() {
            return login.login(account.USERNAME,account.PASSWORD);
        });

        makeLoginTest('#loads(file)', function() {
            let file = path.join(__dirname,'.cookie.privacy.json');
            return login.loads(file);
        });
    });

    describe('when logged in:', function() {
        let user;
        before(() => {
            // user = login.login(account.USERNAME,account.PASSWORD);
            user = login.loads(path.join(__dirname,'.cookie.privacy.json'));
        });

        describe('get#cookies()', function() {
            it('should return an cookie array', function(done) {
                user.then(function(){
                    let cookies = login.cookies;
                    expect(cookies).to.be.an('array');
                    cookies.forEach(cookie => {
                        expect(cookie).to.have.property('key');
                        expect(cookie).to.have.property('value');
                    });
                    done();
                });
            }).timeout(ASYNC_REQUEST_TIMEOUT);
        });

        describe('get#loggedIn()', function() {
            it('should be true', function(done) {
                user.then(() => {
                    expect(login.loggedIn).to.equal(true);
                    done();
                });
            }).timeout(ASYNC_REQUEST_TIMEOUT);
        });

        describe('#dumps(file)', function() {
            it('should dumps to the specific file', function(done) {
                let file = path.join(__dirname,'output-cookie.privacy.json');
                login.dumps(file).then(() => {
                    fs.readFile(file,function(err,data){
                        JSON.parse(data.toString());
                        done();
                    });
                });
            }).timeout(ASYNC_REQUEST_TIMEOUT);
        });

        describe('#@loginRequired',function(){
            let cookieFile = path.join(__dirname,'.cookie.privacy.json');

            it('should be wrapped to a Promise', function(){
                let action = new LoginTest();
                expect(action.method()).to.be.an.instanceof(Promise);
            });

            it('should not execute before the login finished', function(done){
                let action = new LoginTest();
                login.reset();
                login.loads(cookieFile);
                // if the method execute before login finished,
                // variable `login.loggedIn` must be false
                action.method().then(ret => {
                    done();
                });
            });

            it('should execute when loggedIn', function(done){
                let action = new LoginTest();
                action.method().then(ret => {
                    expect(action.executed).to.equal(true);
                    expect(ret).to.equal(42);
                    done();
                });
            });
        });
    });
});
