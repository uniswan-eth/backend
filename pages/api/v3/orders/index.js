import { connectToDatabase } from "../../../../lib/mongodb";

export default async (req, res) => {
    const { db } = await connectToDatabase();
    const orders = await db
        .collection("orders")
        .find(req.query)
        .toArray();
    res.json(orders);
};