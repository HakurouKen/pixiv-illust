import 'babel-polyfill';
import { expect } from 'chai';
import login from '../dist/login';
import Author from '../dist/author';

const REQUEST_TIMEOUT = 5000;

function doLogin(){
    return login.loads(__dirname +'/cookie.privacy.json');
}

describe('Author', function(){
    let author;
    const USER_ID = 6996493;
    before(function(){
        doLogin();
        author = new Author(USER_ID);
    });

    describe('prototype#illustPageUrl(page)', function(){
        it('should return the page url', function(){
            expect(author.illustPageUrl()).to.equal(`http://www.pixiv.net/member_illust.php?id=6996493&type=all&p=1`);
            expect(author.illustPageUrl(2)).to.equal(`http://www.pixiv.net/member_illust.php?id=6996493&type=all&p=2`);
        });
    });

    describe('prototype#getInfo()', function(){
        it('should return the author info list', function(done){
            let infoPromise = author.getInfo();
            infoPromise.then(info => {
                info.forEach(item => {
                    expect(item.name).to.be.ok;
                    expect(item.value).to.be.ok;
                });
                done();
            }).catch(err => {
                return done(err);
            });
        }).timeout(REQUEST_TIMEOUT);
    });

    function checkContents(contents) {
        expect(contents).to.be.an('array');
        contents.forEach(content => {
            expect(content).to.be.an('object');
            expect(content.illust_id).to.be.a('number');
            expect(content.url).to.be.a('string');
            expect(content.title).to.be.a('string');
        });
    }

    describe('prototype#getIllusts(page)', function(){
        it('should return the specific page of illusts list.', function(done){
            (async function(){
                try {
                    let illust = await author.getIllusts();
                    expect(illust.currentPage).to.equal(1);
                    expect(illust.totalPage).to.be.a('number')
                    expect(illust.total).to.be.a('number');
                    checkContents(illust.contents);
                    done();
                } catch(err) {
                    return done(err);
                }
            })();
        }).timeout(REQUEST_TIMEOUT);
    });
});
