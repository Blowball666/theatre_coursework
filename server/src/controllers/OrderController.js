const OrderModel = require('../models/OrderModel');

class OrderController {
  async createOrder(req, res) {
    try {
      const { userId, performanceId, seatIds } = req.body;
      if (!userId || !performanceId || !seatIds || !seatIds.length)
        return res.status(400).json({ success: false, message: 'userId, performanceId and seatIds required' });

      const order = await OrderModel.createWithTickets(userId, performanceId, seatIds);
      res.status(201).json({ success: true, data: order });
    } catch (err) {
      console.error(err);
      if (err.message === 'Some seats are already taken')
        return res.status(409).json({ success: false, message: err.message });
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const validStatuses = ['Ожидает оплаты', 'Оплачен', 'Отменён', 'Возврат средств'];
      if (!validStatuses.includes(status))
        return res.status(400).json({ success: false, message: 'Invalid status' });

      const order = await OrderModel.updateStatus(parseInt(id), status);
      res.json({ success: true, data: order });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}

module.exports = new OrderController();
