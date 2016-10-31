import { expect } from 'chai';
import Promise from 'Bluebird';
import { isthenable,cachedProperty,replacePlaceholder,getDate } from '../dist/utility';

describe('utility', function(){
    describe('#isthenable(o)', function() {
        it('should return whether the object has `then` method', function(){
            [{
                value: null,
                result: false
            },{
                value: {},
                result: false
            },{
                value: {then: false},
                result: false
            },{
                value: {then: function(){}},
                result: true
            },{
                value: Promise.resolve(null),
                result: true
            }].forEach(item => {
                expect(isthenable(item.value)).to.equal(item.result);
            });
        });
    });

    describe('#@cachedProperty', function(){
        class Multiplier {
            constructor(base=1){
                this.base = base;
                this.methodSyncExecuted = 0;
                this.methodAsyncExecuted = 0;
            }

            @cachedProperty
            multiSync(...args){
                this.methodSyncExecuted++;
                return args.reduce((product,factor) =>{
                    return product * factor;
                },this.base);
            }

            @cachedProperty
            multiAsync(...args){
                this.methodAsyncExecuted++;
                let ret = args.reduce((product,factor) =>{
                    return product * factor;
                },this.base);
                return Promise.resolve(ret);
            }
        }

        let instance;
        beforeEach(function(){
            instance = new Multiplier();
        });

        it('should wrap the result to a thenable(Promise) instance',function(){
            expect(instance.multiSync(1)).to.be.an.instanceof(Promise);
            expect(isthenable(instance.multiAsync(1))).to.equal(true);
        });

        it('should only cache the sync method when args are exactly the same', function(done){
            (async function(){
                let value = await instance.multiSync(2,3);
                expect(value).to.equal(6);
                expect(instance.methodSyncExecuted).to.equal(1);

                let value2 = await instance.multiSync(3,2);
                expect(value2).to.equal(6);
                expect(instance.methodSyncExecuted).to.equal(2);

                let value3 = await instance.multiSync(3,4);
                expect(value3).to.equal(12);
                expect(instance.methodSyncExecuted).to.equal(3);
                done();
            })();
        });

        it('should only cache the async method when args are exactly the same', function(done){
            (async function(){
                let value = await instance.multiAsync(2,3);
                expect(value).to.equal(6);
                expect(instance.methodAsyncExecuted).to.equal(1);

                let value2 = await instance.multiAsync(3,2);
                expect(value2).to.equal(6);
                expect(instance.methodAsyncExecuted).to.equal(2);

                let value3 = await instance.multiAsync(3,4);
                expect(value3).to.equal(12);
                expect(instance.methodAsyncExecuted).to.equal(3);
                done();
            })();
        });

        it('should cached the sync property, and turn it into Promise', function(done){
            // Issues 2047: https://github.com/mochajs/mocha/issues/2407#issuecomment-237408877
            // We cannot return a Promise object in the callback function.
            // To use the async keywords, just wrap the async function into a new closure.
            (async function(){
                let value = await instance.multiSync(2,3,4);
                expect(value).to.equal(24);
                expect(instance.methodSyncExecuted).to.equal(1);

                let value2 = await instance.multiSync(2,3,4);
                expect(value2).to.equal(24);
                expect(instance.methodSyncExecuted).to.equal(1);

                let value3 = await instance.multiSync(5,1,4);
                expect(value3).to.equal(20);
                expect(instance.methodSyncExecuted).to.equal(2);

                let value4 = await instance.multiSync(2,3,4);
                expect(value4).to.equal(24);
                expect(instance.methodSyncExecuted).to.equal(2);

                done();
            })();
        });

        it('should cache the async property', function(done){
            (async function(){
                let value = await instance.multiAsync(5,4,5);
                expect(instance.methodAsyncExecuted).to.equal(1);
                expect(value).to.equal(100);

                let value2 = await instance.multiAsync(5,4,5);
                expect(instance.methodAsyncExecuted).to.equal(1);
                expect(value2).to.equal(100);

                let value3 = await instance.multiAsync(5,4,9);
                expect(instance.methodAsyncExecuted).to.equal(2);
                expect(value3).to.equal(180);

                let value4 = await instance.multiAsync(5,4,5);
                expect(instance.methodAsyncExecuted).to.equal(2);
                expect(value4).to.equal(100);

                done();
            })();
        });

        it('can cache several result for one sync function with different args',function(done){
            (async function(){
                let value = await instance.multiSync(2,3,4);
                expect(value).to.equal(24);
                expect(instance.methodSyncExecuted).to.equal(1);

                let value2 = await instance.multiSync(2,3,4);
                expect(value2).to.equal(24);
                expect(instance.methodSyncExecuted).to.equal(1);

                let value3 = await instance.multiSync(5,1,4);
                expect(value3).to.equal(20);
                expect(instance.methodSyncExecuted).to.equal(2);

                let value4 = await instance.multiSync(2,3,4);
                expect(value4).to.equal(24);
                expect(instance.methodSyncExecuted).to.equal(2);

                let value5 = await instance.multiSync(5,1,4);
                expect(value5).to.equal(20);
                expect(instance.methodSyncExecuted).to.equal(2);

                done();
            })();
        });

        it('can cache several result for one async function with different args',function(done){
            (async function(){
                let value = await instance.multiAsync(2,3,4);
                expect(value).to.equal(24);
                expect(instance.methodAsyncExecuted).to.equal(1);

                let value2 = await instance.multiAsync(2,3,4);
                expect(value2).to.equal(24);
                expect(instance.methodAsyncExecuted).to.equal(1);

                let value3 = await instance.multiAsync(5,1,4);
                expect(value3).to.equal(20);
                expect(instance.methodAsyncExecuted).to.equal(2);

                let value4 = await instance.multiAsync(2,3,4);
                expect(value4).to.equal(24);
                expect(instance.methodAsyncExecuted).to.equal(2);

                let value5 = await instance.multiAsync(5,1,4);
                expect(value5).to.equal(20);
                expect(instance.methodAsyncExecuted).to.equal(2);

                done();
            })();
        });

        it('should cached the result in _cache variable of instance', function(done){
            (async function(){
                expect(instance._cache).to.be.undefined;

                await instance.multiSync(1,2);
                expect(instance._cache).to.be.an('object');
                expect(instance._cache).to.have.property('multiSync');
                expect(instance._cache.multiSync).to.be.an('array');
                instance._cache.multiSync.forEach(cache => {
                    expect(cache).to.have.property('args');
                    expect(cache).to.have.property('value');
                });

                await instance.multiAsync();
                expect(instance._cache).to.be.an('object');
                expect(instance._cache).to.have.property('multiAsync');
                expect(instance._cache.multiAsync).to.be.an('array');
                instance._cache.multiAsync.forEach(cache => {
                    expect(cache).to.have.property('args');
                    expect(cache).to.have.property('value');
                });

                done();
            })();
        });

        it('should not affet other instance', function(done){
            (async function(){
                let value = await instance.multiAsync(2);
                expect(value).to.equal(2);

                let instance2 = new Multiplier(2);
                expect(instance2._cache).to.be.undefined;
                expect(instance2.methodAsyncExecuted).to.equal(0);

                let value2 = await instance2.multiAsync(3,4);
                expect(value2).to.equal(24);
                expect(instance2.methodAsyncExecuted).to.equal(1);
                done();
            })();
        });
    });

    describe('#replacePlaceholder(str, dataSource, startDelimiter, endDelimiter)', function(){
        let dataSource;
        before(function(){
            dataSource = {
                repository: 'node-pixiv',
                author: 'HakurouKen',
                files: ['package.json','README.md']
            };
        });

        it('should replace the placeholder with data in dataSource',function(){
            expect(replacePlaceholder(`Author: {{author}}`, dataSource))
                .to.equal('Author: HakurouKen');
            expect(replacePlaceholder(`Project: {{author}}/{{repository}}`, dataSource))
                .to.equal('Project: HakurouKen/node-pixiv');
        });

        it('should support javascript expression', function(){
            expect(replacePlaceholder(`Project: {{author + '/' + repository}}`, dataSource))
                .to.equal('Project: HakurouKen/node-pixiv');

            expect(replacePlaceholder(`Files: {{files.join(',')}}`, dataSource))
                .to.equal('Files: package.json,README.md');
        });

        it('should replace nonexistent keys with empty string', function(){
            expect(replacePlaceholder(`PR: {{pr}}`), dataSource)
                .to.equal('PR: ');
            expect(replacePlaceholder(`Files: {{files[0]}}, PR: {{pr}}`, dataSource))
                .to.equal('Files: package.json, PR: ');
        });

        it('should throw when syntax error happend in expression', function(){
            expect(() => replacePlaceholder(`Syntax Error: {{ files+ }}`)).to.throw(Error);
        });

        it('should replace illegal expression with empty string', function(){
            expect(replacePlaceholder(`Error: {{files.that.does.not.exist}}`,dataSource))
                .to.equal('Error: ');
        });

        it('should support custom delimiter', function(){
            expect(replacePlaceholder(`Project: <% author + '/' + repository %>`, dataSource, '<%', '%>'))
                .to.equal('Project: HakurouKen/node-pixiv');
            expect(replacePlaceholder(`PR: <% pr %>`, dataSource, '<%', '%>'))
                .to.equal('PR: ');
        });
    });

    describe('#getDate(d)', function(){
        it('should return the yyyyMMdd format date string', function(){
            let date = new Date('2016-01-01');
            expect(getDate(date)).to.equal('20160101');
        });

        it('should get date from a timestamp number properly', function(){
            expect(getDate(1451606400000)).to.equal('20160101');
        });

        it('should return the string directly when params given is string', function(){
            expect(getDate('20160102')).to.equal('20160102');
            expect(getDate('2016-01-02')).to.equal('2016-01-02');
        })
    });
});
