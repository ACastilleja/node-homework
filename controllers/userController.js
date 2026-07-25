const { userSchema } = require("../validation/userSchema");


// Register
const register = (req, res) => {
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

    const newUser = { id: Date.now(), name, email, password };
    global.users.push(newUser);
    global.user_id = newUser;

    return res.status(201).json({
        name: newUser.name,
        email: newUser.email,
    });
};

// Logon

const logon = (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({error: "Email and password are required"})
    }

    const user = global.users.find((u) => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ error: "Invalid credentials"});
    };

    global.user_id = user.id;

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
