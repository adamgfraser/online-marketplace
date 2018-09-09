# Design Pattern Decisions

This document explains the design patterns I used and why I chose them.

## System Design

The first decision I made was the architecture of my smart contracts. The domain I wanted to represent was a market with many stores, each of which had many products. It seemed that there were two ways to represent this. First, the `Market` could be a contract that deployed separate `Store` contracts for each store created, maintaining a list of the addresses of the created stores and potentially some privileges to interact with those stores. Second, the `Market` could be a contract that just held the information about each store in its storage and provides functions to reference and interact with the store objects.

I initially explored the first approach but ultimately chose to pursue the second. I felt that given the tight coupling between the market and the stores in the market (e.g. the market owner can close the market and market administrators can approve and remove store owners) this made the most sense. I was able to achieve similar segregation of store balances with appropriate functions in this one contract. I also thought that having a single contract tracking all the state made it easier for the front end application to track and update that state.

Related to this, I also explored a couple of different inheritance structures. The market uses a concept of an owner that could easily be extracted into a separate `Owned` abstract contract that the market inherits from. Similarly, the concept of a group of administrators could potentially be its own abstract contract `Administered` that inherits from `Owned`. Given that I ended up having the single `Market` contract and no other contracts would inherit from these contracts I decided it made the most sense to inline this functionality in the `Market` contract.

However, these are interesting examples of how the same domain can be represented in alternative ways with their own pros and cons on the blockchain just like in traditional software development.

## Structs and Mappings

To represent stores and their products I used a design where the stores were maintained in a mapping from a unique store identifier to a `Store` struct. The `Store` struct itself contained information about the store as well as another mapping from unique product identifiers to `Product` structs with information about each product. This is similar to the design pattern in the [Crowdfunding](https://solidity.readthedocs.io/en/v0.4.24/types.html?highlight=crowdfunding) contract in the Solidity documentation, where each crowdfunding `Campaign` is a struct that itself contains a mapping of `Funder` structs.

I found that this design worked very well. By using a mapping instead of an array I was able to avoid needing to iterate over all the stores or products, which reduces the gas cost of function calls and avoided the risk of exceeding the gas limit if an array became extremely large.

## Restricting Access

I made extensive use of the restricting access pattern. Almost all functions have some kind of modifier to restrict access, whether it is to the contract owner, an administrator, an approved store owner, or the owner of a particular store. Modifiers are a really nice language feature that allow you to add these kind of restrictions in a very straightforward and readable way.

## Fail Early and Fail Loud

I also made very heavy use of the fail early and fail loud design pattern. All of the access restriction modifiers discussed above fail early and loud since they are checked before the body of the function they modify and throw an error if the precondition is not satisfied. There are also several other uses of preconditions to test for example that there is sufficient inventory in stock to buy, that a payment is sufficient, or that a funds withdrawal request does not exceed the store balance.

## Withdrawal From Contracts

The contract uses the withdrawal pattern for sending ether from the contract. Rather than a purchase sending ether to the store owner which could fail, purchases increases a store's balance and then the store owner can call a function to withdraw the balance.

## Circuit Breaker

The contract uses the circuit breaker design pattern through the `close` and `open` functions. In an emergency the store can be closed to prevent all state modifications except for withdrawal of ether by owners. Opening the store restores normal functionality.

## Events

Events were one design pattern that I didn't fully appreciate before developing the front end application. I ended up following the design pattern of emitting an event for every change to contract state.  This made it very easy for a front end client to track the state of items of interest by listening to relevant events and updating its local state accordingly.

This is also a nice solution to some of the limitations of Solidity. For instance, a Solidity function can't return something as simple as a `string[]`, so just getting the name of all the stores on the marketplace to display in the user interface would require a separate call for each store identifier and then combining them with something like `Promise.all`, which is not only cumbersome but creates a risk that the entire call fails if one of the calls fails for some reason. In contrast, if we emit an event for every contract change we can just update local state accordingly and then use the richer variety of collections operations in Javascript to show exactly the information we want. [This](https://media.consensys.net/technical-introduction-to-events-and-logs-in-ethereum-a074d65dd61e) blog post has a really nice description of this design pattern.