$(window).on("load", function(){
    if (typeof web3 !== 'undefined') {
        window.web3 = new Web3(web3.currentProvider);
    } else {
        web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io")); // To change
    }

    console.log(web3.version);

    let tokenAddress = "0xfEf91D338054C02aAaf6Ec55Fd6cC19b6DEAD773", // To change
        ownerAddress = "0x8b878Ee3B32b0dFeA6142F5ca1EfebA8c5dFEc7e", // To change
        airdropAddress = "0x4653075350a20d6df1df52276d80f8e53d9491c9", // To change
        mainAbi = [
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "_addresses",
                        "type": "address[]"
                    },
                    {
                        "name": "_values",
                        "type": "uint256[]"
                    }
                ],
                "name": "doAirdrop",
                "outputs": [
                    {
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [
                    {
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "name": "spender",
                        "type": "address"
                    }
                ],
                "name": "allowance",
                "outputs": [
                    {
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            }
        ],
        tokenInstance = web3.eth.contract(mainAbi).at(tokenAddress),
        contractInstance = web3.eth.contract(mainAbi).at(airdropAddress),
        transactions = JSON.parse(localStorage.getItem("transactions")),
        allowance = 0,
        getAllowance = new Promise((resolve, reject) => {
            tokenInstance.allowance(ownerAddress, airdropAddress, (error, result) => {
                if(!error)
                    resolve(result)
                else
                    return reject(e)
            })
        });

    $.ready.then(function(){
        // Show allowance in DOM
        showAllowance = (amount) => {
            $('#allowance').text(amount > 0 ? amount : '0. (Please allow more tokens for ' + airdropAddress + ' contract.)');
        }

        showTransactions = (data) => {
            $("#txTable tbody").empty();
            data.forEach(function(value, i) {
                $("#txTable tbody").append('<tr scope="row"><th>' + i + '</th><td><a href="https://rinkeby.etherscan.io/tx/'+ value.txHash +'" target="_blank">' + value.txHash + '<a/></td><td>' + value.users + '</td><td>' + value.amount + '</td></tr>');
            })
        }

        if (localStorage.getItem("transactions") === null) {
            localStorage.setItem("transactions", JSON.stringify([]));
        } else {
            showTransactions(transactions);
        }

        // Resolving allowance promise
        getAllowance.then((val) => {
            allowance = web3.fromWei( Number(val), 'ether');
            showAllowance(allowance);
        })

        $('#submit').on('click', () => {
            startAirdrop();
        });

        startAirdrop = () => {
            let totalAmount = 0,
                validationPassed = true,
                receivers = [],
                amounts = [];

            // Replacing and creating 'receivers' array
            $('#receivers').val().split(',').forEach((value, i) => {
                if (/\S/.test(value)) {
                    value = value.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '');

                    // Checksuming the addresses
                    value = web3.toChecksumAddress(value);

                    // Checking if address is valid
                    if(web3.isAddress(value)) {
                        receivers.push(value);
                    } else {
                        alert('Founded wrong ETH address, please check it \n\n' + value);
                        validationPassed = false;
                    }
                }
            });

            // Replacing and creating 'amounts' array
            $('#amounts').val().split(',').forEach((value, i) => {
                if (/\S/.test(value)) {
                    value = value.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '');
                    value = parseInt(value);

                    // Checking if there is 0 in amounts, cause transaction with 0 amount does not make sense
                    if(value !== 0) {
                        amounts.push(value);
                    } else {
                        alert('Founded  number 0 in amounts, please remove it');
                        validationPassed = false;
                    }
                }
            })

            // Checking arrays length and validities
            if(receivers.length < 1 || amounts.length < 1 || receivers.length != amounts.length) {
                alert('Receivers and/or values has an issue, please check it again');
                validationPassed = false;
            }

            if (!validationPassed) return;

            // Calculating total sum of 'amounts' array items
            amounts.forEach((value, i) => {
                totalAmount += value;
            })

            // If allowance tokens more than amounts sum then continue
            if(allowance >= totalAmount) {

                // Calling the method from airdrop smart contract
                contractInstance.doAirdrop(receivers, amounts, (error, result) => {
                    if(!error) {
                        allowance -= totalAmount;
                        showAllowance(allowance);

                        let newTransaction = {
                            txHash: result,
                            users: receivers.length,
                            amount: totalAmount
                        }

                        transactions.push(newTransaction);
                        localStorage.setItem("transactions", JSON.stringify(transactions));
                        showTransactions(transactions);
                    }
                    else
                        alert(error);
                })
            }
            else
                alert('You havent enough tokens for airdrop');
        }
    });
})