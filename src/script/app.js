App = {
    init: async () => {
        return await App.initWeb3()
    },

    initWeb3: async () => {
        try {
            const provider = await App.getProviderInstance()
            if (provider) {
                App.web3 = new Web3(provider)
            } else {
                App.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/94890e5bd20040fe861e18da383bb492"))
            }
            return App.initContracts()
        } catch (error) {
            alert("Enable to access to Metamask")
            console.log(error)
        }
    },

    getProviderInstance: async () => {
        // 1. Try getting modern provider
        const { ethereum } = window
        if (ethereum) {
            try {
                await ethereum.enable()
                return ethereum
            } catch (error) {
                throw new Error("User denied Metamask access")
            }
        }

        // 2. Try getting legacy provider
        const { web3 } = window
        if (web3 && web3.currentProvider) {
            return web3.currentProvider
        }

        return null
    },

    initContracts: async () => {
        App.networkId = await App.web3.eth.net.getId()

        if (App.networkId !== 1) {
            $("#submit").attr("disabled", true)
            alert ("Please switch your Metamask node to Mainnet");
            return
        }

        App.airdropAddress = "0x94080Ed2F72967554D2a6Bf1DD6f678e498DdB29"
        App.airdropABI = [{"constant":false,"inputs":[{"name":"addresses","type":"address[]"},{"name":"values","type":"uint256[]"}],"name":"doAirdrop","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"token","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}]
        App.airdropInstance = new App.web3.eth.Contract(App.airdropABI, App.airdropAddress)

        App.tokenAddress = await App.airdropInstance.methods.token().call()
        App.tokenABI = [{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}],
        App.tokenInstance = new App.web3.eth.Contract(App.tokenABI, App.tokenAddress)

        return App.initVariables()
    },

    initVariables: async () => {
        App.ownerAddress = "0xB5869587CA6E239345f75C28d3b8Ee23da812759"
        App.account = await App.web3.eth.getAccounts().then(accounts => accounts[0])
        App.allowance = App.web3.utils.fromWei(await App.tokenInstance.methods.allowance(App.ownerAddress, App.airdropAddress).call(), 'ether')
        if (localStorage.getItem("transactions") === null) {
            localStorage.setItem("transactions", JSON.stringify([]))
        }
        return App.render()
    },

    showAllowance: () => {
        const amount = App.allowance
        $('#allowance').text(amount > 0 ? amount + " EVOT" : '0. (Please allow more tokens for ' + App.airdropAddress + ' contract.)')
        $('#owner-wallet').text(App.ownerAddress)
    },

    showTransactions: () => {
        const data = JSON.parse(localStorage.getItem("transactions"))
        let rows = document.createDocumentFragment()
        if (data.length !== 0) {
            $("#txTable tbody").empty()
            const { url } = App.detectNetwork()
            for (let i = 0; i < data.length; i++) {
                const txData = data[i]

                const row = document.createElement("tr")
                row.setAttribute("scope", "row")

                const index = document.createElement("th")
                index.appendChild(document.createTextNode(`${i}`))
                row.appendChild(index)

                const hash = document.createElement("td")
                const hyperlink = document.createElement("a")
                const linkText = document.createTextNode(`${txData.hash}`)
                hyperlink.appendChild(linkText)
                hyperlink.href = `${url}/tx/${txData.hash}`
                hash.appendChild(hyperlink)
                row.appendChild(hash)

                const status = document.createElement("td")
                status.appendChild(document.createTextNode(`${txData.status}`))
                row.appendChild(status)

                const users = document.createElement("td")
                users.appendChild(document.createTextNode(`${txData.users}`))
                row.appendChild(users)

                const amount = document.createElement("td")
                amount.appendChild(document.createTextNode(`${txData.amount}`))
                row.appendChild(amount)

                rows.appendChild(row)
            }
            $("#txTable tbody").append(rows)
        }
    },

    detectNetwork: () => {
        switch (App.networkId) {
            case 1:
                return {
                    network: "Mainnet",
                    url: "https://etherscan.io/",
                    id: 1
                }
                break
            case 2:
                return {
                    network: "Morden",
                    url: "https://mordenexplorer.ethernode.io/",
                    id: 2
                }
                break
            case 3:
                return {
                    network: "Ropsten",
                    url: "https://ropsten.etherscan.io/",
                    id: 3
                }
                break
            case 4:
                return {
                    network: "Rinkeby",
                    url: "https://rinkeby.etherscan.io/",
                    id: 4
                }
                break
            case 42:
                return {
                    network: "Kovan",
                    url: "https://kovan.etherscan.io/",
                    id: 42
                }
                break
            default:
                console.log('This is an unknown network.')
        }
    },

    reloadListener: e => {
        e.returnValue = ''
    },

    alertInReload: enable => {
        if (enable) {
            window.addEventListener('beforeunload', App.reloadListener)
        } else {
            window.removeEventListener('beforeunload', App.reloadListener)
        }
    },

    render: () => {
        App.showAllowance()
        App.showTransactions()
    },

    startAirdrop: () => {
        let amounts = []
        let receivers = []
        let totalAmount = 0

        try {
            // Replacing and creating 'receivers' array
            $('#receivers').val().split(',').forEach((address, i) => {
                if (/\S/.test(address)) {
                    address = address.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '')

                    // Checksuming the addresses
                    address = App.web3.utils.toChecksumAddress(address)

                    // Checking if address is valid
                    if(App.web3.utils.isAddress(address)) {
                        receivers.push(address)
                    } else {
                        throw ('Founded wrong ETH address, please check it \n\n' + address)
                    }
                }
            })

            // Replacing and creating 'amounts' array
            amounts = $('#amounts').val().split(',').map(value => {
                if (Number(value) !== 0) {
                       return Number(value)
                   } else {
                        throw ('Founded  number 0 in amounts, please remove it');
                   }
               })

            // Checking arrays length and validities
            if(receivers.length == 0 || amounts.length == 0 || receivers.length != amounts.length || receivers.length > 150 || amounts.length > 150) {
                throw ('Issue with receivers/amount values')
            }


            // Calculating total sum of 'amounts' array items
            totalAmount = parseFloat(amounts.reduce((a, b) => a + b).toFixed(2))

            // If allowance tokens more than amounts sum then continue
            if(App.allowance >= totalAmount) {
                // Calling the method from airdrop smart contract
                App.airdropInstance.methods.doAirdrop(receivers, amounts).send({ from: App.account })
                .on("transactionHash", hash => {
                    App.alertInReload(true)
                    const newTx = {
                        hash,
                        status: "Pending",
                        users: receivers.length,
                        amount: totalAmount
                    }
                    let transactions = JSON.parse(localStorage.getItem("transactions"))
                    transactions.unshift(newTx)
                    localStorage.setItem("transactions", JSON.stringify(transactions))
                    App.showTransactions()
                })
                .on("receipt", receipt => {
                    App.alertInReload(false)

                    App.allowance -= totalAmount

                    const hash = receipt.transactionHash
                    const transactions = JSON.parse(localStorage.getItem("transactions"))
                    const txIndex = transactions.findIndex(tx => tx.hash === hash);
                    transactions[txIndex].status = "Done"

                    localStorage.setItem("transactions", JSON.stringify(transactions))
                    App.render()
                })
                .on("error", error => {
                    App.alertInReload(false)
                    throw ("Tx was failed")
                })
            } else {
                throw ('You havent enough tokens for airdrop, please approve more tokens, restart the page and try again.')
            }
        } catch (error) {
            alert(error)
        }
    }
}

$(window).on("load", () =>{
    $.ready.then(() => {
        App.init()
    })
})