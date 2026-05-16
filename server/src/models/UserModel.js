const BaseModel = require('./BaseModel');

class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    const result = await this.pool.query(
      `SELECT u.*, r.name AS role_name 
       FROM users u 
       LEFT JOIN roles r ON r.id = u.role_id 
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  async findByIdWithRole(id) {
    const result = await this.pool.query(
      `SELECT u.id, u.last_name, u.first_name, u.middle_name, u.email, u.date_of_birth, r.name AS role_name
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getOrderHistory(userId) {
  const result = await this.pool.query(`
    SELECT 
      o.id AS order_id,
      o.created_at,
      o.payment_status,
      json_agg(DISTINCT jsonb_build_object(
        'ticket_id', t.id,
        'performance_id', t.performance_id,
        'show_name', s.name,
        'description', s.description,
        'age_rating', s.age_rating,
        'photo', encode(s.photo, 'base64'),
        'date', p.date,
        'time', p.time,
        'seat_id', t.seat_id
      )) AS tickets
    FROM orders o
    JOIN tickets t ON t.order_id = o.id
    JOIN performances p ON p.id = t.performance_id
    JOIN shows s ON s.id = p.show_id
    WHERE o.user_id = $1
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `, [userId]);
  return result.rows;
}

  async updateProfile(userId, { last_name, first_name, middle_name, email, date_of_birth, password }) {
    const bcrypt = require('bcrypt');
    const fields = [];
    const values = [];
    let idx = 1;
    
    if (last_name)    { fields.push(`last_name=$${idx++}`);    values.push(last_name); }
    if (first_name)   { fields.push(`first_name=$${idx++}`);   values.push(first_name); }
    if (middle_name !== undefined) { fields.push(`middle_name=$${idx++}`); values.push(middle_name || null); }
    if (email)        { fields.push(`email=$${idx++}`);        values.push(email); }
    if (date_of_birth){ fields.push(`date_of_birth=$${idx++}`);values.push(date_of_birth); }
    if (password)     {
      const hash = await bcrypt.hash(password, 12);
      fields.push(`password=$${idx++}`);
      values.push(hash);
    }
  
    if (!fields.length) return null;
    values.push(userId);
    const result = await this.pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id=$${idx} RETURNING id, last_name, first_name, middle_name, email, date_of_birth`,
      values
    );
    return result.rows[0];
  }
}

module.exports = new UserModel();
