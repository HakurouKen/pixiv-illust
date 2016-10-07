import { expect } from 'chai';
import Promise from 'Bluebird';
import { isthenable,cachedProperty,range,replacePlaceholder } from '../dist/utility';
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
            constructor(){
                this.valueSync = 0;
                this.valueAsync = 0;
            }

            @cachedProperty
            addSync(){
                this.valueSync += 1;
                return this.valueSync;
            }

            @cachedProperty
            addAsync(){
                this.valueAsync += 1;
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
    });

    describe('#range(start, stop, step)', function(){
        it('should return array [0,1,2,...,,n] when only one params specified', function(){
            expect(range(5)).to.eql([0,1,2,3,4]);
        });

        it('should return an array from start(include) to end(not include) when start && end specified', function(){
            expect(range(2,5)).to.eql([2,3,4]);
        });

        it('should return an array from start to end in step', function(){
            expect(range(0,10,2)).to.eql([0,2,4,6,8]);
            expect(range(0,10,3)).to.eql([0,3,6,9]);
            expect(range(10,0,-2)).to.eql([10,8,6,4,2]);
        });

        it('should return an empty array when never reach the end',function(){
            expect(range(-1)).to.eql([]);
            expect(range(5,2)).to.eql([]);
            expect(range(0,10,-2)).to.eql([]);
            expect(range(10,0,3)).to.eql([]);
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
