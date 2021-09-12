import EXCHANGEABI from "../../../../abis/Exchange.json";
import { connectToDatabase } from "../../../../lib/mongodb";
import { ethers } from "ethers";
import { orderHashUtils } from "@0x/order-utils";

const EXCHANGE_ADDRESS = "0x1f98206be961f98d0c2d2e5f7d965244b2f2129a";

export default async (req, res) => {
    const { db } = await connectToDatabase();
    const orders = await db
        .collection("orders")
        .find(req.query)
        .toArray();
    const apiOrders = []

    var provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
    var collection = new ethers.Contract(
        EXCHANGE_ADDRESS,
        EXCHANGEABI,
        provider
    );

    for (let i = 0; i < orders.length; i++) {
        var isCancelled = await collection.cancelled(orderHashUtils.getOrderHash(orders[i]));
        var isFilled = await collection.filled(orderHashUtils.getOrderHash(orders[i]));

        if (!isCancelled && isFilled.toNumber() === 0) {
            delete orders[i]._id;
            delete orders[i].signature;
            apiOrders.push({ order: orders[i], metaData: {} });
        }
    }

    res.json({
        total: apiOrders.length,
        page: 1,
        perPage: apiOrders.length,
        records: apiOrders
    });
};