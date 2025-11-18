import passport from "passport"
import { Strategy as LocalStrategy, Strategy } from "passport-local"
import Record from "../models/user.js";
import bcrypt from "bcryptjs";

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        console.log('in passport use')
        const user = await Record.findOne({ username: username })
        if (!user) {
            return done(null, false, { message: "User not found" });
        }
        const isMatch = await bcrypt.compare( password, user.password)
        if (!isMatch) {
            return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}
));

passport.serializeUser((user, done) => {
    console.log('in serializeUser', user)
    done(null, user._id)
});

passport.deserializeUser(async(_id, done) => {
    try{
        console.log('in deserializeUser', _id)
        const user = await User.findById(_id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

