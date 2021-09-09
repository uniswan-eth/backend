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
        apiOrders.push({ signedOrder: orders[i], metadata: {} })
    }
    res.json(apiOrders);
};