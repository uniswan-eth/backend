import { HttpClient } from "@0x/connect";
import { assetDataUtils } from "@0x/order-utils";
import { BigNumber } from "@0x/utils";

const DB_BASE_URL = "https://uns-backend.vercel.app/api/v3";
const MAX_ORDERS = 4;

var possibleFinalPools = new Set();

// "With my `bundle` of assets, and an orderbook of `orders`, what are all the possible asset bundles I can end up with?"
function stateTransition(startingAssetData, orders, executedOrders) {
    var options = []
    for (let i = 0; i < orders.length; i++) {
        const takerAssetsDecoded = assetDataUtils.decodeAssetDataOrThrow(
            orders[i].takerAssetData
        );

        const ourAssetsDecoded = assetDataUtils.decodeAssetDataOrThrow(
            startingAssetData
        );

        // Loop through all the assets wished for by the offer, and remove them from our asset pool
        var orderFillable = true;
        for (let j = 0; j < takerAssetsDecoded.nestedAssetData.length; j++) {
            const index = ourAssetsDecoded.nestedAssetData.indexOf(takerAssetsDecoded.nestedAssetData[j]);
            // If we have some of this asset, try and fill the order.
            if (index > -1) {
                ourAssetsDecoded.amounts[index] = ourAssetsDecoded.amounts[index].minus(takerAssetsDecoded.amounts[j]);
                if (ourAssetsDecoded.amounts[index].toNumber() < 0) {
                    orderFillable = false;
                    break;
                }
            } else {
                orderFillable = false;
                break;
            }
        }

        if (orderFillable) {
            const makerAssetsDecoded = assetDataUtils.decodeAssetDataOrThrow(
                orders[i].makerAssetData
            );

            // Loop through all the assets given in exchange by the offer, and add them to our asset pool
            for (let j = 0; j < makerAssetsDecoded.nestedAssetData.length; j++) {
                var index = ourAssetsDecoded.nestedAssetData.indexOf(makerAssetsDecoded.nestedAssetData[j]);
                // If we don't already have some of this asset...
                if (index === -1) {
                    // Add it to our list
                    index = ourAssetsDecoded.nestedAssetData.length;
                    ourAssetsDecoded.nestedAssetData.push(makerAssetsDecoded.nestedAssetData[j]);
                    ourAssetsDecoded.amounts.push(new BigNumber(0));
                }
                ourAssetsDecoded.amounts[index] = ourAssetsDecoded.amounts[index].plus(makerAssetsDecoded.amounts[j]);
            }

            const newOurAssetsEncoded = assetDataUtils.encodeMultiAssetData(
                ourAssetsDecoded.amounts,
                ourAssetsDecoded.nestedAssetData
            );

            if (!possibleFinalPools.has(newOurAssetsEncoded)) {
                possibleFinalPools.add(newOurAssetsEncoded);

                const newExecutedOrders = [...executedOrders, orders[i]]
                options.push(newExecutedOrders);

                const ordersNew = orders.slice();
                ordersNew.splice(i, 1);

                if (newExecutedOrders.length < MAX_ORDERS) options.push(...stateTransition(newOurAssetsEncoded, ordersNew, newExecutedOrders));
            }
        }
    }
    return options;
}

export default async (req, res) => {
    const { assetData } = req.query;

    possibleFinalPools = new Set();
    possibleFinalPools.add(assetData);

    const orderClient = new HttpClient(DB_BASE_URL);
    const json = await orderClient.getOrdersAsync();
    const orders = json.records.map((r) => r.order);

    const options = stateTransition(assetData, orders, [])

    res.json(options);
};
