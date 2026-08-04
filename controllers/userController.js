const pool = require("../db/pg-pool");
const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

//Helper functions
async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash){
    const [salt, key] = storedHash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = await scrypt(inputPassword, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
}


// Register
const register = async (req, res, next) => {
    if (!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, {abortEarly: false});

    if(error) {
        return res.status(400).json({ message: "Validation failed", details: error.details, });
    }

    let user = null;
    value.hashed_password = await hashPassword(value.password);

    try {
        user = await pool.query(
            `INSERT INTO users (email, name, hashed_password) VALUES ($1, $2, $3) RETURNING id, email, name`,
            [value.email, value.name, value.hashed_password]
        );
    }catch (e) {
        if (e.code === "23505") {
            return res.status(400).json({message: "User already exists."});
        }
        return next(e);
    }

    const newUser = user.rows[0];

    global.user_id = newUser.id;

    return res.status(201).json({
        name: newUser.name,
        email: newUser.email,
    });
};

// Logon

const logon = async (req, res, next) => {
    let { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(401).json({ error: "Invalid credentials"});
    }

    email = email.trim().toLowerCase();

    try {

        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({error: "Invalid credentials"});
        }

        const user = result.rows[0];

        const goodCredentials = await comparePassword(password, user.hashed_password);
        if (!goodCredentials) {
            return res.status(401).json({ error: "Invalid credentials"});
        }

        global.user_id = user.id;

    return res.status(200).json({
        name: user.name,
        email: user.email,
    });

    }catch (err) {
        return next(err);
    }  
};

// Logoff

const logoff = (req, res) => {
    global.user_id = null;
    return res.sendStatus(200);
};

module.exports = {
    register,
    logon,
    logoff
};
