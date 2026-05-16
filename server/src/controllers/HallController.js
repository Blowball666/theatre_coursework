const pool = require('../config/database');

class HallController {
  async getFull(req, res) {
    try {
      const halls = await pool.query(`SELECT * FROM halls ORDER BY id`);

      const result = await Promise.all(halls.rows.map(async hall => {
        const sections = await pool.query(
          `SELECT * FROM sections WHERE hall_id = $1 ORDER BY id`, [hall.id]
        );

        const sectionsWithRows = await Promise.all(sections.rows.map(async sec => {
          const rows = await pool.query(`
            SELECT sr.id, sr.number_in_section AS number, sr.surcharge,
                   COUNT(s.id) AS seat_count
            FROM seat_rows sr
            LEFT JOIN seats s ON s.row_id = sr.id
            WHERE sr.section_id = $1
            GROUP BY sr.id
            ORDER BY sr.number_in_section
          `, [sec.id]);
          return { ...sec, rows: rows.rows };
        }));

        const totalSeats = await pool.query(`
          SELECT COUNT(s.id) AS total
          FROM seats s
          JOIN seat_rows sr ON sr.id = s.row_id
          JOIN sections sec ON sec.id = sr.section_id
          WHERE sec.hall_id = $1
        `, [hall.id]);

        return {
          ...hall,
          sections: sectionsWithRows,
          total_seats: parseInt(totalSeats.rows[0].total),
        };
      }));

      res.json({ success: true, data: result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}

module.exports = new HallController();