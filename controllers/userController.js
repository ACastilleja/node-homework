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
const register = async (req, res) => {
    if (!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, {abortEarly: false});

    if(error) {
        return res.status(400).json({ message: error.message });
    }

    const { name, email, password } = value;

    const existingUser = global.users.find((u) => u.email === email);
    if (existingUser) {
        return res.status(400).json({message: "User already exists." });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = { id: Date.now(), name, email, hashedPassword };
    global.users.push(newUser);
    global.user_id = newUser;

    return res.status(201).json({
        name: newUser.name,
        email: newUser.email,
    });
};

// Logon

const logon = async (req, res) => {
    let { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({error: "Email and password are required"})
    }

    email = email.trim().toLowerCase();

    const user = global.users.find((u) => u.email === email);

    if (!user) {
        return res.status(401).json({ error: "Invalid credentials"});
    };

    const goodCredentials = await comparePassword(password, user.hashedPassword);
    if (!goodCredentials) {
        return res.status(401).json({ error: "Invalid credetials"});
    }

    global.user_id = user;

    return res.status(200).json({
        name: user.name,
        email: user.email,
    });
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
