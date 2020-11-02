// import { BN, fromWei } from 'web3-utils'
// import ether from './helpers/ether'
// import EVMRevert from './helpers/EVMRevert'
// import { duration } from './helpers/duration'
//
//
// const BigNumber = BN
//
// require('chai')
//   .use(require('chai-as-promised'))
//   .use(require('chai-bignumber')(BigNumber))
//   .should()
//
// const CoTraderGlobalConfig = artifacts.require('./core/CoTraderGlobalConfig.sol')
//
//
// contract('CoTraderGlobalConfig', function([userOne, userTwo, userThree]) {
//   beforeEach(async function() {
//     this.platformAddress = '0x0000000000000000000000000000000000000001'
//     this.CoTraderConfig = await CoTraderGlobalConfig.new(this.platformAddress)
//   })
//
//   describe('Update config', function() {
//     it('Owner can set MIN_TRADE_FREEZE', async function() {
//       assert.equal(await this.CoTraderConfig.MIN_TRADE_FREEZE(), duration.minutes(3))
//       await this.CoTraderConfig.set_MIN_TRADE_FREEZE(duration.minutes(7))
//       assert.equal(await this.CoTraderConfig.MIN_TRADE_FREEZE(), duration.minutes(7))
//     })
//
//     it('Not Owner can Not set MIN_TRADE_FREEZE', async function() {
//       await this.CoTraderConfig.set_MIN_TRADE_FREEZE(duration.minutes(7), { from:userTwo }).
//       should.be.rejectedWith(EVMRevert)
//     })
//
//     it('Owner can set MAX_TRADE_FREEZE', async function() {
//       assert.equal(await this.CoTraderConfig.MAX_TRADE_FREEZE(), duration.minutes(15))
//       await this.CoTraderConfig.set_MAX_TRADE_FREEZE(duration.minutes(20))
//       assert.equal(await this.CoTraderConfig.MAX_TRADE_FREEZE(), duration.minutes(20))
//     })
//
//     it('Not Owner can Not set MIN_TRADE_FREEZE', async function() {
//       await this.CoTraderConfig.set_MAX_TRADE_FREEZE(duration.minutes(20), { from:userTwo }).
//       should.be.rejectedWith(EVMRevert)
//     })
//
//     it('Owner can set MIN_DW_INTERVAL', async function() {
//       assert.equal(await this.CoTraderConfig.MIN_DW_INTERVAL(), duration.minutes(30))
//       await this.CoTraderConfig.set_MIN_DW_INTERVAL(duration.minutes(37))
//       assert.equal(await this.CoTraderConfig.MIN_DW_INTERVAL(), duration.minutes(37))
//     })
//
//     it('Not Owner can Not set MIN_DW_INTERVAL', async function() {
//       await this.CoTraderConfig.set_MIN_DW_INTERVAL(duration.minutes(37), { from:userTwo }).
//       should.be.rejectedWith(EVMRevert)
//     })
//
//     it('Owner can set MAX_DW_INTERVAL', async function() {
//       assert.equal(await this.CoTraderConfig.MAX_DW_INTERVAL(), duration.hours(2))
//       await this.CoTraderConfig.set_MAX_DW_INTERVAL(duration.minutes(60))
//       assert.equal(await this.CoTraderConfig.MAX_DW_INTERVAL(), duration.minutes(60))
//     })
//
//     it('Not Owner can Not set MAX_DW_INTERVAL', async function() {
//       await this.CoTraderConfig.set_MAX_DW_INTERVAL(duration.minutes(60), { from:userTwo }).
//       should.be.rejectedWith(EVMRevert)
//     })
//
//     it('Owner can set MIN_MAX_TOKENS', async function() {
//       assert.equal(await this.CoTraderConfig.MIN_MAX_TOKENS(), 20)
//       await this.CoTraderConfig.set_MIN_MAX_TOKENS(33)
//       assert.equal(await this.CoTraderConfig.MIN_MAX_TOKENS(), 33)
//     })
//
//     it('Not Owner can Not set MIN_MAX_TOKENS', async function() {
//       await this.CoTraderConfig.set_MIN_MAX_TOKENS(33, { from:userTwo }).
//       should.be.rejectedWith(EVMRevert)
//     })
//
//     it('Owner can set MAX_MAX_TOKENS', async function() {
//       assert.equal(await this.CoTraderConfig.MAX_MAX_TOKENS(), 40)
//       await this.CoTraderConfig.set_MAX_MAX_TOKENS(50)
//       assert.equal(await this.CoTraderConfig.MAX_MAX_TOKENS(), 50)
//     })
//
//     it('Not Owner can Not set MAX_MAX_TOKENS', async function() {
//       await this.CoTraderConfig.set_MAX_MAX_TOKENS(50, { from:userTwo }).
//       should.be.rejectedWith(EVMRevert)
//     })
//
//     it('Owner can set PLATFORM_ADDRESS', async function() {
//       const NewPlatformAddress = '0x0000000000000000000000000000000000000002'
//       assert.equal(await this.CoTraderConfig.PLATFORM_ADDRESS(), this.platformAddress)
//       await this.CoTraderConfig.set_PLATFORM_ADDRESS(NewPlatformAddress)
//       assert.equal(await this.CoTraderConfig.PLATFORM_ADDRESS(), NewPlatformAddress)
//     })
//
//     it('Not Owner can Not set PLATFORM_ADDRESS', async function() {
//       const NewPlatformAddress = '0x0000000000000000000000000000000000000002'
//       await this.CoTraderConfig.set_PLATFORM_ADDRESS(NewPlatformAddress, { from:userTwo }).
//       should.be.rejectedWith(EVMRevert)
//     })
//   })
// })
