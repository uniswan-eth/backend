import { connectToDatabase } from "../../../lib/mongodb";
import { assetDataUtils } from "@0x/order-utils";

const MAX_ORDERS = 6;

// "With a given `bundle` of assets, and an orderbook of `signedOrders`, what are all the possible assets I can end up with?"
function stateTransition(bundle, signedOrders, executedSignedOrders) {
    var options = []
    for (let i = 0; i < signedOrders.length; i++) {
        const orderDecoded = assetDataUtils.decodeMultiAssetData(
            signedOrders[i].order.takerAssetData
        );

        const bundleDecoded = assetDataUtils.decodeMultiAssetData(
            bundle
        );

        var orderFillable = true;
        var newBundleDecoded = bundleDecoded; // make sure this isn't by reference
        for (let j = 0; j < orderDecoded.nestedAssetData.length; j++) {
            const index = newBundleDecoded.nestedAssetData.indexOf(orderDecoded.nestedAssetData[j]);
            if (index > -1) {
                newBundleDecoded.nestedAssetData.splice(index, 1);
                newBundleDecoded.amounts.splice(index, 1)
            } else {
                orderFillable = false;
                break;
            }
        }

        if (orderFillable) {
            const newBundleEncoded = assetDataUtils.encodeMultiAssetData(
                newBundleDecoded.amounts,
                newBundleDecoded.nestedAssetData
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
