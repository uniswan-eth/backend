import { connectToDatabase } from "../../../../lib/mongodb";

export default async (req, res) => {
    const { db } = await connectToDatabase();
    const page = req.query.page || 1;
    const perPage = req.query.perPage || 10;

    const orderTable = await db
        .collection("orders")
        .find(req.query);

    var orders = await orderTable
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray();


    var validOrders = orders.map((order) => {
        return { order: order, metaData: {} };
    })

    res.json({
        total: await orderTable.count(),
        page: page,
        perPage: perPage,
        records: validOrders
    });
};