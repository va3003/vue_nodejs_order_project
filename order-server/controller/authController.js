import User from "../models/user.js";
import bcrypt from "bcryptjs";
import passport from "passport-local"
import speakeasy from "speakeasy";
import qrCode from "qrcode";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {

    try {
        const {userId, username, email, password, firstName, lastName, role } = req.body;
        console.log("Trying to register : ", email);
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ userId, username, email, password: hashedPassword, firstName, lastName, role });
        await newUser.save();
        res.status(201).json({ message: "Record created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user : " + error });
        throw error;
    }
}

export const login = async (req, res) => {
    try {
        console.log("The authenticated user is : ", req.user.username);
        res.status(200).json({
            message: "User logged in successfully",
            username: req.user.username,
            isMFAEnabled: req.user.isMFAEnabled
        });
    } catch (error) {
        console.error("Error in register:", error);
        throw error;
    }
}

export const status = async (req, res) => {
    try {
        console.log('in status')
        if (req.user) {
            res.status(200).json({
                message: "User logged in successfully",
                username: req.user.username,
                isMFAEnabled: req.user.isMFAEnabled
            });
        }
        else {
            res.status(401).json({ message: "Unauthorized user" });
        }
    } catch (error) {
        console.error("Error in register:", error);
        throw error;
    }
}

export const logout = async (req, res) => {
    try {
        console.log('in logout')
        if (!req.user) res.status(401).json({ message: "Unauthorized user logout" });
        req.logout((err) => {
            console.log('logging out')
            if (err) return res.status(400).json({ message: "User not logged in" });
            res.status(200).json({ message: "Logout successful" });
        });

    } catch (error) {
        console.error("Error in register:", error);
        throw error;
    }
}

export const setup2FA = async (req, res) => {
    try {
        console.log(req.user)
        const user = req.user;
        var secret = speakeasy.generateSecret();
        console.log('speakeasy secret',secret)
        user.twoFactorSecret = secret.base32;
        user.isMFAEnabled = true;
        await user.save();
        const url = speakeasy.otpauthURL({
            secret: secret.base32,
            label: user.username,
            issuer: "Example Inc.",
            encoding: "base32"  
    });
        const qrcodeUrl = await qrCode.toDataURL(url);
        res.status(200).json({ message: "2FA setup successful", secret: secret.base32,qrCode: qrcodeUrl });
    } catch (error) {
        console.error("Error in register:", error);
        res.status(500).json({ error: "Error setting up 2FA", message: error });

        throw error;
    }
}

export const verify2FA = async (req, res) => {
    try {
        const token = req.body.token;
        console.log('token ',token)
        const user = req.user;
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: "base32",
            token: token,
        });
        if (verified) {
            const jwtToken = jwt.sign({ id: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
            res.status(200).json({ message: "2FA verified successfully", token: jwtToken });
        } else {
            res.status(401).json({ message: "Invalid 2FA token" });
        }
    } catch (error) {
        console.error("Error in register:", error);
        throw error;
    }
}

export const reset2FA = async (req, res) => {
    try {
        console.log(req.user)
        const user = req.user;
        var secret = speakeasy.generateSecret();
        console.log('speakeasy secret',secret)
        user.twoFactorSecret = "";
        user.isMFAEnabled = false;
        await user.save();
        res.status(200).json({ message: "2FA reset successful"});
    } catch (error) {
        console.error("Error in register:", error);
        res.status(500).json({ error: "Error resetting 2FA", message: error });
        throw error;
    }
}