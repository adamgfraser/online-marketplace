pragma solidity ^0.4.24;

import "../contracts/Math.sol";

/// @title Online Market
/// @author Adam Fraser
contract Market {

    using Math for uint;

    // Struct types

    // A store on the market.
    struct Store {
        string name;
        address owner;
        uint balance;
        uint numProducts;
        mapping (uint => Product) products;
    }

    // A product offered by a store.
    struct Product {
        string name;
        string description;
        uint price;
        uint quantity;
    }

    // State variables

    // The owner of the market.
    address public owner;

    // Whether the market is closed.
    bool public closed;

    // Store administrators.
    mapping (address => bool) public administrators;

    // Approved store owners.
    mapping (address => bool) public storeOwners;

    // The number of stores on the market.
    uint public numStores;

    // The stores on the market.
    mapping (uint => Store) public stores;

    // Events

    event MarketClosed();

    event MarketOpened();

    event AdministratorAdded(address indexed administrator);

    event AdministratorRemoved(address indexed administrator);

    event StoreOwnerAdded(address indexed storeOwner);

    event StoreOwnerRemoved(address indexed storeOwner);

    event StoreCreated(
        uint indexed storeID,
        address indexed owner,
        string name
    );

    event StoreRemoved(uint indexed storeID);

    event StoreNameChanged(uint indexed storeID, string name);

    event ProductAdded(
        uint indexed storeID,
        uint indexed productID,
        string name,
        string description,
        uint price,
        uint quantity
    );

    event ProductRemoved(uint indexed storeID, uint indexed productID);

    event ProductNameChanged(
        uint indexed storeID,
        uint indexed productID,
        string name
    );

    event ProductDescriptionChanged(
        uint indexed storeID,
        uint indexed productID,
        string description
    );

    event ProductPriceChanged(
        uint indexed storeID,
        uint indexed productID,
        uint price
    );

    event ProductQuantityChanged(
        uint indexed storeID,
        uint indexed productID,
        uint quantity
    );

    event FundsWithdrawn(
        uint indexed storeID,
        address indexed owner,
        uint amount
    );

    event ProductPurchased(
        uint indexed storeID,
        uint indexed productID,
        uint quantity,
        uint amount
    );

    // Modifiers

    // This modifier requires that the caller is the owner of the market.
    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can can call this.");
        _;
    }

    // This modifier requires that the market is open.
    modifier marketOpen {
        require(!closed, "The market is closed.");
        _;
    }

    // This modifier requires that the caller is an administrator.
    modifier onlyAdministrator {
        require(
            administrators[msg.sender],
            "Only administrators can call this."
        );
        _;
    }

    // This modifier requires that the caller is an approved store owner.
    modifier onlyStoreOwners {
        require(storeOwners[msg.sender], "Only store owners can call this.");
        _;
    }

    // This modifier requires that the caller is the owner of the store.
    modifier onlyStoreOwner(uint storeID) {
        require(
            msg.sender == stores[storeID].owner,
            "Only store owner can call this."
        );
        _;
    }

    // This modifier requires that the store has enough ether to withdraw.
    modifier sufficientFunds(uint storeID, uint amount) {
        require(amount <= stores[storeID].balance, "Not enough Ether.");
        _;
    }

    // This modifier requires that the owner of the store is approved.
    modifier storeOwnerApproved(uint storeID) {
        require(
            storeOwners[stores[storeID].owner],
            "The store owner is not approved.");
        _;
    }

    // This modifier requires that the quantity being purchased is in stock.
    modifier inStock(uint storeID, uint productID, uint quantity) {
        require(
            quantity <= stores[storeID].products[productID].quantity,
            "Quantity not in stock."
        );
        _;
    }

    // Constructor

    // Creates an online marketplace that operates on the blockchain.
    constructor() public {
        owner = msg.sender;
    }

    // Owner functions

    /// @notice Closes the market.
    function close() public onlyOwner {
        closed = true;
        emit MarketClosed();
    }

    /// @notice Opens the market.
    function open() public onlyOwner {
        closed = false;
        emit MarketOpened();
    }

    /// @notice Adds an address to the group of market admininistrators.
    /// @param administrator The address to add.
    function addAdministrator(address administrator)
        public
        marketOpen
        onlyOwner
    {
        administrators[administrator] = true;
        emit AdministratorAdded(administrator);
    }

    /// @notice Removes an address from the group of market administrators.
    /// @param administrator The address to remove.
    function removeAdministrator(address administrator)
        public
        marketOpen
        onlyOwner
    {
        administrators[administrator] = false;
        emit AdministratorRemoved(administrator);
    }

    // Admininstrator functions

    /// @notice Adds an address to the list of approved store owners.
    /// @param storeOwner The address to add.
    function addStoreOwner(address storeOwner)
        public
        marketOpen
        onlyAdministrator
    {
        storeOwners[storeOwner] = true;
        emit StoreOwnerAdded(storeOwner);
    }

    /// @notice Removes an address from the list of approved store owners.
    /// @param storeOwner The address to remove.
    function removeStoreOwner(address storeOwner)
        public
        marketOpen
        onlyAdministrator
    {
        storeOwners[storeOwner] = false;
        emit StoreOwnerRemoved(storeOwner);
    }

    // Store owner functions

    /// @notice Creates a new store.
    /// @param name The name of the store.
    /// @return The store.
    function createStore(string name)
        public
        marketOpen
        onlyStoreOwners
        returns (uint storeID)
    {
        storeID = numStores++;
        stores[storeID] = Store(name, msg.sender, 0, 0);
        emit StoreCreated(storeID, msg.sender, name);
    }

    /// @notice Removes a store from the market and sends funds to the owner.
    /// @param storeID The store.
    function removeStore(uint storeID)
        public
        marketOpen
        onlyStoreOwners
        onlyStoreOwner(storeID)
    {
        uint balance = stores[storeID].balance;
        delete stores[storeID];
        emit StoreRemoved(storeID);
        msg.sender.transfer(balance);
    }

    /// @notice Changes the name of a store.
    /// @param storeID The store.
    /// @param name The new name.
    function changeStoreName(uint storeID, string name)
        public
        marketOpen
        onlyStoreOwners
        onlyStoreOwner(storeID)
    {
        stores[storeID].name = name;
        emit StoreNameChanged(storeID, name);
    }

    /// @notice Adds a product to a store's inventory.
    /// @param storeID The store.
    /// @param name The name of the product.
    /// @param description The IPFS hash of the description of the product.
    /// @param price The price of the product.
    /// @param quantity The quantity of the product.
    /// @return The product.
    function addProduct(
        uint storeID,
        string name,
        string description,
        uint price,
        uint quantity
    )
        public
        marketOpen
        onlyStoreOwners
        onlyStoreOwner(storeID)
        returns (uint productID)
    {
        Store storage store = stores[storeID];
        productID = store.numProducts++;
        store.products[productID] = Product(
            name,
            description,
            price,
            quantity
        );
        emit ProductAdded(
            storeID,
            productID,
            name,
            description,
            price,
            quantity
        );
    }

    /// @notice Removes a product from a store's inventory.
    /// @param storeID The store.
    /// @param productID The product.
    function removeProduct(uint storeID, uint productID)
        public
        marketOpen
        onlyStoreOwners
        onlyStoreOwner(storeID)
    {
        delete stores[storeID].products[productID];
        emit ProductRemoved(storeID, productID);
    }

    /// @notice Changes the name of a product in a store's inventory.
    /// @param storeID The store.
    /// @param productID The product.
    /// @param name The new name.
    function changeProductName(uint storeID, uint productID, string name)
        public
        marketOpen
        onlyStoreOwners
        onlyStoreOwner(storeID)
    {
        stores[storeID].products[productID].name = name;
        emit ProductNameChanged(storeID, productID, name);
    }

    /// @notice Changes the description of a product in a store's inventory.
    /// @param storeID The store.
    /// @param productID The product.
    /// @param description The IPFS hash of the new description.
    function changeProductDescription(
        uint storeID,
        uint productID,
        string description
    )
        public
        marketOpen
        onlyStoreOwners
        onlyStoreOwner(storeID)
    {
        stores[storeID].products[productID].description = description;
        emit ProductDescriptionChanged(storeID, productID, description);
    }

    /// @notice Changes the price of a product in a store's inventory.
    /// @param storeID The store.
    /// @param productID The product.
    /// @param price The new price.
    function changeProductPrice(uint storeID, uint productID, uint price)
        public
        marketOpen
        onlyStoreOwners
        onlyStoreOwner(storeID)
    {
        stores[storeID].products[productID].price = price;
        emit ProductPriceChanged(storeID, productID, price);
    }

    /// @notice Changes the quantity of a product in a store's inventory.
    /// @param storeID The store.
    /// @param productID The product.
    /// @param quantity The new price.
    function changeProductQuantity(uint storeID, uint productID, uint quantity)
        public
        marketOpen
        onlyStoreOwners
        onlyStoreOwner(storeID)
    {
        stores[storeID].products[productID].quantity = quantity;
        emit ProductQuantityChanged(storeID, productID, quantity);
    }

    /// @notice Withdraws funds a store has collected from sales.
    /// @param storeID The store.
    /// @param amount The amount to withdraw.
    function withdrawFunds(uint storeID, uint amount)
        public
        onlyStoreOwner(storeID)
        sufficientFunds(storeID, amount)
    {
        stores[storeID].balance -= amount;
        emit FundsWithdrawn(storeID, msg.sender, amount);
        msg.sender.transfer(amount);
    }

    // Generic shopper functions

    /// @notice Purchases a product from a store.
    /// @param storeID The store.
    /// @param productID The product.
    /// @param quantity The quantity to purchase.
    function purchaseProduct(uint storeID, uint productID, uint quantity)
        public
        payable
        marketOpen
        storeOwnerApproved(storeID)
        inStock(storeID, productID, quantity)
    {
        uint cost = stores[storeID].products[productID].price.times(quantity);
        require(msg.value >= cost, "You didn't pay enough.");
        stores[storeID].balance += cost;
        stores[storeID].products[productID].quantity -= quantity;
        emit ProductPurchased(storeID, productID, quantity, cost);
        if (msg.value > cost)
            msg.sender.transfer(msg.value - cost);
    }

    /// @notice Gets a store.
    /// @param storeID The store.
    /// @return The name of the store.
    /// @return The owner of the store.
    /// @return The balance of the store's funds.
    function getStore(uint storeID)
        public
        view
        returns (string name, address storeOwner, uint balance)
    {
        name = stores[storeID].name;
        storeOwner = stores[storeID].owner;
        balance = stores[storeID].balance;
    }

    /// @notice Gets a product.
    /// @param storeID The store.
    /// @param productID The product.
    /// @return The name of the product.
    /// @return The IPFS hash of the description of the product.
    /// @return The price of the product.
    /// @return The quantity of the product.
    function getProduct(uint storeID, uint productID)
        public
        view
        returns (string name, string description, uint price, uint quantity)
    {
        name = stores[storeID].products[productID].name;
        description = stores[storeID].products[productID].description;
        price = stores[storeID].products[productID].price;
        quantity = stores[storeID].products[productID].quantity;
    }
}
