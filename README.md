# CoopWise Training & Seminar Module

## Overview

CoopWise Training & Semninar Module is a comprehensive web-based training management system designed for cooperative organizations in the Philippines. The platform enables administrators to manage training programs, track officer compliance with mandatory training requirements, and facilitate enrollment processes. Officers can view available trainings, enroll themselves and companions, track their attendance records, and suggest new training topics.

The application serves two primary user types:
- **Administrators**: Manage trainings, monitor compliance, track attendance, and generate reports
- **Officers**: Browse available trainings, enroll, view personal compliance status, and suggest training topics

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **Routing**: React Router DOM for client-side navigation
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens

**Design Pattern**: Component-based architecture with clear separation between pages and reusable UI components. The application follows a presentational/container component pattern where pages handle business logic and UI components remain pure and reusable.

**Key Architectural Decisions**:
- shadcn/ui was chosen for its composability and accessibility features, providing production-ready components that can be customized
- Tailwind CSS enables rapid UI development with a utility-first approach while maintaining design consistency through CSS variables
- React Query handles caching, synchronization, and background updates of server state, reducing boilerplate code for data fetching
- TypeScript provides type safety throughout the application, catching errors at compile time

### State Management Strategy

**Local State**: Managed with React hooks (useState, useEffect) for component-specific state
**Server State**: TanStack Query manages all data fetching, caching, and synchronization with the backend
**Global State**: Minimal global state using localStorage for authentication tokens and user information

The application intentionally avoids complex state management libraries, keeping state local to components where possible and using React Query for server-related state.

### Authentication & Authorization

**Current Implementation**: Simple localStorage-based authentication for demonstration purposes
- User credentials stored in localStorage (userRole, userName)
- Role-based routing (administrator vs officer views)
- User ID mapping for demo purposes

**Design Decision**: This is a simplified authentication mechanism suitable for the current development stage. In production, this should be replaced with Supabase Auth or another secure authentication provider.

### Routing Structure

The application uses declarative routing with the following main routes:
- `/` - Landing page with cooperative information
- `/login` - Authentication page
- `/dashboard` - Role-specific dashboard (administrator or officer)
- `/training-management` - Administrator training CRUD operations
- `/compliance-tracker` - Administrator view of officer compliance
- `/officer-dashboard` - Officer personal compliance view
- `/available-trainings` - Officer training enrollment
- `/attendance` - Administrator attendance management
- `/my-attendance` - Officer personal attendance records
- `/reports` - Administrator reporting and analytics

**Design Rationale**: Clear URL structure reflects user mental models and role-based access. Each route corresponds to a specific user task or workflow.

### Component Architecture

**UI Component Library**: All UI components in `src/components/ui/` are based on Radix UI primitives, providing:
- Accessibility out of the box (ARIA attributes, keyboard navigation)
- Unstyled headless components that accept custom styling
- Composable patterns for complex UI interactions

**Feature Components**: 
- `EnrollmentWithCompanionDialog` - Handles training enrollment with optional companion registration
- `TrainingSuggestionDialog` - Allows officers to suggest new training topics
- `EditOfficerDialog` - Administrator interface for managing officer compliance records

**Design Pattern**: Composition over inheritance - components accept children and expose flexible APIs for customization while maintaining consistent behavior.

## External Dependencies

### Backend & Database

**Express Backend API** (Updated November 2025)
- **Purpose**: Custom REST API server providing data persistence and business logic
- **Server**: Express.js running on port 3001
- **Database**: PostgreSQL (Neon-backed) with direct node-postgres connection
- **API Client**: Custom fetch-based client library in `src/lib/api.ts`

**Architecture**:
- Backend server: `server/index.js` - Express REST API with comprehensive endpoints
- API client: `src/lib/api.ts` - Frontend wrapper with error handling and response normalization
- Database connection: Direct PostgreSQL pool connection using environment variables

