const { expect, assert } = require("chai")
const { ethers, getNamedAccounts } = require("hardhat")

describe("Housing Rental contract", function () {
    const createListing = async (contract) => {
        const { deployer } = await getNamedAccounts()
        const transactionResponse = await contract.createListing(
            {
                index: 0,
                metadataID: "1",
                metadataHash: "hash",
                landlord: deployer,
            },
            "1394/2015/SRO1"
        )
        await transactionResponse.wait(1)
    }

    const createProposal = async (contract) => {
        const [owner, dmmy, tenant, middlemanAcc] = await ethers.getSigners()

        const transactionResponse1 = await contract.connect(tenant).createProposal({
            rentAmount: ethers.utils.parseUnits("0.02"),
            months: 12,
            sender: "0x852cea42A73660CF91Ce6935A49333C13fdB18CC",
            listingIndex: 0,
        })
        await transactionResponse1.wait(1)
    }
    const acceptProposal = async (contract) => {
        const { deployer, middlemanAcc } = await getNamedAccounts()
        const transactionResponse = await contract.acceptProposal(
            (listingIndex = 0),
            (index = 0),
            (docID = "1"),
            (docHash = "doc"),
            (middleman = middlemanAcc),
            (startDate = parseInt(Date.now() / 1000).toString()),
            (months = 12),
            (rent = ethers.utils.parseEther("0.1")),
            (deposit = ethers.utils.parseEther("0.2")),
            (landlordSign = "signed")
        )
        await transactionResponse.wait(1)
    }
    const acceptProposalUnauth = async (contract) => {
        const { deployer, middlemanAcc } = await getNamedAccounts()
        const [owner, dmmy, tenant] = await ethers.getSigners()
        const transactionResponse = await contract
            .connect(tenant)
            .acceptProposal(
                (listingIndex = 0),
                (index = 0),
                (docID = "1"),
                (docHash = "doc"),
                (middleman = middlemanAcc),
                (startDate = parseInt(Date.now() / 1000).toString()),
                (months = 12),
                (rent = ethers.utils.parseEther("0.1")),
                (deposit = ethers.utils.parseEther("0.2")),
                (landlordSign = "signed")
            )
        await transactionResponse.wait(1)
    }
    const acceptProposalLate = async (contract) => {
        const { deployer, middlemanAcc } = await getNamedAccounts()
        const transactionResponse = await contract.acceptProposal(
            (listingIndex = 0),
            (index = 0),
            (docID = "1"),
            (docHash = "doc"),
            (middleman = middlemanAcc),
            (startDate = parseInt((Date.now() + 10000000) / 1000).toString()),
            (months = 12),
            (rent = ethers.utils.parseEther("0.1")),
            (deposit = ethers.utils.parseEther("0.2")),
            (landlordSign = "signed")
        )
        await transactionResponse.wait(1)
    }
    const tenantSign = async (contract) => {
        const [owner, dmmy, tenant, middlemanAcc] = await ethers.getSigners()
        const transactionResponse = await contract
            .connect(tenant)
            .signAgreement((listingIndex = 0), (senderSign = "tenantSign"), {
                value: ethers.utils.parseEther("0.2"),
            })
        await transactionResponse.wait(1)
    }
    const tenantSignLow = async (contract) => {
        const [owner, dmmy, tenant, middlemanAcc] = await ethers.getSigners()
        const transactionResponse = await contract
            .connect(tenant)
            .signAgreement((listingIndex = 0), (senderSign = "tenantSign"), {
                value: ethers.utils.parseEther("0.06"),
            })
        await transactionResponse.wait(1)
    }
    const tenantSignUnauth = async (contract) => {
        const [owner, dmmy, tenant, middlemanAcc] = await ethers.getSigners()
        const transactionResponse = await contract
            .connect(dmmy)
            .signAgreement((listingIndex = 0), (senderSign = "tenantSign"), {
                value: ethers.utils.parseEther("0.2"),
            })
        await transactionResponse.wait(1)
    }
    const witnessSign = async (contract) => {
        const [owner, dmmy, tenant, middlemanAcc] = await ethers.getSigners()
        const transactionResponse = await contract
            .connect(middlemanAcc)
            .signAgreement((listingIndex = 0), (senderSign = "witnessSign"))
        await transactionResponse.wait(1)
    }
    const witnessSignUnauth = async (contract) => {
        const [owner, dmmy, tenant, middlemanAcc] = await ethers.getSigners()
        const transactionResponse = await contract
            .connect(dmmy)
            .signAgreement((listingIndex = 0), (senderSign = "witnessSign"))
        await transactionResponse.wait(1)
    }
    const startAgreement = async (contract) => {
        const transactionResponse = await contract.startAgreement((listingIndex = 0))
        await transactionResponse.wait(1)
    }
    const payRent = async (contract) => {
        const [owner, dmmy, tenant, middlemanAcc] = await ethers.getSigners()
        const transactionResponse = await contract.connect(tenant).payRent((listingIndex = 0), {
            value: ethers.utils.parseEther("0.25"),
        })
        await transactionResponse.wait(1)
    }
    const payRentUnauth = async (contract) => {
        const [owner, dmmy, tenant, middlemanAcc] = await ethers.getSigners()
        const transactionResponse = await contract.connect(dmmy).payRent((listingIndex = 0), {
            value: ethers.utils.parseEther("0.25"),
        })
        await transactionResponse.wait(1)
    }
    it("Assigns the correct owner", async function () {
        const [owner] = await ethers.getSigners()
        const HousingRental = await ethers.getContractFactory("HousingRental")
        const contractRental = await HousingRental.deploy(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
            // "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
        await contractRental.deployed()
        expect(await contractRental.getOwner()).to.equal(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
    })
    it("Listing Creation", async function () {
        const HousingRental = await ethers.getContractFactory("HousingRental")

        const contractRental = await HousingRental.deploy(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
            // "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
        await contractRental.deployed()
        await createListing(contractRental)
        expect((await contractRental.getListings("0", "2"))[0].metadataID).to.equal("1")
    })
    it("Proposal Creation", async function () {
        const HousingRental = await ethers.getContractFactory("HousingRental")

        const contractRental = await HousingRental.deploy(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
            // "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
        await contractRental.deployed()
        await createListing(contractRental)
        await createProposal(contractRental)
        expect((await contractRental.getProposals("0"))[0].rentAmount).to.equal(
            ethers.utils.parseUnits("0.02")
        )
    })
    it("Accept Proposal", async function () {
        const HousingRental = await ethers.getContractFactory("HousingRental")

        const contractRental = await HousingRental.deploy(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
        await contractRental.deployed()
        await createListing(contractRental)
        await createProposal(contractRental)
        await acceptProposal(contractRental)
        expect((await contractRental.rentalData("0")).status).to.equal(0)
    })
    it("Accept Proposal from Unauthorized account", async function () {
        const HousingRental = await ethers.getContractFactory("HousingRental")

        const contractRental = await HousingRental.deploy(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
        await contractRental.deployed()
        await createListing(contractRental)
        await createProposal(contractRental)
        let err1
        try {
            await acceptProposalUnauth(contractRental)
        } catch (err) {
            err1 = err
        } finally {
            assert.exists(err1)
        }
    })
    it("Tenant Signature", async function () {
        const HousingRental = await ethers.getContractFactory("HousingRental")

        const contractRental = await HousingRental.deploy(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
        await contractRental.deployed()
        await createListing(contractRental)
        await createProposal(contractRental)
        await acceptProposal(contractRental)
        await tenantSign(contractRental)
        expect((await contractRental.rentalData("0")).tenantSign).to.equal("tenantSign")
    })
    it("Tenant Signature Low Deposit", async function () {
        const HousingRental = await ethers.getContractFactory("HousingRental")

        const contractRental = await HousingRental.deploy(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
        await contractRental.deployed()
        await createListing(contractRental)
        await createProposal(contractRental)
        await acceptProposal(contractRental)
        let err1
        try {
            await tenantSignLow(contractRental)
        } catch (err) {
            err1 = err
        } finally {
            assert.exists(err1)
        }
    })
    it("Tenant Signature from Unauthorized address", async function () {
        const HousingRental = await ethers.getContractFactory("HousingRental")

        const contractRental = await HousingRental.deploy(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
        await contractRental.deployed()
        await createListing(contractRental)
        await createProposal(contractRental)
        await acceptProposal(contractRental)
        let err1
        try {
            await tenantSignUnauth(contractRental)
        } catch (err) {
            err1 = err
        } finally {
            assert.exists(err1)
        }
    })
    it("Witness Signature from Unauthorized address", async function () {
        const HousingRental = await ethers.getContractFactory("HousingRental")

        const contractRental = await HousingRental.deploy(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
        await contractRental.deployed()
        await createListing(contractRental)
        await createProposal(contractRental)
        await acceptProposal(contractRental)
        await tenantSign(contractRental)
        let err1
        try {
            await witnessSignUnauth(contractRental)
        } catch (err) {
            err1 = err
        } finally {
            assert.exists(err1)
        }
    })
    it("Witness Signature", async function () {
        const HousingRental = await ethers.getContractFactory("HousingRental")

        const contractRental = await HousingRental.deploy(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
        await contractRental.deployed()
        await createListing(contractRental)
        await createProposal(contractRental)
        await acceptProposal(contractRental)
        await tenantSign(contractRental)
        await witnessSign(contractRental)
        expect((await contractRental.rentalData("0")).resolverSign).to.equal("witnessSign")
    })
    it("Start Agreement Before Agreed Day", async function () {
        const HousingRental = await ethers.getContractFactory("HousingRental")

        const contractRental = await HousingRental.deploy(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
        await contractRental.deployed()
        await createListing(contractRental)
        await createProposal(contractRental)
        await acceptProposalLate(contractRental)
        await tenantSign(contractRental)
        await witnessSign(contractRental)
        let err1
        try {
            await startAgreement(contractRental)
        } catch (err) {
            err1 = err
        } finally {
            assert.exists(err1)
        }
    })
    it("Start Agreement", async function () {
        const HousingRental = await ethers.getContractFactory("HousingRental")

        const contractRental = await HousingRental.deploy(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
        await contractRental.deployed()
        await createListing(contractRental)
        await createProposal(contractRental)
        await acceptProposal(contractRental)
        await tenantSign(contractRental)
        await witnessSign(contractRental)
        await startAgreement(contractRental)
        expect((await contractRental.rentalData("0")).status).to.equal(2)
    })

    it("Paying Rent", async function () {
        const HousingRental = await ethers.getContractFactory("HousingRental")

        const contractRental = await HousingRental.deploy(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
        await contractRental.deployed()
        await createListing(contractRental)
        await createProposal(contractRental)
        await acceptProposal(contractRental)
        await tenantSign(contractRental)
        await witnessSign(contractRental)
        await startAgreement(contractRental)
        await payRent(contractRental)
        expect((await contractRental.getPaymentData("0")).amountToBePaid[0]).to.equal(
            ethers.utils.parseUnits("0")
        )
    })
    it("Paying Rent from Unauthorized", async function () {
        const HousingRental = await ethers.getContractFactory("HousingRental")

        const contractRental = await HousingRental.deploy(
            "0xa546258f790eDe416DfB434Db017e73f3A2D3173"
        )
        await contractRental.deployed()
        await createListing(contractRental)
        await createProposal(contractRental)
        await acceptProposal(contractRental)
        await tenantSign(contractRental)
        await witnessSign(contractRental)
        await startAgreement(contractRental)
        let err1
        try {
            await payRentUnauth(contractRental)
        } catch (err) {
            err1 = err
        } finally {
            assert.exists(err1)
        }
    })
})
