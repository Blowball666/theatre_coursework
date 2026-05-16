const PerformanceModel = require('../models/PerformanceModel');

class PerformanceController {
  async getById(req, res) {
    try {
      const perf = await PerformanceModel.getById(parseInt(req.params.id));
      if (!perf) return res.status(404).json({ success: false, message: 'Performance not found' });
      res.json({ success: true, data: perf });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getSeats(req, res) {
    try {
      const seats = await PerformanceModel.getSeatsAvailability(parseInt(req.params.id));
      res.json({ success: true, data: seats });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getAll(req, res) {
    try {
      const performances = await PerformanceModel.findAll();
      res.json({ success: true, data: performances });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async create(req, res) {
    try {
      const perf = await PerformanceModel.create(req.body);
      res.status(201).json({ success: true, data: perf });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async update(req, res) {
    try {
      const perf = await PerformanceModel.update(parseInt(req.params.id), req.body);
      if (!perf) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: perf });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async delete(req, res) {
    try {
      const perf = await PerformanceModel.delete(parseInt(req.params.id));
      if (!perf) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: perf });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}

module.exports = new PerformanceController();
