// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BlockEstate {

    // Structure for a Property
    struct Property {
        uint id;
        address owner;
        uint price;
        string location;
        bool isForSale;
        bool isForRent;
        uint rentAmount;  // Rent amount per month
        uint shares;      // Number of shares for fractional ownership
        uint sharePrice;  // Price per share
    }

    // Mapping of property IDs to property details
    mapping(uint => Property) public properties;
    uint public propertyCount;

    // Mapping to track fractional ownership of properties
    mapping(uint => mapping(address => uint)) public propertyShares;  // propertyId -> (ownerAddress -> number of shares)

    // Mapping to track registered users (can be expanded later with roles/tokens)
    mapping(address => bool) public authorizedUsers;

    // Event when a property is registered
    event PropertyRegistered(uint propertyId, address owner, uint price, string location);

    // Event when a rental agreement is created
    event RentalAgreementCreated(uint propertyId, address tenant, uint rentAmount);

    // Event when a share is bought for a property
    event ShareBought(uint propertyId, address buyer, uint shareAmount);

    // Modifier to check if the sender is the property owner
    modifier onlyOwner(uint propertyId) {
        require(properties[propertyId].owner == msg.sender, "Only the property owner can perform this action");
        _;
    }

    // Modifier to check if the sender is authorized to register properties
    modifier onlyAuthorized() {
        require(authorizedUsers[msg.sender], "Only authorized users can register properties");
        _;
    }

    // Modifier to check if the property is for sale
    modifier forSale(uint propertyId) {
        require(properties[propertyId].isForSale, "This property is not for sale");
        _;
    }

    // Modifier to check if the property is for rent
    modifier forRent(uint propertyId) {
        require(properties[propertyId].isForRent, "This property is not available for rent");
        _;
    }

    // Constructor to set initial authorized users (can be expanded with more logic)
    constructor() {
        authorizedUsers[msg.sender] = true;  // The deployer is authorized by default
    }

    // Function to authorize a user (restricted to owner)
    function authorizeUser(address user) public {
        require(msg.sender == address(this), "Only the contract can authorize users");  // Restrict to a specific role or contract admin
        authorizedUsers[user] = true;
    }

    // Function to deauthorize a user (restricted to owner)
    function deauthorizeUser(address user) public {
        require(msg.sender == address(this), "Only the contract can deauthorize users");  // Restrict to a specific role or contract admin
        authorizedUsers[user] = false;
    }

    // Function to register a property for sale or rent
    function registerProperty(
        uint price,
        string memory location,
        bool isForSale,
        bool isForRent,
        uint rentAmount,
        uint shares,
        uint sharePrice
    ) public onlyAuthorized {
        propertyCount++;
        properties[propertyCount] = Property({
            id: propertyCount,
            owner: msg.sender,
            price: price,
            location: location,
            isForSale: isForSale,
            isForRent: isForRent,
            rentAmount: rentAmount,
            shares: shares,
            sharePrice: sharePrice
        });

        emit PropertyRegistered(propertyCount, msg.sender, price, location);
    }

    // Function to create a rental agreement
    function createRentalAgreement(uint propertyId) public payable forRent(propertyId) {
        Property storage property = properties[propertyId];
        
        // Check if enough rent is paid
        require(msg.value == property.rentAmount, "Insufficient rent payment");

        // Transfer rent to property owner with error handling
        (bool success, ) = payable(property.owner).call{value: msg.value}("");
        require(success, "Rent transfer failed");

        // Emit the event
        emit RentalAgreementCreated(propertyId, msg.sender, property.rentAmount);
    }

    // Function to purchase shares of a property (for fractional ownership)
    function buyShares(uint propertyId, uint shareAmount) public payable forSale(propertyId) {
        Property storage property = properties[propertyId];

        // Calculate the total price for the shares
        uint totalPrice = shareAmount * property.sharePrice;
        
        // Ensure enough Ether is sent
        require(msg.value == totalPrice, "Incorrect Ether sent");

        // Ensure the property has enough shares available
        require(property.shares >= shareAmount, "Not enough shares available");

        // Transfer the Ether to the property owner with error handling
        (bool success, ) = payable(property.owner).call{value: msg.value}("");
        require(success, "Share purchase failed");

        // Update shares
        propertyShares[propertyId][msg.sender] += shareAmount;
        property.shares -= shareAmount;

        // Emit the event
        emit ShareBought(propertyId, msg.sender, shareAmount);
    }

    // Function to check how many shares the caller owns in a property
    function getPropertyShares(uint propertyId) public view returns (uint) {
        return propertyShares[propertyId][msg.sender];
    }

    // Function to check if a property is for sale
    function isPropertyForSale(uint propertyId) public view returns (bool) {
        return properties[propertyId].isForSale;
    }

    // Function to check if a property is for rent
    function isPropertyForRent(uint propertyId) public view returns (bool) {
        return properties[propertyId].isForRent;
    }

    // Function to get property details
    function getPropertyDetails(uint propertyId) public view returns (
        uint price,
        string memory location,
        bool isForSale,
        bool isForRent,
        uint rentAmount,
        uint shares,
        uint sharePrice
    ) {
        Property storage property = properties[propertyId];
        return (
            property.price,
            property.location,
            property.isForSale,
            property.isForRent,
            property.rentAmount,
            property.shares,
            property.sharePrice
        );
    }

    // Fallback function to handle unexpected calls or transfers of Ether
    receive() external payable {
        revert("Direct Ether transfers not allowed");
    }

    // Fallback function to handle unexpected calls
    fallback() external payable {
        revert("Fallback function triggered, revert call");
    }
}
