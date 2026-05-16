const express = require('express');
const router = express.Router();
const HallController = require('../controllers/HallController');
const ShowController = require('../controllers/ShowController');
const PerformanceController = require('../controllers/PerformanceController');
const AuthController = require('../controllers/AuthController');
const OrderController = require('../controllers/OrderController');
const AdminController = require('../controllers/AdminController');

// Shows
router.get('/shows/today', ShowController.getTodayShows.bind(ShowController));
router.get('/shows/afisha', ShowController.getAfisha.bind(ShowController));
router.get('/shows', ShowController.getAllShows.bind(ShowController));
router.get('/shows/:id', ShowController.getShowById.bind(ShowController));
router.post('/shows', ShowController.createShow.bind(ShowController));
router.put('/shows/:id', ShowController.updateShow.bind(ShowController));
router.delete('/shows/:id', ShowController.deleteShow.bind(ShowController));

// Performances
router.get('/performances', PerformanceController.getAll.bind(PerformanceController));

router.get('/performances/:id', PerformanceController.getById.bind(PerformanceController));
router.get('/performances/:id/seats', PerformanceController.getSeats.bind(PerformanceController));
router.post('/performances', PerformanceController.create.bind(PerformanceController));
router.put('/performances/:id', PerformanceController.update.bind(PerformanceController));
router.delete('/performances/:id', PerformanceController.delete.bind(PerformanceController));

// Auth / Users
router.post('/auth/login', AuthController.login.bind(AuthController));
router.post('/auth/register', AuthController.register.bind(AuthController));
router.get('/auth/profile', AuthController.getProfile.bind(AuthController));
router.get('/users/:userId/orders', AuthController.getOrderHistory.bind(AuthController));
router.put('/users/:userId/profile', AuthController.updateProfile.bind(AuthController));

// Orders
router.post('/orders', OrderController.createOrder.bind(OrderController));
router.put('/orders/:id/status', OrderController.updateStatus.bind(OrderController));
router.get('/halls-full', HallController.getFull.bind(HallController));

// Admin
router.get('/admin/shows', AdminController.getShows.bind(AdminController));
router.post('/admin/shows', AdminController.createShow.bind(AdminController));
router.put('/admin/shows/:id', AdminController.updateShow.bind(AdminController));
router.put('/admin/shows/:id/photo', AdminController.updateShowPhoto.bind(AdminController));
router.delete('/admin/shows/:id/photo', AdminController.deleteShowPhoto.bind(AdminController));
router.delete('/admin/shows/:id', AdminController.deleteShow.bind(AdminController));

router.get('/admin/performances', AdminController.getPerformances.bind(AdminController));
router.post('/admin/performances', AdminController.createPerformance.bind(AdminController));
router.put('/admin/performances/:id', AdminController.updatePerformance.bind(AdminController));
router.delete('/admin/performances/:id', AdminController.deletePerformance.bind(AdminController));

router.get('/admin/actors', AdminController.getActors.bind(AdminController));
router.post('/admin/actors', AdminController.createActor.bind(AdminController));
router.put('/admin/actors/:id', AdminController.updateActor.bind(AdminController));
router.delete('/admin/actors/:id', AdminController.deleteActor.bind(AdminController));

router.get('/admin/halls', AdminController.getHalls.bind(AdminController));

const CashierController = require('../controllers/CashierController');

router.get('/cashier/tickets', CashierController.getSoldTickets.bind(CashierController));
router.get('/cashier/find-user', CashierController.findUser.bind(CashierController));

module.exports = router;
