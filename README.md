<div align="center">
  <img src="./client/src/assets/imgs/site_logo.png" alt="Jello Logo" width="200"/>
  
  # Jello
  
  ### Real-Time Collaborative Project Management Platform
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)](https://www.mongodb.com/)
</div>

---

## Project Overview

Jello is a real-time collaborative project management platform built with the MERN stack. The application provides teams with tools to organize projects, manage tasks, and collaborate effectively through an intuitive interface.

**Note:** This project was developed as an assignment for the Full Stack Developer role at [Webingo](https://webingo.in).

### Live Demo

- **Frontend:** [https://jelloclient.netlify.app](https://jelloclient.netlify.app)
- **Backend API:** [https://apiJello.yuvrajsoneja.in](https://apiJello.yuvrajsoneja.in)
- **API Documentation:** [https://apiJello.yuvrajsoneja.in/api-docs](https://apiJello.yuvrajsoneja.in/api-docs)

### Key Features

- Real-time Updates - Instant synchronization across all connected clients using Socket.io
- Kanban Board - Visual task management with pagination
- Team Collaboration - Role-based access control (Owner, Admin, Member, Viewer)
- Advanced Filtering - Filter, sort, and search tasks with server-side optimization
- Bulk Operations - Update, assign, or delete multiple tasks simultaneously
- Email Notifications - Branded email templates for invitations and password resets
- Responsive Design - Mobile-first UI with dark mode support
- Secure Authentication - JWT-based auth with refresh tokens and cookie support
- File Attachments - Azure Blob Storage integration for task files
- Project Statistics - Real-time analytics and activity feeds
- Notifications - In-app notification system with sound alerts
- API Documentation - Interactive Swagger UI at `/api-docs`

---

## Architecture & Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks and concurrent features
- **Vite** - Lightning-fast build tool and dev server
- **RTK Query** - Powerful data fetching and caching (eliminates need for separate state management for server data)
- **Zustand** - Lightweight state management for UI state (auth, socket, theme)
- **React Hook Form + Zod** - Type-safe form validation with excellent DX
- **Socket.io Client** - Real-time bidirectional communication
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development

### Backend
- **Node.js + Express** - Fast, unopinionated web framework
- **MongoDB + Mongoose** - NoSQL database with elegant ODM
- **Socket.io** - Real-time engine for live updates
- **BullMQ + Redis** - Robust job queue for async email processing
- **JWT** - Stateless authentication with refresh token rotation
- **Azure Blob Storage** - Scalable cloud storage for file attachments
- **Nodemailer** - Email delivery with custom branded templates
- **Swagger/OpenAPI** - Auto-generated interactive API documentation

### Architecture Decisions

#### Why RTK Query over React Query?
- **Tight Redux Integration**: Seamless integration with existing Redux DevTools
- **Normalized Cache**: Automatic cache updates via tags system
- **Optimistic Updates**: Built-in support for instant UI feedback
- **Code Generation**: Auto-generated hooks reduce boilerplate

#### Why Zustand for UI State?
- **Minimal Boilerplate**: No providers, actions, or reducers needed
- **Small Bundle Size**: ~1KB vs Redux's ~3KB
- **Simple API**: Easy to learn and use for UI-specific state
- **No Context Hell**: Direct store access without prop drilling

#### Why BullMQ for Email Queue?
- **Reliability**: Job persistence in Redis ensures no lost emails
- **Scalability**: Horizontal scaling with multiple workers
- **Retry Logic**: Automatic retry with exponential backoff
- **Priority Queues**: Critical emails (password resets) get higher priority

#### Why Socket.io over WebSockets?
- **Fallback Support**: Auto-fallback to long-polling if WebSocket fails
- **Room Management**: Built-in room/namespace support for project isolation
- **Reconnection**: Automatic reconnection with exponential backoff
- **Event-based**: Clean event-driven architecture

#### Why Azure Blob Storage?
- **Scalability**: Handles petabytes of data
- **CDN Integration**: Fast global content delivery
- **Security**: SAS tokens for time-limited access
- **Cost-effective**: Pay only for what you use

---

## Quick Start

### Prerequisites

- **Docker** & **Docker Compose** (recommended)
- **Node.js 18+** (if running without Docker)
- **MongoDB 6+** (if running without Docker)
- **Redis 7+** (if running without Docker)

### Installation with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yuvrajSoneja2004/management-app.git
   cd management-app
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp server/.env.example server/.env
   
   # Frontend
   cp client/.env.example client/.env
   ```
   
   Edit the `.env` files with your configuration (see [Environment Variables](#-environment-variables) section).

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```
   
   This will start:
   - MongoDB on port `27017`
   - Redis on port `6379`
   - Backend API on port `5000`
   - Frontend on port `5173`

4. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:5000
   - **API Documentation**: http://localhost:5000/api-docs

### Installation without Docker

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/yourusername/jello.git
   cd jello
   
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

2. **Set up environment variables** (see above)

3. **Start MongoDB and Redis** (ensure they're running on your system)

4. **Start the backend**
   ```bash
   cd server
   npm run dev
   ```

5. **Start the frontend** (in a new terminal)
   ```bash
   cd client
   npm run dev
   ```

---

## Environment Variables

### Backend (`server/.env`)

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS
CLIENT_URL=http://localhost:5173

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your-account;AccountKey=your-key;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=fileuploads

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=your-email@gmail.com

# Redis
REDIS_URL=redis://localhost:6379
```

**Note:** There is no `.env` file required for the client. The frontend connects to the backend API URL specified in the server configuration.

---

## API Documentation

### Interactive Documentation

Visit **http://localhost:5000/api-docs** for the full interactive Swagger UI documentation.

### Quick Reference

#### Authentication

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | Register a new user | ❌ |
| `/api/auth/login` | POST | Login and get JWT token | ❌ |
| `/api/auth/forgot-password` | POST | Request password reset email | ❌ |
| `/api/auth/reset-password/:token` | POST | Reset password with token | ❌ |

**Example: Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "johndoe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Projects

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/projects` | GET | Get all user's projects | ✅ |
| `/api/projects` | POST | Create a new project | ✅ |
| `/api/projects/:id` | GET | Get project details | ✅ |
| `/api/projects/:id` | PUT | Update project | ✅ |
| `/api/projects/:id` | DELETE | Delete project | ✅ |
| `/api/projects/:id/archive` | PUT | Archive project | ✅ |
| `/api/projects/:id/restore` | PUT | Restore archived project | ✅ |

**Example: Create Project**
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Redesign",
    "description": "Complete overhaul of company website",
    "startDate": "2024-01-01",
    "endDate": "2024-06-30"
  }'
```

#### Tasks

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/tasks/project/:projectId` | GET | Get tasks for a project | ✅ |
| `/api/tasks` | POST | Create a new task | ✅ |
| `/api/tasks/:id` | PUT | Update task | ✅ |
| `/api/tasks/:id` | DELETE | Delete task | ✅ |
| `/api/tasks/bulk/status` | POST | Bulk update task status | ✅ |
| `/api/tasks/bulk/assign` | POST | Bulk assign tasks | ✅ |
| `/api/tasks/bulk/delete` | POST | Bulk delete tasks | ✅ |

**Query Parameters for GET /api/tasks/project/:projectId:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `status` - Filter by status (Todo, In Progress, Review, Completed)
- `priority` - Filter by priority (Low, Medium, High, Critical)
- `assignee` - Filter by assignee user ID
- `search` - Search in title and description
- `sortBy` - Sort field (priority, status, dueDate, createdAt, updatedAt)
- `order` - Sort order (asc, desc)

**Example: Get Filtered Tasks**
```bash
curl "http://localhost:5000/api/tasks/project/507f1f77bcf86cd799439011?status=In%20Progress&priority=High&sortBy=dueDate&order=asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example: Bulk Update Status**
```bash
curl -X POST http://localhost:5000/api/tasks/bulk/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "status": "Completed"
  }'
```

#### Invitations

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/invitations/invite` | POST | Invite member to project | ✅ |
| `/api/invitations` | GET | Get project invitations | ✅ |
| `/api/invitations/:token/accept` | GET | Accept invitation | ✅ |
| `/api/invitations/:id/cancel` | PUT | Cancel invitation | ✅ |

#### Notifications

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/notifications` | GET | Get user notifications | ✅ |
| `/api/notifications/:id/read` | PUT | Mark notification as read | ✅ |
| `/api/notifications/mark-all-read` | PUT | Mark all as read | ✅ |

---

## Deployment Guide

### Frontend Deployment (Netlify)

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Netlify**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard:
     - `VITE_API_URL` - Your backend API URL
     - `VITE_SOCKET_URL` - Your backend Socket.io URL

3. **Configure redirects** (create `client/public/_redirects`)
   ```
   /*    /index.html   200
   ```

### Backend Deployment (Docker)

1. **Build Docker image**
   ```bash
   cd server
   docker build -t jello-backend .
   ```

2. **Run with Docker Compose** (production)
   ```yaml
   version: '3.8'
   services:
     mongodb:
       image: mongo:6
       volumes:
         - mongo-data:/data/db
       environment:
         MONGO_INITDB_ROOT_USERNAME: admin
         MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
     
     redis:
       image: redis:7-alpine
       volumes:
         - redis-data:/data
     
     backend:
       image: jello-backend
       ports:
         - "5000:5000"
       environment:
         - NODE_ENV=production
         - MONGODB_URI=${MONGODB_URI}
         - REDIS_URL=redis://redis:6379
         - JWT_SECRET=${JWT_SECRET}
         # ... other env vars
       depends_on:
         - mongodb
         - redis
   
   volumes:
     mongo-data:
     redis-data:
   ```

3. **Deploy to cloud provider**
   - **AWS ECS/Fargate**: Use the Docker image with ECS task definitions
   - **Google Cloud Run**: Deploy containerized backend with auto-scaling
   - **DigitalOcean App Platform**: Connect GitHub and deploy with one click
   - **Heroku**: Use `heroku.yml` for container deployment

### Environment Variables for Production

- Set `NODE_ENV=production`
- Use strong, unique values for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Configure CORS to allow only your frontend domain
- Enable HTTPS/TLS for all connections
- Use managed MongoDB (Atlas) and Redis (Redis Cloud) for reliability
- Configure email service with proper DKIM/SPF records

---

## Code Comments & Complex Logic

### Real-time Updates Hook (`useRealtimeUpdates.js`)

```javascript
/**
 * Custom hook for managing real-time Socket.io updates
 * 
 * Architecture Decision: We use RTK Query's cache invalidation instead of
 * manually updating the cache. This ensures consistency and reduces bugs.
 * 
 * @param {string} projectId - Current project ID to subscribe to
 */
export const useRealtimeUpdates = (projectId) => {
  const dispatch = useDispatch();
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket || !projectId) return;

    // Join project-specific room for targeted updates
    socket.emit('joinProject', projectId);

    // Task created: Invalidate cache to trigger refetch
    socket.on('taskCreated', () => {
      dispatch(tasksApi.util.invalidateTags([
        { type: 'Tasks', id: `PROJECT-${projectId}` }
      ]));
    });

    // Cleanup on unmount
    return () => {
      socket.off('taskCreated');
      socket.emit('leaveProject', projectId);
    };
  }, [socket, projectId, dispatch]);
};
```

### Optimistic Updates (`projectsApi.js`)

```javascript
/**
 * Optimistic update pattern for instant UI feedback
 * 
 * Flow:
 * 1. Immediately update cache with optimistic data
 * 2. Send request to server
 * 3. If request fails, rollback the optimistic update
 * 
 * This provides instant feedback while maintaining data consistency
 */
createProject: builder.mutation({
  query: (project) => ({
    url: '/projects',
    method: 'POST',
    body: project,
  }),
  async onQueryStarted(project, { dispatch, queryFulfilled }) {
    // Optimistically add project to cache
    const patchResult = dispatch(
      projectsApi.util.updateQueryData('getProjects', undefined, (draft) => {
        draft.projects.unshift({
          ...project,
          _id: 'temp-' + Date.now(),
          createdAt: new Date().toISOString(),
        });
      })
    );
    
    try {
      await queryFulfilled;
    } catch {
      // Rollback on error
      patchResult.undo();
    }
  },
}),
```

### Form Validation Schemas (`validationSchemas.js`)

```javascript
/**
 * Zod schemas for type-safe form validation
 * 
 * Architecture Decision: We use Zod over Yup because:
 * - Better TypeScript integration
 * - Smaller bundle size
 * - More intuitive API for complex validations
 */
export const projectSchema = z.object({
  name: z.string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine((data) => {
  // Cross-field validation: end date must be after start date
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});
```

### Cache Invalidation Strategy

```javascript
/**
 * RTK Query Tag System
 * 
 * We use a tag-based invalidation system for efficient cache updates:
 * 
 * - `Tasks` tag with `PROJECT-${id}` - Invalidates all tasks for a project
 * - `Tasks` tag with specific task ID - Invalidates single task
 * - `Projects` tag - Invalidates project list
 * 
 * This allows surgical cache updates without over-fetching
 */
providesTags: (result, error, { projectId }) =>
  result?.tasks
    ? [
        ...result.tasks.map(({ _id }) => ({ type: 'Tasks', id: _id })),
        { type: 'Tasks', id: `PROJECT-${projectId}` },
      ]
    : [{ type: 'Tasks', id: `PROJECT-${projectId}` }],
```

### Email Queue Worker (`email.worker.js`)

```javascript
/**
 * BullMQ Email Worker
 * 
 * Architecture Decision: We use a job queue for emails because:
 * - Reliability: Jobs are persisted in Redis
 * - Scalability: Can run multiple workers
 * - Retry Logic: Automatic retry on failure
 * - Priority: Critical emails (password reset) get priority
 * 
 * The worker processes jobs from the 'email' queue and uses
 * Nodemailer to send emails with custom branded templates
 */
const emailWorker = new Worker(
  'email',
  async (job) => {
    const type = job.name; // 'invitation' or 'passwordReset'
    const data = job.data;
    
    const template = emailTemplates[type];
    if (!template) {
      throw new Error(`Unknown email type: ${type}`);
    }
    
    const mailOptions = template(data);
    await transporter.sendMail(mailOptions);
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process 5 emails concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // Per second
    },
  }
);
```

---

## Testing

### Run Tests

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# E2E tests
npm run test:e2e
```

### Test Coverage

```bash
# Generate coverage report
npm run test:coverage
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  
  **Developed by Yuvraj Soneja**
  
  Assignment for Full Stack Developer Role at [Webingo](https://webingo.in)
  
  [Live Demo](https://jello.yuvrajsoneja.in) • [API Documentation](https://apiJello.yuvrajsoneja.in/api-docs) • [GitHub](https://github.com/yuvrajSoneja2004/management-app)
  
</div>
