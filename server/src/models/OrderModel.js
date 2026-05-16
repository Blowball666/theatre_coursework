const BaseModel = require('./BaseModel');

class OrderModel extends BaseModel {
  constructor() {
    super('orders');
  }

  async createWithTickets(userId, performanceId, seatIds) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const taken = await client.query(`
        SELECT seat_id FROM tickets 
        WHERE performance_id = $1 AND seat_id = ANY($2::int[])
      `, [performanceId, seatIds]);

      if (taken.rows.length > 0) {
        throw new Error('Some seats are already taken');
      }

      const orderRes = await client.query(
        `INSERT INTO orders (user_id, payment_status) VALUES ($1, 'Ожидает оплаты') RETURNING *`,
        [userId]
      );
      const order = orderRes.rows[0];

      for (const seatId of seatIds) {
        await client.query(
          `INSERT INTO tickets (seat_id, performance_id, order_id) VALUES ($1, $2, $3)`,
          [seatId, performanceId, order.id]
        );
      }

      await client.query('COMMIT');
      return order;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateStatus(orderId, status) {
    return this.update(orderId, { payment_status: status });
  }
}

module.exports = new OrderModel();
