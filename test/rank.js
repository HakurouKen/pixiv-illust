import { expect } from 'chai';
import _ from 'lodash';
import Promise from 'Bluebird';
import login from '../dist/login';
import Rank from '../dist/rank';

const REQUEST_TIMEOUT = 3000;

function doLogin(){
    return login.loads(__dirname +'/.cookie.privacy.json');
}

describe('Rank', function(){
    describe('prototype#constructor(mode,date)', function(){
        it('should create an new instance when mode is valid', function(){
            expect(new Rank()).to.be.instanceof(Rank);
        });

        it('should raise an error then mode is invalid', function(){
            expect(() => {
                return new Rank('invalid-mode');
            }).to.throw(Error);
        });
    });

    describe('prototype#get#url()', function(){
        it('should return the request url', function(){
            let ranking = new Rank('daily','20161011');
            expect(ranking.url).to.equal(`http://www.pixiv.net/ranking.php?format=json&mode=daily&date=20161011`);

            ranking = new Rank('daily_r18',new Date(1476205200000));
            expect(ranking.url).to.equal(`http://www.pixiv.net/ranking.php?format=json&mode=daily_r18&date=20161012`);
        });
    });

    describe('prototype#getPage(page)', function(){
        beforeEach(function(){
            login.reset();
        });

        after(function(){
            doLogin();
        });

        function checkResponse(response){
            expect(response).to.be.an('object');
            expect(response.contents).to.be.an('array');
            expect(response).to.have.property('page');
            expect(response).to.have.property('next');
            expect(response).to.have.property('date');
        }

        it('should return the json data of normal mode when not logged in', function(done){
            (async function(){
                let ranking = new Rank('daily','20161011');
                let response = await ranking.getPage(1);
                checkResponse(response);
                done();
            })();
        }).timeout(REQUEST_TIMEOUT);

        it('should return the same json data of normal mode when logged in', function(done){
            (async function(){
                let ranking = new Rank('weekly','20161011');
                let response = await ranking.getPage(2);
                await doLogin();
                let ranking2 = new Rank('weekly','20161011');
                let response2 = await ranking.getPage(2);
                expect(response).to.eql(response2);
                done();
            })();
        }).timeout(REQUEST_TIMEOUT*2);

        it('should return the json data of restrict mode when logged in', function(done){
            (async function(){
                doLogin();
                try {
                    let ranking = new Rank('weekly_r18','20161011');
                    let response = await ranking.getPage(2);
                    checkResponse(response);
                    done();
                } catch(e){
                    return done(e);
                }
            })();
        }).timeout(REQUEST_TIMEOUT*10);

        it('should throw a login-required error when not logged in restrict mode', function(done){
            let ranking = new Rank('daily_r18');
            ranking.getPage().catch(() => {
                done();
            });
        }).timeout(REQUEST_TIMEOUT);
    });

    describe('prototype#get(page)', function(){
        it('is the alias of getPage', function(done){
            let ranking = new Rank();
            Promise.all([
                ranking.get(3),
                ranking.getPage(3)
            ]).spread((getPageResponse,getResponse) => {
                expect(getPageResponse).to.eql(getResponse);
                done();
            });
        }).timeout(REQUEST_TIMEOUT);
    });

    describe('prototype#getRank(rank)', function() {
        it('should return top n rank illusts', function(done) {
            let ranking = new Rank('daily');
            ranking.getRank(100).then(contents => {
                expect(contents).to.be.an('array');
                expect(contents.length).to.eql(100);
                done();
            }).catch(err => {
                done(err);
            });
        }).timeout(REQUEST_TIMEOUT*2);
    });

    describe('prototype#getAll()', function(){
        it('should return all contents of ranking', function(){
            // this test will take a long time.
            let ranking = new Rank('monthly');
            ranking.getAll().then(contents => {
                expect(contents).to.be.an('array');
                done();
            }).catch(err => {
                done(err);
            });
        }).timeout(REQUEST_TIMEOUT*10)
    });
});
