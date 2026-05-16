const UserModel = require('../models/UserModel');
const bcrypt = require('bcrypt');

class AuthController {
  async updateProfile(req, res) {
  try {
    const { userId } = req.params;
    const user = await UserModel.updateProfile(parseInt(userId), req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({ success: false, message: 'Email and password required' });

      const user = await UserModel.findByEmail(email);
      if (!user)
        return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid)
        return res.status(401).json({ success: false, message: 'Invalid credentials' });

      req.session = req.session || {};
      
      const { password: _, ...safeUser } = user;
      res.json({ success: true, data: safeUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async register(req, res) {
    try {
      const { last_name, first_name, middle_name, email, password, date_of_birth } = req.body;
      
      const existing = await UserModel.findByEmail(email);
      if (existing)
        return res.status(409).json({ success: false, message: 'Email already registered' });

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await UserModel.create({
        last_name, first_name, middle_name, email,
        password: hashedPassword,
        date_of_birth: date_of_birth || null,
        role_id: 3
      });

      const { password: _, ...safeUser } = user;
      res.status(201).json({ success: true, data: safeUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.query.userId;
      if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
      
      const user = await UserModel.findByIdWithRole(parseInt(userId));
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      
      res.json({ success: true, data: user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getOrderHistory(req, res) {
    try {
      const { userId } = req.params;
      const orders = await UserModel.getOrderHistory(parseInt(userId));
      res.json({ success: true, data: orders });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}

module.exports = new AuthController();
