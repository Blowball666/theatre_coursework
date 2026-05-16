const pool = require('../config/database');

class AdminController {

  async getShows(req, res) {
    try {
      const { rows } = await pool.query(`SELECT id, name, description, price, age_rating, photo FROM shows ORDER BY id`);
      const data = rows.map(row => ({
        ...row,
        photo: row.photo ? row.photo.toString('base64') : null,
      }));
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateShow(req, res) {
    try {
      const { id } = req.params;
      const { name, description, price, age_rating } = req.body;
      await pool.query(
        `UPDATE shows SET name=$1, description=$2, price=$3, age_rating=$4 WHERE id=$5`,
        [name, description, price, age_rating, id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateShowPhoto(req, res) {
    try {
      const { id } = req.params;
      const { photo } = req.body; // base64
      await pool.query(`UPDATE shows SET photo=$1 WHERE id=$2`, [Buffer.from(photo, 'base64'), id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteShowPhoto(req, res) {
    try {
      const { id } = req.params;
      await pool.query(`UPDATE shows SET photo=NULL WHERE id=$1`, [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteShow(req, res) {
    try {
      const { id } = req.params;
      await pool.query(`DELETE FROM shows WHERE id=$1`, [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async createShow(req, res) {
    try {
      const { name, description, price, age_rating } = req.body;
      const result = await pool.query(
        `INSERT INTO shows (name, description, price, age_rating) VALUES ($1,$2,$3,$4) RETURNING id`,
        [name, description, price, age_rating]
      );
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getPerformances(req, res) {
    try {
      const result = await pool.query(`
        SELECT p.id, p.date, p.time, p.show_id,
               s.name AS show_name,
               h.id AS hall_id, h.name AS hall_name,
               COALESCE(json_agg(DISTINCT jsonb_build_object('id', a.id, 'last_name', a.last_name, 'first_name', a.first_name))
                 FILTER (WHERE a.id IS NOT NULL), '[]') AS actors
        FROM performances p
        JOIN shows s ON s.id = p.show_id
        LEFT JOIN performance_halls ph ON ph.performance_id = p.id
        LEFT JOIN halls h ON h.id = ph.hall_id
        LEFT JOIN performance_actors pa ON pa.performance_id = p.id
        LEFT JOIN actors a ON a.id = pa.actor_id
        GROUP BY p.id, s.name, h.id, h.name
        ORDER BY p.date DESC, p.time
      `);
      res.json({ success: true, data: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async createPerformance(req, res) {
    const client = await pool.connect();
    try {
      const { date, time, show_id, hall_id, actor_ids = [] } = req.body;
      await client.query('BEGIN');
      const p = await client.query(
        `INSERT INTO performances (date, time, show_id) VALUES ($1,$2,$3) RETURNING id`,
        [date, time, show_id]
      );
      const pid = p.rows[0].id;
      if (hall_id) await client.query(`INSERT INTO performance_halls (hall_id, performance_id) VALUES ($1,$2)`, [hall_id, pid]);
      for (const aid of actor_ids) {
        await client.query(`INSERT INTO performance_actors (performance_id, actor_id) VALUES ($1,$2)`, [pid, aid]);
      }
      await client.query('COMMIT');
      res.json({ success: true, data: { id: pid } });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ success: false, message: err.message });
    } finally {
      client.release();
    }
  }

  async updatePerformance(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { date, time, show_id, hall_id, actor_ids = [] } = req.body;
      await client.query('BEGIN');
      await client.query(`UPDATE performances SET date=$1, time=$2, show_id=$3 WHERE id=$4`, [date, time, show_id, id]);
      await client.query(`DELETE FROM performance_halls WHERE performance_id=$1`, [id]);
      await client.query(`DELETE FROM performance_actors WHERE performance_id=$1`, [id]);
      if (hall_id) await client.query(`INSERT INTO performance_halls (hall_id, performance_id) VALUES ($1,$2)`, [hall_id, id]);
      for (const aid of actor_ids) {
        await client.query(`INSERT INTO performance_actors (performance_id, actor_id) VALUES ($1,$2)`, [id, aid]);
      }
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ success: false, message: err.message });
    } finally {
      client.release();
    }
  }

  async deletePerformance(req, res) {
    try {
      await pool.query(`DELETE FROM performances WHERE id=$1`, [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getActors(req, res) {
    try {
      const result = await pool.query(`SELECT * FROM actors ORDER BY last_name`);
      res.json({ success: true, data: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async createActor(req, res) {
    try {
      const { last_name, first_name, middle_name } = req.body;
      const result = await pool.query(
        `INSERT INTO actors (last_name, first_name, middle_name) VALUES ($1,$2,$3) RETURNING *`,
        [last_name, first_name, middle_name]
      );
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateActor(req, res) {
    try {
      const { id } = req.params;
      const { last_name, first_name, middle_name } = req.body;
      await pool.query(
        `UPDATE actors SET last_name=$1, first_name=$2, middle_name=$3 WHERE id=$4`,
        [last_name, first_name, middle_name, id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteActor(req, res) {
    try {
      await pool.query(`DELETE FROM actors WHERE id=$1`, [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getHalls(req, res) {
    try {
      const result = await pool.query(`SELECT * FROM halls ORDER BY id`);
      res.json({ success: true, data: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AdminController();