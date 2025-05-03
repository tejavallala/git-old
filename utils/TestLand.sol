// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestLandNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    uint256 public MINT_PRICE = 0.01 ether;

    constructor() ERC721("TestLandNFT", "LAND") Ownable(msg.sender) {}

    function mintLand(string memory uri) public payable returns (uint256) {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(a ddress(this).balance);
    }
}