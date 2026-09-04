require("dotenv").config();
const request = require("supertest");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
let agent;
let saveRes;
let csrfToken;
const { app, server } = require("../app");

beforeAll(async () => {  
await prisma.task.deleteMany(); 
await prisma.user.deleteMany(); 
agent = request.agent(app);
});

afterAll(async () => {
await prisma.$disconnect();
await new Promise((resolve) => server.close(resolve));
});

describe("register a user and test authentication workflow", () => {
    it("46. it creates the user entry", async () => {
        const newUser = {
            name: "John Deere",
            email: "jdeere@example.com",
            password: "Pa$$word20",
        };
        saveRes = await agent.post("/api/users/register").send(newUser);
        expect(saveRes.status).toBe(201);
    });

    it("47. Registration returns an object with the expected name.", () => {
        
        expect(saveRes.body.user?.name).toBe("John Deere");
    });

    it("48. Test that the returned object includes a csrfToken.", () => {
        expect(saveRes.body.csrfToken).toBeDefined();
    });

    it("49. You can logon as the newly registered user.", async () => {
        const loginCredentials = {
            email: "jdeere@example.com",
            password: "Pa$$word20",
        };
        saveRes = await agent.post("/api/users/logon").send(loginCredentials);
        expect(saveRes.status).toBe(200);

        csrfToken = saveRes.body.csrfToken;
    });

    it("50. Verify that you are logged in: /api/tasks should no return a 401", async () => {
        const res = await agent
        .get("/api/tasks")
        .set("X-CSRF-TOKEN", csrfToken || "");
        expect(res.status).toBe(200);
    });

    it("51. Verify that you can log out.", async () => {
        saveRes = await agent
        .post("/api/users/logoff")
        .set("X-CSRF-TOKEN", csrfToken || "");
        expect(saveRes.status).toBe(200);

    });

    it("52. Make sure that you are really logged out: /api/tasks should now return a 401", async () => {
        const res = await agent
        .get("/api/tasks")
        .set("X-CSRF-TOKEN", csrfToken || "");
        expect(res.status).toBe(401);
    });
});
