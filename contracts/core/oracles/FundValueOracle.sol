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
       WARNING
       RINKEBY CONSTRUCTOR
    */
    constructor() public {
        setPublicChainlinkToken();
        oracle = address(0x7AFe1118Ea78C1eae84ca8feE5C65Bc76CcF879e);
        jobId = "6d1bfe27e7034b1d87b5270556b17277";
        fee = 1 * 10 ** 18; // 1 LINK
        chainLinkAddress = address(0x01BE23585060835E02B77ef475b0Cc51aA1e0709);
    }

    /**
     * Create a Chainlink request to retrieve API response, find the target
     */
    function requestValue(address _fundAddress) public returns (bytes32 requestId)
    {
       // transfer link commision from sender
       IERC20(chainLinkAddress).transferFrom(
         msg.sender,
         address(this),
         fee
        );

        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);

        string memory path = apiPath.concat(addressToString(_fundAddress));

        // Set the URL to perform the GET request on
        request.add("get", path);
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
      // for test
      requestIdArrays.push(_requestId);
    }

    // owne can update api endpoint
    function updateApiPath(string calldata _apiPath) external onlyOwner {
      apiPath = _apiPath;
    }

    // owne can update fee
    function updateFee(uint256 _fee) external onlyOwner {
      fee = _fee;
    }

    // helper for convert address to string 
    function addressToString(address _address) public pure returns(string memory) {
       bytes32 _bytes = bytes32(uint256(_address));
       bytes memory HEX = "0123456789abcdef";
       bytes memory _string = new bytes(42);
       _string[0] = '0';
       _string[1] = 'x';
       for(uint i = 0; i < 20; i++) {
           _string[2+i*2] = HEX[uint8(_bytes[i + 12] >> 4)];
           _string[3+i*2] = HEX[uint8(_bytes[i + 12] & 0x0f)];
       }
       return string(_string);
    }
}
