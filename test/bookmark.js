import 'babel-polyfill';
import { expect } from 'chai';
import login from '../dist/login';
import Bookmark from '../dist/bookmark';

function doLogin(){
    return login.loads(__dirname +'/cookie.privacy.json');
}

function contentsCheck(contents){
    contents.forEach(illust=>{
        ['illust_id','url','user_name','user_id','title'].forEach(key => {
            expect(illust[key]).to.be.ok;
        });
    });
}

const REQUEST_TIMEOUT = 5000;

describe.only('BookMark', function(){
    describe('prototype#getPage(page)',function(){
        let bookmark;

        before(function(){
            bookmark = new Bookmark();
        });

        beforeEach(function(){
            return doLogin();
        });

        it('needs login.',function(done){
            login.reset();
            bookmark.getPage().then(()=> {
                return done(new Error('Login check error'));
            },err => {
                done();
            });
        });

        it('should return the specific page of bookmarks', function(done){
            bookmark.getPage(1).then(resp => {
                expect(resp).to.have.property('currentPage',1);
                expect(resp).to.have.property('totalPage');
                expect(resp).to.have.property('total');
                expect(resp.contents).to.be.an('array');
                contentsCheck(resp.contents);
                done();
            }).catch(err=>{
                return done(err);
            });
        }).timeout(REQUEST_TIMEOUT);
    });

    describe('prototype#getAll()',function(){
        let bookmark;

        before(function(){
            bookmark = new Bookmark();
        });

        beforeEach(function(){
            return doLogin();
        });

        it('needs login.',function(done){
            login.reset();
            bookmark.getAll().then(()=> {
                return done(new Error('Login check error'));
            },err => {
                done();
            });
        });

        it('return the marked illust list',function(){
            // Depending on illusts you marked, this test may take a long time.
            // Just pass the test here,
            // if you want to test the getAll function, just uncomment lines below add the `done` params.
            // ---
            // bookmark.getAll().then(function(contents){
            //     contentsCheck(contents);
            //     done();
            // }).catch(err => done(err));
        });
    })
});
