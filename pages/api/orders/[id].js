import { connectToDatabase } from "../../../lib/mongodb";
export default async (req, res) => {
    const { db } = await connectToDatabase();
    const { id } = req.query;
    const orders = await db
        .collection("orders")
        .find({ _id: id })
        .toArray();
    res.json(orders[0]);
};