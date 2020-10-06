pragma solidity ^0.6.0;

import "https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.6/ChainlinkClient.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";


library Strings {
    function concat(string memory _base, string memory _value) internal pure returns (string memory) {
        bytes memory _baseBytes = bytes(_base);
        bytes memory _valueBytes = bytes(_value);

        string memory _tmpValue = new string(_baseBytes.length + _valueBytes.length);
        bytes memory _newValue = bytes(_tmpValue);

        uint i;
        uint j;

        for(i=0; i<_baseBytes.length; i++) {
            _newValue[j++] = _baseBytes[i];
        }

        for(i=0; i<_valueBytes.length; i++) {
            _newValue[j++] = _valueBytes[i++];
        }
        return string(_newValue);
    }
}

contract FundValueOracle is ChainlinkClient, Ownable{
    using Strings for string;

    string public apiPath;
    bytes32[] public requestIdArrays;
    uint256 public fee;
    address public chainLinkAddress;

    address private oracle;
    bytes32 private jobId;

    // Mapping of requestId => FundValue
    mapping (bytes32 => uint256) public getFundValueByID;

    /**
     * Network: Kovan
     * Oracle: Chainlink - 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e
     * Job ID: Chainlink - 29fa9aa13bf1468788b7cc4a500a45b8
     * Link erc20        - 0xa36085F69e2889c224210F603D836748e7dC0088
     *
     * Network: Rinkeby
     * Oracle: Chainlink - 0x01be23585060835e02b77ef475b0cc51aa1e0709
     * Job ID: Chainlink - 6d1bfe27e7034b1d87b5270556b17277
     * Link erc20        - 0x01BE23585060835E02B77ef475b0Cc51aA1e0709
     *
     */
    constructor(address _oracle, bytes32 _jobId, address _chainLinkAddress) public {
        setPublicChainlinkToken();
        oracle = _oracle;
        jobId = _jobId;
        fee = 0.1 * 10 ** 18; // 0.1 LINK
        chainLinkAddress = _chainLinkAddress;
    }

    /**
     * Create a Chainlink request to retrieve API response, find the target
     */
    function requestValue(address _fundAddress) public returns (bytes32 requestId)
    {
       // transfer link commision from sender
       require(
        IERC20(chainLinkAddress).transferFrom(
          msg.sender,
          address(this),
          fee
         ),
         "CANT TRANSFER FROM"
        );

        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);

        // TODO CONVERT ADDRESS TO STRING AND CONCAT API ENDPOIN WITH ADDRESS

        // Set the URL to perform the GET request on
        request.add("get", "https://reqres.in/api/products/3");
        request.add("path", "data.year");

        // Sends the request
        return sendChainlinkRequestTo(oracle, request, fee);
    }

    /**
     * Receive the response in the form of uint256
     */
    function fulfill(bytes32 _requestId, uint256 _result) public recordChainlinkFulfillment(_requestId)
    {
      getFundValueByID[_requestId] = _result;
    }

    // owne can update api endpoint
    function updateApiPath(string memory _apiPath) external onlyOwner {
      apiPath = _apiPath;
    }

    // owne can update fee
    function updateFee(uint256 _fee) external onlyOwner {
      fee = _fee;
    }
}
