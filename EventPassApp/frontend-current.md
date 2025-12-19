# Frontend Implementation Status

## Overview
This document summarizes the current state of the **EventPass** mobile application frontend. The project is built using **React Native** (CLI) and focuses on two main user roles: **Organizers** and **Participants**.

## Project Structure
The project has been refactored into a clean, domain-driven structure:

```
src/
├── screens/
│   ├── auth/           # Login, Register
│   ├── dashboard/      # Main Dashboard
│   ├── organizer/      # Organizer management workflows
│   ├── participant/    # Participant discovery & scanning workflows
│   └── debug/          # Engineering debug menu
├── services/           # Shared data services (MockData)
└── App.tsx             # Main Navigation Entry Point
```

## Features Implemented

### 1. Authentication & Navigation
- **Stack Navigation**: Centralized in `App.tsx`.
- **Auth Screens**: Login and Register screens (UI only).
- **Engineering Menu**: A debug entry point to quickly jump to any screen during development.

### 2. Dashboard
- **Role Selection**: Card-based interface to switch between "Organizer Activity Management" and "Participate New Activity".

### 3. Organizer Flow
- **Organizer Management**: List of hosted activities with a FAB to create new ones.
- **Activity Settings**:
  - Modern card-based UI.
  - **Date Config**: Integrated `@react-native-community/datetimepicker` for Start/End dates.
  - **Badge Management**: Link to manage badges specific to the activity.
- **Badge Management**:
  - **Badge List**: Dynamic list of badges fetched from `MockData` service. Persists per activity.
  - **Badge Edit**: Modern UI for creating/editing badges.
    - **Features**: Icon preview, "Chip" selection for Type (Record, Certification, Achievement, Award), and Limit stepper.
- **Activity Detail**:
  - Overview screen with action buttons.
  - **Participate Preview**: "Participate" button performs a deep link to the Participant view for easy testing.
- **Issue Credential (Start Activity)**:
  - Modernized UI to issue badges.
  - **Features**: Horizontal scrollable badge selector, preview summary. (Recipient ID input was removed as per request).

### 4. Participant Flow
- **Activity Discovery**: List of available activities to join.
- **Participant Activity**: Detail view for a user joining an event.
- **Scanner UI**:
  - **Functionality**: "Scan Badge" button opens a camera view.
  - **Implementation**: Integrated **`react-native-vision-camera`** for real camera usage.
  - **UI**: Custom overlay with frame corners, laser line animation, and flash/close controls.

## Technical Details

### Dependencies
- **Navigation**: `@react-navigation/native`, `@react-navigation/native-stack`
- **Native Modules**: 
  - `react-native-vision-camera` (Camera & QR Code Scanning)
  - `@react-native-community/datetimepicker` (Date/Time native dialogs)

### data Logic
- **MockData Service**: A persistent in-memory store (`src/services/MockData.ts`) mimics a backend database. It links activities to their specific badges, allowing for a consistent experience between the "Settings" (Creation) and "Issue" (Usage) screens.
