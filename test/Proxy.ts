import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Proxy", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {
    const Proxy = await hre.ethers.getContractFactory("Proxy");
    const proxy = await Proxy.deploy();

    const Logic1 = await hre.ethers.getContractFactory("Logic1");
    const logic1 = await Logic1.deploy();

    const Logic2 = await hre.ethers.getContractFactory("Logic2");
    const logic2 = await Logic2.deploy();

    const [signer] = await hre.ethers.getSigners();

    return { proxy, logic1, logic2, signer };
  }

  async function retrieveChangeXCalldata(x: number) {
    const functionSelector = hre.ethers
      .keccak256(hre.ethers.toUtf8Bytes("changeX(uint256)"))
      .slice(0, 10);
    const abiCoder = new hre.ethers.AbiCoder();
    const encodedParam = abiCoder.encode(["uint256"], [x]).slice(2);

    return functionSelector + encodedParam;
  }

  async function getStorageSlot(address: string, slot: string) {
    return hre.ethers.provider.getStorage(address, slot);
  }

  describe("delegatecall", function () {
    it("expect logic1 to change x", async function () {
      const { proxy, logic1, signer } = await loadFixture(deployContracts);
      let valueInString = await getStorageSlot(await proxy.getAddress(), "0x0");

      let valueInInt = parseInt(valueInString);
      expect(valueInInt).equal(0);

      await proxy.setImplementationAddress(await logic1.getAddress());

      const calldata = await retrieveChangeXCalldata(56);

      const txRequest = {
        to: await proxy.getAddress(),
        data: calldata,
      };
      const txResponse = await signer.sendTransaction(txRequest);

      valueInString = await getStorageSlot(await proxy.getAddress(), "0x0");
      valueInInt = parseInt(valueInString);
      expect(valueInInt).equal(56);
    });

    it("expect logic2 to consume x from the proxy storage", async function () {
      const { proxy, logic1, logic2, signer } = await loadFixture(
        deployContracts
      );
      let valueInString = await getStorageSlot(await proxy.getAddress(), "0x0");
      let valueInInt = parseInt(valueInString);
      await proxy.setImplementationAddress(await logic1.getAddress());
      let calldata = await retrieveChangeXCalldata(56);
      let txRequest = {
        to: await proxy.getAddress(),
        data: calldata,
      };
      let txResponse = await signer.sendTransaction(txRequest);

      await proxy.setImplementationAddress(await logic2.getAddress());
      calldata = await retrieveChangeXCalldata(44);
      txRequest = {
        to: await proxy.getAddress(),
        data: calldata,
      };
      txResponse = await signer.sendTransaction(txRequest);

      valueInString = await getStorageSlot(await proxy.getAddress(), "0x0");
      valueInInt = parseInt(valueInString);
      expect(valueInInt).equal(100);
    });
  });
});
