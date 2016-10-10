import { expect } from 'chai';
import Promise from 'Bluebird';
import { isthenable,cachedProperty,replacePlaceholder } from '../dist/utility';
import 'babel-polyfill';

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
        class TestClass {
            constructor(step=1){
                this.step = step;
                this.valueSync = 0;
                this.valueAsync = 0;
            }

            @cachedProperty
            addSync(){
                this.valueSync += this.step;
                return this.valueSync;
            }

            @cachedProperty
            addAsync(){
                this.valueAsync += this.step;
                return Promise.resolve(this.valueAsync);
            }
        }

        let instance;
        beforeEach(function(){
            instance = new TestClass();
        });

        it('should wrap the result to a thenable(Promise) instance',function(){
            expect(instance.addSync()).to.be.an.instanceof(Promise);
            expect(isthenable(instance.addAsync())).to.equal(true);
        });

        it('should cached the sync property, and turn it into Promise', function(done){
            // Issues 2047: https://github.com/mochajs/mocha/issues/2407#issuecomment-237408877
            // We cannot return a Promise object in the callback function.
            // To use the async keywords, just wrap the async function into a new closure.
            (async function(){
                let value = await instance.addSync();
                expect(value).to.equal(1);
                let value2 = await instance.addSync();
                expect(value2).to.equal(1);
                done();
            })();
        });

        it('should cached the async property', function(done){
            (async function(){
                let value = await instance.addAsync();
                expect(value).to.equal(1);
                let value2 = await instance.addAsync();
                expect(value2).to.equal(1);
                done();
            })();
        });

        it('should cached the result in _cache variable of instance', function(done){
            (async function(){
                expect(instance._cache).to.be.undefined;
                await instance.addSync();
                expect(instance._cache).to.be.an('object');
                expect(instance._cache).to.have.property('addSync');

                await instance.addAsync();
                expect(instance._cache).to.be.an('object');
                expect(instance._cache).to.have.property('addAsync');
                done();
            })();
        });

        it('should not affet other instance', function(done){
            (async function(){
                let value = await instance.addSync();
                expect(value).to.equal(1);

                let instance2 = new TestClass(2);
                expect(instance2._cache).to.be.undefined;
                let value2 = await instance2.addSync();
                expect(value2).to.equal(2);
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
});
