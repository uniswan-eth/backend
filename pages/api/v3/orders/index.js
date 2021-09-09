import { connectToDatabase } from "../../../../lib/mongodb";

export default async (req, res) => {
    const { db } = await connectToDatabase();
    const orders = await db
        .collection("orders")
        .find(req.query)
        .toArray();
    const apiOrders = []
    for (let i = 0; i < orders.length; i++) {
        delete orders[i]._id;
        delete orders[i].signature
        apiOrders.push({ order: orders[i], metadata: {} })
    }
    res.json({
        total: apiOrders.length,
        page: 1,
        perPage: apiOrders.length,
        records: apiOrders
    });
};