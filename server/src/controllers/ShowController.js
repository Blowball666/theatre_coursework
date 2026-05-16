const ShowModel = require('../models/ShowModel');

class ShowController {
  async getTodayShows(req, res) {
    try {
      const shows = await ShowModel.getTodayShows();
      res.json({ success: true, data: shows });
    } catch (err) {
      console.error('getTodayShows error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getAfisha(req, res) {
  try {
    const { limit = 20, offset = 0, dateFrom } = req.query;
    const data = await ShowModel.getAfisha({
      limit: parseInt(limit),
      offset: parseInt(offset),
      dateFrom: dateFrom || null,
    });
      res.json({ success: true, data });
    } catch (err) {
      console.error('getAfisha error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getShowById(req, res) {
    try {
      const { id } = req.params;
      const show = await ShowModel.getShowWithPerformances(parseInt(id));
      if (!show) return res.status(404).json({ success: false, message: 'Show not found' });
      res.json({ success: true, data: show });
    } catch (err) {
      console.error('getShowById error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getAllShows(req, res) {
    try {
      const shows = await ShowModel.findAll();
      res.json({ success: true, data: shows });
    } catch (err) {
      console.error('getAllShows error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async createShow(req, res) {
    try {
      const show = await ShowModel.create(req.body);
      res.status(201).json({ success: true, data: show });
    } catch (err) {
      console.error('createShow error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async updateShow(req, res) {
    try {
      const { id } = req.params;
      const show = await ShowModel.update(parseInt(id), req.body);
      if (!show) return res.status(404).json({ success: false, message: 'Show not found' });
      res.json({ success: true, data: show });
    } catch (err) {
      console.error('updateShow error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async deleteShow(req, res) {
    try {
      const { id } = req.params;
      const show = await ShowModel.delete(parseInt(id));
      if (!show) return res.status(404).json({ success: false, message: 'Show not found' });
      res.json({ success: true, data: show });
    } catch (err) {
      console.error('deleteShow error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}

module.exports = new ShowController();
