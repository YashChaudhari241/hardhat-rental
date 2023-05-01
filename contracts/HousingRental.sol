// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract HousingRental {
    address immutable i_owner;
    struct Listing {
        uint index;
        address landlord;
        string metadataID;
        string metadataHash;
    }

    struct UserData{
        Proposal[] proposals;
        uint[] listingIndices;
        Shortrent[] activeRentIndices;
        Shortrent[] activeTenantIndices;
        Shortrent[] activeResolverIndices;
    }

    struct Shortrent{
        uint listingIndex;
        uint rent;
    }

    enum RentalStatus {
        AWAITING_SIGNATURES,
        AWAITING_START_DATE,
        STARTED,
        ENDED
    }

    enum UserType {
        LANDLORD,
        TENANT,
        RESOLVER
    }
    struct RentDetails {
        address tenant;
        uint8 months;
        uint16 docID;
        string docHash;
        address middleman;
        uint startDate;
        uint rent;
        uint deposit;
        string resolverSign;
        string tenantSign;
        string landlordSign;
        RentalStatus status;
    }

    struct Payment {
        uint[] expectedDate;
        uint[] amountToBePaid;
        uint8[] late;
    }

    struct Proposal{
        uint rentAmount;
        uint8 months;
        address sender;
        uint listingIndex;
    }

    struct Dispute {
        UserType raisedBy;
        uint amount;
        uint heldAmount;
    }
    mapping(string=> Listing[]) historicalData;
    mapping(uint => Dispute) disputeData;
    mapping(uint => Payment) paymentData;
    mapping(uint => RentDetails) rentData;
    mapping(uint => Proposal[]) proposals;
    mapping(address => UserData) userData;
    error Rental__InvalidSlice();
    error Rental__SenderNotLandlord();
    error Rental__SenderNotTenant();
    error Rental__Unauthorized();
    error Rental__RentLowerThanProposal();
    error Rental__UnexpectedFundTransfer();
    error Rental__OutOfRange();
    error Rental__NotReady();
    error Rental__NotAvailable();
    error Rental__LowDeposit(uint reqdDeposit);
    Listing[] private s_listings;

    event ListingCreated(uint indexed id, Listing newListing, address sender);

    constructor(address owner) {
        i_owner = owner;
    }

    function getOwner() public view returns (address owner) {
        return i_owner;
    }

    function get_Length() public view returns (uint) {
        return s_listings.length;
    }

    function createListing(Listing memory newListing,string memory propertyID) public {
        // if (s_listings[newListing.index].landlord == address(0)) {
        //     revert Rental__NotAvailable();
        // }
        uint curLen = s_listings.length;
        newListing.index = curLen;
        newListing.landlord = msg.sender;
        s_listings.push(newListing);
        historicalData[propertyID].push(newListing);
        userData[msg.sender].listingIndices.push(curLen);
        emit ListingCreated(curLen, newListing, msg.sender);
    }

    function createProposal(Proposal memory newProposal) external returns (uint) {
        newProposal.sender = msg.sender;
        proposals[newProposal.listingIndex].push(newProposal);
        userData[msg.sender].proposals.push(newProposal);
        return proposals[newProposal.listingIndex].length - 1;
    }

    function getProposals(uint index) external view returns (Proposal[] memory) {
        return proposals[index];
    }

    function getUserData() external view returns (UserData memory){
        return userData[msg.sender];
    } 

    function acceptProposal(
        uint listingIndex,
        uint index,
        uint16 docID,
        string memory docHash,
        address middleman,
        uint startDate,
        uint8 months,
        uint rent,
        uint deposit,
        string memory landlordSign
    ) external {
        if (index >= proposals[listingIndex].length) {
            revert Rental__OutOfRange();
        }
        if (s_listings[listingIndex].landlord != msg.sender) {
            revert Rental__SenderNotLandlord();
        }
        if(proposals[listingIndex][index].rentAmount > rent){
            revert Rental__RentLowerThanProposal();
        }
        RentDetails memory newRent = RentDetails(
            proposals[listingIndex][index].sender,
            months,
            docID,
            docHash,
            middleman,
            startDate,
            rent,
            deposit,
            "",
            "",
            landlordSign,
            RentalStatus.AWAITING_SIGNATURES
        );
        userData[msg.sender].activeRentIndices.push(Shortrent(listingIndex,rent));
        userData[proposals[listingIndex][index].sender].activeTenantIndices.push(Shortrent(listingIndex,rent));
        userData[middleman].activeResolverIndices.push(Shortrent(listingIndex,rent));
        delete proposals[listingIndex];
        rentData[listingIndex] = newRent;
    }

    function getPaymentData(uint listingIndex) external view returns (Payment memory) {
        return paymentData[listingIndex];
    }

    function rentalData(uint listingIndex) external view returns (RentDetails memory) {
        return rentData[listingIndex];
    }

    function getDispute(uint listingIndex) external view returns (Dispute memory) {
        return disputeData[listingIndex];
    }

    function signAgreement(uint listingIndex, string memory senderSign) external payable {
        RentDetails memory tempData = rentData[listingIndex];
        if (tempData.tenant == msg.sender) {
            if (bytes(tempData.resolverSign).length != 0) {
                revert Rental__NotAvailable();
            }
            if (msg.value > tempData.deposit) {
                payable(msg.sender).transfer(msg.value - tempData.deposit);
                rentData[listingIndex].tenantSign = senderSign;
            } else if (msg.value < tempData.deposit) {
                revert Rental__LowDeposit(tempData.deposit);
            } else {
                rentData[listingIndex].tenantSign = senderSign;
            }
            if (bytes(tempData.resolverSign).length != 0) {
                rentData[listingIndex].status = RentalStatus.AWAITING_START_DATE;
            }
        } else if (tempData.middleman == msg.sender) {
            if (msg.value != 0) {
                revert Rental__UnexpectedFundTransfer();
            }
            rentData[listingIndex].resolverSign = senderSign;
            if (bytes(tempData.tenantSign).length != 0) {
                rentData[listingIndex].status = RentalStatus.AWAITING_START_DATE;
            }
        } else {
            revert Rental__Unauthorized();
        }
    }

    function startAgreement(uint listingIndex) external {
        RentDetails memory tempData = rentData[listingIndex];

        if (
            tempData.status == RentalStatus.AWAITING_START_DATE &&
            block.timestamp > tempData.startDate
        ) {
            rentData[listingIndex].status = RentalStatus.STARTED;
            uint[] memory expectedDates = new uint[](tempData.months);
            uint[] memory amount = new uint[](tempData.months);
            uint8[] memory late = new uint8[](tempData.months);
            // Payment memory paymentTimeline = Payment(expectedDates,amount,late);
            for (uint i; i < tempData.months; ++i) {
                // paymentTimeline[i] = Payment(
                //     i == 0
                //         ? tempData.startDate + 30 days
                //         : paymentTimeline[i - 1].expectedDate + 30 days,
                //     tempData.rent,
                //     2
                // );
                unchecked {
                    expectedDates[i] = i == 0
                        ? tempData.startDate + 30 days
                        : expectedDates[i - 1] + 30 days;
                }
                amount[i] = tempData.rent;
                late[i] = 2;
            }
            paymentData[listingIndex] = Payment(expectedDates, amount, late);
        } else {
            revert Rental__NotReady();
        }
    }

    function endAgreement(uint listingIndex) public {
        RentDetails memory tempData = rentData[listingIndex];
        if (tempData.startDate + (tempData.months * 30 days) < block.timestamp) {
            delete paymentData[listingIndex];
        }
        payable(tempData.tenant).transfer(tempData.deposit);
        rentData[listingIndex].status = RentalStatus.ENDED;
    }

    function recalculateRent(uint listingIndex) public {
        RentDetails memory tempData = rentData[listingIndex];
        if (tempData.status != RentalStatus.STARTED) {
            revert Rental__NotReady();
        }
        uint totalPending = 0;
        // Payment memory paymentTimeline = paymentData[listingIndex];
        Payment memory paymentTimeline = paymentData[listingIndex];
        for (uint i; i < tempData.months; ++i) {
            if (
                paymentTimeline.amountToBePaid[i] != 0 &&
                paymentTimeline.expectedDate[i] < block.timestamp
            ) {
                if (paymentTimeline.late[i] != 1) {
                    paymentTimeline.amountToBePaid[i] += paymentTimeline.amountToBePaid[i] / 10;
                    paymentTimeline.late[i] = 1;
                }
                totalPending += paymentTimeline.amountToBePaid[i];
            } else if (paymentTimeline.expectedDate[i] < block.timestamp) {
                break;
            }
        }
        // if(totalPending> (tempData.deposit/10)*7){

        // }
        paymentData[listingIndex] = paymentTimeline;
    }

    function raiseDispute(uint listingIndex) external payable {
        Dispute memory tempDispute = disputeData[listingIndex];
        // RentDetails memory tempData = rentData[listingIndex];
        if (tempDispute.amount != 0) {
            revert Rental__NotReady();
        }
        if (msg.sender == rentData[listingIndex].tenant) {
            tempDispute.raisedBy = UserType.TENANT;
            tempDispute.amount = msg.value;
            disputeData[listingIndex] = tempDispute;
        } else if (msg.sender == s_listings[listingIndex].landlord) {
            tempDispute.raisedBy = UserType.LANDLORD;
            tempDispute.amount = msg.value;
            disputeData[listingIndex] = tempDispute;
        }
    }

    function resolveDispute(uint listingIndex, UserType decision) external {
        Dispute memory tempDispute = disputeData[listingIndex];
        RentDetails memory tempData = rentData[listingIndex];
        if (tempDispute.amount == 0) {
            revert Rental__NotReady();
        }
        if (msg.sender != tempData.middleman) {
            revert Rental__Unauthorized();
        }

        if (decision == UserType.TENANT) {
            if (tempDispute.raisedBy == UserType.TENANT) {
                unchecked {
                    payable(tempData.tenant).transfer(tempDispute.amount + tempDispute.heldAmount);
                }
            } else {
                payable(tempData.tenant).transfer(tempDispute.amount);
            }
        } else {
            if (tempDispute.raisedBy == UserType.TENANT) {
                unchecked {
                    payable(s_listings[listingIndex].landlord).transfer(
                        tempDispute.amount + tempDispute.heldAmount
                    );
                }
            } else {
                if (tempDispute.amount <= tempData.deposit) {
                    unchecked {
                        payable(s_listings[listingIndex].landlord).transfer(
                            tempDispute.amount + tempDispute.amount
                        );
                        tempData.deposit -= tempDispute.amount;
                    }
                } else {
                    unchecked {
                        payable(s_listings[listingIndex].landlord).transfer(
                            tempDispute.amount + tempData.deposit
                        );
                        tempData.deposit = 0;
                    }
                }
            }
        }
        delete disputeData[listingIndex];
    }

    function payRent(uint listingIndex) external payable {
        if (msg.sender != rentData[listingIndex].tenant) {
            revert Rental__SenderNotTenant();
        }
        recalculateRent(listingIndex);
        uint remainingFunds = msg.value;
        Payment memory paymentTimeline = paymentData[listingIndex];
        for (uint i; i < rentData[listingIndex].months; ++i) {
            if (
                paymentTimeline.amountToBePaid[i] != 0 &&
                paymentTimeline.expectedDate[i] > block.timestamp
            ) {
                if (remainingFunds > paymentTimeline.amountToBePaid[i]) {
                    unchecked {
                        remainingFunds -= paymentTimeline.amountToBePaid[i];
                        paymentTimeline.amountToBePaid[i] = 0;
                    }
                } else {
                    unchecked {
                        paymentTimeline.amountToBePaid[i] -= remainingFunds;
                        remainingFunds = 0;
                    }
                }
            }
        }
        if (remainingFunds > 0) {
            payable(msg.sender).transfer(remainingFunds);
        }
        Dispute memory tempDispute = disputeData[listingIndex];
        if (
            tempDispute.amount > tempDispute.heldAmount && tempDispute.raisedBy == UserType.TENANT
        ) {
            unchecked {
                disputeData[listingIndex].heldAmount += msg.value;
            }
        } else {
            payable(s_listings[listingIndex].landlord).transfer(msg.value);
        }
        paymentData[listingIndex] = paymentTimeline;
    }

    function getListings(uint cursor, uint size) public view returns (Listing[] memory) {
        if (size > 50) {
            revert Rental__InvalidSlice();
            // revert("test");
        }
        if (s_listings.length == 0) {
            revert Rental__OutOfRange();
        }
        Listing[] memory temp_listings = s_listings;
        if (cursor > temp_listings.length - 1) {
            revert Rental__OutOfRange();
            // require(false,"test");
        }
        unchecked {
            size = cursor + size > temp_listings.length ? temp_listings.length - cursor : size;
        }
        Listing[] memory result = new Listing[](size);
        for (uint i; i <= size - 1; i++) {
            result[i] = temp_listings[i + cursor];
        }
        return result;
    }
}
