const BaseModel = require('./BaseModel');

class ShowModel extends BaseModel {
  constructor() {
    super('shows');
  }

  async getTodayShows() {
    const result = await this.pool.query(`
      SELECT s.id, s.name, s.description, s.price, s.age_rating, s.photo,
          MIN(p.time) AS next_time
      FROM shows s
      JOIN performances p ON p.show_id = s.id
      WHERE p.date = CURRENT_DATE
      GROUP BY s.id
      ORDER BY MIN(p.time)
    `);
    return result.rows.map(row => ({
      ...row,
      photo: row.photo ? row.photo.toString('base64') : null,
    }));
  }

  async getAfisha({ limit = 20, offset = 0, dateFrom } = {}) {
    let where;
    const params = [];
    let idx = 1;

    if (dateFrom) {
      params.push(dateFrom);
      where = `WHERE p.date = $${idx++}`;
    } else {
      where = `WHERE p.date >= CURRENT_DATE`;
    }

    params.push(limit, offset);

    const result = await this.pool.query(`
      SELECT 
        p.id AS performance_id,
        p.date,
        p.time,
        s.id AS show_id,
        s.name,
        s.description,
        s.price,
        s.age_rating,
        s.photo,
        h.name AS hall_name,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', a.id, 'last_name', a.last_name, 'first_name', a.first_name))
          FILTER (WHERE a.id IS NOT NULL), '[]'
        ) AS actors
      FROM performances p
      JOIN shows s ON s.id = p.show_id
      LEFT JOIN performance_halls ph ON ph.performance_id = p.id
      LEFT JOIN halls h ON h.id = ph.hall_id
      LEFT JOIN performance_actors pa ON pa.performance_id = p.id
      LEFT JOIN actors a ON a.id = pa.actor_id
      ${where}
      GROUP BY p.id, p.date, p.time, s.id, s.name, s.description, s.price, s.age_rating, h.name
      ORDER BY p.date ASC, p.time ASC
      LIMIT $${idx++} OFFSET $${idx++}
    `, params);

    return result.rows.map(row => ({
      ...row,
      photo: row.photo ? row.photo.toString('base64') : null,
    }));
  }

  async getShowWithPerformances(showId) {
    const show = await this.findById(showId);
    if (!show) return null;

    const perfResult = await this.pool.query(`
      SELECT p.id, p.date, p.time, h.name AS hall_name
      FROM performances p
      LEFT JOIN performance_halls ph ON ph.performance_id = p.id
      LEFT JOIN halls h ON h.id = ph.hall_id
      WHERE p.show_id = $1 AND p.date >= CURRENT_DATE
      ORDER BY p.date, p.time
    `, [showId]);

    return {
      ...show,
      photo: show.photo ? show.photo.toString('base64') : null,
      performances: perfResult.rows,
    };
  }
}

module.exports = new ShowModel();
