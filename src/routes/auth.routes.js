const express = require('express');
const router = express.Router();
const AuthCOntroller = require('../controllers/auth.controller');

router.post('/login', (req, res) => AuthCOntroller.login(req, res));

module.exports = router;
