import { connectToDatabase } from "../../../../lib/mongodb";

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



    var validOrders = [];
    await Promise.all(
        orders.map(async (order) => {
            validOrders.push({ order: order, metaData: {} });

        })
    );

    res.json({
        total: await db
            .collection("orders")
            .find(req.query)
            .count(),
        page: page,
        perPage: perPage,
        records: validOrders
    });
};