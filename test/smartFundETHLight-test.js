import { BN, fromWei, toWei } from 'web3-utils'
import { MerkleTree } from 'merkletreejs'
import keccak256 from 'keccak256'
import ether from './helpers/ether'
import EVMRevert from './helpers/EVMRevert'
import { duration } from './helpers/duration'
import latestTime from './helpers/latestTime'


const timeMachine = require('ganache-time-traveler')
const BigNumber = BN
const buf2hex = x => '0x'+x.toString('hex')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const ETH_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

// Create additional mock bytes params for trade via Paraswap aggregator
const PARASWAP_MOCK_ADDITIONAL_PARAMS = web3.eth.abi.encodeParameters(
  ['uint256', 'address[]', 'uint256[]', 'uint256[]', 'uint256', 'bytes'],
  [1,
   ['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'],
   [1,2],
   [1,2],
   1,
   "0x"
  ])

// Create additional mock bytes params for trade via 1inch aggregator
const ONEINCH_MOCK_ADDITIONAL_PARAMS = web3.eth.abi.encodeParameters(
  ['uint256', 'uint256[]'],
  [1,
   [1,1]
  ])

// real contracts
const SmartFundETH = artifacts.require('./core/light_funds/SmartFundETHLight.sol')
const TokensTypeStorage = artifacts.require('./core/storage/TokensTypeStorage.sol')
const PermittedAddresses = artifacts.require('./core/verification/PermittedAddresses.sol')
const MerkleWhiteList = artifacts.require('./core/verification/MerkleTreeTokensVerification.sol')
const CoTraderGlobalConfig = artifacts.require('./core/CoTraderGlobalConfig.sol')


// mock
const Token = artifacts.require('./tokens/Token')
const CoTraderDAOWalletMock = artifacts.require('./CoTraderDAOWalletMock')
const OneInch = artifacts.require('./OneInchMock')
const ExchangePortalMock = artifacts.require('./portalsMock/ExchangePortalMock')
const FundValueOracle = artifacts.require('./FundValueOracle')

// Tokens keys converted in bytes32
const TOKEN_KEY_CRYPTOCURRENCY = "0x43525950544f43555252454e4359000000000000000000000000000000000000"

// Contracts instance
let xxxERC,
    DAI,
    LINK,
    exchangePortal,
    smartFundETH,
    BNT,
    COT_DAO_WALLET,
    yyyERC,
    tokensType,
    permittedAddresses,
    oneInch,
    merkleWhiteList,
    MerkleTREE,
    Oracle,
    CoTraderConfig



