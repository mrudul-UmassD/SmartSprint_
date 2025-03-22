# SmartSprint

SmartSprint is an AI-Enhanced Kanban Solution for Agile Teams, designed to streamline project management and boost productivity.

## Features

- **User Authentication**: Secure login and registration with role-based access control
- **Dashboard**: Get an overview of your projects and tasks at a glance
- **Project Management**: Create, update, and delete projects
- **Task Management**: Create tasks with priorities, status tracking and assignment
- **Kanban Board**: Visual task management with drag-and-drop interface
- **User Profiles**: Manage your account information
- **Comments & Collaboration**: Add comments to tasks for better team communication

## Technologies Used

### Backend
- Node.js with Express
- SQLite database
- JWT for authentication
- bcrypt for password hashing

### Frontend
- React (Create React App)
- Material UI for components and styling
- React Router for navigation
- Axios for API requests
- Context API for state management

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/mrudul-UmassD/SmartSprint_.git
cd SmartSprint_
```

2. Install all dependencies (backend and frontend):
```bash
npm run install-all
```

## Running the Application

Start both the backend and frontend with a single command:

```bash
npm start
```

This will start:
- Backend API on http://localhost:5000
- Frontend on http://localhost:3000

## Testing

Run the automated tests:

```bash
npm test
```

Test results will be exported to a timestamped file in the `test-results` directory.

## Development

- Backend API is located in the `backend` directory
- Frontend React app is located in the `frontend` directory

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
```

## Available Scripts

- `npm start`: Start both backend and frontend
- `npm run backend`: Start only the backend
- `npm run frontend`: Start only the frontend
- `npm run install-all`: Install dependencies for both backend and frontend
- `npm test`: Run all tests and export results
- `npm run build`: Build the frontend for production

## License

[MIT](LICENSE) 