import { Router } from "express";
import passport from "passport";
import { register, login, status, logout, setup2FA, verify2FA, reset2FA } from "../controller/authController.js";

const router = Router();

//Rgisteration Route
router.post('/register',register);

// Login Route
router.post('/login',passport.authenticate("local"),login);
// router.post('/login',login);
// //Auth Status Route
router.get('/status',status);

export default router;