contract('SmartFundETH', function([userOne, userTwo, userThree]) {

  async function deployContracts(successFee=1000){
    COT_DAO_WALLET = await CoTraderDAOWalletMock.new()
    oneInch = await OneInch.new()

    // DEPLOY ERC20 TOKENS
    xxxERC = await Token.new(
      "xxxERC20",
      "xxx",
      18,
      toWei(String(100000000))
    )

    yyyERC = await Token.new(
      "yyyERC20",
      "yyy",
      18,
      toWei(String(100000000))
    )

    BNT = await Token.new(
      "Bancor Newtork Token",
      "BNT",
      18,
      toWei(String(100000000))
    )

    DAI = await Token.new(
      "DAI Stable Coin",
      "DAI",
      18,
      toWei(String(100000000))
    )

    LINK = await Token.new(
      "LINK Chain",
      "LINK",
      18,
      toWei(String(100000000))
    )

    Oracle = await FundValueOracle.new(
      LINK.address
    )

    // give some link another users
    await LINK.transfer(userTwo, toWei(String(10000)))
    await LINK.transfer(userThree, toWei(String(10000)))


    // Create MerkleTREE instance
    const leaves = [
      xxxERC.address,
      yyyERC.address,
      BNT.address,
      DAI.address,
      ETH_TOKEN_ADDRESS
    ].map(x => keccak256(x)).sort(Buffer.compare)

    MerkleTREE = new MerkleTree(leaves, keccak256)

    // Deploy merkle white list contract
    merkleWhiteList = await MerkleWhiteList.new(MerkleTREE.getRoot())

    // Deploy tokens type storage
    tokensType = await TokensTypeStorage.new()

    // Mark ETH as CRYPTOCURRENCY, because we recieve this token,
    // without trade, but via deposit
    await tokensType.setTokenTypeAsOwner(ETH_TOKEN_ADDRESS, "CRYPTOCURRENCY")

    // Deploy exchangePortal
    exchangePortal = await ExchangePortalMock.new(
      1,
      1,
      DAI.address,
      tokensType.address,
      merkleWhiteList.address
    )

    // allow exchange portal and pool portal write to token type storage
    await tokensType.addNewPermittedAddress(exchangePortal.address)

    permittedAddresses = await PermittedAddresses.new(
      exchangePortal.address,
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      DAI.address
    )

    CoTraderConfig = await CoTraderGlobalConfig.new(COT_DAO_WALLET.address)

    // Deploy ETH fund
    smartFundETH = await SmartFundETH.new(
      userOne,                                      // address _owner,
      'TEST ETH FUND',                              // string _name,
      successFee,                                   // uint256 _successFee,
      exchangePortal.address,                       // address _exchangePortalAddress,
      permittedAddresses.address,                   // permitted address
      Oracle.address,                               // Oracle
      true,                                         // verification for trade tokens
      CoTraderConfig.address
    )
  }

  beforeEach(async function() {
    await deployContracts()
  })

  describe('INIT', function() {
    it('Correct init tokens', async function() {
      const nameX = await xxxERC.name()
      const totalSupplyX = await xxxERC.totalSupply()
      assert.equal(nameX, "xxxERC20")
      assert.equal(totalSupplyX, toWei(String(100000000)))

      const nameY = await yyyERC.name()
      const totalSupplyY = await yyyERC.totalSupply()
      assert.equal(nameY, "yyyERC20")
      assert.equal(totalSupplyY, toWei(String(100000000)))
    })

    it('Correct version 8', async function() {
      assert.equal(await smartFundETH.version(), 8)
    })

    it('Correct size type', async function() {
      assert.equal(await smartFundETH.isLightFund(), true)
    })

    it('Correct exchange portal in fund', async function() {
      assert.equal(await smartFundETH.exchangePortal(), exchangePortal.address)
    })

    it('Correct Oracle in fund', async function() {
      assert.equal(await smartFundETH.fundValueOracle(), Oracle.address)
    })

    it('Correct init Oracle token', async function() {
      assert.equal(await Oracle.chainLinkAddress(), LINK.address)
    })


    it('Correct init exchange portal stable coin', async function() {
      assert.equal(await exchangePortal.stableCoinAddress(), DAI.address)
    })


    it('Correct init eth smart fund', async function() {
      const name = await smartFundETH.name()
      const totalShares = await smartFundETH.totalShares()
      const portalEXCHANGE = await smartFundETH.exchangePortal()

      assert.equal(exchangePortal.address, portalEXCHANGE)
      assert.equal('TEST ETH FUND', name)
      assert.equal(0, totalShares)
    })

    it('Correct init commision', async function() {
      const successFee = await smartFundETH.successFee()
      const platformFee = await smartFundETH.platformFee()

      assert.equal(Number(successFee), 1000)
      assert.equal(Number(platformFee), 1000)
      assert.equal(Number(successFee), Number(platformFee))
    })
  })

  describe('Deposit', function() {
    // update and provide data from Oracle
    async function updateOracle(value, sender){
      await Oracle.setMockValue(value)
      await LINK.approve(smartFundETH.address, toWei(String(1)), {from: sender})
      await smartFundETH.updateFundValueFromOracle(LINK.address, toWei(String(1)), {from: sender})
    }

    it('should not be able to deposit 0 Ether', async function() {
      assert.equal(await smartFundETH.totalShares(), 0)
      // if total shares 0, no need call Oracle for deposit
      await smartFundETH.deposit({ from: userOne, value: 0 })
      .should.be.rejectedWith(EVMRevert)
    })

    it('should be able to deposit positive amount of Ether', async function() {
      await smartFundETH.deposit({ from: userOne, value: 100 })
      assert.equal(await smartFundETH.addressToShares(userOne), toWei(String(1)))

      assert.notEqual(await smartFundETH.totalShares(), 0)

      await updateOracle(100, userOne)

      const fundValue = await smartFundETH.calculateFundValue()
      assert.equal(fundValue, 100)
    })

    it('should accurately calculate empty fund value', async function() {
      assert.equal((await smartFundETH.getAllTokenAddresses()).length, 1) // Ether is initial token
      await updateOracle(0, userOne)
      assert.equal(await smartFundETH.calculateFundValue(), 0)
    })

    it('should require update from Oracle for deposit if total shares != 0', async function() {
      assert.equal(await smartFundETH.totalShares(), 0)

      await smartFundETH.deposit({ from: userOne, value: 100 })
      assert.equal(await smartFundETH.addressToShares(userOne), toWei(String(1)))
      assert.equal(await smartFundETH.totalShares(), toWei(String(1)))

      await smartFundETH.deposit({ from: userOne, value: 100 })
      .should.be.rejectedWith(EVMRevert)
      assert.equal(await smartFundETH.addressToShares(userOne), toWei(String(1)))
      assert.equal(await smartFundETH.totalShares(), toWei(String(1)))

      await updateOracle(100, userOne)

      await smartFundETH.deposit({ from: userOne, value: 100 })
      assert.equal(await smartFundETH.addressToShares(userOne), toWei(String(2)))
      assert.equal(await smartFundETH.totalShares(), toWei(String(2)))
    })
  })

  describe('Profit', function() {
    // update and provide data from Oracle
    async function updateOracle(value, sender){
      await Oracle.setMockValue(value)
      await LINK.approve(smartFundETH.address, toWei(String(1)), {from: sender})
      await smartFundETH.updateFundValueFromOracle(LINK.address, toWei(String(1)), {from: sender})
    }

    async function calculateFundProfit(totalFundValue, oracleSender){
      // return int256(fundValue) + int256(totalWeiWithdrawn) - int256(totalWeiDeposited)
      await updateOracle(totalFundValue, oracleSender)
      const fundValue = new BigNumber(await smartFundETH.calculateFundValue())
      const totalWeiWithdrawn = await smartFundETH.totalWeiWithdrawn()
      const totalWeiDeposited = await smartFundETH.totalWeiDeposited()

      return fundValue.add(totalWeiWithdrawn).sub(totalWeiDeposited)
    }

    it('should have correct total D/W wei data', async function() {
      assert.equal(await smartFundETH.totalWeiDeposited(), 0)
      assert.equal(await smartFundETH.totalWeiWithdrawn(), 0)
    })

    it('should accurately calculate profit if price stays stable', async function() {
        // give portal some money
        await xxxERC.transfer(exchangePortal.address, 1000)

        // deposit in fund
        await smartFundETH.deposit({ from: userOne, value: 100 })

        // get proof and position for dest token
        const proof = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => buf2hex(x.data))
        const position = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => x.position === 'right' ? 1 : 0)

        // make a trade with the fund
        await smartFundETH.trade(
          ETH_TOKEN_ADDRESS, 100,
          xxxERC.address,
          2,
          proof,
          position,
          ONEINCH_MOCK_ADDITIONAL_PARAMS, 1,{
          from: userOne,
        })

        assert.equal(await calculateFundProfit(100, userOne), 0)
    })

    it('should accurately calculate profit upon price rise', async function() {
        // give portal some money
        await xxxERC.transfer(exchangePortal.address, 1000)

        // deposit in fund
        await smartFundETH.deposit({ from: userOne, value: 100 })

        // get proof and position for dest token
        const proof = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => buf2hex(x.data))
        const position = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => x.position === 'right' ? 1 : 0)

        // make a trade with the fund
        await smartFundETH.trade(
          ETH_TOKEN_ADDRESS,
          100,
          xxxERC.address,
          0,
          proof,
          position,
          PARASWAP_MOCK_ADDITIONAL_PARAMS, 1,{
          from: userOne,
        })

        // change the rate (making a profit)
        await exchangePortal.setRatio(1, 2)

        assert.equal(await calculateFundProfit(200, userOne), 100)
    })

    it('should accurately calculate profit upon price fall', async function() {
        // give portal some money
        await xxxERC.transfer(exchangePortal.address, 1000)

        // deposit in fund
        await smartFundETH.deposit({ from: userOne, value: 100 })

        // get proof and position for dest token
        const proof = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => buf2hex(x.data))
        const position = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => x.position === 'right' ? 1 : 0)

        // Trade 100 eth for 100 bat via kyber
        await smartFundETH.trade(
          ETH_TOKEN_ADDRESS,
          100,
          xxxERC.address,
          2,
          proof,
          position,
          ONEINCH_MOCK_ADDITIONAL_PARAMS, 1,{
          from: userOne,
        })

        // change the rate to make a loss (2 tokens is 1 ether)
        assert.equal(await calculateFundProfit(50, userOne), -50)
    })

    it('should accurately calculate profit if price stays stable with multiple trades', async function() {
        // give exchange portal contract some money
        await xxxERC.transfer(exchangePortal.address, 1000)
        await yyyERC.transfer(exchangePortal.address, 1000)

        // deposit in fund
        await smartFundETH.deposit({ from: userOne, value: 100 })

        // get proof and position for dest token
        const proofYYY = MerkleTREE.getProof(keccak256(yyyERC.address)).map(x => buf2hex(x.data))
        const positionYYY = MerkleTREE.getProof(keccak256(yyyERC.address)).map(x => x.position === 'right' ? 1 : 0)

        await smartFundETH.trade(
          ETH_TOKEN_ADDRESS,
          50,
          yyyERC.address,
          0,
          proofYYY,
          positionYYY,
          PARASWAP_MOCK_ADDITIONAL_PARAMS, 1,{
          from: userOne,
        })

        // get proof and position for dest token
        const proofXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => buf2hex(x.data))
        const positionXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => x.position === 'right' ? 1 : 0)

        await smartFundETH.trade(
          ETH_TOKEN_ADDRESS, 50,
          xxxERC.address,
          2,
          proofXXX,
          positionXXX,
          ONEINCH_MOCK_ADDITIONAL_PARAMS, 1,{
          from: userOne,
        })

        // check that we still haven't made a profit
        assert.equal(await calculateFundProfit(100, userOne), 0)
    })

    it('Fund manager should be able to withdraw after investor withdraws', async function() {
        // give exchange portal contract some money
        await xxxERC.transfer(exchangePortal.address, toWei(String(50)))
        await exchangePortal.pay({ from: userOne, value: toWei(String(3))})
        // deposit in fund
        await smartFundETH.deposit({ from: userOne, value: toWei(String(1)) })

        assert.equal(await web3.eth.getBalance(smartFundETH.address), toWei(String(1)))

        // get proof and position for dest token
        const proofXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => buf2hex(x.data))
        const positionXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => x.position === 'right' ? 1 : 0)

        await smartFundETH.trade(
          ETH_TOKEN_ADDRESS,
          toWei(String(1)),
          xxxERC.address,
          0,
          proofXXX,
          positionXXX,
          PARASWAP_MOCK_ADDITIONAL_PARAMS,
          1,
          {
            from: userOne
          }
        )

        assert.equal(await web3.eth.getBalance(smartFundETH.address), 0)

        // 1 token is now worth 2 ether
        await exchangePortal.setRatio(1, 2)

        await updateOracle(toWei(String(2)), userOne)

        assert.equal(await smartFundETH.calculateFundValue(), toWei(String(2)))

        // get proof and position for dest token
        const proofETH = MerkleTREE.getProof(keccak256(ETH_TOKEN_ADDRESS)).map(x => buf2hex(x.data))
        const positionETH = MerkleTREE.getProof(keccak256(ETH_TOKEN_ADDRESS)).map(x => x.position === 'right' ? 1 : 0)

        // update freeze time
        await advanceTimeAndBlock(duration.minutes(6))

        // should receive 200 'ether' (wei)
        await smartFundETH.trade(
          xxxERC.address,
          toWei(String(1)),
          ETH_TOKEN_ADDRESS,
          0,
          proofETH,
          positionETH,
          PARASWAP_MOCK_ADDITIONAL_PARAMS,
          1,
          {
            from: userOne,
          }
        )

        assert.equal(await web3.eth.getBalance(smartFundETH.address), toWei(String(2)))

        const totalWeiDeposited = await smartFundETH.totalWeiDeposited()
        assert.equal(fromWei(totalWeiDeposited), 1)

        await advanceTimeAndBlock(duration.minutes(31))
        await updateOracle(toWei(String(2)), userOne)

        // user1 now withdraws 1.9 ether, 0.9 of which are profit
        await smartFundETH.withdraw(0, { from: userOne })

        const totalWeiWithdrawn = await smartFundETH.totalWeiWithdrawn()
        assert.equal(fromWei(totalWeiWithdrawn), 1.9)

        await advanceTimeAndBlock(duration.minutes(31))
        await updateOracle(toWei(String(0.1)), userOne)

        assert.equal(await smartFundETH.calculateFundValue(), toWei(String(0.1)))

        const {
          fundManagerRemainingCut,
          fundValue,
          fundManagerTotalCut,
        } =
        await smartFundETH.calculateFundManagerCut()

        assert.equal(fundValue, toWei(String(0.1)))
        assert.equal(fundManagerRemainingCut, toWei(String(0.1)))
        assert.equal(fundManagerTotalCut, toWei(String(0.1)))

          // // FM now withdraws their profit
        await smartFundETH.fundManagerWithdraw({ from: userOne })
        // Platform recieve commision
        assert.notEqual(await web3.eth.getBalance(await CoTraderConfig.PLATFORM_ADDRESS()), 0)
      })

   it('Should properly calculate profit after another user made profit and withdrew', async function() {
        // give exchange portal contract some money
        await xxxERC.transfer(exchangePortal.address, toWei(String(50)))
        await exchangePortal.pay({ from: userOne, value: toWei(String(5)) })
        // deposit in fund
        await smartFundETH.deposit({ from: userOne, value: toWei(String(1)) })

        assert.equal(await web3.eth.getBalance(smartFundETH.address), toWei(String(1)))

        // get proof and position for dest token
        const proofXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => buf2hex(x.data))
        const positionXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => x.position === 'right' ? 1 : 0)

        await smartFundETH.trade(
          ETH_TOKEN_ADDRESS,
          toWei(String(1)),
          xxxERC.address,
          0,
          proofXXX,
          positionXXX,
          PARASWAP_MOCK_ADDITIONAL_PARAMS,
          1,
          {
            from: userOne,
          }
        )

        assert.equal(await web3.eth.getBalance(smartFundETH.address), 0)

        // 1 token is now worth 2 ether
        await exchangePortal.setRatio(1, 2)

        await updateOracle(toWei(String(2)), userOne)

        assert.equal(await smartFundETH.calculateFundValue(), toWei(String(2)))

        // get proof and position for dest token
        const proofETH = MerkleTREE.getProof(keccak256(ETH_TOKEN_ADDRESS)).map(x => buf2hex(x.data))
        const positionETH = MerkleTREE.getProof(keccak256(ETH_TOKEN_ADDRESS)).map(x => x.position === 'right' ? 1 : 0)

        // update freeze time
        await timeMachine.advanceTimeAndBlock(duration.minutes(6))

        // should receive 200 'ether' (wei)
        await smartFundETH.trade(
          xxxERC.address,
          toWei(String(1)),
          ETH_TOKEN_ADDRESS,
          0,
          proofETH,
          positionETH,
          PARASWAP_MOCK_ADDITIONAL_PARAMS,
          1,
          {
            from: userOne,
          }
        )

        assert.equal(await web3.eth.getBalance(smartFundETH.address), toWei(String(2)))

        await timeMachine.advanceTimeAndBlock(duration.minutes(31))
        await updateOracle(toWei(String(2)), userOne)

        // user1 now withdraws 1.9 ether, 0.9 of which are profit
        await smartFundETH.withdraw(0, { from: userOne })

        await timeMachine.advanceTimeAndBlock(duration.minutes(31))
        await updateOracle(toWei(String(0.1)), userOne)

        assert.equal(await smartFundETH.calculateFundValue(), toWei(String(0.1)))

        // FM now withdraws their profit
        await smartFundETH.fundManagerWithdraw({ from: userOne })
        assert.equal(await web3.eth.getBalance(smartFundETH.address), 0)

        await timeMachine.advanceTimeAndBlock(duration.minutes(31))
        await updateOracle(0, userOne)

        // now user2 deposits into the fund
        await smartFundETH.deposit({ from: userTwo, value: toWei(String(1)) })

        // 1 token is now worth 1 ether
        await exchangePortal.setRatio(1, 1)

        // update freeze time
        await advanceTimeAndBlock(duration.minutes(6))

        await smartFundETH.trade(
          ETH_TOKEN_ADDRESS,
          toWei(String(1)),
          xxxERC.address,
          0,
          proofXXX,
          positionXXX,
          PARASWAP_MOCK_ADDITIONAL_PARAMS,
          1,
          {
            from: userOne,
          }
        )

        // 1 token is now worth 2 ether
        await exchangePortal.setRatio(1, 2)

        // should receive 200 'ether' (wei)
        await smartFundETH.trade(
          xxxERC.address,
          toWei(String(1)),
          ETH_TOKEN_ADDRESS,
          0,
          proofETH,
          positionETH,
          PARASWAP_MOCK_ADDITIONAL_PARAMS,
          1,
          {
            from: userOne,
          }
        )

        await advanceTimeAndBlock(duration.minutes(31))
        await updateOracle(toWei(String(2)), userOne)

        const {
          fundManagerRemainingCut,
          fundValue,
          fundManagerTotalCut,
        } = await smartFundETH.calculateFundManagerCut()

        assert.equal(fundValue, toWei(String(2)))
        // 'remains cut should be 0.1 eth'
        assert.equal(
          fundManagerRemainingCut,
          toWei(String(0.1))
        )
        // 'total cut should be 0.2 eth'
        assert.equal(
          fundManagerTotalCut,
          toWei(String(0.2))
        )
      })
  })

  describe('Withdraw', function() {
   // update and provide data from Oracle
   async function updateOracle(value, sender){
     await Oracle.setMockValue(value)
     await LINK.approve(smartFundETH.address, toWei(String(1)), {from: sender})
     await smartFundETH.updateFundValueFromOracle(LINK.address, toWei(String(1)), {from: sender})
   }

   it('should be able to withdraw all deposited funds', async function() {
      const totalShares = await smartFundETH.totalShares()
      assert.equal(totalShares, 0)

      await smartFundETH.deposit({ from: userOne, value: 100 })
      assert.equal(await web3.eth.getBalance(smartFundETH.address), 100)

      await updateOracle(100, userOne)

      await smartFundETH.withdraw(0, { from: userOne })
      assert.equal(await web3.eth.getBalance(smartFundETH.address), 0)
    })

    it('should be able to withdraw percentage of deposited funds', async function() {
      let totalShares

      totalShares = await smartFundETH.totalShares()
      assert.equal(totalShares, 0)

      await smartFundETH.deposit({ from: userOne, value: 100 })

      totalShares = await smartFundETH.totalShares()

      await updateOracle(100, userOne)

      await smartFundETH.withdraw(5000, { from: userOne }) // 50.00%

      assert.equal(await smartFundETH.totalShares(), totalShares / 2)
    })

    it('should be able to withdraw deposited funds with multiple users', async function() {
      // deposit
      await smartFundETH.deposit({ from: userOne, value: 100 })

      await updateOracle(100, userTwo)

      assert.equal(await smartFundETH.calculateFundValue(), 100)
      await smartFundETH.deposit({ from: userTwo, value: 100 })

      // check
      await advanceTimeAndBlock(duration.minutes(31))
      await updateOracle(200, userOne)
      assert.equal(await smartFundETH.calculateFundValue(), 200)

      // withdraw from userOne
      let sfBalance
      sfBalance = await web3.eth.getBalance(smartFundETH.address)
      assert.equal(sfBalance, 200)
      await smartFundETH.withdraw(0, { from: userOne })
      sfBalance = await web3.eth.getBalance(smartFundETH.address)

      assert.equal(sfBalance, 100)

      // withdraw from userTwo
      await advanceTimeAndBlock(duration.minutes(31))
      await updateOracle(100, userTwo)
      await smartFundETH.withdraw(0, { from: userTwo })
      sfBalance = await web3.eth.getBalance(smartFundETH.address)
      assert.equal(sfBalance, 0)
    })
  })


  describe('Fund Manager', function() {
    // update and provide data from Oracle
    async function updateOracle(value, sender){
     await Oracle.setMockValue(value)
     await LINK.approve(smartFundETH.address, toWei(String(1)), {from: sender})
     await smartFundETH.updateFundValueFromOracle(LINK.address, toWei(String(1)), {from: sender})
    }

    it('should calculate fund manager and platform cut when no profits', async function() {
      await deployContracts(1500)
      await updateOracle(0, userOne)

      const {
        fundManagerRemainingCut,
        fundValue,
        fundManagerTotalCut,
      } = await smartFundETH.calculateFundManagerCut()

      assert.equal(fundManagerRemainingCut, 0)
      assert.equal(fundValue, 0)
      assert.equal(fundManagerTotalCut, 0)
    })

    const fundManagerTest = async (expectedFundManagerCut = 15, self) => {
      // deposit
      await smartFundETH.deposit({ from: userOne, value: 100 })
      // send xxx to exchange
      await xxxERC.transfer(exchangePortal.address, 200, { from: userOne })

      // get proof and position for dest token
      const proofXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => buf2hex(x.data))
      const positionXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => x.position === 'right' ? 1 : 0)

      // Trade 100 ether for 100 xxx
      await smartFundETH.trade(
        ETH_TOKEN_ADDRESS,
        100,
        xxxERC.address,
        2,
        proofXXX,
        positionXXX,
        ONEINCH_MOCK_ADDITIONAL_PARAMS, 1,{
        from: userOne,
      })

      // increase price of xxx. Ratio of 1/2 means 1 eth = 1/2 xxx
      await exchangePortal.setRatio(1, 2)

      await updateOracle(200, userOne)

      // check profit and cuts are corrects
      const {
        fundManagerRemainingCut,
        fundValue,
        fundManagerTotalCut,
      } = await smartFundETH.calculateFundManagerCut()

      assert.equal(fundValue, 200)
      assert.equal(fundManagerRemainingCut.toNumber(), expectedFundManagerCut)
      assert.equal(fundManagerTotalCut.toNumber(), expectedFundManagerCut)
    }

    it('should calculate fund manager and platform cut correctly', async function() {
      await deployContracts(1500)
      await fundManagerTest()
    })

    it('should calculate fund manager and platform cut correctly when not set', async function() {
      await deployContracts(0)
      await fundManagerTest(0)
    })

    it('should calculate fund manager and platform cut correctly when no platform fee', async function() {
      await deployContracts(1500)
      await fundManagerTest(15)
    })

    it('should calculate fund manager and platform cut correctly when no success fee', async function() {
      await deployContracts(0)
      await fundManagerTest(0)
    })

    it('should be able to withdraw fund manager profits', async function() {
      await deployContracts(2000)
      await fundManagerTest(20)

      await advanceTimeAndBlock(duration.minutes(31))
      await updateOracle(200, userOne)

      await smartFundETH.fundManagerWithdraw({ from: userOne })

      await advanceTimeAndBlock(duration.minutes(31))
      await updateOracle(180, userOne)

      const {
        fundManagerRemainingCut,
        fundValue,
        fundManagerTotalCut,
      } = await smartFundETH.calculateFundManagerCut()

      assert.equal(fundValue, 180)
      assert.equal(fundManagerRemainingCut, 0)
      assert.equal(fundManagerTotalCut, 20)
    })
  })

  describe('Min return', function() {
    it('Not allow execude transaction trade if for some reason DEX not sent min return asset', async function() {
      // deploy smartFund with 10% success fee
      await deployContracts(1000)
      // disable transfer in DEX
      await exchangePortal.changeStopTransferStatus(true)
      // give exchange portal contract some money
      await xxxERC.transfer(exchangePortal.address, toWei(String(10)))

      // deposit in fund
      await smartFundETH.deposit({ from: userOne, value: toWei(String(1)) })

      // get proof and position for dest token
      const proofXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => buf2hex(x.data))
      const positionXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => x.position === 'right' ? 1 : 0)

      await smartFundETH.trade(
        ETH_TOKEN_ADDRESS,
        toWei(String(1)),
        xxxERC.address,
        0,
        proofXXX,
        positionXXX,
        PARASWAP_MOCK_ADDITIONAL_PARAMS,
        toWei(String(1)),
        {
          from: userOne,
        }
      ).should.be.rejectedWith(EVMRevert)
    })
  })

  describe('Fund Manager profit cut with deposit/withdraw scenarios', function() {
    // update and provide data from Oracle
    async function updateOracle(value, sender){
     await Oracle.setMockValue(value)
     await LINK.approve(smartFundETH.address, toWei(String(1)), {from: sender})
     await smartFundETH.updateFundValueFromOracle(LINK.address, toWei(String(1)), {from: sender})
    }

    it('should accurately calculate shares when the manager makes a profit', async function() {
      // deploy smartFund with 10% success fee
      await deployContracts(1000)
      const fee = await smartFundETH.successFee()
      assert.equal(fee, 1000)

      // give exchange portal contract some money
      await xxxERC.transfer(exchangePortal.address, toWei(String(10)))

      // deposit in fund
      await smartFundETH.deposit({ from: userOne, value: toWei(String(1)) })

      // get proof and position for dest token
      const proofXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => buf2hex(x.data))
      const positionXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => x.position === 'right' ? 1 : 0)

      // trade 1 ETH to XXX
      await smartFundETH.trade(
        ETH_TOKEN_ADDRESS,
        toWei(String(1)),
        xxxERC.address,
        0,
        proofXXX,
        positionXXX,
        PARASWAP_MOCK_ADDITIONAL_PARAMS,
        1,
        {
          from: userOne,
        }
      )

      // After trade recieved asset should be marked as CRYPTOCURRENCY
      assert.equal(await tokensType.getType(xxxERC.address), TOKEN_KEY_CRYPTOCURRENCY)

      // 1 token is now worth 2 ether, the fund managers cut is now 0.1 ether
      await exchangePortal.setRatio(1, 2)
      // NOW TOTAL VALUE = 2 ETH (1 XXX * 2 = 2 ETH)
      await updateOracle(toWei(String(2)), userTwo)

      // additional check
      assert.equal(fromWei(await smartFundETH.calculateFundValue()), 2)

      const {
        fundManagerRemainingCut,
        fundValue,
        fundManagerTotalCut,
      } = await smartFundETH.calculateFundManagerCut()

      assert.equal(fundValue, toWei(String(2)))
      assert.equal(fromWei(String(fundManagerRemainingCut)), 0.1)
      assert.equal(fromWei(String(fundManagerTotalCut)), 0.1)

      // Deposit from user 2
      await smartFundETH.deposit({ from: userTwo, value: toWei(String(1)) })

      // User 2 should recieve more than 0.5 shares, because user 1 should pay manager profit
      assert.isTrue(fromWei(await smartFundETH.addressToShares(userTwo)) > 0.5)

      // Trade 1 ETH to 0.5 XXX
      await advanceTimeAndBlock(duration.minutes(6))
      await smartFundETH.trade(
        ETH_TOKEN_ADDRESS,
        toWei(String(1)),
        xxxERC.address,
        0,
        proofXXX,
        positionXXX,
        PARASWAP_MOCK_ADDITIONAL_PARAMS,
        1,
        {
          from: userOne,
        }
      )

      await advanceTimeAndBlock(duration.minutes(31))
      // TOTAL VALUE NOW 3 ETH (1.5 XXX * 2 = 3 ETH)
      await updateOracle(toWei(String(3)), userOne)

      // balance before manager cut
      assert.equal(fromWei(await xxxERC.balanceOf(smartFundETH.address)), 1.5)
      assert.equal(fromWei(await web3.eth.getBalance(smartFundETH.address)), 0)

      // Fund manager can cut 0.1 ETH (0.05 XXX)
      await smartFundETH.fundManagerWithdraw()

      // balance after manager cut
      assert.equal(fromWei(await xxxERC.balanceOf(smartFundETH.address)), 1.45)
      assert.equal(fromWei(await web3.eth.getBalance(smartFundETH.address)), 0)

      await advanceTimeAndBlock(duration.minutes(31))
      // TOTAL VALUE NOW 2.9 ETH (1.45 XXX * 2 = 2.9)
      await updateOracle(toWei(String(2.9)), userTwo)

      // User 2 not hold any XXX
      assert.equal(fromWei(await xxxERC.balanceOf(userTwo)), 0)

      // Withdraw from user 2
      await smartFundETH.withdraw(0,{ from: userTwo })
      assert.equal(fromWei(await xxxERC.balanceOf(userTwo)), 0.5)
    })
  })


  describe('Platform cut', function() {
    // update and provide data from Oracle
    async function updateOracle(value, sender){
     await Oracle.setMockValue(value)
     await LINK.approve(smartFundETH.address, toWei(String(1)), {from: sender})
     await smartFundETH.updateFundValueFromOracle(LINK.address, toWei(String(1)), {from: sender})
    }

    it('Platform can get 10% from ETH profit', async function() {
      // deploy smartFund with 10% success fee and platform fee
      await deployContracts(1000)
      // give exchange portal contract some money
      await xxxERC.transfer(exchangePortal.address, toWei(String(50)))
      await exchangePortal.pay({ from: userOne, value: toWei(String(3))})

      // deposit in fund
      await smartFundETH.deposit({ from: userOne, value: toWei(String(1)) })

      assert.equal(await web3.eth.getBalance(smartFundETH.address), toWei(String(1)))

      // get proof and position for dest token
      const proofXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => buf2hex(x.data))
      const positionXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => x.position === 'right' ? 1 : 0)

      await smartFundETH.trade(
        ETH_TOKEN_ADDRESS,
        toWei(String(1)),
        xxxERC.address,
        0,
        proofXXX,
        positionXXX,
        PARASWAP_MOCK_ADDITIONAL_PARAMS,
        1,
        {
          from: userOne
        }
      )

      assert.equal(await web3.eth.getBalance(smartFundETH.address), 0)

      // 1 token is now worth 2 ether
      await exchangePortal.setRatio(1, 2)
      // TOTAL ETH value = 2 ETH now
      await updateOracle(toWei(String(2)), userOne)

      assert.equal(await smartFundETH.calculateFundValue(), toWei(String(2)))

      // get proof and position for dest token
      const proofETH = MerkleTREE.getProof(keccak256(ETH_TOKEN_ADDRESS)).map(x => buf2hex(x.data))
      const positionETH = MerkleTREE.getProof(keccak256(ETH_TOKEN_ADDRESS)).map(x => x.position === 'right' ? 1 : 0)

      await advanceTimeAndBlock(duration.minutes(6))
      await smartFundETH.trade(
        xxxERC.address,
        toWei(String(1)),
        ETH_TOKEN_ADDRESS,
        0,
        proofETH,
        positionETH,
        PARASWAP_MOCK_ADDITIONAL_PARAMS,
        1,
        {
          from: userOne,
        }
      )

      assert.equal(await web3.eth.getBalance(smartFundETH.address), toWei(String(2)))

      const totalWeiDeposited = await smartFundETH.totalWeiDeposited()
      assert.equal(fromWei(totalWeiDeposited), 1)

      await advanceTimeAndBlock(duration.minutes(31))
      // TOTAL ETH value = 2 ETH now
      await updateOracle(toWei(String(2)), userOne)
      // user1 now withdraws 1.9 ether, 0.9 of which are profit
      await smartFundETH.withdraw(0, { from: userOne })

      await advanceTimeAndBlock(duration.minutes(31))
      // TOTAL ETH value = 0.1 ETH now
      await updateOracle(toWei(String(0.1)), userOne)

      const totalWeiWithdrawn = await smartFundETH.totalWeiWithdrawn()
      assert.equal(fromWei(totalWeiWithdrawn), 1.9)

      assert.equal(await smartFundETH.calculateFundValue(), toWei(String(0.1)))

      const {
        fundManagerRemainingCut,
        fundValue,
        fundManagerTotalCut,
      } =
      await smartFundETH.calculateFundManagerCut()

      assert.equal(fundValue, toWei(String(0.1)))
      assert.equal(fundManagerRemainingCut, toWei(String(0.1)))
      assert.equal(fundManagerTotalCut, toWei(String(0.1)))

      // // FM now withdraws their profit
      await smartFundETH.fundManagerWithdraw({ from: userOne })

      // Platform get 10%
      assert.equal(fromWei(await web3.eth.getBalance(COT_DAO_WALLET.address)), 0.01)

      // Fund transfer all balance
      assert.equal(fromWei(await web3.eth.getBalance(smartFundETH.address)), 0)
    })

    it('Platform can get 10% from ERC profit', async function() {
      // deploy smartFund with 10% success fee and platform fee
      await deployContracts(1000)
      // give exchange portal contract some money
      await xxxERC.transfer(exchangePortal.address, toWei(String(50)))
      await exchangePortal.pay({ from: userOne, value: toWei(String(3))})

      // deposit in fund
      await smartFundETH.deposit({ from: userOne, value: toWei(String(1)) })

      assert.equal(await web3.eth.getBalance(smartFundETH.address), toWei(String(1)))

      // 1 token is now cost 1 ether
      await exchangePortal.setRatio(1, 1)

      // get proof and position for dest token
      const proofXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => buf2hex(x.data))
      const positionXXX = MerkleTREE.getProof(keccak256(xxxERC.address)).map(x => x.position === 'right' ? 1 : 0)

      await smartFundETH.trade(
        ETH_TOKEN_ADDRESS,
        toWei(String(1)),
        xxxERC.address,
        0,
        proofXXX,
        positionXXX,
        PARASWAP_MOCK_ADDITIONAL_PARAMS,
        1,
        {
          from: userOne
        }
      )

      assert.equal(await web3.eth.getBalance(smartFundETH.address), 0)

      // TOTAL fund value = 1 ETH
      await updateOracle(toWei(String(1)), userOne)
      assert.equal(await smartFundETH.calculateFundValue(), toWei(String(1)))

      // 1 token is now worth 2 ether
      await exchangePortal.setRatio(1, 2)
      await advanceTimeAndBlock(duration.minutes(31))
      // TOTAL ETH value = 2 ETH now (1 XXX * 2)
      await updateOracle(toWei(String(2)), userOne)

      assert.equal(await smartFundETH.calculateFundValue(), toWei(String(2)))

      assert.equal(await web3.eth.getBalance(smartFundETH.address), toWei(String(0)))
      assert.equal(await xxxERC.balanceOf(smartFundETH.address), toWei(String(1)))

      const totalWeiDeposited = await smartFundETH.totalWeiDeposited()
      assert.equal(fromWei(totalWeiDeposited), 1)

      // user1 now withdraws 1.9 ether, 0.9 of which are profit
      await smartFundETH.withdraw(0, { from: userOne })

      const totalWeiWithdrawn = await smartFundETH.totalWeiWithdrawn()
      assert.equal(fromWei(totalWeiWithdrawn), 1.9)

      await advanceTimeAndBlock(duration.minutes(31))
      // TOTAL ETH value = 0.1 ETH
      await updateOracle(toWei(String(0.1)), userOne)
      assert.equal(await smartFundETH.calculateFundValue(), toWei(String(0.1)))

      const {
        fundManagerRemainingCut,
        fundValue,
        fundManagerTotalCut,
      } =
      await smartFundETH.calculateFundManagerCut()

      assert.equal(fundValue, toWei(String(0.1)))
      assert.equal(fundManagerRemainingCut, toWei(String(0.1)))
      assert.equal(fundManagerTotalCut, toWei(String(0.1)))

      // // FM now withdraws their profit
      await smartFundETH.fundManagerWithdraw({ from: userOne })

      // Platform get 10%
      // 0.005 xxx = 0.01 ETH
      assert.equal(fromWei(await xxxERC.balanceOf(COT_DAO_WALLET.address)), 0.005)

      // Fund transfer all balance
      assert.equal(fromWei(await xxxERC.balanceOf(smartFundETH.address)), 0)
    })
  })

  describe('ERC20 implementation', function() {
    // update and provide data from Oracle
    async function updateOracle(value, sender){
     await Oracle.setMockValue(value)
     await LINK.approve(smartFundETH.address, toWei(String(1)), {from: sender})
     await smartFundETH.updateFundValueFromOracle(LINK.address, toWei(String(1)), {from: sender})
    }

    it('should be able to transfer shares to another user', async function() {
      await smartFundETH.deposit({ from: userTwo, value: 100 })
      assert.equal(await smartFundETH.balanceOf(userTwo), toWei(String(1)))

      await smartFundETH.transfer(userThree, toWei(String(1)), { from: userTwo })
      assert.equal(await smartFundETH.balanceOf(userThree), toWei(String(1)))
      assert.equal(await smartFundETH.balanceOf(userTwo), 0)
    })

    it('should allow a user to withdraw their shares that were transfered to them', async function() {
      await smartFundETH.deposit({ from: userTwo, value: 100 })
      await smartFundETH.transfer(userThree, toWei(String(1)), { from: userTwo })
      assert.equal(await smartFundETH.balanceOf(userThree), toWei(String(1)))
      await updateOracle(100, userThree)
      await smartFundETH.withdraw(0, { from: userThree })
      assert.equal(await smartFundETH.balanceOf(userThree), 0)
    })
  })

  describe('Whitelist Investors', function() {
    // update and provide data from Oracle
    async function updateOracle(value, sender){
     await Oracle.setMockValue(value)
     await LINK.approve(smartFundETH.address, toWei(String(1)), {from: sender})
     await smartFundETH.updateFundValueFromOracle(LINK.address, toWei(String(1)), {from: sender})
    }

    it('should not allow anyone to deposit when whitelist is empty and set', async function() {
      await smartFundETH.setWhitelistOnly(true)
      await smartFundETH.deposit({ from: userTwo, value: 100 }).should.be.rejectedWith(EVMRevert)
      await smartFundETH.deposit({ from: userThree, value: 100 }).should.be.rejectedWith(EVMRevert)
    })

    it('should only allow whitelisted addresses to deposit', async function() {
      await smartFundETH.setWhitelistOnly(true)
      await smartFundETH.setWhitelistAddress(userOne, true)
      await smartFundETH.deposit({ from: userOne, value: 100 })

      await smartFundETH.deposit({ from: userTwo, value: 100 }).should.be.rejectedWith(EVMRevert)
      await smartFundETH.setWhitelistAddress(userTwo, true)
      await updateOracle(100, userTwo)
      await smartFundETH.deposit({ from: userTwo, value: 100 })

      assert.equal(await smartFundETH.addressToShares.call(userOne), toWei(String(1)))
      assert.equal(await smartFundETH.addressToShares.call(userTwo), toWei(String(1)))

      await smartFundETH.setWhitelistAddress(userOne, false)
      await advanceTimeAndBlock(duration.minutes(31))
      await updateOracle(200, userOne)
      await smartFundETH.deposit({ from: userOne, value: 100 }).should.be.rejectedWith(EVMRevert)
      await smartFundETH.setWhitelistOnly(false)
      await smartFundETH.deposit({ from: userOne, value: 100 })
      assert.equal(await smartFundETH.addressToShares.call(userOne), toWei(String(2)))
    })
  })

  describe('Orcale additional', function() {
    // update and provide data from Oracle
    async function updateOracle(value, sender){
      await Oracle.setMockValue(value)
      await LINK.approve(smartFundETH.address, toWei(String(1)), {from: sender})
      await smartFundETH.updateFundValueFromOracle(LINK.address, toWei(String(1)), {from: sender})
    }

    it('Next user cant deposit if prev user open deposi procedure, but can if prev user not used his time', async function() {
      // first deposit (total shares 0) not require Oracle call
      await smartFundETH.deposit({ from: userOne, value: 100 })
      assert.equal(await smartFundETH.totalShares(), toWei(String(1)))
      // update price from user 1 (open deposit process)
      await updateOracle(100, userOne)

      // should be rejected
      await updateOracle(100, userTwo).should.be.rejectedWith(EVMRevert)
      await smartFundETH.deposit({ from: userTwo, value: 100 }).should.be.rejectedWith(EVMRevert)

      // update time
      await advanceTimeAndBlock(duration.minutes(31))

      // success
      await updateOracle(100, userTwo)
      await smartFundETH.deposit({ from: userTwo, value: 100 })
      assert.equal(await smartFundETH.totalShares(), toWei(String(2)))
    })

    it('Next user can not open  withdraw if prev user open withdraw procedure, but can if prev user not', async function() {
      // first deposit (total shares 0) not require Oracle call
      await smartFundETH.deposit({ from: userOne, value: 100 })
      assert.equal(await smartFundETH.totalShares(), toWei(String(1)))

      // second user deposit
      await updateOracle(100, userTwo)
      await smartFundETH.deposit({ from: userTwo, value: 100 })
      assert.equal(await smartFundETH.totalShares(), toWei(String(2)))

      // update price from user 1 (open withdarw process)
      await advanceTimeAndBlock(duration.minutes(31))
      await updateOracle(100, userOne)

      // should be rejected
      await updateOracle(100, userTwo).should.be.rejectedWith(EVMRevert)
      await smartFundETH.withdraw(0, { from: userTwo}).should.be.rejectedWith(EVMRevert)

      // update time
      await advanceTimeAndBlock(duration.minutes(31))

      // success
      await updateOracle(100, userTwo)
      await smartFundETH.withdraw(0, { from: userTwo})
      assert.equal(await smartFundETH.totalShares(), toWei(String(1)))
    })

    it('Manager can change Oracle address', async function() {
      const newOracleAddress = '0x0000000000000000000000000000000000000000'
      await permittedAddresses.addNewAddress(newOracleAddress, 5)
      assert.equal(await smartFundETH.fundValueOracle(), Oracle.address)
      await smartFundETH.setNewFundValueOracle(newOracleAddress)
      assert.equal(await smartFundETH.fundValueOracle(), newOracleAddress)
    })

    it('Manager can NOT change NON permitted Oracle address', async function() {
      const newOracleAddress = '0x0000000000000000000000000000000000000000'
      await smartFundETH.setNewFundValueOracle(newOracleAddress)
      .should.be.rejectedWith(EVMRevert)
      assert.equal(await smartFundETH.fundValueOracle(), Oracle.address)
    })

    it('Test deposit after new changed time ', async function() {
      await smartFundETH.deposit({ from: userOne, value: 100 })
      assert.equal(await smartFundETH.totalShares(), toWei(String(1)))

      // second user deposit
      await updateOracle(100, userTwo)

      // update time
      await CoTraderConfig.set_DW_FREEZE_TIME(duration.minutes(40))

      // revert (time)
      await advanceTimeAndBlock(duration.minutes(31))
      await updateOracle(100, userTwo).should.be.rejectedWith(EVMRevert)
      await smartFundETH.deposit({ from: userTwo, value: 100 }).should.be.rejectedWith(EVMRevert)

      // update time
      await CoTraderConfig.set_DW_FREEZE_TIME(duration.minutes(30))

      // success
      await updateOracle(100, userTwo)
      await smartFundETH.deposit({ from: userTwo, value: 100 })
      assert.equal(await smartFundETH.totalShares(), toWei(String(2)))
    })

    it('Test withdraw after new changed time ', async function() {
      await smartFundETH.deposit({ from: userOne, value: 100 })
      assert.equal(await smartFundETH.totalShares(), toWei(String(1)))

      // user start withdraw
      await updateOracle(100, userOne)

      // update time
      await CoTraderConfig.set_DW_FREEZE_TIME(duration.minutes(40))

      // revert (time)
      await advanceTimeAndBlock(duration.minutes(30))
      await updateOracle(100, userOne).should.be.rejectedWith(EVMRevert)
      await smartFundETH.withdraw(0, { from: userOne }).should.be.rejectedWith(EVMRevert)

      // update time
      await CoTraderConfig.set_DW_FREEZE_TIME(duration.minutes(30))

      // success
      await updateOracle(100, userOne)
      await smartFundETH.withdraw(0, { from: userOne })
      assert.equal(await smartFundETH.totalShares(), 0)
    })

    it('Test trade after new changed time ', async function() {
      // provide exchange portal with some assets
      await yyyERC.transfer(exchangePortal.address, 1000)

      // deposit
      await smartFundETH.deposit({ from: userOne, value: 100 })
      assert.equal(await smartFundETH.totalShares(), toWei(String(1)))

      // second user start deposit process
      await updateOracle(100, userTwo)

      // increase time
      await advanceTimeAndBlock(duration.minutes(3))

      // get proof and position for dest token
      const proofYYY = MerkleTREE.getProof(keccak256(yyyERC.address)).map(x => buf2hex(x.data))
      const positionYYY = MerkleTREE.getProof(keccak256(yyyERC.address)).map(x => x.position === 'right' ? 1 : 0)

      // should be rejected because 5 minutes by default
      await smartFundETH.trade(
         ETH_TOKEN_ADDRESS,
         100,
         yyyERC.address,
         0,
         proofYYY,
         positionYYY,
         PARASWAP_MOCK_ADDITIONAL_PARAMS, 1,{
         from: userOne,
       }).should.be.rejectedWith(EVMRevert)

       assert.equal(await yyyERC.balanceOf(smartFundETH.address), 0)

       // reduce time from 5 to 3 minutes
       await CoTraderConfig.set_TRADE_FREEZE_TIME(duration.minutes(3))

       await smartFundETH.trade(
          ETH_TOKEN_ADDRESS,
          100,
          yyyERC.address,
          0,
          proofYYY,
          positionYYY,
          PARASWAP_MOCK_ADDITIONAL_PARAMS, 1,{
          from: userOne,
        })

       assert.equal(await yyyERC.balanceOf(smartFundETH.address), 100)
    })
  })

  describe('Update addresses', function() {
    const testAddress = '0x0000000000000000000000000000000000000777'

    // exchange portal
    it('Owner should not be able change NON permitted exchane portal', async function() {
      await smartFundETH.setNewExchangePortal(testAddress).should.be.rejectedWith(EVMRevert)
    })

    it('Owner should be able change permitted exchane portal', async function() {
      await permittedAddresses.addNewAddress(testAddress, 1)
      await smartFundETH.setNewExchangePortal(testAddress)
      assert.equal(testAddress, await smartFundETH.exchangePortal())
    })

    it('NOT Owner should NOT be able change permitted exchane portal', async function() {
      await permittedAddresses.addNewAddress(testAddress, 1)
      await smartFundETH.setNewExchangePortal(testAddress, { from:userTwo })
      .should.be.rejectedWith(EVMRevert)
    })
  })
  //END
})
