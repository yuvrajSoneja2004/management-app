const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/modules/auth/user.model');
const Project = require('../../src/modules/project/project.model');

require('../setup');

describe('Task API - Integration Tests', () => {
    let accessToken;
    let userId;
    let projectId;

    beforeEach(async () => {
        // Register and login user
        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

        accessToken = registerRes.body.accessToken;
        userId = registerRes.body._id;

        // Create a project
        const projectRes = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: 'Test Project',
                description: 'Test Description'
            });

        projectId = projectRes.body._id;
    });

    describe('POST /api/tasks', () => {
        it('should create a new task', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    title: 'Test Task',
                    description: 'Test Description',
                    projectId,
                    status: 'Todo',
                    priority: 'High'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.title).toBe('Test Task');
            expect(res.body.status).toBe('Todo');
        });

        it('should return 400 for invalid task data', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    // Missing required title
                    projectId,
                    status: 'Todo'
                });

            expect(res.status).toBe(400);
        });

        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .send({
                    title: 'Test Task',
                    projectId
                });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/tasks/project/:projectId', () => {
        beforeEach(async () => {
            // Create some tasks
            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    title: 'Task 1',
                    projectId,
                    status: 'Todo'
                });

            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    title: 'Task 2',
                    projectId,
                    status: 'In Progress'
                });
        });

        it('should get tasks for a project with pagination', async () => {
            const res = await request(app)
                .get(`/api/tasks/project/${projectId}?page=1&limit=10`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('tasks');
            expect(res.body).toHaveProperty('pagination');
            expect(res.body.tasks).toBeInstanceOf(Array);
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(10);
        });

        it('should filter tasks by status', async () => {
            const res = await request(app)
                .get(`/api/tasks/project/${projectId}?status=Todo`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.tasks.every(task => task.status === 'Todo')).toBe(true);
        });
    });

    describe('PUT /api/tasks/:id', () => {
        let taskId;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    title: 'Test Task',
                    projectId,
                    status: 'Todo'
                });

            taskId = res.body._id;
        });

        it('should update a task', async () => {
            const res = await request(app)
                .put(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    status: 'In Progress',
                    priority: 'High'
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('In Progress');
            expect(res.body.priority).toBe('High');
        });

        it('should return 400 for invalid status', async () => {
            const res = await request(app)
                .put(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    status: 'InvalidStatus'
                });

            expect(res.status).toBe(400);
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        let taskId;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    title: 'Test Task',
                    projectId,
                    status: 'Todo'
                });

            taskId = res.body._id;
        });

        it('should delete a task', async () => {
            const res = await request(app)
                .delete(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message');
        });

        it('should return 404 for non-existent task', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .delete(`/api/tasks/${fakeId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(404);
        });
    });
});
