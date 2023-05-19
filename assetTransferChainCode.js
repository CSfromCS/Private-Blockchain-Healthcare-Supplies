// assetTransfer.js
// Purpose: This file contains the functions for the asset transfer page.

'use strict';

const { Contract } = require('fabric-contract-api');

class SupplyChaincode extends Contract {
    async initLedger(ctx) {
        console.info('Initializing the ledger');
    }

    async _checkClientOrg(ctx, allowedOrgs) {
        const clientMspId = ctx.clientIdentity.getMSPID();
        if (!allowedOrgs.includes(clientMspId)) {
            throw new Error(`Client is not a member of the allowed organizations: ${allowedOrgs.join(', ')}`);
        }
    }

    async createSupplyRecord(ctx, id, item, quantity, date, location) {
        await this._checkClientOrg(ctx, ['Org1MSP']); // Assuming Health Workers belong to Org1MSP
        let supplyRecord = {
            item,
            quantity: parseInt(quantity),
            date,
            location,
            docType: 'supply'
        };
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(supplyRecord)));
        console.info('New supply record created');
    }

    async updateSupplyRecord(ctx, id, newQuantity) {
        await this._checkClientOrg(ctx, ['Org1MSP']); // Assuming Health Workers belong to Org1MSP
        const recordAsBytes = await ctx.stub.getState(id);
        if (!recordAsBytes || recordAsBytes.length === 0) {
            throw new Error(`Supply record with ID ${id} does not exist`);
        }
        const record = JSON.parse(recordAsBytes.toString());
        record.quantity = parseInt(newQuantity);
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(record)));
        console.info('Supply record updated');
    }

    async retrieveSupplyRecord(ctx, id) {
        await this._checkClientOrg(ctx, ['Org1MSP', 'Org2MSP']); // Both Health Workers and Relief Administrators can retrieve
        const recordAsBytes = await ctx.stub.getState(id);
        if (!recordAsBytes || recordAsBytes.length === 0) {
            throw new Error(`Supply record with ID ${id} does not exist`);
        }
        console.info('Supply record retrieved');
        return recordAsBytes.toString();
    }

}
module.exports = SupplyChaincode;



    async retrieveAllSupplyRecords(ctx) {
    const allResults = [];
    // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
    const iterator = await ctx.stub.getStateByRange('', '');
    let result = await iterator.next();
    while (!result.done) {
        const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
        let record;
        try {
            record = JSON.parse(strValue);
        } catch (err) {
            console.log(err);
            record = strValue;
        }
        allResults.push(record);
        result = await iterator.next();
    }
    return JSON.stringify(allResults);
}

