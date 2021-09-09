import { connectToDatabase } from "../../../../lib/mongodb";

export default async (req, res) => {
    const { db } = await connectToDatabase();
    const orders = await db
        .collection("orders")
        .find(req.query)
        .toArray();
    for (let i = 0; i < orders.length; i++) {
        delete orders[i]._id;
    }
    res.json(orders);
};