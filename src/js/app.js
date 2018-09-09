App = {
  web3Provider: null,
  node: null,
  contracts: {},
  market: null,
  account: null,
  owner: false,
  administrator: false,
  storeOwner: false,
  shopper: false,
  storeID: null,
  closed: false,
  administrators: new Set(),
  storeOwners: new Set(),
  stores: new Map(),

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initIPFS();
  },

  initIPFS: function() {
    App.node = App.newIPFSNode();
    App.initContract();
  },

  initContract: function() {
    $.getJSON('Market.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var MarketArtifact = data;
      App.contracts.Market = TruffleContract(MarketArtifact);
    
      // Set the provider for our contract
      App.contracts.Market.setProvider(App.web3Provider);

      // Use our contract to display and update the user interface
      App.init();
    });
  },

  init: async() => {
    App.market = await App.contracts.Market.deployed();
    
    // Get the necessary information to identify the user
    App.account = await App.getAccount();
    let owner = await App.market.owner();
    App.owner = App.account == owner;
    App.administrator = await App.market.administrators(App.account);
    App.storeOwner = await App.market.storeOwners(App.account);
    if (!App.owner && !App.administrator && !App.storeOwner) App.shopper = true;

    // Begin listening for events from the blockchain
    App.market.allEvents({fromBlock: 0, toBlock: 'latest'}).watch(App.handleEvent);

    // Bind event listeners for user interactions
    App.bindEvents();

    // Refresh the user interface if the account changes
    setInterval(function() {
      if (web3.eth.accounts[0] !== App.account) {
        App.account = web3.eth.accounts[0];
        App.refresh();
      }
    }, 100);

    // Show the application to the user
    App.show();
  },

  bindEvents: function() {
    $(document).on('click', '.manageStore', App.handleManageStore);
    $(document).on('click', '.seeStores', App.handleSeeStores);
    $(document).on('click', '.visitStore', App.handleVisitStore);
    $(document).on('click', '.browseStores', App.handleBrowseStores);
    $(document).on('click', '.closeMarket', App.handleCloseMarket);
    $(document).on('click', '.openMarket', App.handleOpenMarket);
    $(document).on('click', '.addAdministrator', App.handleAddAdministrator);
    $(document).on('click', '.removeAdministrator', App.handleRemoveAdministrator);
    $(document).on('click', '.addStoreOwner', App.handleAddStoreOwner);
    $(document).on('click', '.removeStoreOwner', App.handleRemoveStoreOwner);
    $(document).on('click', '.createStore', App.handleCreateStore);
    $(document).on('click', '.removeStore', App.handleRemoveStore);
    $(document).on('click', '.changeStoreName', App.handleChangeStoreName);
    $(document).on('click', '.addProduct', App.handleAddProduct);
    $(document).on('click', '.removeProduct', App.handleRemoveProduct); 
    $(document).on('click', '.changeProductName', App.handleChangeProductName);
    $(document).on('click', '.changeProductDescription', App.handleChangeProductDescription);
    $(document).on('click', '.changeProductPrice', App.handleChangeProductPrice);
    $(document).on('click', '.changeProductQuantity', App.handleChangeProductQuantity);
    $(document).on('click', '.withdrawFunds', App.handleWithdrawFunds);
    $(document).on('click', '.purchaseProduct', App.handlePurchaseProduct);
  },

  show: function() {
    if (App.owner) {
      App.showOwnerFunctions();
    } else if (App.administrator) {
      App.showAdministratorFunctions();
    } else if (App.storeOwner) {
      App.showStoreOwnerFunctions();
    } else {
      App.showShopperFunctions();
    }
  },

  showOwnerFunctions: function() {
    App.showStatus();
    App.showAdministrators();
    document.getElementById('ownerFunctions').style.display = "inline";
  },

  showAdministratorFunctions: function() {
    App.showStoreOwners();
    document.getElementById('administratorFunctions').style.display = "inline";
  },

  showStoreOwnerFunctions: function() {
    App.showOwnedStores();
    document.getElementById('storeOwnerFunctions').style.display = "inline";
  },

  showShopperFunctions: function() {
    App.showStores();
    document.getElementById('shopperFunctions').style.display = "inline";
  },

  // Logic for handling events from user interface

  handleManageStore: function(event) {
    event.preventDefault();
    var storeID = parseInt($(event.target).data('id'));
    App.storeID = storeID;
    var store = App.stores.get(storeID);
    var name = store.name;
    document.getElementById('ownedStoreName').innerText = name;
    document.getElementById('balance').innerText = store.balance;
    App.showOwnedProducts();
    document.getElementById('storeOwnerFunctions').style.display = "none";
    document.getElementById('manageStore').style.display = "inline";
  },

  handleSeeStores: function(event) {
    event.preventDefault();
    App.storeID = null;
    App.showOwnedStores();
    document.getElementById('manageStore').style.display = "none";
    document.getElementById('storeOwnerFunctions').style.display = "inline";
  },

  handleVisitStore: function(event) {
    event.preventDefault();
    var storeID = parseInt($(event.target).data('id'));
    App.storeID = storeID;
    var store = App.stores.get(storeID);
    var name = store.name;
    document.getElementById('storeName').innerText = name;
    App.showProducts();
    document.getElementById('shopperFunctions').style.display = "none";
    document.getElementById('visitStore').style.display = "inline";
  },

  handleBrowseStores: function(event) {
    event.preventDefault();
    App.storeID = null;
    App.showStores()
    document.getElementById('visitStore').style.display = "none";
    document.getElementById('shopperFunctions').style.display = "inline";
  },

  handleCloseMarket: function(event) {
    event.preventDefault();
    App.market.close({account: App.account})
  },

  handleOpenMarket: function(event) {
    event.preventDefault();
    App.market.open({account: App.account})
  },

  handleAddAdministrator: function(event) {
    event.preventDefault();
    var administrator = document.getElementById("addAdministrator").value
    document.getElementById("addAdministrator").value = ""
    if (administrator !== "") {
      App.market.addAdministrator(administrator, {account: App.account});
    }
  },

  handleRemoveAdministrator: function(event) {
    event.preventDefault();
    var administrator = $(event.target).data('id');
    App.market.removeAdministrator(administrator, {account: App.account});
  },

  handleAddStoreOwner: function(event) {
    event.preventDefault();
    var storeOwner = document.getElementById("addStoreOwner").value
    document.getElementById("addStoreOwner").value = ""
    if (storeOwner !== "") {
      App.market.addStoreOwner(storeOwner, {account: App.account});
    }
  },

  handleRemoveStoreOwner: function(event) {
    event.preventDefault();
    var storeOwner = $(event.target).data('id');
    App.market.removeStoreOwner(storeOwner, {account: App.account});
  },

  handleCreateStore: function(event) {
    event.preventDefault();
    var name = document.getElementById("createStore").value
    document.getElementById("createStore").value = ""
    if (name !== "") {
      return App.market.createStore(name, {account: App.account})
    }
  },

  handleRemoveStore: function(event) {
    event.preventDefault();
    var storeID = parseInt($(event.target).data('id'));
    App.market.removeStore(storeID, {account: App.account})
  },

  handleChangeStoreName: function(event) {
    var storeID = parseInt($(event.target).data('id'));
    App.prompt("Store Name").then(function(name) {
      if (name != "") {
        App.market.changeStoreName(storeID, name, {account: App.account})
      }
    });
  },

  handleAddProduct: function(event) {
    event.preventDefault();
    var name = document.getElementById("productName").value
    document.getElementById("productName").value = "";
    var description = document.getElementById("productDescription").value;
    document.getElementById("productDescription").value = "";
    var price = Number(document.getElementById("productPrice").value);
    document.getElementById("productPrice").value = "";
    var quantity = Number(document.getElementById("productQuantity").value)
    document.getElementById("productQuantity").value = "";
    if (name !== "" && description !== "" && price !== "" && quantity !== "") {
      App.putIPFS(description).then(function(hash) {
        App.market.addProduct(App.storeID, name, hash, web3.toWei(price, "ether"), quantity, {account: App.account});
      });
    }
  },

  handleRemoveProduct: function(event) {
    event.preventDefault();
    var productID = parseInt($(event.target).data('id'));
    App.market.removeProduct(App.storeID, productID, {account: App.account});
  },

  handleChangeProductName: function(event) {
    event.preventDefault();
    if (!App.closed) {
      var productID = parseInt($(event.target).data('id'));
      App.prompt("Product Name").then(function(name) {
        if (name !== "") {
          App.market.changeProductName(App.storeID, productID, name, {account: App.account});
        }
      });
    }
  },

  handleChangeProductDescription: function(event) {
    event.preventDefault();
    if (!App.closed) {
      var productID = parseInt($(event.target).data('id'));
      App.prompt("Product Description").then(function(description) {
        if (description !== "") {
          App.putIPFS(description).then(function(hash) {
            App.market.changeProductDescription(App.storeID, productID, hash, {account: App.account});
          });
        }
      });
    }
  },

  handleChangeProductPrice: function(event) {
    event.preventDefault();
    if (!App.closed) {
      var productID = parseInt($(event.target).data('id'));
      App.prompt("Product Price").then(function(price) {
        if (price !== "") {
          App.market.changeProductPrice(App.storeID, productID, web3.toWei(Number(price), "ether"), {account: App.account});
        }
      });
    }
  },

  handleChangeProductQuantity: function(event) {
    event.preventDefault();
    if (!App.closed) {
      var productID = parseInt($(event.target).data('id'));
      App.prompt("Product Quantity").then(function(quantity) {
        if (quantity !== "") {
          App.market.changeProductQuantity(App.storeID, productID, parseInt(quantity), {account: App.account});
        }
      });
    }
  },

  handleWithdrawFunds: function(event) {
    event.preventDefault();
    var amount = document.getElementById("withdrawFunds").value;
    document.getElementById("withdrawFunds").value = "";
    if (amount !== "") {
      App.market.withdrawFunds(App.storeID, web3.toWei(Number(amount), "ether"), {account: App.account});
    }
  },

  handlePurchaseProduct: function(event) {
    event.preventDefault();
    var productID = parseInt($(event.target).data('id'));
    App.prompt("Quantity").then(function(result) {
      if (result !== "") {
        var quantity = parseInt(result)
        var storeID = App.storeID;
        var store = App.stores.get(storeID);
        var products = store.products;
        var product = products.get(productID);
        var price = product.price;
        var value = price * quantity;
        App.market.purchaseProduct(storeID, productID, quantity, {account: App.account, value: web3.toWei(value, "ether")})
      }
    });
  },

  // Logic for handling events from Ethereum blockchain

  handleEvent: function(err, result) {
    if (!err) {
      if (result.event == "MarketClosed") {
        App.handleMarketClosed();
      } else if (result.event == "MarketOpened") {
        App.handleMarketOpened();
      } else if (result.event == "AdministratorAdded") {
        App.handleAdministratorAdded(result);
      } else if (result.event == "AdministratorRemoved") {
        App.handleAdministratorRemoved(result);
      } else if (result.event == "StoreOwnerAdded") {
        App.handleStoreOwnerAdded(result);
      } else if (result.event == "StoreOwnerRemoved") {
        App.handleStoreOwnerRemoved(result);
      } else if (result.event == "StoreCreated") {
        App.handleStoreCreated(result);
      } else if (result.event == "StoreRemoved") {
        App.handleStoreRemoved(result);
      } else if (result.event == "StoreNameChanged") {
        App.handleStoreNameChanged(result);
      } else if (result.event == "ProductAdded") {
        App.handleProductAdded(result);
      } else if (result.event == "ProductRemoved") {
        App.handleProductRemoved(result);
      } else if (result.event == "ProductNameChanged") {
        App.handleProductNameChanged(result);
      } else if (result.event == "ProductDescriptionChanged") {
        App.handleProductDescriptionChanged(result);
      } else if (result.event == "ProductPriceChanged") {
        App.handleProductPriceChanged(result);
      } else if (result.event == "ProductQuantityChanged") {
        App.handleProductQuantityChanged(result);
      } else if (result.event == "FundsWithdrawn") {
        App.handleFundsWithdrawn(result);
      } else if (result.event == "ProductPurchased") {
        App.handleProductPurchased(result);
      } else {
        console.log(result);
      }
    } else
    console.log(err);
  },

  handleMarketClosed: function() {
    App.closed = true;
    App.disableFunctions();
    if (App.owner) {
      App.showStatus();
    }
  },

  handleMarketOpened: function() {
    App.closed = false;
    App.enableFunctions();
    if (App.owner) {
      App.showStatus();
    }
  },

  handleAdministratorAdded: function(result) {
    var administrator = result.args.administrator;
    App.administrators.add(administrator);
    if (App.owner) {
      App.showAdministrators();
    }
  },

  handleAdministratorRemoved: function(result) {
    var administrator = result.args.administrator;
    App.administrators.delete(administrator);
    if (App.owner) {
      App.showAdministrators();
    }  if (App.account == administrator) {
      App.refresh();
    }
  },

  handleStoreOwnerAdded: function(result) {
    var storeOwner = result.args.storeOwner;
    App.storeOwners.add(storeOwner);
    if (App.administrator) {
      App.showStoreOwners();
    } if (App.account == storeOwner) {
      App.refresh();
    }
  },

  handleStoreOwnerRemoved: function(result) {
    var storeOwner = result.args.storeOwner;
    App.storeOwners.delete(storeOwner);
    if (App.administrator) {
      App.showStoreOwners();
    }
  },

  handleStoreCreated: function(result) {
    var storeID = result.args.storeID.toNumber();
    var owner = result.args.owner;
    var name = result.args.name;
    var store = {"owner": owner, "name": name, "balance": 0, "products": new Map()}
    App.stores.set(storeID, store)
    if (App.storeOwner && App.account == owner && App.storeID == null) {
      App.showOwnedStores();
    } else if (App.shopper && App.storeID == null) {
      App.showStores();
    }
  },

  handleStoreRemoved: function(result) {
    var storeID = result.args.storeID.toNumber();
    var owner = App.stores.get(storeID).owner;
    App.stores.delete(storeID);
    if (App.storeOwner && App.account == owner && App.storeID == null) {
      App.showOwnedStores();
    } else if (App.shopper && App.storeID == null) {
      App.showStores();
    }
  },

  handleStoreNameChanged: function(result) {
    var storeID = result.args.storeID.toNumber();
    var name = result.args.name;
    var owner = App.stores.get(storeID).owner;
    App.stores.get(storeID).name = name;
    if (App.storeOwner && App.account == owner && App.storeID == null) {
      App.showOwnedStores();
    } else if (App.shopper && App.storeID == null) {
      App.showStores();
    }
  },

  handleProductAdded: function(result) {
    var storeID = result.args.storeID.toNumber();
    var productID = result.args.productID.toNumber();
    var name = result.args.name;
    var hash = result.args.description;
    var price = web3.fromWei(result.args.price, "ether").toNumber();
    var quantity = result.args.quantity.toNumber();
    var store = App.stores.get(storeID);
    var products = store.products;
    var product = {"name": name, "hash": hash, "description": null, "price": price, "quantity": quantity};
    products.set(productID, product);
    if (App.storeOwner && storeID == App.storeID) {
      App.showOwnedProducts();
    } else if (App.shopper && storeID == App.storeID) {
      App.showProducts();
    }
    App.getIPFS(hash).then(App.handleIPFS(storeID, productID));
  },

  handleProductRemoved: function(result) {
    var storeID = result.args.storeID.toNumber();
    var productID = result.args.productID.toNumber();
    var store = App.stores.get(storeID);
    var products = store.products;
    products.delete(productID);
    if (App.storeOwner && storeID == App.storeID) {
      App.showOwnedProducts();
    } else if (App.shopper && storeID == App.storeID) {
      App.showProducts();
    }
  },

  handleProductNameChanged: function(result) {
    var storeID = result.args.storeID.toNumber();
    var productID = result.args.productID.toNumber();
    var name = result.args.name;
    var store = App.stores.get(storeID);
    var products = store.products
    var product = products.get(productID);
    product.name = name;
    if (App.storeOwner && storeID == App.storeID) {
      App.showOwnedProducts();
    } else if (App.shopper && storeID == App.storeID) {
      App.showProducts();
    }
  },

  handleProductDescriptionChanged: function(result) {
    var storeID = result.args.storeID.toNumber();
    var productID = result.args.productID.toNumber();
    var hash = result.args.description;
    var store = App.stores.get(storeID);
    var products = store.products
    var product = products.get(productID);
    product.hash = hash;
    if (App.storeOwner && storeID == App.storeID) {
      App.showOwnedProducts();
    } else if (App.shopper && storeID == App.storeID) {
      App.showProducts();
    }
    App.getIPFS(hash).then(App.handleIPFS(storeID, productID));
  },

  handleProductPriceChanged: function(result) {
    var storeID = result.args.storeID.toNumber();
    var productID = result.args.productID.toNumber();
    var price = web3.fromWei(result.args.price, "ether").toNumber();
    var store = App.stores.get(storeID);
    var products = store.products;
    var product = products.get(productID);
    product.price = price;
    if (App.storeOwner && storeID == App.storeID) {
      App.showOwnedProducts();
    } else if (App.shopper && storeID == App.storeID) {
      App.showProducts();
    }
  },

  handleProductQuantityChanged: function(result) {
    var storeID = result.args.storeID.toNumber();
    var productID = result.args.productID.toNumber();
    var quantity = result.args.quantity.toNumber();
    var store = App.stores.get(storeID);
    var products = store.products
    var product = products.get(productID);
    product.quantity = quantity;
    if (App.storeOwner && storeID == App.storeID) {
      App.showOwnedProducts();
    } else if (App.shopper && storeID == App.storeID) {
      App.showProducts();
    }
  },

  handleFundsWithdrawn: function(result) {
    var storeID = result.args.storeID.toNumber();
    var amount = web3.fromWei(result.args.amount, "ether").toNumber();
    var store = App.stores.get(storeID);
    store.balance -= amount
    if (App.storeOwner && storeID == App.storeID) {
      App.showBalance();
    }
  },

  handleProductPurchased: function(result) {
    var storeID = result.args.storeID.toNumber();
    var productID = result.args.productID.toNumber();
    var quantity = result.args.quantity.toNumber();
    var amount = web3.fromWei(result.args.amount, "ether").toNumber();
    var store = App.stores.get(storeID);
    var products = store.products;
    var product = products.get(productID);
    product.quantity -= quantity;
    store.balance += amount;
    if (App.storeOwner && storeID == App.storeID) {
      App.showBalance();
      App.showOwnedProducts();
    } else if (App.shopper && storeID == App.storeID) {
      App.showProducts();
    }
  },

  // Functions to update user interface elements

  showStatus: function() {
    if (App.closed) {
      document.getElementById("status").innerText = "closed";
    } else {
      document.getElementById("status").innerText = "open";
    }
  },

  showAdministrators: function() {
    var administratorsRow = $('#administratorsRow');
    var administratorTemplate = $('#administratorTemplate');
    administratorsRow.empty();
    for (var administrator of App.administrators) {
      administratorTemplate.find('.address').text(administrator);
      administratorTemplate.find('.removeAdministrator').attr('data-id', administrator);;
      administratorsRow.append(administratorTemplate.html());
    }
  },

  showStoreOwners: function() {
    var storeOwnersRow = $('#storeOwnersRow');
    var storeOwnerTemplate = $('#storeOwnerTemplate');
    storeOwnersRow.empty();
    for (var storeOwner of App.storeOwners) {
      storeOwnerTemplate.find('.address').text(storeOwner);
      storeOwnerTemplate.find('.removeStoreOwner').attr('data-id', storeOwner);;
      storeOwnersRow.append(storeOwnerTemplate.html());
    }
  },

  showOwnedStores: function() {
    var storesRow = $('#ownedStoresRow');
    var storeTemplate = $('#ownedStoreTemplate');
    storesRow.empty();
    for (var [storeID, store] of App.stores) {
      if (App.account == store.owner) {
        storeTemplate.find('.storeName').text(store.name);
        storeTemplate.find('.manageStore').attr('data-id', storeID);
        storeTemplate.find('.changeStoreName').attr('data-id', storeID);
        storeTemplate.find('.removeStore').attr('data-id', storeID);
        storesRow.append(storeTemplate.html());
      }
    }
    App.storeOwner = true;
  },

  showBalance: function() {
    document.getElementById("balance").innerText = App.stores.get(App.storeID).balance
  },

  showOwnedProducts: function() {
    var storeID = App.storeID;
    var store = App.stores.get(storeID);
    var products = store.products
    var productsRow = $('#ownedProductsRow');
    var productTemplate = $('#ownedProductTemplate');
    productsRow.empty();
    for (var [productID, product] of products) {
      productTemplate.find('.productName').text(product.name);
      if (product.description !== null) {
        productTemplate.find('.productDescription').text(product.description);
      } else {
        productTemplate.find('.productDescription').text("");
      }
      productTemplate.find('.productPrice').text(product.price);
      productTemplate.find('.productQuantity').text(product.quantity);
      productTemplate.find('.changeProductName').attr('data-id', productID);
      productTemplate.find('.changeProductDescription').attr('data-id', productID);
      productTemplate.find('.changeProductQuantity').attr('data-id', productID);
      productTemplate.find('.changeProductPrice').attr('data-id', productID);
      productTemplate.find('.removeProduct').attr('data-id', productID);
      productsRow.append(productTemplate.html());
    }
    App.storeOwner = true;
  },

  showStores: function() {
    var storesRow = $('#storesRow');
    var storeTemplate = $('#storeTemplate');
    storesRow.empty();
    for (var [storeID, store] of App.stores) {
      if (App.storeOwners.has(store.owner)) {
        storeTemplate.find('.storeName').text(store.name);
        storeTemplate.find('.visitStore').attr('data-id', storeID);
        storesRow.append(storeTemplate.html());
      }
    }
  },

  showProducts: function() {
    var storeID = App.storeID;
    var store = App.stores.get(storeID);
    var products = store.products
    var productsRow = $('#productsRow');
    var productTemplate = $('#productTemplate');
    productsRow.empty();
    for (var [productID, product] of products) {
      productTemplate.find('.productName').text(product.name);
      if (product.description !== null) {
        productTemplate.find('.productDescription').text(product.description);
      } else {
        productTemplate.find('.productDescription').text("");
      }
      productTemplate.find('.productPrice').text(product.price);
      productTemplate.find('.productQuantity').text(product.quantity);
      productTemplate.find('.purchaseProduct').attr('data-id', productID);
      productsRow.append(productTemplate.html());
    }
  },

  disableFunctions: function() {
    $('.marketOpen').prop('disabled', true);
  },

  enableFunctions: function() {
    $('.marketOpen').prop('disabled', false);
  },

  refresh: async() => {
    document.getElementById('ownerFunctions').style.display = "none";
    document.getElementById('administratorFunctions').style.display = "none";
    document.getElementById('storeOwnerFunctions').style.display = "none";
    document.getElementById('manageStore').style.display = "none";
    document.getElementById('shopperFunctions').style.display = "none";
    document.getElementById('visitStore').style.display = "none";
    let owner = await App.market.owner();
    App.owner = App.account == owner;
    App.administrator = await App.market.administrators(App.account);
    App.storeOwner = await App.market.storeOwners(App.account);
    if (!App.owner && !App.administrator && !App.storeOwner) App.shopper = true;
    App.storeID = null;
    App.show();
  },

  // Miscellaneous helper functions

  // Wrap call to get accounts in a promise
  getAccount: function() {
    return new Promise(function(resolve, reject) {
      web3.eth.getAccounts(function(error, accounts) {
      if (!error) {
        resolve(accounts[0]);
      } else {
        reject(error);
      }
      });
    });
  },

  // Use a modal to prompt user for input and return the result
  prompt: function(message) {
    var modal = $('#modalTemplate');
    modal.find(".col-form-label").text(message);
    var promise = new Promise(function(resolve, reject) {
      var cancelButton = $("#cancelButton");
      var okayButton = $("#okayButton");
      $("#cancelButton").on("click", function() {
        cancelButton.off();
        okayButton.off();
        document.getElementById("modalText").value = "";
        modal.hide();
        resolve("");
      })
      okayButton.on("click", function() {
        var result = document.getElementById("modalText").value;
        cancelButton.off();
        okayButton.off();
        modal.hide();
        document.getElementById("modalText").value = "";
        resolve(result);
      })
    })
    modal.show();
    return promise;
  },

  // IPFS functions

  // Create a new IPFS node and return it when ready
  newIPFSNode: function() {
    return new Promise(function(resolve, reject) {
      var node = new window.Ipfs();
      node.on("ready", function() {
        resolve(node);
      });
      node.on("error", function(error) {
        reject(error);
      })
    });
  },

  // Store text on IPFS and return the hash
  putIPFS: function(text) {
    var fileBuffer = buffer.Buffer.from(text);
    return App.node.then(function(node) {
      return node.files.add(fileBuffer).then(function(result) {
        return result[0].hash;
      });
    });
  },
    
  // Return the text corresponding to an IPFS hash
  getIPFS: function(hash) {
    return App.node.then(function(node) {
      return node.files.cat(hash).then(function(fileBuffer) {
        return fileBuffer.toString();
      });
    });
  },

  // Save data received from IPFS to local storage and update the user interface
  handleIPFS: function(storeID, productID) {
    return function(description) {
      if (App.stores.has(storeID)) {
        var products = App.stores.get(storeID).products;
        if (products.has(productID)) {
          var product = products.get(productID);
          product.description = description;
          if (App.storeOwner && storeID == App.storeID) {
            App.showOwnedProducts();
          } else if (App.shopper && storeID == App.storeID) {
            App.showProducts();
          }
        }
      }
    };
  }
};

$(function() {
  $(window).load(function() {
    App.initWeb3();
  });
});