var Market = artifacts.require("Market")

contract("Market", async (accounts) => {

    const owner = accounts[0]
    const alice = accounts[1]
    const bob = accounts[2]
    const carol = accounts[3]
    const emptyAddress = "0x0000000000000000000000000000000000000000"

    var administrator
    var storeOwner
    var storeID
    var productID

    it("should allow the owner to add an administrator", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        let event = market.AdministratorAdded()
        await event.watch((err, res) => {
            administrator = res.args.administrator
            eventEmitted = true
        })

        await market.addAdministrator(alice, {from: owner})

        const result = await market.administrators(administrator)

        assert.equal(result, true, "the address added should be listed as an administrator")
        assert.equal(eventEmitted, true, "adding an administrator should emit an AdministratorAdded event")
    })

    it("should allow an administrator to add a store owner", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        let event = market.StoreOwnerAdded()
        await event.watch((err, res) => {
            storeOwner = res.args.storeOwner
            eventEmitted = true
        })

        await market.addStoreOwner(bob, {from: alice})

        const result = await market.storeOwners(storeOwner)

        assert.equal(result, true, "the address added should be listed as a store owner")
        assert.equal(eventEmitted, true, "adding a store owner should emit a StoreOwnerAdded event")
    })

    it("should allow a store owner to create a store", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        let event = market.StoreCreated()
        await event.watch((err, res) => {
            storeID = res.args.storeID
            eventEmitted = true
        })

        const name = "store name"

        await market.createStore(name, {from: bob})

        const result = await market.getStore(storeID)

        assert.equal(result[0], name, "the name of the store does not match the expected value")
        assert.equal(result[1], bob, "the address adding the store should be listed as the store owner")
        assert.equal(result[2], 0, "the balance should be set to 0 when a store is created")
        assert.equal(eventEmitted, true, "creating a store should emit a StoreCreated event")
    })

    it("should allow a store owner to change a store's name", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        let event = market.StoreNameChanged()
        await event.watch((err, res) => {
            storeID = res.args.storeID
            eventEmitted = true
        })

        const name = "changed store name"

        await market.changeStoreName(storeID, name, {from: bob})

        const result = await market.getStore(storeID)

        assert.equal(result[0], name, "the name of the store does not match the expected value")
        assert.equal(eventEmitted, true, "changing a store's name should emit a StoreNameChanged event")
    })

    it("should allow a store owner to add a product", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        let event = market.ProductAdded()
        await event.watch((err, res) => {
            storeID = res.args.storeID
            productID = res.args.productID
            eventEmitted = true
        })

        const name = "product name"
        const description = "QmZu8ZqDg3hFH7Uek8pxCUPdF2A88uy5BrfLRfDbzeZPdF"
        const price = web3.toWei(2, "ether")
        const quantity = 1

        await market.addProduct(storeID, name, description, price, quantity, {from: bob})

        const result = await market.getProduct(storeID, productID)

        assert.equal(result[0], name, "the name of the product does not match the expected valuet")
        assert.equal(result[1], description, "the description of the product does not match the expected value")
        assert.equal(result[2], price, "the price of the product does not match the expected value")
        assert.equal(result[3], quantity, "the quantity of the product does not match the expected value")
        assert.equal(eventEmitted, true, "adding a product should emit a ProductAdded event")
    })

    it("should allow a store owner to change a product's name", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        let event = market.ProductNameChanged()
        await event.watch((err, res) => {
            storeID = res.args.storeID
            productID = res.args.productID
            eventEmitted = true
        })

        const name = "changed store name"

        await market.changeProductName(storeID, productID, name, {from: bob})

        const result = await market.getProduct(storeID, productID)

        assert.equal(result[0], name, "the name of the product does not match the expected valuet")
        assert.equal(eventEmitted, true, "changing a product's name should emit a ProductNameChanged event")
    })

    it("should allow a store owner to change a product's description", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        let event = market.ProductDescriptionChanged()
        await event.watch((err, res) => {
            storeID = res.args.storeID
            productID = res.args.productID
            eventEmitted = true
        })

        const description = "QmZSswoJqJnX7eBoQLXCbZB9uVEsEt5AuafFxoLbZmuLxL"

        await market.changeProductDescription(storeID, productID, description, {from: bob})

        const result = await market.getProduct(storeID, productID)

        assert.equal(result[1], description, "the description of the product does not match the expected valuet")
        assert.equal(eventEmitted, true, "changing a product's description should emit a ProductDescriptionChanged event")
    })

    it("should allow a store owner to change a product's price", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        let event = market.ProductPriceChanged()
        await event.watch((err, res) => {
            storeID = res.args.storeID
            productID = res.args.productID
            eventEmitted = true
        })

        const price = web3.toWei(1, "ether")

        await market.changeProductPrice(storeID, productID, price, {from: bob})

        const result = await market.getProduct(storeID, productID)

        assert.equal(result[2], price, "the price of the product does not match the expected valuet")
        assert.equal(eventEmitted, true, "changing a product's price should emit a ProductPriceChanged event")
    })

    it("should allow a store owner to change a product's quantity", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        let event = market.ProductQuantityChanged()
        await event.watch((err, res) => {
            storeID = res.args.storeID
            productID = res.args.productID
            eventEmitted = true
        })

        const quantity = 2

        await market.changeProductQuantity(storeID, productID, quantity, {from: bob})

        const result = await market.getProduct(storeID, productID)

        assert.equal(result[3], quantity, "the quantity of the product does not match the expected value")
        assert.equal(eventEmitted, true, "changing a product's quantity should emit a ProductQuantityChanged event")
    })

    it("should allow a shopper to buy a product", async() => {
        const market = await Market.deployed()

        const storeBefore = await market.getStore(storeID)
        const productBefore = await market.getProduct(storeID, productID)

        var eventEmitted = false

        let event = market.ProductPurchased()
        await event.watch((err, res) => {
            storeID = res.args.storeID
            productID = res.args.productID
            eventEmitted = true
        })

        const price = productBefore[2].toNumber()
        const amount = web3.toWei(2, "ether")

        var storeBalanceBefore = storeBefore[2].toNumber()
        var quantityBefore = productBefore[3].toNumber()
        var marketBalanceBefore = await web3.eth.getBalance(market.address).toNumber()
        var carolBalanceBefore = await web3.eth.getBalance(carol).toNumber()

        await market.purchaseProduct(storeID, productID, 1, {from: carol, value: amount})

        const storeAfter = await market.getStore(storeID)
        const productAfter = await market.getProduct(storeID, productID)

        var storeBalanceAfter = storeAfter[2].toNumber()
        var quantityAfter = productAfter[3].toNumber()
        var marketBalanceAfter = await web3.eth.getBalance(market.address).toNumber()
        var carolBalanceAfter = await web3.eth.getBalance(carol).toNumber()

        assert.equal(storeBalanceAfter, storeBalanceBefore + price, "the store's balance should be increased by the price of the product")
        assert.equal(quantityAfter, quantityBefore - 1, "the quantity of the product does not match the expected value")
        assert.equal(eventEmitted, true, "purchasing a product should emit a ProductPurchased event")
        assert.equal(marketBalanceAfter, marketBalanceBefore + price, "the market's balance should be increased by the price of the product")
        assert.isBelow(carolBalanceAfter, carolBalanceBefore - price, "the buyer's balance should be reduced by more than the price of the product (including gas costs)")
    })

    it("should allow a store owner to withdraw funds", async() => {
        const market = await Market.deployed()

        const storeBefore = await market.getStore(storeID)

        var eventEmitted = false

        let event = market.FundsWithdrawn()
        await event.watch((err, res) => {
            storeID = res.args.storeID
            eventEmitted = true
        })

        const amount = web3.toWei(1, "ether")

        var storeBalanceBefore = storeBefore[2].toNumber()
        var marketBalanceBefore = await web3.eth.getBalance(market.address).toNumber()
        var bobBalanceBefore = await web3.eth.getBalance(bob).toNumber()

        await market.withdrawFunds(storeID, amount, {from: bob})

        const storeAfter = await market.getStore(storeID)

        var storeBalanceAfter = storeAfter[2].toNumber()
        var marketBalanceAfter = await web3.eth.getBalance(market.address).toNumber()
        var bobBalanceAfter = await web3.eth.getBalance(carol).toNumber()
        
        assert.equal(storeBalanceAfter, storeBalanceBefore - amount, "the store's balance should be reduced by the amount withdrawn")
        assert.equal(eventEmitted, true, "withdrawing funds should emit a FundsWithdrawn event")
        assert.equal(marketBalanceAfter, marketBalanceBefore - amount, "the market's balance should be reduced by the amount withdrawn")
        assert.isBelow(bobBalanceAfter, bobBalanceBefore + parseInt(amount, 10), "the store owner's balance should be increased by less than the amount withdrawn (including gas costs)")
    })

    it("should allow a store owner to remove a product", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        var event = market.ProductRemoved()
        await event.watch((err, res) => {
            storeID = res.args.storeID
            productID = res.args.productID
            eventEmitted = true
        })

        await market.removeProduct(storeID, productID, {from: bob})

        const result = await market.getProduct(storeID, productID)

        assert.equal(result[0], "", "the name should be set to 0 when a product is removed")
        assert.equal(result[1], "", "the description should be set to 0 when a product is removed")
        assert.equal(result[2], 0, "the price should be set to 0 when a product is removed")
        assert.equal(result[3], 0, "the quantity should be set to 0 when a product is removed")
        assert.equal(eventEmitted, true, "removing a product should emit a ProductRemoved event")
    })

    it("should allow a store owner to remove a store", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        let event = market.StoreRemoved()
        await event.watch((err, res) => {
            storeID = res.args.storeID
            eventEmitted = true
        })

        await market.removeStore(storeID, {from: bob})

        const result = await market.getStore(storeID)

        assert.equal(result[0], "", "the name should be set to 0 when a store is removed")
        assert.equal(result[1], emptyAddress, "the store owner address should be set to 0 when a store is removed")
        assert.equal(result[2].toNumber(), 0, "the balance should be set to 0 when a store is removed")
        assert.equal(eventEmitted, true, "removing a store should emit a StoreRemoved event")
    })

    it("should allow an administrator to remove a store owner", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        let event = market.StoreOwnerRemoved()
        await event.watch((err, res) => {
            storeOwner = res.args.storeOwner
            eventEmitted = true
        })

        await market.removeStoreOwner(bob, {from: alice})

        const result = await market.storeOwners(storeOwner)

        assert.equal(result, false, "the address removed should not be listed as a store owner")
        assert.equal(eventEmitted, true, "removing a store owner should emit a StoreOwnerRemoved event")
    })

    it("should allow the owner to remove an administrator", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        let event = market.AdministratorRemoved()
        await event.watch((err, res) => {
            administrator = res.args.administrator
            eventEmitted = true
        })

        await market.removeAdministrator(alice)

        const result = await market.administrators(administrator)

        assert.equal(result, false, "the address removed should not be listed as an administrator")
        assert.equal(eventEmitted, true, "removing an administrator should emit an AdministratorRemoved event")
    })

    it("should allow the owner to close the market", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        let event = market.MarketClosed()
        await event.watch((err, res) => {
            eventEmitted = true
        })

        await market.close()

        const result = await market.closed()

        assert.equal(result, true, "the state of the market should be closed")
        assert.equal(eventEmitted, true, "closing the market should emit a MarketClosed event")
    })

    it("should allow the owner to open the market", async() => {
        const market = await Market.deployed()

        var eventEmitted = false

        let event = market.MarketOpened()
        await event.watch((err, res) => {
            eventEmitted = true
        })

        await market.open()

        const result = await market.closed()

        assert.equal(result, false, "the state of the market should be open")
        assert.equal(eventEmitted, true, "opening the market should emit a MarketOpened event")
    })
})