import express from 'express'
import session from "express-session"
import passport from "passport"
import dotenv from "dotenv"
import cors from "cors"
import bodyParser from "body-parser";
import { json, urlencoded } from "express";
import dbConnect from "./config/dbConnect.js"
import authRoutes from "./routes/authRoutes.js"
import "./config/passportConfig.js"

const app = express();

console.log('env in app: ', process.env.NODE_ENV)

const corsOption = { 
    origin: ["http://localhost:3001","http://localhost:8080"],
    // credentials: true,
    methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    // allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOption));
app.use(json({ limit : "100mb"}))/
app.use(urlencoded({limit : "100mb", extended : true}));
app.use(session({
    secret: process.env.session_secret || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge:6000 * 60,
    }
}));

app.use(passport.initialize());
app.use(passport.session());
//Routes
app.use("/api/auth",authRoutes);


export default app;