**Database Schema**:
- `profiles` - User/officer information (full_name, cooperative, position, role)
- `trainings` - Training session metadata (title, topic, dates, venue, speaker, capacity)
- `training_registrations` - Officer enrollment records linking profiles to trainings
- `attendance` - Attendance tracking (officer_id, training_id, method, timestamp)
- `companion_registrations` - Companion enrollment data for officers bringing guests
- `training_suggestions` - Officer-submitted training topic suggestions

**API Endpoints**:
- `/api/profiles` - User profile management
- `/api/trainings` - Training CRUD operations with metrics
- `/api/training-registrations` - Enrollment management with companion support
- `/api/attendance` - Attendance recording and tracking
- `/api/training-suggestions` - Training topic suggestions from officers

**Migration History**: 
- Originally built with Supabase Backend-as-a-Service
- Migrated to PostgreSQL + Express backend (November 2025)
- All production data successfully migrated (5 profiles, 5 trainings, 18 registrations)
- Complete removal of Supabase dependencies while preserving all functionality

### UI & Component Libraries

**Radix UI Primitives** (v1.x)
- Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu, Popover, Progress, Radio Group, Select, Slider, Switch, Tabs, Toast, Tooltip
- **Rationale**: Industry-standard accessible components that work across frameworks

**Utility Libraries**
- `lucide-react` v0.462.0 - Icon library with React components
- `class-variance-authority` v0.7.1 - Type-safe variant-based styling
- `clsx` & `tailwind-merge` - Conditional className composition
- `date-fns` v3.6.0 - Date manipulation and formatting
- `react-day-picker` v8.10.1 - Calendar/date picker component
- `embla-carousel-react` v8.3.0 - Touch-enabled carousel

### Form Management

**React Hook Form Ecosystem**
- `react-hook-form` (implicit via @hookform/resolvers)
- `@hookform/resolvers` v3.9.0 - Schema validation integration
- **Use Case**: Form validation and state management throughout the application

### Development Tools

**Build & Development**
- Vite 5.x - Fast build tool with HMR
- TypeScript 5.x - Type safety and developer experience
- ESLint with TypeScript plugin - Code quality enforcement
- PostCSS with Tailwind - CSS processing

**Code Quality Configuration**:
- Relaxed TypeScript strict mode for rapid development (`strict: false`, `noImplicitAny: false`)
- ESLint configured for React hooks and component refresh
- Unused variables warnings disabled to reduce noise during development

### Theming & Styling

**Theme System**
- `next-themes` v0.3.0 - Dark/light mode support
- Custom CSS variables defined in `src/index.css` for consistent design tokens
- Blue color palette (50-900) as primary brand colors
- HSL-based color system for easy theme customization

**Design System**: All colors, spacing, and typography defined through CSS variables, enabling centralized theme management and easy customization.

### Current Limitations & Future Considerations

1. **Authentication**: Currently using localStorage-based demo authentication; should implement JWT-based authentication for production
2. **Real-time Features**: No real-time updates currently implemented; consider adding WebSocket support for live enrollment updates
3. **File Uploads**: No current file upload mechanism for certificates or documents
4. **Offline Support**: Application requires constant internet connection
5. **Mobile Responsiveness**: Basic responsive design implemented but could be enhanced for mobile-first experience
6. **API Ordering**: Training list returns results in descending order by start_date (most recent first); consider client-side sorting if ascending order is preferred

## Getting Started

### Prerequisites
- Node.js (LTS version recommended)
- npm (comes with Node.js) or Yarn

### Running the Application
1.  Start install :
    ```bash
    npm install

1.  Start development server:
    ```bash
    npm run dev
  
### Demo Credentials
- **Administrator:**
    - Username: `admin@coopwise.com`
    - Password: `admin123`
- **Cooperative Officer:**
    - Username: `officer@coopwise.com`
    - Password: `officer123`

## Future Enhancements 
- **Email Notifications:** Integration with email servers (e.g., Gmail ) for sending notifications and confirmations to users. 
- **QR Code Scanning:** Full integration  for live attendance.
## Author
- [Lagatic, Xavier Angelo James O.]
- [11-43205/BSIT/]
- [(https://github.com/XAVIERPOOL)]
