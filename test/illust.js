import { expect } from 'chai';
import Promise from 'Bluebird';
import path from 'path';
import login from '../dist/login';
import Downloader from '../dist/illust';
import 'babel-polyfill';

const ASYNC_REQUEST_TIMEOUT = 10000;

describe('Downloader',function(){
    before(function(){
        login.loads(path.join(__dirname,'cookie.privacy.json'));
    });

    describe('prototype#getInfo()', function(){
        const infoTestCase = async function(id,info,done){
            try {
                let downloader = new Downloader(id);
                let _info = await downloader.getInfo();
                expect(_info).to.eql(info);
                done();
            } catch (err) {
                return done(err);
            }
        }

        it('should return info of a single illust', function(done){
            infoTestCase(59260474,{
                id: 59260474,
                title: 'マシュ',
                author: 'しらび',
                tools: [],
                page: 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=59260474',
                date: '2016年10月2日 00:26'
            },done);
        }).timeout(ASYNC_REQUEST_TIMEOUT);

        it('should return info of a set of illusts', function(done){
            infoTestCase(59301639,{
                id: 59301639,
                title: '✦',
                author: 'Lpip',
                tools: [ 'CLIP STUDIO PAINT' ],
                page: 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=59301639',
                date: '2016年10月4日 12:00'
            },done);
        }).timeout(ASYNC_REQUEST_TIMEOUT);

        it('should return info of a ugoira picture set', function(done){
            infoTestCase(59152669,{
                id: 59152669,
                title: '動くラブレター小日向美穂ちゃん',
                author: 'rariemonn',
                tools: [ 'Photoshop', 'SAI' ],
                page: 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=59152669',
                date: '2016年9月25日 00:35'
            },done);
        }).timeout(ASYNC_REQUEST_TIMEOUT);
    });

    describe('prototype#_getDownloadQueue()', function(){
        const downloadQueueTestCase = async function(id,queue,done) {
            try {
                let downloader = new Downloader(id);
                let downloadQueue = await downloader._getDownloadQueue();
                expect(downloadQueue).to.eql(queue);
                done();
            } catch (err) {
                return done(err);
            }
        }

        it('should return the picture download queue (of single illust)', function(done){
            downloadQueueTestCase(58668275,[{
                id: 58668275,
                title: 'Is the order a rabbit?　Ⅴ',
                author: 'Koi',
                tools: [ 'SAI' ],
                page: 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=58668275',
                url: 'http://i4.pixiv.net/img-original/img/2016/08/27/12/00/16/58668275_p0.jpg',
                date: '2016年8月27日 12:00',
                suffix: '.jpg'
            }],done);
        }).timeout(ASYNC_REQUEST_TIMEOUT);

        it('should return the picture download queue (of multiple illust)', function(done){
            downloadQueueTestCase(58986423,[{
                id: 58986423,
                title: '中秋 - 01',
                author: 'red flowers',
                tools: [ 'Photoshop', 'SAI' ],
                page: 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=58986423',
                url: 'http://i4.pixiv.net/img-original/img/2016/09/15/01/16/50/58986423_p0.jpg',
                date: '2016年9月15日 01:16',
                suffix: '.jpg'
            },{
                id: 58986423,
                title: '中秋 - 02',
                author: 'red flowers',
                tools: [ 'Photoshop', 'SAI' ],
                page: 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=58986423',
                url: 'http://i4.pixiv.net/img-original/img/2016/09/15/01/16/50/58986423_p1.jpg',
                date: '2016年9月15日 01:16',
                suffix: '.jpg'
            }],done);
        }).timeout(ASYNC_REQUEST_TIMEOUT);

        it('should return the picture download queue (of ugoira)', function(done){
            downloadQueueTestCase(59152669,[{
                id: 59152669,
                title: '動くラブレター小日向美穂ちゃん',
                author: 'rariemonn',
                tools: [ 'Photoshop', 'SAI' ],
                page: 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=59152669',
                url: 'http://i2.pixiv.net/img-zip-ugoira/img/2016/09/25/00/35/10/59152669_ugoira1920x1080.zip',
                date: '2016年9月25日 00:35',
                suffix: '.zip'
            }],done);
        }).timeout(ASYNC_REQUEST_TIMEOUT);
    });

    describe('prototype#download(filePath)', function(){
        it('will take a long time, you may run download method yourself.',function(){

        });
    });
});
