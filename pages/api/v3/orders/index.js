import { connectToDatabase } from "../../../../lib/mongodb";

export default async (req, res) => {
    const { db } = await connectToDatabase();
    const { makerAddress } = req.query
    const orders = await db
        .collection("orders")
        .find(makerAddress ? { makerAddress: makerAddress } : {})
        .toArray();
    res.json(orders);
};