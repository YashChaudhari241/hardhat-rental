//SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract HousingRental {
    address immutable i_owner;
    struct Listing {
        uint16 id;
        address landlord;
        uint256 deposit;
        uint256 rent;
        uint8 months;
        bool isRentEth;
        string metadataID;
        string metadataHash;
    }
    error Rental__InvalidSlice();
    error Rental__OutOfRange();
    Listing[] private s_listings;

    event ListingCreated(uint16 indexed id, Listing newListing, address sender);

    constructor(address owner) {
        i_owner = owner;
    }

    function getOwner() public view returns (address owner) {
        return i_owner;
    }

    function createListing(Listing memory newListing) public returns (uint16) {
        Listing[] memory temp_listings = s_listings;
        if (temp_listings.length > 0)
            newListing.id = uint16(temp_listings[temp_listings.length - 1].id + 1);
        else {
            newListing.id = 0;
        }
        s_listings.push(newListing);
        emit ListingCreated(newListing.id, newListing, msg.sender);
        return newListing.id;
    }

    function getListings(uint16 cursor, uint16 size) public view returns (Listing[] memory) {
        if (cursor < 0 || size <= 0 || size > 50) {
            // revert Rental__InvalidSlice();
            revert("test");
        }
        Listing[] memory temp_listings = s_listings;
        if (cursor > temp_listings.length - 1) {
            // revert Rental__OutOfRange();
            // require(false,"test");
            revert("test2");
        }
        size = cursor + size > temp_listings.length ? uint16(temp_listings.length) - cursor : size;
        Listing[] memory result = new Listing[](size);
        for (uint i = 0; i <= size - 1; i++) {
            result[i] = temp_listings[i + cursor];
        }
        return result;
    }
}
