const pool = require('../config/database');

class CashierController {
  async getSoldTickets(req, res) {
    try {
      const { period = 'today' } = req.query;

      let dateFilter = '';
      if (period === 'today')     dateFilter = `AND DATE(o.created_at) = CURRENT_DATE`;
      if (period === 'yesterday') dateFilter = `AND DATE(o.created_at) = CURRENT_DATE - 1`;
      if (period === 'week')      dateFilter = `AND o.created_at >= NOW() - INTERVAL '7 days'`;
      if (period === 'month')     dateFilter = `AND o.created_at >= NOW() - INTERVAL '30 days'`;

      const result = await pool.query(`
        SELECT
          t.id AS ticket_id,
          t.seat_id,
          o.id AS order_id,
          o.created_at,
          o.payment_status,
          s.name AS show_name,
          s.description,
          s.age_rating,
          s.price,
          encode(s.photo, 'base64') AS photo,
          p.date AS perf_date,
          p.time AS perf_time,
          u.last_name || ' ' || u.first_name || ' ' || COALESCE(u.middle_name, '') AS buyer
        FROM tickets t
        JOIN orders o ON o.id = t.order_id
        JOIN performances p ON p.id = t.performance_id
        JOIN shows s ON s.id = p.show_id
        JOIN users u ON u.id = o.user_id
        WHERE 1=1 ${dateFilter}
        ORDER BY o.created_at DESC
      `);

      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async findUser(req, res) {
    try {
      const { email } = req.query;
      if (!email) return res.status(400).json({ success: false, message: 'Email required' });
      const result = await pool.query(`SELECT id, last_name, first_name, email FROM users WHERE email = $1`, [email]);
      if (!result.rows.length) return res.status(404).json({ success: false, message: 'Пользователь не найден' });
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new CashierController();