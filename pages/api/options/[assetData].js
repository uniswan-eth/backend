import { connectToDatabase } from "../../../lib/mongodb";
import { assetDataUtils } from "@0x/order-utils";

const MAX_ORDERS = 6;

// "With a given `bundle` of assets, and an orderbook of `signedOrders`, what are all the possible assets I can end up with?"
function stateTransition(startingAssetData, signedOrders, executedSignedOrders) {
    var options = []
    for (let i = 0; i < signedOrders.length; i++) {
        const takerAssetsDecoded = assetDataUtils.decodeMultiAssetData(
            signedOrders[i].order.takerAssetData
        );

        const startingDecoded = assetDataUtils.decodeMultiAssetData(
            startingAssetData
        );

        // Loop through all the assets wished for by the offer, and remove them from our asset pool
        var orderFillable = true;
        for (let j = 0; j < takerAssetsDecoded.nestedAssetData.length; j++) {
            const index = startingDecoded.nestedAssetData.indexOf(takerAssetsDecoded.nestedAssetData[j]);
            // If we have some of this asset...
            if (index > -1) {
                // Try to fill the order.
                startingDecoded.amounts[index] -= takerAssetsDecoded.amounts[i]
                if (startingDecoded.amounts[index] < 0) {
                    orderFillable = false;
                    break;
                }
            }
        }

        const makerAssetsDecoded = assetDataUtils.decodeMultiAssetData(
            signedOrders[i].order.takerAssetData
        );
        // Loop through all the assets given in exchange by the offer, and add them to our asset pool
        for (let j = 0; j < makerAssetsDecoded.nestedAssetData.length; j++) {
            var index = startingDecoded.nestedAssetData.indexOf(makerAssetsDecoded.nestedAssetData[j]);
            // If we don't already have some of this asset...
            if (index === -1) {
                // Add it to our list
                index = startingDecoded.nestedAssetData.length;
                startingDecoded.nestedAssetData.push(makerAssetsDecoded.nestedAssetData[j]);
                startingDecoded.amounts.push(0);
            }
            startingDecoded.amounts[index] += makerAssetsDecoded.amounts[i]
        }

        if (orderFillable) {
            const newBundleEncoded = assetDataUtils.encodeMultiAssetData(
                startingDecoded.amounts,
                startingDecoded.nestedAssetData
            );

            const newExecutedSignedOrders = [...executedSignedOrders, signedOrders[i]]
            options.push(newExecutedSignedOrders);

            const signedOrdersNew = signedOrders.slice();
            signedOrdersNew.splice(i, 1);

            if (newExecutedSignedOrders.length < MAX_ORDERS) options = options.concat(stateTransition(newBundleEncoded, signedOrdersNew, newExecutedSignedOrders));
        }
    }
    return options;
}

export default async (req, res) => {
    const { db } = await connectToDatabase();
    const { assetData } = req.query;

    const signedOrders = await db
        .collection("orders")
        .find({})
        .toArray();

    var options = stateTransition(assetData, signedOrders, [])

    res.json(options);
};
