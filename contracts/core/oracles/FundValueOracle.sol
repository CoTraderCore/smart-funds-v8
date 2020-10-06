pragma solidity ^0.6.0;

import "https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.6/ChainlinkClient.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

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

    address private oracle;
    bytes32 private jobId;

    // Mapping of requestId => FundValue
    mapping (bytes32 => uint256) public getFundValueByID;

    /**
     * Network: Kovan
     * Oracle: Chainlink - 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e
     * Job ID: Chainlink - 29fa9aa13bf1468788b7cc4a500a45b8
     * Fee: 0.1 LINK
     */
    constructor() public {
        setPublicChainlinkToken();
        oracle = 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e;
        jobId = "29fa9aa13bf1468788b7cc4a500a45b8";
        fee = 0.1 * 10 ** 18; // 0.1 LINK
    }

    /**
     * Create a Chainlink request to retrieve API response, find the target
     */
    function requestValue(address _fundAddress) public returns (bytes32 requestId)
    {
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
