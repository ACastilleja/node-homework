
// Register
const register = (req, res) => {
    const { name, email, password } = req.body;
    
    const newUser = {name, email, password };

    global.users = global.users || [];
    global.users.push(newUser);

    global.user_id = newUser;
    
    res.status(201).json({ name, email });
};

// Logon

const logon = (req, res) => {
    const { email, password } = req.body;

    const users = global.users || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        global.user_id = user;
        return res.status(200).json({ name: user.name, email: user.email});
    };

    return res.status(401).json({ message: "Invalid email or password"});

};

// Logoff

const logoff = (req, res) => {
    global.user_id = null;
    res.status(200).json({ message: "Logged off successfully" });
};

module.exports = {
    register,
    logon,
    logoff
};
