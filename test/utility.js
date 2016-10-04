import { expect } from 'chai';
import Promise from 'Bluebird';
import { isthenable,cachedProperty } from '../dist/utility';

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
});
