require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const { EventEmitter } = require("events");
const {
    index,
    show,
    create,
    update,
    deleteTask,
} = require("../controllers/taskController");
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");

let user1 = null;
let user2 = null;
let saveRes = null;
let saveData= null;
let saveTaskId = null;

beforeAll(async () => {
    await prisma.Task.deleteMany();
    await prisma.User.deleteMany();
    user1 = await prisma.User.create({data: { name: "Bob", email: "bob@sample.com", hashedPassword: "nonsense"}});
    user2 = await prisma.User.create({data: { name: "Alice", email: "alice@sample.com", hashedPassword: "nonsense"}});
});

afterAll(() => {
    prisma.$disconnect();
});

describe("testing task creation", () => {
    it("14. cant create a task without a user id", async () => {
        const req = httpMocks.createRequest({
            method: "POST",
            body: { title: "first task"},
        });
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        expect.assertions(1);
        try {
        await waitForRouteHandlerCompletion(create, req, saveRes);
        } catch (e) {
            expect(e.name).toBe("TypeError");
        }
    });

    it("15. You can't create a task with a bogus user id.", async () => {
        const req = httpMocks.createRequest({
            method: "POST",
            user: { id: 9999999 },
            body: { title: "bogus task" },
        });
        saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
        expect.assertions(1);
        try{
            await waitForRouteHandlerCompletion(create, req, saveRes);
        } catch (e) {
            expect(e.name).toBe("PrismaClientKnownRequestError");
        }
    });

    it("16. If you have a valid user id, create() succeeds(res.statusCode should be 201).", async () => {
        const req = httpMocks.createRequest({
            method: "POST",
            user: { id: user1.id },
            body: { title: "first task" },
        });
        saveRes= httpMocks.createResponse({ eventEmitter: EventEmitter });
        await waitForRouteHandlerCompletion(create, req, saveRes);
        expect(saveRes.statusCode).toBe(201);
    });

    it("17. The object returned from the create() call has the expected title.", async () => {
        saveData = saveRes._getJSONData();
        expect(saveData.title).toBe("first task");
    });

    it("The object has the right value for isCompleted.", async () => {
        expect(saveData.isCompleted).toBe(false);
    });

    it("19. The object does not have any value for userId.", async () => {
        saveTaskId = saveData.id;
        expect(saveData.userId).toBeUndefined();
    });
});

describe("test getting created tasks", () => {
    it("20. You can't get a list of tasks without a user id.", async () => {
        const req = httpMocks.createRequest({
            method: "GET",
        });
        saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
        expect.assertions(1);
        try{
            await waitForRouteHandlerCompletion(index, req, saveRes);
        } catch (e) {
            expect(e.name).toBe("TypeError");
        }
    });

    it("21. If you use user1's id, the call returns a 200 status.", async () => {
        const req = httpMocks.createRequest({
            method: "GET",
            user: { id: user1.id },
        });
        saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
        await waitForRouteHandlerCompletion(index, req, saveRes);
        expect(saveRes.statusCode).toBe(200);
    });

    it("22. The returned object has a tasks array of length 1.", async () => {
        saveData = saveRes._getJSONData();
        expect(saveData.tasks.length).toBe(1);
    });

    
})