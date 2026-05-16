const BaseModel = require('./BaseModel');

class PerformanceModel extends BaseModel {
  constructor() {
    super('performances');
  }

  async getById(id) {
    const result = await this.pool.query(`
      SELECT 
        p.id, p.date, p.time, p.show_id,
        s.name AS show_name, s.description, s.price, s.age_rating,
        h.name AS hall_name, h.id AS hall_id
      FROM performances p
      JOIN shows s ON s.id = p.show_id
      LEFT JOIN performance_halls ph ON ph.performance_id = p.id
      LEFT JOIN halls h ON h.id = ph.hall_id
      WHERE p.id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  async getSeatsAvailability(performanceId) {
    const result = await this.pool.query(`
      SELECT 
        s.id AS seat_id,
        s.number_in_row,
        sr.id AS row_id,
        sr.number_in_section,
        sr.surcharge,
        sec.id AS section_id,
        sec.type AS section_type,
        h.id AS hall_id,
        h.name AS hall_name,
        CASE WHEN t.id IS NOT NULL THEN true ELSE false END AS is_taken
      FROM seats s
      JOIN seat_rows sr ON sr.id = s.row_id
      JOIN sections sec ON sec.id = sr.section_id
      JOIN halls h ON h.id = sec.hall_id
      JOIN performance_halls ph ON ph.hall_id = h.id AND ph.performance_id = $1
      LEFT JOIN tickets t ON t.seat_id = s.id AND t.performance_id = $1
      ORDER BY sec.id, sr.number_in_section, s.number_in_row
    `, [performanceId]);
    return result.rows;
  }
}

module.exports = new PerformanceModel();
