import EXCHANGEABI from "../../../../abis/Exchange.json";
import { connectToDatabase } from "../../../../lib/mongodb";
import { ethers } from "ethers";

const EXCHANGE_ADDRESS = "0x1f98206be961f98d0c2d2e5f7d965244b2f2129a";

export default async (req, res) => {
    const { db } = await connectToDatabase();
    const page = req.query.page || 1;
    const perPage = req.query.perPage || 10;

    const orders = await db
        .collection("orders")
        .find(req.query)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray();

    const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
    const collection = new ethers.Contract(
        EXCHANGE_ADDRESS,
        EXCHANGEABI,
        provider
    );

    var validOrders = []
    await Promise.all(
        orders.map(async (order) => {
            const orderInfo = await collection.getOrderInfo(order);

            if (orderInfo.orderStatus === 3) {
                validOrders.push({ order: order, metaData: {} });
            } else {
                await db
                    .collection("orders")
                    .remove(order);
            }
        })
    )

    res.json({
        total: await db
            .collection("orders")
            .count(),
        page: page,
        perPage: perPage,
        records: validOrders
    });
};